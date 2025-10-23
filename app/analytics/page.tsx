// app/analytics/page.tsx
import { fetchInstruments, fetchArticlesForSymbol, isTradingRelevant } from "../lib/news";

function genFakePrices(n = 120) {
  // 120 punkter ~ 2 timer i 1-min opløsning (demo)
  const arr: number[] = [];
  let v = 100;
  for (let i = 0; i < n; i++) {
    v += Math.sin(i / 8) * 0.6 + (Math.random() - 0.5) * 1.2;
    arr.push(v);
  }
  return arr;
}

function Chart({
  title,
  points,
  markers,
}: {
  title: string;
  points: number[];
  markers: { idx: number; label: string }[];
}) {
  // simple SVG line
  const w = 520;
  const h = 180;
  const pad = 16;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const scaleX = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const scaleY = (v: number) => pad + (1 - (v - min) / (max - min + 0.00001)) * (h - pad * 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`).join(" ");

  return (
    <div className="card p-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      <svg width={w} height={h} className="block">
        <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.8" strokeWidth={1.5} />
        {markers.map((m, i) => (
          <g key={i}>
            <circle cx={scaleX(m.idx)} cy={scaleY(points[m.idx])} r={4} fill="#60a5fa" />
            {/* lille label */}
            <text x={scaleX(m.idx) + 6} y={scaleY(points[m.idx]) - 6} fontSize="10" fill="#94a3b8">
              {m.label.slice(0, 18)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default async function AnalyticsPage() {
  const instruments = await fetchInstruments();

  // Vi viser de første 6 instrumenter for performance i demo
  const first = instruments.slice(0, 6);

  const rows: {
    symbol: string;
    title: string;
    points: number[];
    markers: { idx: number; label: string }[];
  }[] = [];

  for (const inst of first) {
    const { articles } = await fetchArticlesForSymbol(inst.symbol, 40);
    // vælg de første 4 relevante og fordel dem over grafen
    const relevant = articles.filter((a) => isTradingRelevant(a as any, inst)).slice(0, 4);
    const points = genFakePrices(120);
    const step = Math.floor(points.length / (relevant.length + 1));
    const markers = relevant.map((a, i) => ({
      idx: Math.min(points.length - 1, (i + 1) * step),
      label: a.title,
    }));

    rows.push({
      symbol: inst.symbol,
      title: `${inst.name} • ${inst.symbol}`,
      points,
      markers,
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-slate-400">
          Graf pr. instrument med markører for vigtige nyheder (demo-priser – byt senere til rigtige).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Chart key={r.symbol} title={r.title} points={r.points} markers={r.markers} />
        ))}
      </div>
    </div>
  );
}
