// lib/newsFilter.ts
export type RawArticle = {
  title: string;
  description?: string | null;
  url: string;
  publishedAt: string; // ISO
  source?: { name?: string; id?: string };
  content?: string | null;
};

export type ScoredArticle = RawArticle & {
  score: number;     // 0..1
  reason: string[];  // hvilke regler ramte
};

const EXCLUDE_PHRASES = [
  // lifestyle / ikke-trading
  "jewelry","necklace","bracelet","ring","wedding","model","fashion",
  "celebrity","gossip","tv show","movie","trailer","music video",
  "recipe","garden","makeup","football transfer","gaming",
  "lifestyle","luxury watch","handbag","cosmetics","runway",
];

const INCLUDE_PHRASES_BASE = [
  // makro/markets
  "fed","ecb","boj","boe","snB","opec","treasury","bond","yield",
  "inflation","cpi","ppi","pce","gdp","payrolls","jobless","claims",
  "pmi","manufacturing","industrial output","trade balance",
  "hike","cut","rate","guidance","earnings","revenue","forecast",
  "equities","stocks","futures","commodities","oil","gold","silver",
  "copper","sanctions","geopolitics","war","china","property",
  "liquidity","volatility","fx","currency","devaluation",
];

function text(h?: string | null) {
  return (h ?? "").toLowerCase();
}

function hitCount(haystack: string, needles: string[]) {
  let n = 0;
  for (const k of needles) if (haystack.includes(k)) n++;
  return n;
}

// Hovedfilter: giver score 0..1 og fjerner irrelevante artikler
export function scoreAndFilter(
  articles: RawArticle[],
  instrumentKeywords: string[]  // fx ["gold","xauusd","lagarde","ecb"]
): ScoredArticle[] {
  const results: ScoredArticle[] = [];

  for (const a of articles) {
    const body = text(a.title) + " " + text(a.description) + " " + text(a.content);

    // Hårde eksklusioner
    if (EXCLUDE_PHRASES.some((x) => body.includes(x))) continue;

    // Inklusionsord = generelle + instrumentets egne
    const include = [...INCLUDE_PHRASES_BASE, ...instrumentKeywords.map(x => x.toLowerCase())];

    const incHits = hitCount(body, include);
    const titleBoost = hitCount(text(a.title), include) * 2;
    const recentBoost = 0.2; // lille bonus for at være ny (du kan vægte med alder)

    let score = Math.min(1, (incHits * 0.1) + titleBoost * 0.1 + recentBoost);

    // Minimumscore – alt under smides væk
    if (score < 0.25) continue;

    const reason: string[] = [];
    if (titleBoost) reason.push("title-match");
    if (incHits) reason.push("keywords");
    results.push({ ...a, score, reason });
  }

  // sortér best først & fjern dubletter (på URL)
  const seen = new Set<string>();
  return results
    .sort((a, b) => b.score - a.score || +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
}
