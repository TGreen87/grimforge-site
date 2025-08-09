import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await req.json().catch(() => ({ text: "" }));
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "'text' is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt asking strictly for JSON output
    const prompt = `Extract 5-10 SEO-friendly music product tags from the following details. 
- Use concise lowercase words, allow hyphens, no emojis, no prefixes, no numbering.
- Avoid duplicates and very generic words (music, album).
- Return ONLY valid JSON in the form: {"tags":["tag1","tag2",...]}

Text:\n${text}`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "system", content: "Be precise and concise. Output JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 400,
        return_images: false,
        return_related_questions: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity error:", errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    let tags: string[] = [];
    try {
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      const arr = parsed?.tags;
      if (Array.isArray(arr)) tags = arr.map((t: unknown) => String(t)).filter(Boolean);
    } catch (_) {
      // Try to extract JSON substring if model wrapped it
      const match = typeof content === "string" ? content.match(/\{[\s\S]*\}/) : null;
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          const arr = parsed?.tags;
          if (Array.isArray(arr)) tags = arr.map((t: unknown) => String(t)).filter(Boolean);
        } catch {}
      }
    }

    // Basic fallback to ensure response shape
    if (!Array.isArray(tags) || tags.length === 0) {
      tags = [];
    }

    return new Response(JSON.stringify({ tags }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-tags error", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
