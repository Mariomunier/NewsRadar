// app/ui/TopNav.tsx
"use client";

import { Search, Star, SunMoon } from "lucide-react";
import { useState } from "react";

export default function TopNav() {
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-[#0f1219]/95 backdrop-blur">
      <div className="container mx-auto h-full px-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-blue-500" />
          <span className="text-sm font-semibold tracking-wide">NewsRadar</span>
        </a>

        <div className="flex-1 max-w-xl relative ml-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="w-full rounded-lg bg-white/5 pl-8 pr-3 py-2 text-sm outline-none border border-white/10 focus:ring-2 focus:ring-blue-500"
            placeholder="Søg instrument (fx XAUUSD, EURUSD, ES, BTCUSDT)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) {
                window.location.href = `/instrument/${q.trim().toUpperCase()}`;
              }
            }}
          />
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
          <Star className="h-4 w-4" />
          <span className="hidden md:inline">Favoritter</span>
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          title="Tema"
          onClick={() => {
            document.documentElement.classList.toggle("light");
            document.documentElement.classList.toggle("dark");
          }}
        >
          <SunMoon className="h-4 w-4" />
          <span className="hidden md:inline">Tema</span>
        </button>
      </div>
    </header>
  );
}
