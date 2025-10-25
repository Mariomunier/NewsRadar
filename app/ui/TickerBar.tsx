// app/ui/TickerBar.tsx
"use client";

import { useEffect, useState } from "react";

type Række = { symbol: string; last?: string; change?: string };

async function hentInstrumenter(): Promise<{ symbol: string }[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/instrument?select=symbol&order=asset_class.asc,symbol.asc`;
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function TickerBar() {
  const [rækker, setRækker] = useState<Række[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const instr = await hentInstrumenter();
        // MOCK-priser (kan senere skiftes til rigtige quotes)
        const mapped = instr.map((i) => ({
          symbol: i.symbol,
          last: (Math.random() * 100).toFixed(2),
          change: ((Math.random() * 2 - 1) * 1.5).toFixed(2) + "%",
        }));
        setRækker(mapped);
      } catch {
        setRækker([
          { symbol: "EURUSD", last: "1.07", change: "0.12%" },
          { symbol: "XAUUSD", last: "2351", change: "-0.24%" },
          { symbol: "BTCUSDT", last: "64250", change: "0.44%" },
        ]);
      }
    })();
  }, []);

  if (!rækker.length) return null;

  const linje = rækker.map((it, idx) => {
    const neg = (it.change ?? "").trim().startsWith("-");
    return (
      <a key={it.symbol + idx} href={`/instrument/${it.symbol}`} className="ticker-item hover:underline">
        <span className="text-slate-300">{it.symbol}</span>
        <span className="opacity-90">{it.last ?? "…"}</span>
        <span className={neg ? "ticker-change-neg" : "ticker-change-pos"}>
          {it.change ?? "…"}
        </span>
      </a>
    );
  });

  return (
    <div className="ticker-wrap">
      <div className="container mx-auto px-3">
        {/* dupliker én gang for sømløs rulning */}
        <div className="ticker-line">
          {linje}
          {linje}
        </div>
      </div>
    </div>
  );
}

