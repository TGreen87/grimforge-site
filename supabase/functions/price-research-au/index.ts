import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PriceRequest {
  title: string;
  artist: string;
  format?: "vinyl" | "cassette" | "cd";
  cost?: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const PPLX_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PPLX_API_KEY) {
    console.error("Missing PERPLEXITY_API_KEY secret");
    return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY secret" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as PriceRequest;
    const { title, artist, format = "vinyl", cost = null } = body || {};

    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userQuery = `Research current Australia market price for ${artist} - ${title} (${format}). Consider:
- Primary comps: Australian retailers, Discogs AU, local eBay AU sold listings
- Condition: New retail (sealed) unless known otherwise
- Typical indie record store margins in AU; if cost provided, consider reasonable retail margin
- Include GST considerations implicitly in retail price
Return STRICT JSON ONLY with keys:
{
  "suggested_price": number, // in AUD
  "currency": "AUD",
  "reasoning": string, // 1-2 sentences max
  "sources": [{"title": string, "url": string}] // up to 5
}
${cost !== null ? `Cost basis (seller reported): AUD ${cost}. Prefer suggested_price >= cost * 1.25 unless market contradicts.` : ""}`;

    const pplxResp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PPLX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          { role: 'system', content: 'Be precise and concise. Return JSON only.' },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0,
      }),
    });

    if (!pplxResp.ok) {
      const errText = await pplxResp.text();
      console.error('Perplexity API error', errText);
      return new Response(JSON.stringify({ error: 'Perplexity API error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pplxJson = await pplxResp.json();
    const content: string = pplxJson?.choices?.[0]?.message?.content ?? '';

    let parsed: any;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : content);
    } catch (e) {
      console.warn('Failed to parse JSON from Perplexity, using fallback', e);
      parsed = {};
    }

    const result = {
      suggested_price: typeof parsed.suggested_price === 'number' ? parsed.suggested_price : null,
      currency: parsed.currency === 'AUD' ? 'AUD' : 'AUD',
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'Pricing based on recent AU market comps.',
      sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0,5).filter((s: any) => s && s.url && s.title) : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('price-research-au error', error);
    return new Response(JSON.stringify({ error: 'Unexpected error', details: error?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
