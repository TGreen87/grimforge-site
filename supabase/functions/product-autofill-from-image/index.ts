import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AutofillRequest {
  imageBase64?: string;
  imageBase64List?: string[];
  referenceUrls?: string[];
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
    const { imageBase64, imageBase64List, referenceUrls = [], hints } = body || {};

    const images = Array.isArray(imageBase64List)
      ? imageBase64List.filter((s) => typeof s === "string" && s.length > 0)
      : [];
    if (imageBase64 && typeof imageBase64 === "string") images.unshift(imageBase64);
    const uniqueImages = Array.from(new Set(images));

    if ((!uniqueImages.length) && (!referenceUrls || referenceUrls.length === 0)) {
      return new Response(JSON.stringify({ error: "Provide at least one image or a reference URL" }), {
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

    const refs = (referenceUrls || []).slice(0, 5).join(" | ");
    const userText = `Hints to help (optional): title=${hints?.title ?? ""}, artist=${hints?.artist ?? ""}, format=${hints?.format ?? ""}. Reference URLs: ${refs}`;

    const userContent = [
      { type: "text", text: userText },
      ...uniqueImages.slice(0, 5).map((u) => ({ type: "image_url" as const, image_url: { url: u } })),
    ];

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userContent as any,
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
    } as {
      title: string; artist: string; format: "vinyl"|"cassette"|"cd"; description: string; tags: string[];
    };

    // Fallback: if insufficient data, try web search via Perplexity using uploaded image(s) and reference URLs
    if ((!result.title || !result.artist) && Deno.env.get("PERPLEXITY_API_KEY")) {
      try {
        const imageUrls: string[] = [];
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (uniqueImages.length && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          for (const img of uniqueImages.slice(0, 5)) {
            if (typeof img === "string" && img.startsWith("data:")) {
              const m = img.match(/^data:(.*?);base64,(.*)$/);
              if (m) {
                const mime = m[1] || "image/jpeg";
                const base64 = m[2];
                const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
                const ext = (mime.split("/")[1] || "jpg").toLowerCase();
                const path = `autofill/tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const blob = new Blob([bytes], { type: mime });
                const { error: upErr } = await supabase.storage.from("products").upload(path, blob, { contentType: mime, upsert: true });
                if (!upErr) {
                  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
                  if (pub?.publicUrl) imageUrls.push(pub.publicUrl);
                }
              }
            } else if (typeof img === "string") {
              imageUrls.push(img);
            }
          }
        } else if (uniqueImages.length) {
          // No Supabase creds available to upload data URLs, use any http(s) URLs directly
          for (const img of uniqueImages.slice(0, 5)) if (typeof img === "string") imageUrls.push(img);
        }

        const allRefs = (referenceUrls || []).slice(0, 8);

        if (imageUrls.length || allRefs.length) {
          const PPLX_API_KEY = Deno.env.get("PERPLEXITY_API_KEY")!;
          const query = `Identify this music release and return JSON only.\nImage URLs:\n${imageUrls.map((u,i)=>`- ${i+1}. ${u}`).join("\n")}\nReference URLs:\n${allRefs.map((u,i)=>`- ${i+1}. ${u}`).join("\n")}\nKeys:\n{\n  "title": string,\n  "artist": string,\n  "format": "vinyl" | "cassette" | "cd",\n  "description": string,\n  "tags": string[]\n}\nGuidelines:\n- Use Discogs, Bandcamp, label and retailer pages to confirm.\n- Keep description <= 280 chars. Provide 5-8 concise tags. Infer format if possible; else vinyl.\n- If unknown, use empty strings/array.`;

          const pplxResp = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${PPLX_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.1-sonar-large-128k-online",
              messages: [
                { role: "system", content: "Be precise. Return JSON only." },
                { role: "user", content: query },
              ],
              temperature: 0.2,
              top_p: 0.9,
              max_tokens: 800,
              search_recency_filter: "year",
            }),
          });

          if (pplxResp.ok) {
            const pplxData = await pplxResp.json();
            const text: string = pplxData?.choices?.[0]?.message?.content ?? "";
            try {
              const match = text.match(/\{[\s\S]*\}/);
              const p = JSON.parse(match ? match[0] : text);
              result.title = result.title || (typeof p.title === "string" ? p.title : "");
              result.artist = result.artist || (typeof p.artist === "string" ? p.artist : "");
              const fm = ["vinyl","cassette","cd"].includes(p.format) ? p.format : undefined;
              result.format = result.format || (fm as any) || "vinyl";
              result.description = result.description || (typeof p.description === "string" ? p.description : "");
              if (Array.isArray(p.tags)) {
                const extra = p.tags.filter((t: unknown) => typeof t === "string").slice(0, 10);
                result.tags = Array.from(new Set([...(result.tags || []), ...extra]));
              }
            } catch {}
          }
        }
      } catch (e) {
        console.warn("Perplexity fallback failed", e);
      }
    }

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
