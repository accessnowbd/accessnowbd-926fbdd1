// Generates product copy via Lovable AI Gateway.
// Mode: "short" → 1-line tagline + 2-3 sentence short description.
// Mode: "rich" → rich markdown description + SEO meta title/description + tags.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  mode: "short" | "rich";
  product: {
    name: string;
    category?: string;
    tagline?: string;
    description?: string;
    features?: string[];
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { mode, product } = (await req.json()) as Body;
    if (!product?.name) throw new Error("product.name is required");

    const systemShort =
      "You write concise, persuasive Bangladeshi e-commerce product copy in clean English. Output STRICT JSON only.";
    const systemRich =
      "You write rich, SEO-optimised Bangladeshi e-commerce product descriptions in clean English with light markdown. Output STRICT JSON only.";

    const userPrompt =
      mode === "short"
        ? `Generate copy for this digital product. Keep tagline under 70 chars and short_description 2-3 short sentences. Return JSON: { "tagline": string, "short_description": string }.\n\nProduct:\n${JSON.stringify(product, null, 2)}`
        : `Generate rich SEO copy. Return JSON: { "description": string (300-500 words, light markdown with bullet points), "seo_title": string (max 60 chars), "seo_description": string (max 155 chars), "tags": string[] (5-8 keywords) }.\n\nProduct:\n${JSON.stringify(product, null, 2)}`;

    const tool =
      mode === "short"
        ? {
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
          }
        : {
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
          };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: mode === "short" ? systemShort : systemRich },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (r.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit, please retry shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (r.status === 402)
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to your Lovable workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    const args =
      data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    const parsed = JSON.parse(args);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("product-ai error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
