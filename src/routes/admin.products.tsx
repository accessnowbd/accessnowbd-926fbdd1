import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, Save, X, Eye, EyeOff,
  Sparkles, FileText, Database, Download, Upload, Search, Copy, Package,
  CheckCircle2, AlertCircle, Clock, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Plan = { label: string; price: number; original_price?: number; duration?: string; note?: string };
type StockStatus = "in_stock" | "out_of_stock" | "preorder";
type Product = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  badge: string | null;
  tagline: string;
  description: string;
  short_description: string;
  delivery_time: string;
  warranty: string;
  features: string[];
  plans: Plan[];
  is_active: boolean;
  stock_status: StockStatus;
  views: number;
  sort_order: number;
  image_url: string;
};

const empty: Product = {
  slug: "", name: "", emoji: "📦", gradient: "from-primary to-primary",
  category: "OTT & Streaming", badge: null, tagline: "", description: "",
  short_description: "",
  delivery_time: "Within 30 mins", warranty: "Full warranty",
  features: [], plans: [{ label: "1 Month", price: 0, duration: "1 month" }],
  is_active: true, stock_status: "in_stock", views: 0, sort_order: 0, image_url: "",
};

const STOCK_LABELS: Record<StockStatus, { label: string; bn: string; cls: string; icon: typeof CheckCircle2 }> = {
  in_stock: { label: "In stock", bn: "স্টকে আছে", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  out_of_stock: { label: "Out of stock", bn: "স্টক শেষ", cls: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertCircle },
  preorder: { label: "Pre-order", bn: "প্রি-অর্ডার", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
};

function lowestPrice(p: Product): { price: number; original?: number } {
  if (!p.plans?.length) return { price: 0 };
  const sorted = [...p.plans].sort((a, b) => a.price - b.price);
  return { price: sorted[0].price, original: sorted[0].original_price };
}

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | StockStatus>("all");
  const [sortBy, setSortBy] = useState<"order" | "views" | "name">("order");
  const [aiBusy, setAiBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setProducts((data ?? []) as unknown as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const s = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(s)];
  }, [products]);

  const filtered = useMemo(() => {
    let arr = products.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (stockFilter !== "all" && p.stock_status !== stockFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortBy === "views") arr = [...arr].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    else if (sortBy === "name") arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [products, query, catFilter, stockFilter, sortBy]);

  const stats = useMemo(() => ({
    total: products.length,
    inStock: products.filter((p) => p.stock_status === "in_stock").length,
    outOfStock: products.filter((p) => p.stock_status === "out_of_stock").length,
    preorder: products.filter((p) => p.stock_status === "preorder").length,
  }), [products]);

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.slug));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.slug)));
  };
  const toggleOne = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug); else next.add(slug);
    setSelected(next);
  };

  const remove = async (slug: string) => {
    if (!confirm("এই পণ্যটি মুছবেন?")) return;
    const { error } = await supabase.from("products").delete().eq("slug", slug);
    if (error) return toast.error(error.message);
    toast.success("পণ্য মুছে ফেলা হয়েছে");
    load();
  };

  const duplicate = async (p: Product) => {
    const newSlug = `${p.slug}-copy-${Date.now().toString(36).slice(-4)}`;
    const payload: Product = {
      ...p,
      slug: newSlug,
      name: `${p.name} (Copy)`,
      sort_order: (products.at(-1)?.sort_order ?? 0) + 10,
      views: 0,
    };
    const { error } = await supabase.from("products").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Duplicated");
    load();
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("slug", p.slug);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((x) => x.slug === p.slug ? { ...x, is_active: !p.is_active } : x));
  };

  const setStock = async (slug: string, stock_status: StockStatus) => {
    const { error } = await supabase.from("products").update({ stock_status }).eq("slug", slug);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((x) => x.slug === slug ? { ...x, stock_status } : x));
  };

  const move = async (slug: string, dir: -1 | 1) => {
    const idx = products.findIndex((p) => p.slug === slug);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= products.length) return;
    const a = products[idx], b = products[swap];
    const aOrder = a.sort_order, bOrder = b.sort_order;
    const next = [...products];
    next[idx] = { ...a, sort_order: bOrder };
    next[swap] = { ...b, sort_order: aOrder };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setProducts(next);
    const [r1, r2] = await Promise.all([
      supabase.from("products").update({ sort_order: bOrder }).eq("slug", a.slug),
      supabase.from("products").update({ sort_order: aOrder }).eq("slug", b.slug),
    ]);
    if (r1.error || r2.error) { toast.error("Reorder failed"); load(); }
  };

  const runAI = async (mode: "short" | "rich") => {
    if (selected.size === 0) {
      toast.error("আগে কিছু পণ্য সিলেক্ট করুন");
      return;
    }
    setAiBusy(true);
    const slugs = Array.from(selected);
    let ok = 0, fail = 0;
    for (const slug of slugs) {
      const p = products.find((x) => x.slug === slug);
      if (!p) continue;
      try {
        const { data, error } = await supabase.functions.invoke("product-ai", {
          body: { mode, product: { name: p.name, category: p.category, tagline: p.tagline, description: p.description, features: p.features } },
        });
        if (error) throw error;
        if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
        const patch: Partial<Product> = {};
        if (mode === "short") {
          const d = data as { tagline?: string; short_description?: string };
          if (d.tagline) patch.tagline = d.tagline;
          if (d.short_description) patch.short_description = d.short_description;
        } else {
          const d = data as { description?: string };
          if (d.description) patch.description = d.description;
        }
        const { error: upErr } = await supabase.from("products").update(patch).eq("slug", slug);
        if (upErr) throw upErr;
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
    }
    setAiBusy(false);
    if (ok) toast.success(`${ok}টি পণ্যের জন্য AI কপি তৈরি হয়েছে`);
    if (fail) toast.error(`${fail}টি পণ্যে ব্যর্থ হয়েছে`);
    load();
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), products }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ব্যাকআপ ডাউনলোড শুরু হয়েছে");
  };

  const importBackup = async (file: File) => {
    if (!confirm("Restore করলে স্ল্যাগ মিল থাকা পণ্যগুলো ওভাররাইট হবে। চালিয়ে যাবেন?")) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items: Product[] = Array.isArray(parsed) ? parsed : parsed.products;
      if (!Array.isArray(items)) throw new Error("Invalid backup file");
      let ok = 0;
      for (const p of items) {
        const { error } = await supabase.from("products").upsert(p as never, { onConflict: "slug" });
        if (!error) ok++;
      }
      toast.success(`${ok}টি পণ্য Restore হয়েছে`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore ব্যর্থ");
    }
  };

  return (
    <div>
      {/* Top bar — title + action buttons */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-2xl">📦</span> পণ্য ম্যানেজমেন্ট
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length}টি পণ্য</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runAI("short")}
            disabled={aiBusy || selected.size === 0}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl text-white text-sm font-semibold shadow-[0_4px_14px_-4px_rgba(168,85,247,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
            title={selected.size === 0 ? "আগে পণ্য সিলেক্ট করুন" : "AI Short Description"}
          >
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Short Desc
          </button>
          <button
            onClick={() => runAI("rich")}
            disabled={aiBusy || selected.size === 0}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl text-white text-sm font-semibold shadow-[0_4px_14px_-4px_rgba(99,102,241,0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #2f6dff 100%)" }}
          >
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} AI Rich Desc + SEO
          </button>
          <BackupMenu onExport={exportBackup} onImport={() => fileRef.current?.click()} />
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ""; }}
          />
          <button
            onClick={() => { setEditing({ ...empty, sort_order: (products.at(-1)?.sort_order ?? 0) + 10 }); setIsNew(true); }}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> নতুন পণ্য
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Package} label="মোট পণ্য" value={stats.total} tint="slate" />
        <StatCard icon={CheckCircle2} label="স্টকে আছে" value={stats.inStock} tint="emerald" />
        <StatCard icon={AlertCircle} label="স্টক শেষ" value={stats.outOfStock} tint="rose" />
        <StatCard icon={Clock} label="প্রি-অর্ডার" value={stats.preorder} tint="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="পণ্য খুঁজুন…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-white text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-white text-sm">
          {categories.map((c) => <option key={c} value={c}>{c === "all" ? "সব ক্যাটাগরি" : c}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className="h-10 px-3 rounded-xl border border-border bg-white text-sm">
          <option value="all">সব স্টক</option>
          <option value="in_stock">স্টকে আছে</option>
          <option value="out_of_stock">স্টক শেষ</option>
          <option value="preorder">প্রি-অর্ডার</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-10 px-3 rounded-xl border border-border bg-white text-sm">
          <option value="order">সর্ট: অর্ডার</option>
          <option value="views">সর্বমোট ভিউ</option>
          <option value="name">নাম</option>
        </select>
        {selected.size > 0 && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> {selected.size} সিলেক্টেড
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th className="text-left px-3 py-3">পণ্য</th>
                  <th className="text-left px-3 py-3">ক্যাটাগরি</th>
                  <th className="text-left px-3 py-3">মূল্য</th>
                  <th className="text-left px-3 py-3">স্টক</th>
                  <th className="text-left px-3 py-3">ভিউ</th>
                  <th className="text-left px-3 py-3">স্ট্যাটাস</th>
                  <th className="text-right px-3 py-3 w-44">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const checked = selected.has(p.slug);
                  const price = lowestPrice(p);
                  const stock = STOCK_LABELS[p.stock_status] ?? STOCK_LABELS.in_stock;
                  return (
                    <tr key={p.slug} className={`border-t border-border hover:bg-slate-50/60 ${checked ? "bg-primary/5" : ""}`}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={checked} onChange={() => toggleOne(p.slug)} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg grid place-items-center text-lg bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200">{p.emoji}</div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                              {p.name}
                              {p.badge && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">{p.badge}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{p.category}</td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800">৳{price.price.toLocaleString()}</div>
                        {price.original && price.original > price.price && (
                          <div className="text-xs text-muted-foreground line-through">৳{price.original.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={p.stock_status}
                          onChange={(e) => setStock(p.slug, e.target.value as StockStatus)}
                          className={`h-7 px-2 rounded-full text-[11px] font-semibold border ${stock.cls} cursor-pointer`}
                        >
                          <option value="in_stock">স্টকে আছে</option>
                          <option value="out_of_stock">স্টক শেষ</option>
                          <option value="preorder">প্রি-অর্ডার</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1 text-xs"><Eye className="w-3 h-3" />{p.views ?? 0}</span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs border ${p.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                        >
                          {p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="উপরে" onClick={() => move(p.slug, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
                          <IconBtn title="নিচে" onClick={() => move(p.slug, 1)} disabled={i === filtered.length - 1}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
                          <IconBtn title="এডিট" onClick={() => { setEditing(p); setIsNew(false); }}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                          <IconBtn title="ডুপ্লিকেট" onClick={() => duplicate(p)}><Copy className="w-3.5 h-3.5" /></IconBtn>
                          <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" title="দেখুন" className="w-8 h-8 grid place-items-center rounded-md border border-border hover:bg-secondary">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          <IconBtn title="মুছুন" onClick={() => remove(p.slug)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">কোনো পণ্য পাওয়া যায়নি।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Package; label: string; value: number; tint: "slate" | "emerald" | "rose" | "amber" }) {
  const map = {
    slate: "from-slate-100 to-slate-50 text-slate-600 ring-slate-200",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200",
    rose: "from-rose-100 to-rose-50 text-rose-700 ring-rose-200",
    amber: "from-amber-100 to-amber-50 text-amber-700 ring-amber-200",
  } as const;
  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl grid place-items-center bg-gradient-to-br ${map[tint]} ring-1`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function BackupMenu({ onExport, onImport }: { onExport: () => void; onImport: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-4 inline-flex items-center gap-2 rounded-xl text-white text-sm font-semibold shadow-[0_4px_14px_-4px_rgba(16,185,129,0.6)]"
        style={{ background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)" }}
      >
        <Database className="w-4 h-4" /> Backups & Restore
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg z-20 p-1">
          <button onClick={() => { onExport(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 text-left">
            <Download className="w-4 h-4 text-emerald-600" /> ব্যাকআপ ডাউনলোড (.json)
          </button>
          <button onClick={() => { onImport(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 text-left">
            <Upload className="w-4 h-4 text-cyan-600" /> Restore (.json আপলোড)
          </button>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 grid place-items-center rounded-md border border-border ${danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-secondary"} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ProductEditor({ product, isNew, onClose, onSaved }: { product: Product; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Product>(product);
  const [busy, setBusy] = useState(false);
  const [featuresText, setFeaturesText] = useState((product.features ?? []).join("\n"));

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));

  const setPlan = (i: number, patch: Partial<Plan>) => {
    setForm((f) => ({ ...f, plans: f.plans.map((p, idx) => idx === i ? { ...p, ...patch } : p) }));
  };
  const addPlan = () => setForm((f) => ({ ...f, plans: [...f.plans, { label: "New plan", price: 0, duration: "" }] }));
  const removePlan = (i: number) => setForm((f) => ({ ...f, plans: f.plans.filter((_, idx) => idx !== i) }));
  const movePlan = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    setForm((f) => {
      if (j < 0 || j >= f.plans.length) return f;
      const next = [...f.plans];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, plans: next };
    });
  };

  const save = async () => {
    if (!form.slug.trim() || !form.name.trim()) return toast.error("Slug and name are required");
    setBusy(true);
    const features = featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = { ...form, features, plans: form.plans };
    const op = isNew
      ? supabase.from("products").insert(payload as never)
      : supabase.from("products").update(payload as never).eq("slug", form.slug);
    const { error } = await op;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Product created" : "Product updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
            {isNew ? "নতুন পণ্য" : `এডিট: ${product.name}`}
          </h2>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Slug *" value={form.slug} onChange={(v) => set("slug", v)} disabled={!isNew} placeholder="netflix-premium" />
            <Field label="Name *" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Category" value={form.category} onChange={(v) => set("category", v)} />
            <Field label="Badge (optional)" value={form.badge ?? ""} onChange={(v) => set("badge", v || null)} placeholder="HOT, SALE…" />
            <Field label="Emoji" value={form.emoji} onChange={(v) => set("emoji", v)} />
            <Field label="Image URL" value={form.image_url} onChange={(v) => set("image_url", v)} />
            <Field label="Delivery time" value={form.delivery_time} onChange={(v) => set("delivery_time", v)} />
            <Field label="Warranty" value={form.warranty} onChange={(v) => set("warranty", v)} />
            <label className="block">
              <span className="text-xs font-semibold text-[#333]">Stock status</span>
              <select
                value={form.stock_status}
                onChange={(e) => set("stock_status", e.target.value as StockStatus)}
                className="mt-1.5 w-full h-10 px-3 rounded-md border border-border text-sm outline-none focus:border-primary"
              >
                <option value="in_stock">স্টকে আছে</option>
                <option value="out_of_stock">স্টক শেষ</option>
                <option value="preorder">প্রি-অর্ডার</option>
              </select>
            </label>
            <Field label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => set("sort_order", Number(v) || 0)} />
          </div>

          <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
          <TextArea label="Short description" value={form.short_description} onChange={(v) => set("short_description", v)} rows={2} />
          <TextArea label="Description" value={form.description} onChange={(v) => set("description", v)} rows={5} />
          <TextArea label="Features (one per line)" value={featuresText} onChange={setFeaturesText} rows={5} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#333]">Plans</label>
              <button onClick={addPlan} className="text-xs px-3 h-8 inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-primary/10">
                <Plus className="w-3.5 h-3.5" /> Add plan
              </button>
            </div>
            <div className="space-y-2">
              {form.plans.map((p, i) => (
                <div key={i} className="border border-border rounded-xl p-3 grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-3 h-9 px-3 rounded-md border border-border text-sm" placeholder="Label" value={p.label} onChange={(e) => setPlan(i, { label: e.target.value })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" type="number" placeholder="Price" value={p.price} onChange={(e) => setPlan(i, { price: Number(e.target.value) })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" type="number" placeholder="MRP" value={p.original_price ?? ""} onChange={(e) => setPlan(i, { original_price: e.target.value ? Number(e.target.value) : undefined })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" placeholder="Duration" value={p.duration ?? ""} onChange={(e) => setPlan(i, { duration: e.target.value })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" placeholder="Note" value={p.note ?? ""} onChange={(e) => setPlan(i, { note: e.target.value })} />
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <IconBtn title="Up" onClick={() => movePlan(i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn title="Down" onClick={() => movePlan(i, 1)} disabled={i === form.plans.length - 1}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn title="Remove" onClick={() => removePlan(i)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            <span className="text-sm">Active (visible on storefront)</span>
          </label>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-full border border-border text-sm font-semibold">Cancel</button>
          <button onClick={save} disabled={busy} className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#333]">{label}</span>
      <input
        type={type} value={value} disabled={disabled} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 px-3 rounded-md border border-border text-sm outline-none focus:border-primary disabled:bg-secondary disabled:text-muted-foreground"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#333]">{label}</span>
      <textarea
        value={value} rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 rounded-md border border-border text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
