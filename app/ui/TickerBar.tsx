// app/ui/TickerBar.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchInstruments } from "../lib/news";

// Simpel CSS marquee – vi duplicerer indholdet for “uendelig” loop
const styles = `
@keyframes tickerScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-wrap {
  overflow: hidden;
  position: relative;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
}
.ticker-move {
  display: inline-flex;
  white-space: nowrap;
  gap: 24px;
  animation: tickerScroll 35s linear infinite;
  will-change: transform;
}
.ticker-item {
  display: inline-flex;
  gap: 8px;
  font-size: 12px;
  align-items: center;
}
.ticker-price { opacity: .9 }
.ticker-change-pos { color: #10b981 } /* green-500 */
.ticker-change-neg { color: #ef4444 } /* red-500 */
`;

type Row = { symbol: string; last?: string; change?: string };

export default function TickerBar() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const instruments = await fetchInstruments();
        // mock priser (du kan bytte til rigtige senere)
        const mapped = instruments.map((i) => ({
          symbol: i.symbol,
          last: (Math.random() * 100).toFixed(2),
          change: ((Math.random() * 2 - 1) * 1.5).toFixed(2) + "%",
        }));
        setRows(mapped);
      } catch {
        setRows([
          { symbol: "EURUSD", last: "1.07", change: "0.12%" },
          { symbol: "XAUUSD", last: "2351", change: "-0.24%" },
          { symbol: "BTCUSDT", last: "64250", change: "0.44%" },
        ]);
      }
    })();
  }, []);

  const content = (
    <>
      {rows.map((it, idx) => {
        const neg = (it.change ?? "").trim().startsWith("-");
        return (
          <a
            key={it.symbol + idx}
            href={`/instrument/${it.symbol}`}
            className="ticker-item hover:underline"
          >
            <span className="text-slate-300">{it.symbol}</span>
            <span className="ticker-price">{it.last ?? "…"}</span>
            <span className={neg ? "ticker-change-neg" : "ticker-change-pos"}>
              {it.change ?? "…"}
            </span>
          </a>
        );
      })}
    </>
  );

  return (
    <div className="ticker-wrap">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="container mx-auto px-3 py-2">
        {/* duplikeret: to gange i træk => 100% + 100% => animation til -50% */}
        <div className="ticker-move">
          {content}
          {content}
        </div>
      </div>
    </div>
  );
}

