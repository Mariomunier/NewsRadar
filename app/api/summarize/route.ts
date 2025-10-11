import { NextRequest, NextResponse } from "next/server";

const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";
const LLM_API_KEY = process.env.LLM_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

async function callLLM(prompt: string): Promise<any> {
  if (LLM_PROVIDER === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers: { "Authorization": `Bearer ${LLM_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role:"system", content:"Du er en finansnyheds-analytiker. Svar KUN med gyldig JSON." },
          { role:"user", content: prompt }
        ]
      })
    });
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content || "{}";
    return JSON.parse(text);
  }
  throw new Error("LLM provider ikke implementeret");
}

export async function POST(req: NextRequest){
  const body = await req.json();
  const { instrument, items, instrument_id } = body;

  const trimmed = (items||[]).slice(0, 20).map((it:any)=>({
    title: it.title, snippet: it.snippet, source: it.domain, time: it.published_at, url: it.url
  }));

  const prompt = `Rolle: Du er finansnyheds-analytiker. Returnér KUN JSON:
impact ('bullish'|'bearish'|'neutral'),
horizon ('intraday'|'short'|'medium'|'long'),
confidence (0..1),
explanation (max 120 ord, på dansk, ingen råd/signal),
drivers (liste),
key_sources (titel+url fra de mest troværdige).
Artikler: ${JSON.stringify(trimmed).slice(0,6000)}`;

  const result = await callLLM(prompt);

  const headers = { apikey: SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`, "Content-Type":"application/json" };
  await fetch(`${SUPABASE_URL}/rest/v1/assessment`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      instrument_id,
      impact: result.impact,
      horizon: result.horizon,
      confidence: result.confidence,
      explanation: result.explanation,
      drivers: result.drivers,
      key_sources: result.key_sources
    })
  });

  return NextResponse.json(result);
}
