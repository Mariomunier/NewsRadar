// app/page.tsx
import Link from "next/link";

async function getInstruments() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/instrument?select=symbol,name,asset_class`;
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY as string,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
    },
    cache: "no-store",
  });
  return r.json();
}

export default async function Home() {
  const instruments = await getInstruments();
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">NewsRadar</h1>
      <p className="mb-6 text-sm text-gray-600">Vælg et instrument for at se de vigtigste drivere.</p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {instruments.map((it: any) => (
          <li key={it.symbol} className="border rounded-lg p-4 hover:shadow">
            <div className="text-xs text-gray-500">{it.asset_class.toUpperCase()}</div>
            <div className="text-lg font-medium">{it.name} • {it.symbol}</div>
            <Link href={`/instrument/${it.symbol}`} className="text-blue-600 text-sm underline">Åbn</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
