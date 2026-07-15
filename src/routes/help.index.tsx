import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen, ChevronRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/SiteFooter";

type HelpArticle = {
  id: string;
  data: { title?: string; slug?: string; category?: string; body?: string };
  sort_order: number;
};

async function loadArticles(): Promise<HelpArticle[]> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("id, data, sort_order")
    .eq("kind", "help_article")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as HelpArticle[];
}

export const Route = createFileRoute("/help/")({
  component: HelpIndex,
  head: () => ({
    meta: [
      { title: "Help Center — AccessNow BD" },
      { name: "description", content: "Guides and answers for orders, payment, warranty, refunds, account issues and more — searchable Help Center for AccessNow BD customers." },
      { property: "og:title", content: "Help Center — AccessNow BD" },
      { property: "og:description", content: "Everything you need to know about buying and using premium subscriptions in Bangladesh." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://accessnowbd.com/help" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://accessnowbd.com/help" }],
  }),
});

function HelpIndex() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["help-articles"],
    queryFn: loadArticles,
  });

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of articles) if (a.data?.category) set.add(String(a.data.category));
    return ["all", ...Array.from(set)];
  }, [articles]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (activeCat !== "all" && a.data?.category !== activeCat) return false;
      if (!q) return true;
      return (
        String(a.data?.title ?? "").toLowerCase().includes(q) ||
        String(a.data?.body ?? "").toLowerCase().includes(q) ||
        String(a.data?.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [articles, query, activeCat]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-r from-violet-100 via-fuchsia-50 to-indigo-100 border border-violet-200/60 p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur grid place-items-center shadow-sm">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            আমরা কীভাবে সাহায্য করতে পারি?
          </h1>
          <p className="mt-2 text-slate-600 max-w-2xl">
            Order, payment, warranty, refund, account — সব প্রশ্নের উত্তর এক জায়গায়।
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search article title, category…"
              className="w-full h-14 pl-12 pr-4 rounded-full bg-white border border-slate-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>
        </div>

        {/* Category pills */}
        {categories.length > 1 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`px-4 h-9 rounded-full text-xs font-semibold capitalize transition border ${
                  activeCat === c
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {c === "all" ? "সব" : c}
              </button>
            ))}
          </div>
        )}

        {/* Articles */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {isLoading ? (
            <div className="col-span-2 py-16 text-center text-slate-500 text-sm">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-slate-500 text-sm">
              কোনো article পাওয়া যায়নি।
            </div>
          ) : (
            visible.map((a) => (
              <Link
                key={a.id}
                to="/help/$slug"
                params={{ slug: String(a.data?.slug ?? "") }}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {a.data?.category && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5 mb-2">
                        {a.data.category}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition">
                      {a.data?.title}
                    </h3>
                    {a.data?.body && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {String(a.data.body).slice(0, 140)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 shrink-0 mt-1" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Still need help */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-bold">উত্তর পাননি?</div>
            <div className="text-sm text-slate-300">আমাদের support team আপনার জন্য 24/7 প্রস্তুত।</div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition"
          >
            <MessageCircle className="w-4 h-4" /> Contact support
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
