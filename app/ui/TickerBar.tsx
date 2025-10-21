// app/ui/TickerBar.tsx
"use client";

import { useEffect, useState } from "react";

type Item = { symbol: string; last?: string; change?: string };

export default function TickerBar() {
  const [items, setItems] = useState<Item[]>([
    { symbol: "EURUSD" },
    { symbol: "XAUUSD" },
    { symbol: "BTCUSDT" },
    { symbol: "ES" },
    { symbol: "CL" },
  ]);

  useEffect(() => {
    // demo-tal – byt til rigtige priser senere
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        last: (Math.random() * 100).toFixed(2),
        change: (Math.random() * 2 - 1).toFixed(2) + "%",
      }))
    );
  }, []);

  return (
    <div className="border-b border-white/10 bg-black/20">
      <div className="container mx-auto px-3 overflow-x-auto whitespace-nowrap text-xs py-2 flex gap-6">
        {items.map((it) => {
          const negative = (it.change || "").trim().startsWith("-");
          return (
            <a key={it.symbol} href={`/instrument/${it.symbol}`} className="hover:underline">
              <span className="text-slate-400 mr-2">{it.symbol}</span>
              <span className="mr-2">{it.last ?? "…"}</span>
              <span className={negative ? "text-red-500" : "text-green-500"}>{it.change ?? "…"}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
