// app/analytics/page.tsx
function demoSerie(n = 120) {
  const arr: number[] = [];
  let v = 100;
  for (let i = 0; i < n; i++) {
    v += Math.sin(i / 8) * 0.6 + (Math.random() - 0.5) * 1.2;
    arr.push(v);
  }
  return arr;
}

function MiniGraf({ titel }: { titel: string }) {
  const p = demoSerie(120);
  const w = 520, h = 180, pad = 16;
  const min = Math.min(...p), max = Math.max(...p);
  const sx = (i: number) => pad + (i / (p.length - 1)) * (w - pad * 2);
  const sy = (v: number) => pad + (1 - (v - min) / (max - min + 1e-6)) * (h - pad * 2);
  const d = p.map((v, i) => `${i ? "L" : "M"} ${sx(i)} ${sy(v)}`).join(" ");

  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-medium">{titel}</div>
      <svg width={w} height={h}>
        <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.9" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function AnalyticsSide() {
  const rækker = ["EURUSD", "XAUUSD", "BTCUSDT", "ES", "CL", "USDJPY"];
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-slate-400">Demo-grafer. Vi kan senere koble rigtige data og nyhedsmarkører på.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rækker.map((s) => (<MiniGraf key={s} titel={s} />))}
      </div>
    </div>
  );
}

