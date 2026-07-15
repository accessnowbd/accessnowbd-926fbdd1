import React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, ArrowLeft, Newspaper, ShoppingBag } from "lucide-react";

type BlogRow = {
  id: string;
  created_at: string;
  data: {
    title: string;
    slug: string;
    excerpt?: string;
    cover_url?: string;
    body: string;
    author?: string;
    published_at?: string;
    kind?: "product" | "site";
    product_slug?: string;
  };
};

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_records")
        .select("id,created_at,data")
        .eq("kind", "blog_post")
        .eq("is_active", true)
        .contains("data", { slug })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BlogRow | null;
    },
  });

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const d = loaderData?.data;
    if (!d) return {};
    const url = `https://accessnowbd.com/blog/${d.slug}`;
    return {
      meta: [
        { title: d.title },
        { name: "description", content: d.excerpt || d.title },
        { property: "og:title", content: d.title },
        { property: "og:description", content: d.excerpt || d.title },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(d.cover_url ? [{ property: "og:image", content: d.cover_url }, { name: "twitter:image", content: d.cover_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: d.title,
            description: d.excerpt,
            image: d.cover_url,
            author: { "@type": "Organization", name: d.author || "AccessNow BD" },
            publisher: { "@type": "Organization", name: "AccessNow BD" },
            datePublished: d.published_at,
            mainEntityOfPage: url,
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-slate-600">
      <div className="text-center">
        <p className="text-2xl font-bold">Blog post পাওয়া যায়নি</p>
        <Link to="/blog" className="mt-3 inline-block text-rose-600 font-bold">← Back to Blog</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen grid place-items-center text-slate-600 p-6">
      <div className="text-center">
        <p className="text-lg font-bold text-red-600">Error: {error.message}</p>
        <button onClick={reset} className="mt-3 px-4 py-2 rounded-lg bg-rose-600 text-white">Retry</button>
      </div>
    </div>
  ),
  component: BlogPost,
});

function renderMarkdown(md: string) {
  // Minimal markdown: ## / ### headings, **bold**, bullet lists, paragraphs, links.
  const lines = md.split("\n");
  const out: React.ReactElement[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-4 space-y-1.5 list-disc pl-6 text-slate-700">
          {list.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}
        </ul>,
      );
      list = [];
    }
  };
  function inline(s: string) {
    return s
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((\/[^\s)]+)\)/g, '<a href="$2" class="text-rose-600 font-bold hover:underline">$1</a>')
      .replace(/\[(.+?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" class="text-rose-600 font-bold hover:underline" target="_blank" rel="noopener">$1</a>');
  }
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith("### ")) {
      flushList();
      out.push(<h3 key={i} className="mt-6 mb-2 text-lg font-extrabold text-slate-900" dangerouslySetInnerHTML={{ __html: inline(l.slice(4)) }} />);
    } else if (l.startsWith("## ")) {
      flushList();
      out.push(<h2 key={i} className="mt-8 mb-3 text-2xl font-black text-slate-900" dangerouslySetInnerHTML={{ __html: inline(l.slice(3)) }} />);
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      list.push(l.slice(2));
    } else if (!l) {
      flushList();
    } else {
      flushList();
      out.push(<p key={i} className="my-3 text-[15px] leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: inline(l) }} />);
    }
  });
  flushList();
  return out;
}

function BlogPost() {
  const params = Route.useParams();
  const { data: row } = useSuspenseQuery(postQuery(params.slug));
  if (!row) return null;
  const d = row.data;
  const date = new Date(d.published_at || row.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-600">
          <ArrowLeft className="w-4 h-4" /> All blog posts
        </Link>
        <h1 className="mt-4 text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{d.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
          <Calendar className="w-4 h-4" /> {date}
          {d.author && <span>• {d.author}</span>}
          {d.kind === "product" && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">Product Guide</span>}
        </div>
        {d.cover_url && (
          <img src={d.cover_url} alt={d.title} className="mt-6 rounded-2xl w-full max-h-96 object-cover" />
        )}
        {d.excerpt && (
          <p className="mt-6 text-lg text-slate-600 border-l-4 border-rose-500 pl-4 italic">{d.excerpt}</p>
        )}
        <div className="mt-6">{renderMarkdown(d.body)}</div>

        {d.product_slug && (
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white p-6 text-center">
            <Newspaper className="w-8 h-8 mx-auto opacity-80" />
            <p className="mt-2 font-bold">এই product কিনতে চান?</p>
            <Link to="/product/$slug" params={{ slug: d.product_slug }}
              className="mt-3 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white text-rose-600 font-black">
              <ShoppingBag className="w-4 h-4" /> Product দেখুন
            </Link>
          </div>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
