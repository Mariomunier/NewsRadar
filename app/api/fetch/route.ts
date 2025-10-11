import { NextRequest, NextResponse } from "next/server";

const NEWS_API_KEY = process.env.NEWS_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

type Item = { title:string; url:string; domain:string; published_at:string; snippet?:string; relevance?:number };
function domainFromUrl(u:string){ try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ""; } }
function hoursAgo(dt:string){ return (Date.now() - new Date(dt).getTime())/36e5; }
function scoreItem(it: Item, symbol: string, keywords: string[], sourceScores: Record<string,number>): number {
  const base = Math.min(1, Math.max(0, 1 - (hoursAgo(it.published_at)/48)));
  const dom = sourceScores[it.domain] ?? 0.5;
  const text = (it.title + " " + (it.snippet||"")).toLowerCase();
  const symHit = text.includes(symbol.toLowerCase()) ? 0.15 : 0;
  const kwHit = keywords.some(k => text.includes(k.toLowerCase())) ? 0.1 : 0;
  return Math.max(0, Math.min(1, base*0.6 + dom*0.3 + symHit + kwHit));
}

export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "EURUSD";
  const lookback = parseInt(searchParams.get("lookback_hours") || "48",10);
  const maxItems = parseInt(searchParams.get("max_items") || "50",10);

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

  // instrument
  const instRes = await fetch(`${SUPABASE_URL}/rest/v1/instrument?symbol=eq.${symbol}&select=id,keywords`, { headers });
  const inst = (await instRes.json())[0];
  if(!inst) return NextResponse.json({ error:"Unknown instrument" }, { status:400 });

  // sources
  const srcRes = await fetch(`${SUPABASE_URL}/rest/v1/source?whitelisted=eq.true&select=domain,score`, { headers });
  const srcRows = await srcRes.json() as {domain:string, score:number}[];
  const sourceScores = Object.fromEntries(srcRows.map(s=>[s.domain,s.score]));

  const items: Item[] = [];

  // NewsAPI eksempel
  if(NEWS_API_KEY){
    const q = encodeURIComponent(symbol);
    const r = await fetch(`https://newsapi.org/v2/everything?q=${q}&pageSize=25&sortBy=publishedAt&language=en`, {
      headers: { "X-Api-Key": NEWS_API_KEY }
    });
    const j = await r.json();
    (j.articles||[]).forEach((a:any)=>{
      if(!a.url) return;
      items.push({
        title: a.title || "",
        url: a.url,
        domain: domainFromUrl(a.url),
        published_at: a.publishedAt || new Date().toISOString(),
        snippet: a.description || ""
      });
    });
  }

  // dedupe + filter
  const cutoff = Date.now() - lookback*3600*1000;
  const map = new Map<string, Item>();
  for(const it of items){
    const key = it.title.toLowerCase().slice(0,160);
    if(!map.has(key) && new Date(it.published_at).getTime()>=cutoff){
      map.set(key, it);
    }
  }
  let unique = [...map.values()].slice(0, maxItems);

  // score
  const keywords: string[] = (inst.keywords||[]);
  const scored = unique.map(it => ({...it, relevance: scoreItem(it, symbol, keywords, sourceScores)}))
                       .sort((a,b)=> (b.relevance||0) - (a.relevance||0));

  // gem i Supabase
  for(const it of scored.slice(0, maxItems)){
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
    items: scored,
    source_stats: { whitelisted: srcRows.length, blacklisted: 0, deduped: items.length - scored.length }
  });
}
