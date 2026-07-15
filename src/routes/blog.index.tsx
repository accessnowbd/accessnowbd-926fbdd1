import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";

type BlogRow = {
  id: string;
  created_at: string;
  data: {
    title: string;
    slug: string;
    excerpt?: string;
    cover_url?: string;
    author?: string;
    published_at?: string;
    kind?: "product" | "site";
    product_slug?: string;
  };
};

const blogListQuery = queryOptions({
  queryKey: ["blog", "list"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("admin_records")
      .select("id,created_at,data")
      .eq("kind", "blog_post")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as BlogRow[];
  },
});

const URL = "https://accessnowbd.com/blog";
const TITLE = "Blog — AccessNow BD | Bangladesh Digital Subscription Guides";
const DESCRIPTION = "AccessNow BD এর blog — Netflix, Spotify, Microsoft, ChatGPT সহ সব premium subscription এর গাইড, tips ও comparison। বাংলাদেশ থেকে কিনুন নিরাপদে।";

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(blogListQuery),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(blogListQuery);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
            <Newspaper className="w-4 h-4" /> BLOG
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Bangladesh Digital Subscription Guides</h1>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">Netflix, Spotify, Microsoft, ChatGPT সহ সব premium subscription এর latest guide, tips ও comparison।</p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">শীঘ্রই নতুন blog আসছে…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => {
              const d = p.data;
              const date = new Date(d.published_at || p.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
              return (
                <Link key={p.id} to="/blog/$slug" params={{ slug: d.slug }}
                  className="group rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-rose-300 hover:shadow-xl transition">
                  {d.cover_url ? (
                    <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                      <img src={d.cover_url} alt={d.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-rose-500 to-orange-500 grid place-items-center text-white">
                      <Newspaper className="w-10 h-10 opacity-80" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> {date}
                      {d.kind === "product" && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">Product</span>}
                    </div>
                    <h2 className="mt-2 text-lg font-extrabold text-slate-900 group-hover:text-rose-600 line-clamp-2">{d.title}</h2>
                    {d.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{d.excerpt}</p>}
                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-rose-600">Read more <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
