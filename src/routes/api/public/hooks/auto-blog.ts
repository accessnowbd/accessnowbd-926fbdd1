import { createFileRoute } from "@tanstack/react-router";

// Auto-Blog generator. Called by pg_cron daily.
// Auth: Supabase anon key in `apikey` header (public hooks bypass edge auth; verify here).
// Actions each run:
//   1. Pick up to MAX_PER_RUN active products that don't yet have a blog post → generate + insert.
//   2. Ensure current calendar month has >= MONTHLY_SITE_POSTS general site blogs → generate missing.
//
// Blog posts are stored in `admin_records` (kind = 'blog_post') with data:
//   { title, slug, excerpt, cover_url, body, author, published_at, product_slug?, kind: 'product'|'site' }

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const MAX_PER_RUN = 6; // safety cap per invocation
const MONTHLY_SITE_POSTS = 2;

const SITE_TOPICS = [
  "Bangladesh এ ডিজিটাল সাবস্ক্রিপশন কেনার সম্পূর্ণ গাইড",
  "bKash/Nagad দিয়ে online premium subscription payment করার নিরাপদ উপায়",
  "AccessNow BD থেকে subscription কেনার ৭টি কারণ",
  "Bangladesh এ streaming service ব্যবহারের সেরা tips",
  "Digital marketplace কীভাবে কাজ করে — AccessNow BD এর behind the scenes",
  "Subscription sharing vs personal account — কোনটি আপনার জন্য?",
  "Bangladesh এ AI tools ব্যবহার করে productivity বাড়ানোর উপায়",
  "Genuine vs cracked subscription — কেন original কিনবেন",
  "প্রথমবার premium subscription কিনছেন? এই বিষয়গুলো জেনে নিন",
  "AccessNow BD এর ২৪/৭ support কীভাবে কাজ করে",
];

