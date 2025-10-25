// app/news/page.tsx
async function hentSeneste(limit = 60) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/article?select=id,title,url,source_domain,published_at,summary&order=published_at.desc&limit=${limit}`;
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

export const dynamic = "force-dynamic";

export default async function NyhedsfeedSide() {
  const items = await hentSeneste(48);

  // Lille relevansfilter (du har allerede dybere filtrering pr. instrument)
  const whitelist = /(fed|ecb|rente|cpi|inflation|usd|eur|jpy|gbp|gold|oil|bitcoin|rally|selloff|volatility)/i;
  const blacklist = /(smykke|jewelry|udstilling|celebrity|gossip)/i;
  const filtreret = items.filter((a: any) => whitelist.test(a.title) && !blacklist.test(a.title));

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-xl font-semibold">Nyhedsfeed</h1>
        <p className="text-sm text-slate-400">Et hurtigt overblik fra kendte kilder.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtreret.slice(0, 24).map((a: any) => (
          <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="card p-4 hover:bg-white/10">
            <div className="text-xs text-slate-400 mb-1">
              {a.source_domain} · {new Date(a.published_at).toLocaleString("da-DK")}
            </div>
            <div className="font-medium">{a.title}</div>
            {a.summary ? <div className="text-sm text-slate-400 mt-1 line-clamp-2">{a.summary}</div> : null}
          </a>
        ))}
      </div>
    </div>
  );
}

