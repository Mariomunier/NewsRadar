// app/instrument/[symbol]/page.tsx
import Link from "next/link";

// ====== HELPERS (du kan flytte dem til app/lib/news.ts) ======
async function getInstrument(symbol: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/instrument?symbol=eq.${symbol}&select=id,symbol,name,asset_class,keywords`;
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  const j = await r.json();
  return j[0] as
    | { id: string; symbol: string; name: string; asset_class: string; keywords?: string[] }
    | undefined;
}

// Henter nyheder via din egen /api/fetch?symbol=... (din base API)
async function fetchArticles(symbol: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const r = await fetch(
    `${base}/api/fetch?symbol=${symbol}&lookback_hours=48&max_items=40`,
    { cache: "no-store" }
  );
  return r.json() as Promise<
    Array<{
      id: string;
      title: string;
      url: string;
      source_domain: string;
      published_at: string;
      summary?: string | null;
      instrument_id?: string | null;
    }>
  >;
}

// Valgfri: kald din /api/summarize for at få komprimeret vurdering
async function summarize(symbol: string, instrument_id: string, items: any[]) {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const r = await fetch(`${base}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrument: symbol, instrument_id, items }),
  });
  return r.json() as Promise<{ summary: string; drivers?: string[] }>;
}

// Simpel trading-relevans (supplerer din /api/fetch-logik)
const BLACKLIST = [
  /jewel|jewelry|smykke/i,
  /exhibition|udstilling|museum/i,
  /celebrity|gossip|royal/i,
  /fashion|runway|designer/i,
];
const WHITELIST = [
  /fed|fomc|ecb|boj|pboC|rente|interest rate|pivot|hike|cut/i,
  /cpi|ppi|inflation|jobs|payroll|gdp|macro/i,
  /yield|treasury|bond|credit|spread/i,
  /usd|eur|jpy|gbp|chf|sek|nok|aud|cad|gold|silver|oil|bitcoin|crypto/i,
  /price|rally|selloff|volatility|support|resistance/i,
];
function isTradingRelevant(t: string) {
  if (BLACKLIST.some((re) => re.test(t))) return false;
  return WHITELIST.some((re) => re.test(t));
}

// ====== PAGE ======
export const dynamic = "force-dynamic";

type PageProps = { params: { symbol: string } };

export async function generateMetadata({ params }: PageProps) {
  const symbol = params.symbol.toUpperCase();
  const inst = await getInstrument(symbol);
  return {
    title: inst ? `${inst.name} • ${symbol}` : symbol,
    description: "Automatisk nyhedsoverblik med kilde-links og vurdering.",
  };
}

export default async function InstrumentPage({ params }: PageProps) {
  const symbol = params.symbol.toUpperCase();
  const inst = await getInstrument(symbol);

  if (!inst) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold mb-2">{symbol}</h1>
        <p className="text-sm text-slate-400">Instrument blev ikke fundet.</p>
        <div className="mt-4">
          <Link className="text-blue-400 hover:underline" href="/">
            Tilbage
          </Link>
        </div>
      </div>
    );
  }

  const raw = await fetchArticles(symbol);

  // Relevansfiltrering
  const items = raw
    .filter((a) => isTradingRelevant(`${a.title} ${a.summary ?? ""}`))
    .slice(0, 20);

  // Valgfrit summary (hvis din /api/summarize er sat op)
  let verdict: { summary?: string; drivers?: string[] } = {};
  try {
    verdict = await summarize(symbol, inst.id, items);
  } catch {
    // det er ok at ignorere hvis /api/summarize ikke er klar
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="text-xs text-slate-400 uppercase tracking-wide">{inst.asset_class}</div>
        <h1 className="text-2xl font-semibold mt-1">
          {inst.name} • {inst.symbol}
        </h1>
        {verdict.summary ? (
          <p className="text-sm text-slate-300 mt-3">{verdict.summary}</p>
        ) : (
          <p className="text-sm text-slate-400 mt-3">
            Automatisk nyhedsoverblik med kilde-links og vurdering.
          </p>
        )}
        {verdict.drivers?.length ? (
          <div className="mt-3 text-sm">
            <span className="text-slate-400 mr-2">Mulige drivere:</span>
            {verdict.drivers.join(", ")}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="card p-4 hover:bg-white/10"
          >
            <div className="text-xs text-slate-400 mb-1">
              {new URL(`https://${a.source_domain}`).hostname} ·{" "}
              {new Date(a.published_at).toLocaleString("da-DK")}
            </div>
            <div className="font-medium">{a.title}</div>
            {a.summary ? (
              <div className="text-sm text-slate-400 mt-1 line-clamp-2">{a.summary}</div>
            ) : null}
          </a>
        ))}
      </div>
    </div>
  );
}