type BlogData = {
  title: string;
  slug: string;
  excerpt: string;
  cover_url?: string;
  body: string;
  author: string;
  published_at: string;
  product_slug?: string;
  kind: "product" | "site";
  auto_generated?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function callAI(system: string, user: string, apiKey: string) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI ${res.status}: ${t.slice(0, 300)}`);
  }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] };
  const raw = j.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw) as { title: string; excerpt: string; body: string };
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : "{}") as { title: string; excerpt: string; body: string };
  }
}

const PRODUCT_SYSTEM = `You are a senior SEO copywriter for AccessNow BD (accessnowbd.com), a Bangladesh digital-subscription marketplace (Netflix, Spotify, Microsoft, ChatGPT, Canva, etc.). Write engaging bilingual (Bangla-heavy, English mixed) blog posts optimized for Google.
Return STRICT JSON only, no code fences, matching:
{ "title": string (60-80 chars, catchy, includes product name + Bangladesh), "excerpt": string (150-200 chars, hooks reader), "body": string (markdown, 600-900 words, sections with ## headings, bullet lists, includes price/plan info, delivery, why buy from AccessNow BD, FAQ with 3 Q&A, end with clear CTA linking to /product/{slug}) }`;

const SITE_SYSTEM = `You are a senior SEO copywriter for AccessNow BD (accessnowbd.com), a Bangladesh digital-subscription marketplace. Write authoritative bilingual blog posts (Bangla-heavy, English mixed) that build trust and target Bangladeshi buyers.
Return STRICT JSON only, no code fences, matching:
{ "title": string (60-80 chars, catchy, Bangladesh-focused), "excerpt": string (150-200 chars), "body": string (markdown, 700-1000 words, ## sections, lists, at least one internal link to /products, includes practical steps and a FAQ) }`;

export const Route = createFileRoute("/api/public/hooks/auto-blog")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ---- Auth ----
        const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("apikey") || request.headers.get("Apikey");
        if (!anonKey || !provided || provided !== anonKey) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }
        const aiKey = process.env.LOVABLE_API_KEY;
        if (!aiKey) return Response.json({ ok: false, error: "AI key missing" }, { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const generated: string[] = [];
        const errors: string[] = [];

        try {
          // ===== 1. Product blogs =====
          const [{ data: products }, { data: existing }] = await Promise.all([
            supabaseAdmin.from("products")
              .select("slug,name,category,image_url,short_description,description,tagline")
              .eq("is_active", true)
              .order("sort_order")
              .limit(500),
            supabaseAdmin.from("admin_records")
              .select("data")
              .eq("kind", "blog_post")
              .limit(1000),
          ]);

          const existingProductSlugs = new Set<string>();
          const existingBlogSlugs = new Set<string>();
          for (const r of (existing ?? [])) {
            const d = r.data as Partial<BlogData> | null;
            if (d?.product_slug) existingProductSlugs.add(d.product_slug);
            if (d?.slug) existingBlogSlugs.add(d.slug);
          }

          const pending = (products ?? []).filter((p) => !existingProductSlugs.has(p.slug));
          const productBatch = pending.slice(0, MAX_PER_RUN);

          for (const p of productBatch) {
            try {
              const prompt = `Product: ${p.name}
Category: ${p.category || "digital subscription"}
Tagline: ${p.tagline || ""}
Short: ${p.short_description || ""}
Description: ${(p.description || "").slice(0, 1500)}

Write a comprehensive blog post about this product for Bangladeshi buyers. End with CTA linking to /product/${p.slug}`;
              const ai = await callAI(PRODUCT_SYSTEM, prompt, aiKey);
              if (!ai.title || !ai.body) throw new Error("Empty AI response");

              let slug = slugify(ai.title);
              if (!slug || existingBlogSlugs.has(slug)) slug = `${slugify(p.name)}-guide-${Date.now().toString(36).slice(-4)}`;
              existingBlogSlugs.add(slug);

              const record: BlogData = {
                title: ai.title,
                slug,
                excerpt: ai.excerpt || "",
                cover_url: p.image_url || undefined,
                body: ai.body,
                author: "AccessNow BD Team",
                published_at: new Date().toISOString(),
                product_slug: p.slug,
                kind: "product",
                auto_generated: true,
              };
              const { error } = await supabaseAdmin.from("admin_records").insert({
                kind: "blog_post",
                data: record as never,
                is_active: true,
              });
              if (error) throw new Error(error.message);
              generated.push(`product:${slug}`);
            } catch (e) {
              errors.push(`product ${p.slug}: ${(e as Error).message}`);
            }
          }

          // ===== 2. Monthly site blogs =====
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          const { data: monthPosts } = await supabaseAdmin.from("admin_records")
            .select("data,created_at")
            .eq("kind", "blog_post")
            .gte("created_at", monthStart.toISOString());
          const monthSiteCount = (monthPosts ?? []).filter((r) => {
            const d = r.data as Partial<BlogData> | null;
            return d?.kind === "site";
          }).length;
          const need = Math.max(0, MONTHLY_SITE_POSTS - monthSiteCount);

          // Only allow up to 2 site posts per invocation and only if slots remain in MAX_PER_RUN
          const remainingBudget = Math.max(0, MAX_PER_RUN - productBatch.length);
          const siteCount = Math.min(need, remainingBudget, 2);
          const usedTopics = new Set<string>();
          for (const r of (existing ?? [])) {
            const d = r.data as Partial<BlogData> | null;
            if (d?.kind === "site" && d?.title) usedTopics.add(d.title);
          }
          const freshTopics = SITE_TOPICS.filter((t) => !usedTopics.has(t))
            .sort(() => Math.random() - 0.5)
            .slice(0, siteCount);

          for (const topic of freshTopics) {
            try {
              const ai = await callAI(SITE_SYSTEM, `Topic: ${topic}\nWrite the full blog post.`, aiKey);
              if (!ai.title || !ai.body) throw new Error("Empty AI response");
              let slug = slugify(ai.title);
              if (!slug || existingBlogSlugs.has(slug)) slug = `${slugify(topic)}-${Date.now().toString(36).slice(-4)}`;
              existingBlogSlugs.add(slug);
              const record: BlogData = {
                title: ai.title,
                slug,
                excerpt: ai.excerpt || "",
                body: ai.body,
                author: "AccessNow BD Team",
                published_at: new Date().toISOString(),
                kind: "site",
                auto_generated: true,
              };
              const { error } = await supabaseAdmin.from("admin_records").insert({
                kind: "blog_post",
                data: record as never,
                is_active: true,
              });
              if (error) throw new Error(error.message);
              generated.push(`site:${slug}`);
            } catch (e) {
              errors.push(`site: ${(e as Error).message}`);
            }
          }

          return Response.json({
            ok: true,
            generated,
            errors,
            product_pending: Math.max(0, pending.length - productBatch.length),
            month_site_count: monthSiteCount + freshTopics.length,
          });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message, generated, errors }, { status: 500 });
        }
      },

      GET: async () => Response.json({ ok: true, hint: "POST with apikey header to run auto-blog." }),
    },
  },
});
