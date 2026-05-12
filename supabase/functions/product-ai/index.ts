// Generates product copy & images via Lovable AI Gateway.
// Modes:
//  - "short" → tagline + short_description
//  - "rich"  → long markdown description + SEO meta + tags
//  - "all"   → everything (tagline, short, description, features, seo)
//  - "image" → AI-generated product image (returns data URL)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Mode = "short" | "rich" | "all" | "image";

type Body = {
  mode: Mode;
  product: {
    name: string;
    category?: string;
    tagline?: string;
    description?: string;
    features?: string[];
  };
  imagePrompt?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const { mode, product, imagePrompt } = (await req.json()) as Body;
    if (!product?.name) throw new Error("product.name is required");

    // ===== IMAGE GENERATION (direct Gemini API with user's key) =====
    if (mode === "image") {
      if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");
      const prompt =
        imagePrompt?.trim() ||
        `Premium glassmorphism product mockup of "${product.name}"${product.category ? ` (${product.category})` : ""}: clean studio background with soft pastel aurora gradient, frosted glass card, subtle glow, vibrant brand colors, professional e-commerce hero shot, ultra high detail, 1:1 square. No text, no watermark.`;

      const model = "gemini-2.5-flash-image-preview";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      });

      if (r.status === 429) return json({ error: "Gemini rate limit, please retry shortly." }, 429);
      if (!r.ok) {
        const t = await r.text();
        console.error("gemini image error", r.status, t);
        return json({ error: `Gemini API error (${r.status}): ${t.slice(0, 200)}` }, 500);
      }
      const data = await r.json();
      const parts = data?.candidates?.[0]?.content?.parts ?? [];
      const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData;
      if (!inline?.data) {
        console.error("no image in gemini response", JSON.stringify(data).slice(0, 400));
        return json({ error: "No image returned from Gemini" }, 500);
      }
      const mime = inline.mimeType || "image/png";
      const dataUrl = `data:${mime};base64,${inline.data}`;
      return json({ image: dataUrl });
    }

    // ===== TEXT GENERATION (still via Lovable AI Gateway) =====
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // ===== TEXT GENERATION =====
    const systems: Record<Exclude<Mode, "image">, string> = {
      short:
        "You write concise, persuasive Bangladeshi e-commerce product copy in clean English. Output STRICT JSON only.",
      rich:
        "You write rich, SEO-optimised Bangladeshi e-commerce product descriptions in clean English with light markdown. Output STRICT JSON only.",
      all:
        "You are an expert Bangladeshi e-commerce copywriter. Write everything needed for a digital product listing in clean English with light markdown where appropriate. Output STRICT JSON only.",
    };

    const prompts: Record<Exclude<Mode, "image">, string> = {
      short: `Generate copy for this digital product. Keep tagline under 70 chars and short_description 2-3 short sentences. Return JSON: { "tagline": string, "short_description": string }.\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
      rich: `Generate rich SEO copy. Return JSON: { "description": string (300-500 words, light markdown with bullet points), "seo_title": string (max 60 chars), "seo_description": string (max 155 chars), "tags": string[] (5-8 keywords) }.\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
      all: `Generate the full listing for this product. Return JSON with: tagline (under 70 chars), short_description (2-3 sentences), description (300-500 words markdown with bullets), features (array of 5-8 short bullet strings), seo_title (max 60 chars), seo_description (max 155 chars), tags (array of 5-8 keywords).\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
    };

    const tools: Record<Exclude<Mode, "image">, unknown> = {
      short: {
        type: "function",
        function: {
          name: "write_short_copy",
          parameters: {
            type: "object",
            properties: {
              tagline: { type: "string" },
              short_description: { type: "string" },
            },
            required: ["tagline", "short_description"],
            additionalProperties: false,
          },
        },
      },
      rich: {
        type: "function",
        function: {
          name: "write_rich_copy",
          parameters: {
            type: "object",
            properties: {
              description: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
            required: ["description", "seo_title", "seo_description", "tags"],
            additionalProperties: false,
          },
        },
      },
      all: {
        type: "function",
        function: {
          name: "write_full_listing",
          parameters: {
            type: "object",
            properties: {
              tagline: { type: "string" },
              short_description: { type: "string" },
              description: { type: "string" },
              features: { type: "array", items: { type: "string" } },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
            required: [
              "tagline",
              "short_description",
              "description",
              "features",
              "seo_title",
              "seo_description",
              "tags",
            ],
            additionalProperties: false,
          },
        },
      },
    };

    const key = mode as Exclude<Mode, "image">;
    const tool = tools[key] as { function: { name: string } };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systems[key] },
          { role: "user", content: prompts[key] },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (r.status === 429) return json({ error: "Rate limit, please retry shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await r.json();
    const args =
      data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    return json(JSON.parse(args));
  } catch (e) {
    console.error("product-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
