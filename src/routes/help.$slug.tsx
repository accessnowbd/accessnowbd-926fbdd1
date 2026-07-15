import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/SiteFooter";

type HelpArticle = {
  id: string;
  data: { title?: string; slug?: string; category?: string; body?: string };
};

async function loadArticle(slug: string): Promise<HelpArticle | null> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("id, data")
    .eq("kind", "help_article")
    .eq("is_active", true);
  if (error) throw error;
  const rows = (data ?? []) as HelpArticle[];
  return rows.find((r) => String(r.data?.slug ?? "") === slug) ?? null;
}

async function loadRelated(category: string | undefined, excludeSlug: string): Promise<HelpArticle[]> {
  if (!category) return [];
  const { data } = await supabase
    .from("admin_records")
    .select("id, data")
    .eq("kind", "help_article")
    .eq("is_active", true)
    .limit(20);
  const rows = ((data ?? []) as HelpArticle[]).filter(
    (r) => r.data?.category === category && r.data?.slug !== excludeSlug,
  );
  return rows.slice(0, 4);
}

export const Route = createFileRoute("/help/$slug")({
  component: HelpArticlePage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Help Center — AccessNow BD` },
      { name: "description", content: "AccessNow BD Help Center article." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Help Center` },
      { property: "og:description", content: "AccessNow BD Help Center article." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `https://accessnowbd.com/help/${params.slug}` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `https://accessnowbd.com/help/${params.slug}` }],
  }),
});

function HelpArticlePage() {
  const { slug } = useParams({ from: "/help/$slug" });
  const { data: article, isLoading } = useQuery({
    queryKey: ["help-article", slug],
    queryFn: () => loadArticle(slug),
  });
  const { data: related = [] } = useQuery({
    queryKey: ["help-related", article?.data?.category, slug],
    queryFn: () => loadRelated(article?.data?.category, slug),
    enabled: !!article,
  });

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-slate-500 text-sm">Loading…</div>;
  }
  if (!article) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 grid place-items-center mb-4">
            <BookOpen className="w-6 h-6 text-slate-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Article পাওয়া যায়নি</h1>
          <p className="mt-2 text-slate-500 text-sm">এই লিংকটি সরিয়ে ফেলা হয়েছে বা inactive করা হয়েছে।</p>
          <Link
            to="/help"
            className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-slate-900 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Help Center
          </Link>
        </div>
      </div>
    );
  }

  const { title, category, body } = article.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/30 via-white to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Help Center
        </Link>

        <article className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {category && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-0.5 mb-3">
              {category}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{title}</h1>
          <div className="mt-6 prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap text-[15px] leading-relaxed">
            {body}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">এই article কি কাজে এসেছে?</div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Support-এ প্রশ্ন করুন
            </Link>
          </div>
        </article>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Related articles</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/help/$slug"
                  params={{ slug: String(r.data?.slug ?? "") }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-violet-300 hover:shadow-sm transition"
                >
                  <div className="font-semibold text-slate-900 text-sm">{r.data?.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
