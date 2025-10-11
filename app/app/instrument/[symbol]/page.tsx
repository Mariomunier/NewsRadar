import Link from "next/link";

async function getInstrument(symbol: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/instrument?symbol=eq.${symbol}&select=id,symbol,name`;
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
    },
    cache: "no-store",
  });
  const j = await r.json();
  return j[0];
}

async function fetchArticles(symbol: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  const r = await fetch(`${base}/api/fetch?symbol=${symbol}&lookback_hours=48&max_items=40`, { cache: "no-store" });
  return r.json();
}

async function summarize(symbol: string, instrument_id: string, items: any[]) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  const r = await fetch(`${base}/api/summarize`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ instrument: symbol, instrument_id, items })
  });
  return r.json();
}

export default async function Page({ params }: { params: { symbol: string } }) {
  const inst = await getInstrument(params.symbol);
  if (!inst) return <main className="p-6">Ukendt instrument</main>;

  const fetched = await fetchArticles(params.symbol);
  const summary = await summarize(params.symbol, inst.id, fetched.items);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/" className="text-sm underline">← Tilbage</Link>
        <h1 className="text-2xl font-semibold mt-2">{inst.name} • {inst.symbol}</h1>
        <p className="text-gray-600 text-sm">Automatisk nyhedsoverblik med kilde-links og vurdering.</p>
      </div>

      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Dagens drivere</h2>
          <span className="text-xs px-2 py-1 rounded bg-gray-100">
            impact: {summary.impact} • horizon: {summary.horizon} • conf: {summary.confidence}
          </span>
        </div>
        <p className="text-sm">{summary.explanation}</p>
        <div className="text-xs text-gray-600 mt-2">Drivers: {(summary.drivers||[]).join(", ")}</div>
        <div className="text-xs mt-2">
          Kilder: {(summary.key_sources||[]).map((s:any,i:number)=>(
            <a key={i} href={s.url} className="underline mr-2" target="_blank">{s.title||s.url}</a>
          ))}
        </div>
      </section>

      <section className="border rounded-lg p-4">
        <h3 className="font-medium mb-3">Kildeartikler ({fetched.items.length})</h3>
        <ul className="space-y-3">
          {fetched.items.map((it:any,i:number)=>(
            <li key={i} className="border rounded p-3">
              <div className="text-xs text-gray-500">{it.domain} • {new Date(it.published_at).toLocaleString()}</div>
              <a href={it.url} target="_blank" className="text-sm underline font-medium">{it.title}</a>
              <div className="text-xs text-gray-600 mt-1">Relevans: {it.relevance.toFixed(2)}</div>
              {it.snippet ? <p className="text-sm mt-1">{it.snippet}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
