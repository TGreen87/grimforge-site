import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseOutputText(obj: any): string {
  if (!obj) return "";
  if (typeof obj.output_text === "string" && obj.output_text) return obj.output_text;
  const content = obj.content;
  if (Array.isArray(content)) {
    const t = content.find((c) => c.type === "output_text" || c.type === "text");
    if (t?.text) return t.text;
  }
  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
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

    const instructions = `Extract 5-10 SEO-friendly music product tags from the following details.\n- Use concise lowercase words, allow hyphens, no emojis, no prefixes, no numbering.\n- Avoid duplicates and very generic words (music, album).\n- Return ONLY valid JSON in the form: {"tags":["tag1","tag2",...]}`;

    const payload = {
      model: "gpt-5",
      input: [
        { role: "system", content: [{ type: "text", text: "Be precise and concise. Output JSON only." }] },
        { role: "user", content: [ { type: "input_text", text: instructions + "\n\nText:\n" + text } ] },
      ],
      temperature: 0.2,
      store: false,
    } as const;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI Responses error:", errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const textOut = parseOutputText(data);

    let tags: string[] = [];
    try {
      const parsed = JSON.parse(textOut || "{}");
      const arr = parsed?.tags;
      if (Array.isArray(arr)) tags = arr.map((t: unknown) => String(t)).filter(Boolean);
    } catch (_) {
      const match = typeof textOut === "string" ? textOut.match(/\{[\s\S]*\}/) : null;
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          const arr = parsed?.tags;
          if (Array.isArray(arr)) tags = arr.map((t: unknown) => String(t)).filter(Boolean);
        } catch {}
      }
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
