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

type Mode = "short" | "rich" | "all" | "image" | "seo";
type CardStyle = "premium-pastel" | "premium-dark" | "glassmorphism" | "soft-aurora" | "dark-neon";

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
  "premium-pastel":
    "A premium 1:1 square social-media product card on a CLEAN WHITE BASE BACKGROUND. The background is mostly soft white / off-white with subtle premium design accents: faint pastel light leaks in the corners (lilac, peach, sky), a few delicate translucent bubble circles, and a very soft radial glow — but the dominant color stays white. In the foreground place ONE large centered frosted-glass rounded-square panel (soft white inner glow, thin light border, glass-morphism). Inside that glass panel, place a single big premium 3D rounded-square app-style icon dead-center, taking ~45% of the panel — the icon MUST be the official recognizable brand/product logo that matches the product name, rendered crisp and polished. Top-left corner of the glass panel: small pill badge with the text 'ACCESSNOW BD' in white uppercase on a translucent dark pill. Top-right corner: a clean white rounded pill badge containing the product/brand name with its small logo mark. Bottom of the glass panel: one row, small dark text, a globe icon followed by 'www.accessnowbd.com', then a phone icon followed by '+880 1580-607614'. Studio quality, ultra crisp, no extra text, no watermark.",
  "premium-dark":
    "A premium 1:1 square social-media product card on a CLEAN WHITE BASE BACKGROUND with subtle premium design touches: faint geometric line accents, soft cool-tone light leaks in the corners (icy blue, lavender), a few delicate translucent bubbles, and a very soft radial glow — but the background stays predominantly white. In the foreground place ONE large centered frosted-glass rounded-square panel with a slightly darker tinted glass and a crisp thin border (glass-morphism, soft shadow). Inside that glass panel, place a single big premium 3D rounded-square app-style icon dead-center, taking ~45% of the panel — the icon MUST be the official recognizable brand/product logo that matches the product name, rendered crisp and polished. Top-left corner of the glass panel: small pill badge 'ACCESSNOW BD' in white uppercase on a translucent dark pill. Top-right corner: a clean white rounded pill badge containing the product/brand name with its small logo mark. Bottom of the glass panel: one row, small dark text, a globe icon followed by 'www.accessnowbd.com', then a phone icon followed by '+880 1580-607614'. Cinematic studio quality, ultra crisp, no extra text, no watermark.",
  "glassmorphism":
    "premium glassmorphism product mockup on a clean white background with soft pastel accents, frosted glass card, subtle inner glow, ultra-clean studio lighting",
  "soft-aurora":
    "A premium 1:1 square product card on a CLEAN WHITE BASE BACKGROUND with airy aurora light leaks (mint, lilac, peach) gently flowing across the corners and a very soft radial glow. Foreground: ONE large centered frosted-glass rounded-square panel with a slight aurora-tinted edge glow. Inside, place a single big premium 3D rounded-square app-style icon dead-center (~45% of panel) — it MUST be the official recognizable brand/product logo for the product name, crisp and polished. Top-left of glass panel: small dark translucent pill 'ACCESSNOW BD' in white uppercase. Top-right: clean white pill with the product/brand name and small logo mark. Bottom row inside panel: small dark text — globe icon then 'www.accessnowbd.com', then phone icon then '+880 1580-607614'. Cinematic studio quality, ultra crisp, no extra text, no watermark.",
  "dark-neon":
    "A premium 1:1 square product card on a DEEP MIDNIGHT background (near-black with subtle blue/violet gradient), with thin neon rim accents (electric cyan + magenta), faint grid lines and tiny glowing particles. Foreground: ONE large centered dark frosted-glass rounded-square panel with a vivid neon edge glow (cyan→magenta). Inside, place a single big premium 3D rounded-square app-style icon dead-center (~45% of panel) — it MUST be the official recognizable brand/product logo for the product name, crisp and polished. Top-left of glass panel: small translucent pill 'ACCESSNOW BD' in white uppercase. Top-right: dark translucent pill with the product/brand name and small logo mark, white text. Bottom row inside panel: small bright text — globe icon then 'www.accessnowbd.com', then phone icon then '+880 1580-607614'. Cinematic cyberpunk studio quality, ultra crisp, no extra text, no watermark.",
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
      const styleId: CardStyle = (style as CardStyle) || "premium-pastel";
      const styleText = STYLE_PROMPTS[styleId] ?? STYLE_PROMPTS["premium-pastel"];
      const isPremium = styleId !== "glassmorphism";
      const subjectLine = `Subject / product being showcased: "${product.name}"${product.category ? ` (${product.category})` : ""}.`;
      const userExtra = imagePrompt?.trim() ? ` Additional direction: ${imagePrompt.trim()}.` : "";
      const prompt = isPremium
        ? `${styleText} ${subjectLine}${userExtra} Render exactly the small text shown (brand pill, product pill, website www.accessnowbd.com, phone +880 1580-607614). Do NOT add any other text or watermark. Ultra high detail, 1:1 square.`
        : (imagePrompt?.trim() || `${styleText}. ${subjectLine} Branded for ${SHOP_BRAND}. 1:1 square, ultra high detail, no text, no watermark.`);

      // ---- Path A: Lovable AI Gateway (preferred) — Nano Banana 2 with fallback ----
      if (apiKey) {
        const models = ["google/gemini-3.1-flash-image-preview", "google/gemini-2.5-flash-image-preview"];
        for (const model of models) {
          try {
            const gw = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
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
              console.error(`gateway ${model} returned no image`, JSON.stringify(gd).slice(0, 400));
            } else {
              console.error(`gateway ${model} error`, gw.status, (await gw.text()).slice(0, 200));
            }
          } catch (e) {
            console.error(`gateway ${model} exception`, e);
          }
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
    // STRUCTURED DESCRIPTION TEMPLATE — fetched from admin_records so admins can
    // edit section order / headings from the admin panel without redeploying.
    const DEFAULT_DESCRIPTION_TEMPLATE = `
The "description" field MUST be markdown that follows EXACTLY this section order and headings (in clean English, with Bangla "Note" line at the end). Tailor every line to the specific product, brand and category — never leave placeholder text.

## {Product Name} – {one-line value proposition}

{2-4 sentence intro paragraph.}

## Choose Your {Brand} Plan

### 🟪 {Plan 1 name} – {duration}
- {benefit}

### 🟦 {Plan 2 name} – {duration}
- {benefit}

## Powerful {Brand} Features
- {feature}

## Perfect For
- **Content Creators** – {reason}

## Why Buy From AccessNow BD
- Trusted digital subscription provider in Bangladesh
- Secure delivery with verified access
- Fast customer support

## Delivery Information
- Delivery time: within 1–2 hours during office hours

**Note:** Some {Brand} features may be region-dependent and availability in Bangladesh may vary.
`;

    let DESCRIPTION_TEMPLATE = DEFAULT_DESCRIPTION_TEMPLATE;
    try {
      const supaUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supaUrl && serviceKey) {
        const r = await fetch(
          `${supaUrl}/rest/v1/admin_records?kind=eq.description_template&is_active=eq.true&select=data&order=updated_at.desc&limit=1`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
        );
        if (r.ok) {
          const rows = await r.json();
          const tpl = rows?.[0]?.data?.template;
          if (typeof tpl === "string" && tpl.trim().length > 50) {
            DESCRIPTION_TEMPLATE = tpl;
          }
        }
      }
    } catch (e) {
      console.error("template fetch failed, using default", e);
    }

    const systems: Record<Exclude<Mode, "image">, string> = {
      short:
        "You write concise, persuasive Bangladeshi e-commerce product copy in clean English. Output STRICT JSON only.",
      rich:
        "You write rich, SEO-optimised Bangladeshi e-commerce product descriptions in clean English markdown for AccessNow BD. You ALWAYS follow the provided section template exactly. Output STRICT JSON only.",
      all:
        "You are an expert Bangladeshi e-commerce copywriter for AccessNow BD. You ALWAYS write the long description following the provided sectioned markdown template exactly. Output STRICT JSON only.",
      seo:
        "You are a senior SEO copywriter for AccessNow BD (Bangladesh's trusted digital subscription store). You craft Google-friendly, click-worthy meta tags that rank for buyer-intent keywords like 'buy {product} in Bangladesh', '{product} BD price', '{product} subscription Bangladesh'. Output STRICT JSON only — no commentary.",
    };

    const prompts: Record<Exclude<Mode, "image">, string> = {
      short: `Generate copy for this digital product. Keep tagline under 70 chars and short_description 2-3 short sentences. Return JSON: { "tagline": string, "short_description": string }.\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
      rich: `Generate rich SEO copy. Return JSON: { "description": string, "seo_title": string (max 60 chars), "seo_description": string (max 155 chars), "tags": string[] (5-8 keywords) }.\n\nThe "description" MUST follow this template exactly:\n${DESCRIPTION_TEMPLATE}\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
      all: `Generate the full listing for this product. Return JSON with: tagline (under 70 chars), short_description (2-3 sentences), description (markdown following the template below EXACTLY), features (array of 5-8 short bullet strings), seo_title (max 60 chars), seo_description (max 155 chars), tags (array of 5-8 keywords).\n\nDescription template (MANDATORY):\n${DESCRIPTION_TEMPLATE}\n\nProduct:\n${JSON.stringify(product, null, 2)}`,
      seo: `Write Google-ranking SEO meta tags for this product page on accessnowbd.com.

Rules:
- seo_title: 50–60 chars. MUST start with the product/brand name + a buyer-intent keyword (e.g. "Buy", "Price", "Subscription"). Include "Bangladesh" or "BD". End with " | AccessNow BD". Use a power word (Cheap, Official, Premium, Genuine, Instant) when natural.
- seo_description: 140–160 chars. Mention the product name + key benefit + price/availability cue (e.g. "best price", "instant delivery", "official subscription"). Include "Bangladesh" / "BD". End with a soft call-to-action ("Order now", "Get yours today"). Natural, no keyword stuffing.
- tags: 6–10 lowercase long-tail keywords a Bangladeshi buyer would search (e.g. "buy {name} bangladesh", "{name} bd price", "{name} subscription bd", "cheap {name} bangladesh").

Return JSON: { "seo_title": string, "seo_description": string, "tags": string[] }.

Product:
${JSON.stringify(product, null, 2)}`,
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
