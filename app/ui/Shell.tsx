// app/ui/Shell.tsx
import SideNav from "./SideNav";
import TopNav from "./TopNav";
import TickerBar from "./TickerBar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <TickerBar />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <SideNav />
        <main className="min-h-[60vh] p-4 lg:p-6 space-y-4">{children}</main>
        <aside className="hidden lg:block border-l border-white/10 bg-black/20 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold mb-2">Hurtige links</div>
            <ul className="space-y-2 text-sm">
              <li><a className="text-blue-400 hover:underline" href="/instrument/EURUSD">EURUSD</a></li>
              <li><a className="text-blue-400 hover:underline" href="/instrument/XAUUSD">XAUUSD</a></li>
              <li><a className="text-blue-400 hover:underline" href="/instrument/BTCUSDT">BTCUSDT</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
