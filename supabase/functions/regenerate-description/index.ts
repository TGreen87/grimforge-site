import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegenRequest {
  title: string;
  artist: string;
  format?: "vinyl" | "cassette" | "cd";
  tags?: string[];
  existing?: string;
}

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

  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { title, artist, format = "vinyl", tags = [], existing = "" } = (await req.json()) as RegenRequest;
    if (!title || !artist) {
      return new Response(JSON.stringify({ error: "title and artist are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instructions = `Write a concise, music-focused product description for a record store listing.\nConstraints:\n- 120–220 characters.\n- Describe sound/genre/subgenres, scene/region if relevant, edition/pressing cues.\n- Avoid artwork/visual terms entirely.\n- Tone should fit extreme/underground metal retail (no "cosmic" unless clearly accurate).\n- Return JSON only: {"description": "..."}`;

    const userInput = `Title: ${title}\nArtist: ${artist}\nFormat: ${format}\nTags: ${(tags || []).join(", ")}\nExisting (optional): ${existing}`;

    const payload = {
      model: "gpt-5",
      input: [
        { role: "system", content: [{ type: "text", text: instructions }] },
        { role: "user", content: [{ type: "input_text", text: userInput }] },
      ],
      temperature: 0.5,
      store: false,
    } as const;

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("OpenAI Responses error", err);
      return new Response(JSON.stringify({ error: "AI error", details: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const text = parseOutputText(data);

    let description = "";
    try {
      const match = text && text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : text || "{}");
      description = typeof parsed.description === "string" ? parsed.description : "";
    } catch (_) {}

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("regenerate-description error", error);
    return new Response(JSON.stringify({ error: "Unexpected error", details: error?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
