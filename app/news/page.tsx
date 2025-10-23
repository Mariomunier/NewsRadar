// app/news/page.tsx
import { fetchRecentArticles, isTradingRelevant } from "../lib/news";
import { fetchInstruments } from "../lib/news";

export const dynamic = "force-dynamic";

export default async function NewsFeedPage() {
  const [articles, instruments] = await Promise.all([
    fetchRecentArticles(60),
    fetchInstruments(),
  ]);
  // Map instrument-id -> instrument
  const byId = new Map<string, any>();
  for (const inst of instruments as any[]) (byId as any).set(inst.id, inst);

  // Kun “kendte”/store medier + trading-relevans
  const filtered = articles.filter((a) =>
    isTradingRelevant(a as any, a.instrument_id ? byId.get(a.instrument_id) : null)
  );

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-semibold">Nyhedsfeed</h1>
        <p className="text-sm text-slate-400">
          Et hurtigt overblik fra de mest troværdige kilder.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.slice(0, 24).map((a) => (
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
