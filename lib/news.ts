// app/lib/news.ts
// Små utilities til at hente instrumenter/nyheder + filtrere relevance

type Instrument = {
  symbol: string;
  name: string;
  asset_class: string;
  keywords?: string[];
};

type Article = {
  id: string;
  instrument_id?: string | null;
  title: string;
  url: string;
  source_domain: string;
  published_at: string;
  summary?: string | null;
};

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supaKey = process.env.SUPABASE_ANON_KEY!;

// Domains vi stoler mest på (du har allerede "source" tabellen – vi supplerer bare i koden)
export const ALLOWLIST_DOMAINS = [
  "reuters.com",
  "bloomberg.com",
  "wsj.com",
  "ft.com",
  "investing.com",
  "cnbc.com",
  "seekingalpha.com",
  "marketwatch.com",
  "federalreserve.gov",
  "ecb.europa.eu",
  "bankofengland.co.uk",
  "bea.gov",
];

// “Uinteressant for trading” – filtrér fra
export const BLACKLIST_PATTERNS = [
  /jewel|jewelry|necklace|ring|bracelet|smykke|smykker/i,
  /wedding|engagement|bride|groom|bryllup/i,
  /fashion|runway|designer/i,
  /exhibition|art|museum|gallery|udstilling/i,
  /celebrity|gossip|royal|skuespiller|filmstjerne/i,
  /perfume|fragrance|makeup/i,
  /lottery|prize|giveaway/i,
];

// “Trading-relevante” nøgleord – mindst ét skal matche
export const TRADING_WHITELIST = [
  /fed|fomc|ecb|boj|pboC|interest rate|rente|hike|cut|pivot/i,
  /cpi|ppi|inflation|jobs|payroll|unemployment|retail sales|gdp|macro/i,
  /yield|treasury|bond|credit|spread/i,
  /usd|eur|jpy|gbp|chf|sek|nok|aud|cad|yuan|renminbi|bitcoin|ether|crypto|gold|silver|oil/i,
  /price|rally|selloff|risk|volatility|breakout|support|resistance/i,
];

export function isTradingRelevant(a: Article, inst?: Instrument | null): boolean {
  const t = `${a.title} ${a.summary ?? ""}`;

  // 1) blacklists out
  if (BLACKLIST_PATTERNS.some((re) => re.test(t))) return false;

  // 2) trading whitelist in
  const hitTrading = TRADING_WHITELIST.some((re) => re.test(t));

  // 3) domæne skal være nogenlunde OK
  const okDomain = ALLOWLIST_DOMAINS.some((d) => a.source_domain.endsWith(d));

  // 4) hvis instrument leverer keywords – bonus
  const kwHit =
    inst?.keywords?.length
      ? inst.keywords.some((k) => t.toLowerCase().includes(k.toLowerCase()))
      : false;

  // Min. krav: enten domæne ok + trading-hit, eller keywords rammer + trading-hit
  return (okDomain && hitTrading) || (kwHit && hitTrading);
}

// Hent instrumenter
export async function fetchInstruments(): Promise<Instrument[]> {
  const url = `${supaUrl}/rest/v1/instrument?select=symbol,name,asset_class,keywords&order=asset_class.asc,symbol.asc`;
  const r = await fetch(url, {
    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Hent artikler (seneste X)
export async function fetchRecentArticles(limit = 40): Promise<Article[]> {
  const url = `${supaUrl}/rest/v1/article?select=id,title,url,source_domain,published_at,summary,instrument_id&order=published_at.desc&limit=${limit}`;
  const r = await fetch(url, {
    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Hent artikler for et givet symbol
export async function fetchArticlesForSymbol(symbol: string, limit = 40) {
  // lookup instrument id
  const instUrl = `${supaUrl}/rest/v1/instrument?symbol=eq.${encodeURIComponent(
    symbol
  )}&select=id,symbol,name,asset_class,keywords&limit=1`;
  const ir = await fetch(instUrl, {
    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    cache: "no-store",
  });
  const [inst] = (await ir.json()) as (Instrument & { id: string })[];

  if (!inst?.id) return { inst: null, articles: [] as Article[] };

  const artUrl = `${supaUrl}/rest/v1/article?instrument_id=eq.${inst.id}&select=id,title,url,source_domain,published_at,summary,instrument_id&order=published_at.desc&limit=${limit}`;
  const ar = await fetch(artUrl, {
    headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    cache: "no-store",
  });
  const articles = (await ar.json()) as Article[];

  // filter + let top 20 være
  const filtered = articles.filter((a) => isTradingRelevant(a, inst)).slice(0, 20);
  return { inst, articles: filtered };
}
