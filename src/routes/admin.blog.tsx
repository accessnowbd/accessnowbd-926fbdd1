import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Newspaper, Loader2, Sparkles, RefreshCw, ExternalLink, CheckCircle2, AlertCircle, Trash2, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlog,
});

type BlogRow = {
  id: string;
  created_at: string;
  is_active: boolean;
  data: {
    title: string;
    slug: string;
    excerpt?: string;
    cover_url?: string;
    author?: string;
    kind?: "product" | "site";
    product_slug?: string;
    auto_generated?: boolean;
  };
};

function AdminBlog() {
  const [posts, setPosts] = useState<BlogRow[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<{ generated: string[]; errors: string[]; product_pending: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: blogs }, { count }] = await Promise.all([
      supabase.from("admin_records").select("id,created_at,is_active,data").eq("kind", "blog_post").order("created_at", { ascending: false }).limit(300),
      supabase.from("products").select("slug", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setPosts((blogs ?? []) as BlogRow[]);
    setProductCount(count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runNow = async () => {
    setRunning(true);
    setLastRun(null);
    try {
      // Use anon key that our public hook expects
      const anonKey = (import.meta as { env: Record<string, string | undefined> }).env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      const res = await fetch("/api/public/hooks/auto-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ trigger: "admin" }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || `HTTP ${res.status}`);
      setLastRun(j);
      toast.success(`✅ ${j.generated?.length || 0} নতুন blog generate হলো`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const toggleActive = async (row: BlogRow) => {
    const { error } = await supabase.from("admin_records").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return toast.error(error.message);
    setPosts((p) => p.map((x) => (x.id === row.id ? { ...x, is_active: !row.is_active } : x)));
  };

  const remove = async (row: BlogRow) => {
    if (!confirm(`"${row.data.title}" delete করবেন?`)) return;
    const { error } = await supabase.from("admin_records").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setPosts((p) => p.filter((x) => x.id !== row.id));
    toast.success("Deleted");
  };

  const withBlog = new Set(posts.filter((p) => p.data.product_slug).map((p) => p.data.product_slug!));
  const productBlogs = posts.filter((p) => p.data.kind === "product").length;
  const siteBlogs = posts.filter((p) => p.data.kind === "site").length;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = posts.filter((p) => new Date(p.created_at) >= monthStart).length;
  const pending = Math.max(0, productCount - withBlog.size);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-rose-100 grid place-items-center text-rose-600">
            <Newspaper className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Auto AI Blog</h2>
            <p className="text-xs mt-0.5 text-slate-500">প্রতিটি product এর জন্য এবং মাসে ২টি site blog — AI নিজে থেকে লিখে publish করে। Admin এর কিছুই করা লাগবে না।</p>
          </div>
        </div>
        <button onClick={runNow} disabled={running} className="a-save-btn">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate এখনই (৬টি পর্যন্ত)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total blogs" value={posts.length} tone="slate" />
        <Stat label="Product blogs" value={`${productBlogs} / ${productCount}`} tone="emerald" />
        <Stat label="Site blogs (this month)" value={`${posts.filter((p) => p.data.kind === "site" && new Date(p.created_at) >= monthStart).length} / 2`} tone="violet" />
        <Stat label="Product blogs বাকি" value={pending} tone={pending > 0 ? "amber" : "slate"} />
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
        <div className="flex items-center gap-2 mb-2 text-sm font-extrabold text-rose-800">
          <RefreshCw className="w-4 h-4" /> কীভাবে কাজ করে
        </div>
        <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
          <li>প্রতিদিন AI নিজে থেকে চেক করে — কোন product এর জন্য এখনো blog লেখা হয়নি সেগুলোর জন্য blog লেখে।</li>
          <li>প্রতি মাসে অন্তত ২টি site/company blog automatic publish করে (Bangladesh subscription guide, tips, comparison ইত্যাদি)।</li>
          <li>Rate/credit safe: একবারে সর্বোচ্চ ৬টি blog generate করে। বাকিগুলো পরদিন হবে।</li>
          <li>সব blog automatic publish হয়ে যায় — কিন্তু নিচে থেকে যেকোনো টা hide/delete করতে পারবেন।</li>
        </ul>
        <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
          <ExternalLink className="w-3.5 h-3.5" /> Public URL: <a href="/blog" target="_blank" rel="noopener" className="text-rose-600 font-bold hover:underline">/blog</a>
        </div>
      </div>

      {/* Last run */}
      {lastRun && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-800 mb-2">Last run result</div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>✅ Generated: <span className="font-bold">{lastRun.generated.length}</span> {lastRun.generated.length ? `(${lastRun.generated.slice(0, 3).join(", ")}${lastRun.generated.length > 3 ? "…" : ""})` : ""}</div>
            <div>⏳ Product blogs বাকি: <span className="font-bold">{lastRun.product_pending}</span></div>
            {lastRun.errors.length > 0 && <div className="text-red-600">⚠️ Errors: {lastRun.errors.slice(0, 2).join(" | ")}</div>}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-800">সব Blog Posts ({posts.length}) — এই মাসে {thisMonth}</div>
        </div>
        {loading ? (
          <div className="p-10 grid place-items-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <p>কোনো blog নেই। "Generate এখনই" চাপুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-scroll-x">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Kind</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-800 line-clamp-1">{p.data.title}</div>
                      <div className="text-xs text-slate-400 truncate">/blog/{p.data.slug}</div>
                    </td>
                    <td className="p-3">
                      {p.data.kind === "product" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Product</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">Site</span>
                      )}
                      {p.data.auto_generated && <span className="ml-1 text-[10px] text-slate-400">AI</span>}
                    </td>
                    <td className="p-3 text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString("en-GB")}</td>
                    <td className="p-3">
                      {p.is_active ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Published</span>
                        : <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-bold"><AlertCircle className="w-3.5 h-3.5" /> Hidden</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <a href={`/blog/${p.data.slug}`} target="_blank" rel="noopener" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => toggleActive(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600" title={p.is_active ? "Hide" : "Publish"}>
                          {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => remove(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: "slate" | "emerald" | "violet" | "amber" }) {
  const cls: Record<string, string> = {
    slate: "from-slate-500 to-slate-600",
    emerald: "from-emerald-500 to-teal-500",
    violet: "from-violet-500 to-fuchsia-500",
    amber: "from-amber-500 to-orange-500",
  };
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-2xl font-black bg-gradient-to-r ${cls[tone]} bg-clip-text text-transparent`}>{value}</div>
    </div>
  );
}
