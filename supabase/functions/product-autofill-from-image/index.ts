import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutofillRequest {
  imageBase64: string;
  hints?: { title?: string; artist?: string; format?: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY secret");
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY secret" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as AutofillRequest;
    const { imageBase64, hints } = body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You extract structured metadata about a music release from a cover image. Return STRICT JSON only with keys: 
{
  "title": string,
  "artist": string,
  "format": "vinyl" | "cassette" | "cd",
  "description": string,
  "tags": string[]
}
- Infer format from visual cues (vinyl record, cassette shell, CD logo). If uncertain, default to "vinyl".
- Keep description concise (max 280 chars), include notable info like edition, color, label if visible.
- tags: 5-8 concise keywords (subgenres, mood, country if readable).
- If the field is unknown, use an empty string, and tags as empty array.
Return JSON only.`;

    const userText = `Hints to help (optional): title=${hints?.title ?? ""}, artist=${hints?.artist ?? ""}, format=${hints?.format ?? ""}.`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "input_image",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      temperature: 0.2,
    } as const;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("OpenAI API error", errText);
      return new Response(JSON.stringify({ error: "OpenAI API error", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed: any = {};
    try {
      // Some models wrap JSON in code fences
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.warn("Failed to parse JSON content, returning minimal fields", e);
      parsed = {};
    }

    const result = {
      title: typeof parsed.title === "string" ? parsed.title : "",
      artist: typeof parsed.artist === "string" ? parsed.artist : "",
      format: ["vinyl", "cassette", "cd"].includes(parsed.format) ? parsed.format : "vinyl",
      description: typeof parsed.description === "string" ? parsed.description : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("product-autofill-from-image error", error);
    return new Response(JSON.stringify({ error: "Unexpected error", details: error?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
