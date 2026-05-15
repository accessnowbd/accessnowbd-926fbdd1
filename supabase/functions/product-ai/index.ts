// Generates product copy & images via Lovable AI Gateway.
// Modes:
//  - "short" → tagline + short_description
//  - "rich"  → long markdown description + SEO meta + tags
//  - "all"   → everything (tagline, short, description, features, seo)
//  - "image" → AI-generated product image (returns data URL)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/accessnowbd\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/(www\.)?accessnowbd\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];
function corsFor(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": allow ? origin : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  } as Record<string, string>;
}

type Mode = "short" | "rich" | "all" | "image";
type CardStyle = "glassmorphism" | "soft-aurora" | "dark-neon";

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
  style?: CardStyle;
};

const STYLE_PROMPTS: Record<CardStyle, string> = {
  "glassmorphism":
    "premium glassmorphism product mockup: frosted glass card on a soft pastel aurora gradient background, subtle inner glow, vibrant accent highlights, ultra-clean studio lighting",
  "soft-aurora":
    "soft aurora gradient hero shot: airy light pastel background (mint, lilac, peach), gentle bokeh, premium light theme, polished e-commerce hero",
  "dark-neon":
    "premium dark neon product hero: deep midnight gradient background, subtle neon violet/cyan rim glow, sharp studio lighting, cinematic mood",
};

const SHOP_BRAND = "AccessNow BD";


const json = (body: unknown, status = 200, corsHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const { mode, product, imagePrompt, style } = (await req.json()) as Body;
    if (!product?.name) throw new Error("product.name is required");

    // ===== IMAGE GENERATION =====
    // Prefer Lovable AI Gateway (no extra key needed). Fallback to direct
    // Gemini API if a GEMINI_API_KEY is configured on the project.
    if (mode === "image") {
      const styleId: CardStyle = (style as CardStyle) || "glassmorphism";
      const styleText = STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS["glassmorphism"];
      const prompt =
        imagePrompt?.trim() ||
        `${styleText}. Subject: "${product.name}"${
          product.category ? ` (${product.category})` : ""
        }. Branded for ${SHOP_BRAND}. 1:1 square, ultra high detail, no text, no watermark.`;

      // ---- Path A: Lovable AI Gateway (preferred) ----
      if (apiKey) {
        try {
          const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image-preview",
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });
          if (gw.status === 429) return json({ error: "Rate limited, please retry shortly." }, 429, corsHeaders);
          if (gw.status === 402) return json({ error: "AI credits exhausted. Add credits in Lovable workspace." }, 402, corsHeaders);
          if (gw.ok) {
            const gd = await gw.json();
            const msg = gd?.choices?.[0]?.message ?? {};
            const url: string | undefined =
              msg?.images?.[0]?.image_url?.url ||
              msg?.images?.[0]?.url ||
              (Array.isArray(msg?.content)
                ? msg.content.find((c: any) => c?.image_url?.url)?.image_url?.url
                : undefined);
            if (url) return json({ image: url }, 200, corsHeaders);
            console.error("gateway returned no image", JSON.stringify(gd).slice(0, 400));
          } else {
            console.error("gateway image error", gw.status, (await gw.text()).slice(0, 200));
          }
        } catch (e) {
          console.error("gateway image exception", e);
        }
      }

      // ---- Path B: Direct Gemini API ----
      if (geminiKey) {
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
        if (r.status === 429) return json({ error: "Gemini rate limit, please retry shortly." }, 429, corsHeaders);
        if (!r.ok) {
          const t = await r.text();
          console.error("gemini image error", r.status, t);
          return json({ error: `Gemini API error (${r.status}): ${t.slice(0, 200)}` }, 500, corsHeaders);
        }
        const data = await r.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData;
        if (!inline?.data) {
          console.error("no image in gemini response", JSON.stringify(data).slice(0, 400));
          return json({ error: "No image returned from Gemini" }, 500, corsHeaders);
        }
        const mime = inline.mimeType || "image/png";
        return json({ image: `data:${mime};base64,${inline.data}` }, 200, corsHeaders);
      }

      return json({ error: "No image provider configured. Add LOVABLE_API_KEY or GEMINI_API_KEY." }, 500, corsHeaders);
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

    if (r.status === 429) return json({ error: "Rate limit, please retry shortly." }, 429, corsHeaders);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402, corsHeaders);
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return json({ error: "AI gateway error" }, 500, corsHeaders);
    }
    const data = await r.json();
    const args =
      data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    return json(JSON.parse(args), 200, corsHeaders);
  } catch (e) {
    console.error("product-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500, corsHeaders);
  }
});
