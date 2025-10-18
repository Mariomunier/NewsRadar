import { NextRequest, NextResponse } from "next/server";

const NEWS_API_KEY = process.env.NEWS_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const FALLBACK_SEARCH_API_KEY = process.env.SEARCH_API_KEY || ""; // (valgfrit) Tavily/Brave/SerpAPI

type Item = { title:string; url:string; domain:string; published_at:string; snippet?:string; relevance?:number };

function domainFromUrl(u:string){ try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ""; } }
function hoursAgo(dt:string){ return (Date.now() - new Date(dt).getTime())/36e5; }

// Globale negative ord (filtrer bil-salg / spam)
const NEGATIVE = [
  "car for sale","used car","leasing","SUV","dealership","coupon",
  "celebrity","gossip","fashion","lottery","horoscope"
].map(s=>s.toLowerCase());

// Finans-ord som booster relevans
const FINANCE_HINTS = [
  "market","stocks","bonds","yields","futures","options","fx","forex",
  "rates","inflation","cpi","pce","opec","comex","lbma","treasury","fed",
  "ecb","boj","boe","oil","gold","silver","bitcoin","crypto","etf","volatility","risk"
];

function looksFinancial(text: string){
  const t = text.toLowerCase();
  return FINANCE_HINTS.some(w => t.includes(w));
}

function isNoise(title:string, snippet:string){
  const t = (title+" "+(snippet||"")).toLowerCase();
  return NEGATIVE.some(w => t.includes(w));
}

// Relevansscorer: tid, domænescore, symbol/keywords match, finans-hint
function scoreItem(it: Item, symbol: string, keywords: string[], sourceScores: Record<string,number>): number {
  const recency = Math.min(1, Math.max(0, 1 - (hoursAgo(it.published_at)/72))); // 72t vindue
  const dom = sourceScores[it.domain] ?? 0.4;
  const text = (it.title + " " + (it.snippet||"")).toLowerCase();
  const symHit = text.includes(symbol.toLowerCase()) ? 0.20 : 0;
  const kwHit = keywords.some(k => k && text.includes(k.toLowerCase())) ? 0.25 : 0;
  const fin = looksFinancial(text) ? 0.20 : -0.20; // straf hvis ikke finans
  const base = recency*0.5 + dom*0.35 + symHit + kwHit + fin;
  return Math.max(0, Math.min(1, base));
}

// Byg søge-forespørgsler (symbol + navn + keywords)
function buildQueries(symbol: string, name: string, keywords: string[]){
  const base = [`"${symbol}"`, `"${name}"`];
  const topKw = (keywords||[]).slice(0,5).map(k => `"${k}"`);
  // Vi laver flere OR-varianter for bedre dækning
  const Q = [
    [...base].join(" OR "),
    [...base, ...topKw].join(" OR "),
    [...topKw].join(" OR "),
  ].filter(Boolean);
  return Array.from(new Set(Q));
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "EURUSD";
  const lookback = parseInt(searchParams.get("lookback_hours") || "72",10);
  const maxItems = parseInt(searchParams.get("max_items") || "60",10);

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

  // 1) instrument + whiteliste
  const instRes = await fetch(`${SUPABASE_URL}/rest/v1/instrument?symbol=eq.${symbol}&select=id,keywords,name,asset_class`, { headers });
  const inst = (await instRes.json())[0];
  if(!inst) return NextResponse.json({ error:"Unknown instrument" }, { status:400 });

  const srcRes = await fetch(`${SUPABASE_URL}/rest/v1/source?select=domain,score,whitelisted`, { headers });
  const srcRows = await srcRes.json() as {domain:string, score:number, whitelisted:boolean}[];
  const sourceScores = Object.fromEntries(srcRows.filter(s=>s.whitelisted).map(s=>[s.domain,s.score]));
  const whitelist = new Set(Object.keys(sourceScores));
  const blacklist = new Set(srcRows.filter(s=>!s.whitelisted).map(s=>s.domain));

  const queries = buildQueries(symbol, inst.name, inst.keywords||[]);

  // 2) Hent fra NewsAPI (flere queries), engelsk + sorteret efter tid
  const items: Item[] = [];
  const cutoff = Date.now() - lookback*3600*1000;

  async function getFromNewsAPI(q: string){
    if(!NEWS_API_KEY) return;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&searchIn=title,description&language=en&pageSize=50&sortBy=publishedAt`;
    const r = await fetch(url, { headers: { "X-Api-Key": NEWS_API_KEY } });
    const j = await r.json();
    (j.articles||[]).forEach((a:any)=>{
      if(!a?.url) return;
      const u = a.url;
      const d = domainFromUrl(u);
      const art: Item = {
        title: a.title || "",
        url: u,
        domain: d,
        published_at: a.publishedAt || new Date().toISOString(),
        snippet: a.description || ""
      };
      items.push(art);
    });
  }

  for(const q of queries){ await getFromNewsAPI(q); }

  // (Valgfrit) fallback søge-provider, hvis få resultater
  if(items.length < 6 && FALLBACK_SEARCH_API_KEY){
    // eksempel: Tavily minimal
    try {
      const q = `${symbol} OR ${inst.name} ${((inst.keywords||[]).slice(0,3)).join(" ")}`;
      const r = await fetch("https://api.tavily.com/search", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization": `Bearer ${FALLBACK_SEARCH_API_KEY}` },
        body: JSON.stringify({ query: q, max_results: 8 })
      });
      const j = await r.json();
      (j.results||[]).forEach((a:any)=>{
        if(!a.url) return;
        items.push({
          title: a.title || "",
          url: a.url,
          domain: domainFromUrl(a.url),
          published_at: new Date().toISOString(),
          snippet: a.content || a.meta_description || ""
        });
      });
    } catch {}
  }

  // 3) Dedupe + cut lookback + whitelist + fjern støj
  const map = new Map<string, Item>();
  for(const it of items){
    const key = (it.title||"").toLowerCase().slice(0,180);
    if(!key) continue;
    if(map.has(key)) continue;

    const t = new Date(it.published_at).getTime();
    if(Number.isFinite(t) && t < cutoff) continue;

    if(blacklist.has(it.domain)) continue; // eksplicit blacklist

    // whitelist først; hvis domæne ukendt, allow men med lav score (nedstrøms filtrering)
    if(isNoise(it.title, it.snippet||"")) continue;

    map.set(key, it);
  }
  const unique = [...map.values()];

  // 4) Scor + sortér + forkast lav relevans
  const scored = unique
    .map(it => ({...it, relevance: scoreItem(it, symbol, inst.keywords||[], sourceScores)}))
    .filter(it => (it.relevance||0) >= 0.35) // hårdere cutoff mod “biler”
    .sort((a,b)=> (b.relevance||0) - (a.relevance||0))
    .slice(0, maxItems);

  // 5) Gem kun topresultater i Supabase
  for(const it of scored){
    const body = {
      instrument_id: inst.id, title: it.title, url: it.url, domain: it.domain,
      published_at: it.published_at, snippet: it.snippet, relevance: it.relevance
    };
    await fetch(`${SUPABASE_URL}/rest/v1/article`, {
      method: "POST",
      headers: { ...headers, "Content-Type":"application/json", Prefer:"resolution=merge-duplicates" },
      body: JSON.stringify(body)
    });
  }

  return NextResponse.json({
    q_used: queries,
    items: scored,
    counts: { raw: items.length, unique: unique.length, returned: scored.length, whitelisted: Array.from(whitelist).length },
  });
}
