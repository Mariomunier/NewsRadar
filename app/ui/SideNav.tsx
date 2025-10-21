// app/ui/SideNav.tsx
import { Home, Newspaper, BarChart3, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Instrumenter", icon: Home },
  { href: "/news", label: "Nyhedsfeed", icon: Newspaper },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Indstillinger", icon: Settings },
];

export default function SideNav() {
  return (
    <aside className="hidden lg:block w-[240px] border-r border-white/10 bg-black/20">
      <div className="px-3 py-3 text-xs uppercase tracking-wide text-slate-400">Menu</div>
      <nav className="px-2 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5">
            <Icon className="h-4 w-4 text-slate-400" />
            <span className="text-sm">{label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
