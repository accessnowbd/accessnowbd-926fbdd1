import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, Save, X, Eye, EyeOff,
  Sparkles, FileText, Database, Download, Upload, Search, Copy, Package,
  CheckCircle2, AlertCircle, Clock, Filter, Wand2, ImageIcon, Zap, RefreshCw,
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

/* ============================== PRODUCT EDITOR (WordPress-style) ============================== */

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

type AiBusy = "" | "all" | "short" | "rich" | "image-gen" | "image-up";

function ProductEditor({ product, isNew, onClose, onSaved }: { product: Product; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Product>(product);
  const [busy, setBusy] = useState(false);
  const [featuresText, setFeaturesText] = useState((product.features ?? []).join("\n"));
  const [ai, setAi] = useState<AiBusy>("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [autoSlug, setAutoSlug] = useState(isNew); // auto-derive slug from name while creating
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Auto slug from name
  useEffect(() => {
    if (autoSlug && form.name) set("slug", slugify(form.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, autoSlug]);

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

  /* ======== AI helpers ======== */
  const callAi = async (mode: "short" | "rich" | "all") => {
    if (!form.name.trim()) { toast.error("আগে Name লিখুন"); return; }
    setAi(mode);
    try {
      const { data, error } = await supabase.functions.invoke("product-ai", {
        body: { mode, product: { name: form.name, category: form.category, tagline: form.tagline, description: form.description, features: featuresText.split("\n").filter(Boolean) } },
      });
      if (error) throw error;
      const d = data as Record<string, unknown> & { error?: string };
      if (d?.error) throw new Error(d.error);

      setForm((f) => {
        const next = { ...f };
        if (typeof d.tagline === "string") next.tagline = d.tagline;
        if (typeof d.short_description === "string") next.short_description = d.short_description;
        if (typeof d.description === "string") next.description = d.description;
        return next;
      });
      if (Array.isArray(d.features)) {
        setFeaturesText((d.features as string[]).join("\n"));
      }
      toast.success("AI কপি তৈরি হয়েছে ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI generation failed");
    } finally {
      setAi("");
    }
  };

  /* ======== Image: AI generate (saves data URL → uploads to Storage) ======== */
  const generateImage = async () => {
    if (!form.name.trim()) { toast.error("আগে Name লিখুন"); return; }
    setAi("image-gen");
    try {
      const { data, error } = await supabase.functions.invoke("product-ai", {
        body: { mode: "image", product: { name: form.name, category: form.category }, imagePrompt },
      });
      if (error) throw error;
      const d = data as { image?: string; error?: string };
      if (d?.error) throw new Error(d.error);
      if (!d.image) throw new Error("No image returned");

      // Convert data URL → Blob → upload
      const blob = await (await fetch(d.image)).blob();
      const file = new File([blob], `${slugify(form.name) || "product"}-ai-${Date.now()}.png`, { type: blob.type || "image/png" });
      const url = await uploadProductImage(file);
      set("image_url", url);
      toast.success("AI ইমেজ তৈরি হয়েছে 🎨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setAi("");
    }
  };

  /* ======== Image: file upload ======== */
  const uploadProductImage = async (file: File): Promise<string> => {
    if (file.size > 8 * 1024 * 1024) throw new Error("ফাইল 8MB-এর কম হতে হবে");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${slugify(form.name) || "untitled"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("admin-uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setAi("image-up");
    try {
      const url = await uploadProductImage(file);
      set("image_url", url);
      toast.success("ইমেজ আপলোড হয়েছে ✓");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setAi("");
    }
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

  const aiBusy = ai !== "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm grid place-items-start md:place-items-center p-2 md:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">{isNew ? "New product" : "Edit product"}</div>
            <h2 className="font-bold text-base md:text-lg truncate" style={{ fontFamily: "var(--font-display)" }}>
              {isNew ? "নতুন পণ্য তৈরি করুন" : product.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => callAi("all")}
              disabled={aiBusy}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-white text-xs font-bold shadow-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }}
              title="Generate everything with AI"
            >
              {ai === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              AI Auto-fill
            </button>
            <button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* AI Auto-fill banner (mobile) */}
        <div className="sm:hidden px-5 py-3 border-b border-slate-100">
          <button
            onClick={() => callAi("all")}
            disabled={aiBusy}
            className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-white text-xs font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }}
          >
            {ai === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI দিয়ে সব ফিল করুন
          </button>
        </div>

        <div className="p-5 md:p-6 grid lg:grid-cols-[1fr_320px] gap-6">
          {/* ===== LEFT: main content ===== */}
          <div className="space-y-5 min-w-0">
            {/* Title block */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4">
              <Field label="Product name *" value={form.name} onChange={(v) => set("name", v)} placeholder="Netflix Premium Subscription" big />
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <LinkIconLocal />
                <span className="font-mono">/product/</span>
                {autoSlug ? (
                  <span className="font-mono font-semibold text-slate-700">{form.slug || "—"}</span>
                ) : (
                  <input
                    value={form.slug}
                    onChange={(e) => set("slug", slugify(e.target.value))}
                    disabled={!isNew}
                    className="font-mono font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-violet-400 disabled:bg-slate-100"
                  />
                )}
                {isNew && (
                  <button onClick={() => setAutoSlug((v) => !v)} className="text-violet-600 font-semibold hover:underline">
                    {autoSlug ? "Edit" : "Auto"}
                  </button>
                )}
              </div>
            </div>

            {/* Tagline + Short description with AI button */}
            <SectionCard
              title="Short copy"
              right={
                <AiBtn busy={ai === "short"} onClick={() => callAi("short")}>
                  AI Short
                </AiBtn>
              }
            >
              <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} placeholder="Premium streaming, instant delivery" />
              <TextArea label="Short description" value={form.short_description} onChange={(v) => set("short_description", v)} rows={2} />
            </SectionCard>

            {/* Full description */}
            <SectionCard
              title="Full description"
              right={
                <AiBtn busy={ai === "rich"} onClick={() => callAi("rich")}>
                  AI Rich Desc + SEO
                </AiBtn>
              }
            >
              <TextArea value={form.description} onChange={(v) => set("description", v)} rows={8} placeholder="Write or generate with AI…" />
            </SectionCard>

            {/* Features */}
            <SectionCard title="Features (one per line)">
              <TextArea value={featuresText} onChange={setFeaturesText} rows={5} placeholder={"Instant access\n4K Ultra HD\n4 device support"} />
            </SectionCard>

            {/* Plans */}
            <SectionCard
              title="Pricing plans"
              right={
                <button onClick={addPlan} className="text-xs h-8 px-3 inline-flex items-center gap-1 rounded-full bg-slate-900 text-white">
                  <Plus className="w-3.5 h-3.5" /> Add plan
                </button>
              }
            >
              <div className="space-y-2">
                {form.plans.map((p, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-3 grid grid-cols-12 gap-2 items-center bg-white">
                    <input className="col-span-12 sm:col-span-3 h-9 px-3 rounded-md border border-slate-200 text-sm" placeholder="Label" value={p.label} onChange={(e) => setPlan(i, { label: e.target.value })} />
                    <input className="col-span-6 sm:col-span-2 h-9 px-3 rounded-md border border-slate-200 text-sm" type="number" placeholder="Price" value={p.price} onChange={(e) => setPlan(i, { price: Number(e.target.value) })} />
                    <input className="col-span-6 sm:col-span-2 h-9 px-3 rounded-md border border-slate-200 text-sm" type="number" placeholder="MRP" value={p.original_price ?? ""} onChange={(e) => setPlan(i, { original_price: e.target.value ? Number(e.target.value) : undefined })} />
                    <input className="col-span-6 sm:col-span-2 h-9 px-3 rounded-md border border-slate-200 text-sm" placeholder="Duration" value={p.duration ?? ""} onChange={(e) => setPlan(i, { duration: e.target.value })} />
                    <input className="col-span-6 sm:col-span-2 h-9 px-3 rounded-md border border-slate-200 text-sm" placeholder="Note" value={p.note ?? ""} onChange={(e) => setPlan(i, { note: e.target.value })} />
                    <div className="col-span-12 sm:col-span-1 flex items-center justify-end gap-1">
                      <IconBtn title="Up" onClick={() => movePlan(i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Down" onClick={() => movePlan(i, 1)} disabled={i === form.plans.length - 1}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
                      <IconBtn title="Remove" onClick={() => removePlan(i)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ===== RIGHT: sidebar ===== */}
          <div className="space-y-5">
            {/* Featured image */}
            <SectionCard
              title="Featured image"
              right={<span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Upload or AI</span>}
            >
              <div
                className="relative aspect-square w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 grid place-items-center overflow-hidden cursor-pointer hover:border-violet-300 transition"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); onPickFile(e.dataTransfer.files?.[0]); }}
              >
                {form.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 px-4">
                    <ImageIcon className="w-7 h-7 mx-auto mb-1.5" />
                    <div className="text-xs font-semibold">Click or drop image</div>
                    <div className="text-[10px] mt-0.5">PNG · JPG · WebP · max 8MB</div>
                  </div>
                )}
                {ai === "image-up" && (
                  <div className="absolute inset-0 bg-black/40 grid place-items-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ""; }}
              />
              <div className="mt-3 flex flex-col gap-2">
                <input
                  value={form.image_url}
                  onChange={(e) => set("image_url", e.target.value)}
                  placeholder="Or paste image URL…"
                  className="h-9 px-3 rounded-md border border-slate-200 text-xs outline-none focus:border-violet-400"
                />
                <div className="relative mt-1 rounded-2xl p-[1px] overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.55), rgba(139,92,246,0.55), rgba(59,130,246,0.55))" }}>
                  <div className="relative rounded-2xl p-3.5 bg-white/70 backdrop-blur-xl">
                    {/* aurora blobs inside the card */}
                    <div className="pointer-events-none absolute -top-10 -left-8 w-32 h-32 rounded-full bg-fuchsia-300/40 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-violet-300/40 blur-2xl" />
                    <div className="pointer-events-none absolute top-6 right-10 w-20 h-20 rounded-full bg-sky-300/30 blur-2xl" />

                    <div className="relative">
                      <label className="text-[10px] font-extrabold uppercase tracking-[0.18em] inline-flex items-center gap-1.5 bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#ec4899,#8b5cf6,#3b82f6)" }}>
                        <Sparkles className="w-3 h-3 text-fuchsia-500" />
                        AI Image · Gemini
                        <span className="ml-1 text-[8px] font-bold text-violet-700 bg-violet-100/80 px-1.5 py-0.5 rounded-full not-italic tracking-normal">PREMIUM</span>
                      </label>
                      <div className="mt-2 relative">
                        <input
                          value={imagePrompt}
                          onChange={(e) => setImagePrompt(e.target.value)}
                          placeholder="leave blank for auto · describe the look you want…"
                          className="w-full h-10 pl-9 pr-3 rounded-xl border border-white/60 bg-white/80 backdrop-blur text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/60 placeholder:text-slate-400 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                        />
                        <Wand2 className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-violet-500" />
                      </div>
                      <button
                        onClick={generateImage}
                        disabled={aiBusy}
                        className="group relative mt-2.5 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider disabled:opacity-50 overflow-hidden shadow-[0_10px_30px_-10px_rgba(139,92,246,0.7)] hover:shadow-[0_14px_36px_-10px_rgba(139,92,246,0.85)] transition-shadow"
                        style={{ background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)" }}
                      >
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)" }} />
                        <span className="relative inline-flex items-center gap-2">
                          {ai === "image-gen" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {ai === "image-gen" ? "Generating…" : "Generate with AI"}
                        </span>
                      </button>
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Powered by your Gemini API key · square HD output
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Organize */}
            <SectionCard title="Organize">
              <Field label="Category" value={form.category} onChange={(v) => set("category", v)} />
              <Field label="Badge" value={form.badge ?? ""} onChange={(v) => set("badge", v || null)} placeholder="HOT, SALE…" />
              <Field label="Emoji" value={form.emoji} onChange={(v) => set("emoji", v)} />
            </SectionCard>

            {/* Inventory & status */}
            <SectionCard title="Status">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Stock</span>
                <select
                  value={form.stock_status}
                  onChange={(e) => set("stock_status", e.target.value as StockStatus)}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-slate-200 text-sm outline-none focus:border-violet-400"
                >
                  <option value="in_stock">স্টকে আছে</option>
                  <option value="out_of_stock">স্টক শেষ</option>
                  <option value="preorder">প্রি-অর্ডার</option>
                </select>
              </label>
              <Field label="Delivery time" value={form.delivery_time} onChange={(v) => set("delivery_time", v)} />
              <Field label="Warranty" value={form.warranty} onChange={(v) => set("warranty", v)} />
              <Field label="Sort order (auto)" type="number" value={String(form.sort_order)} onChange={(v) => set("sort_order", Number(v) || 0)} />
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                <span className="text-sm">Active (visible on storefront)</span>
              </label>
            </SectionCard>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-5 md:px-6 py-3 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {aiBusy ? "AI কাজ করছে…" : isNew ? "Save করলে storefront-এ লাইভ হবে" : "Auto-saved on Save"}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={onClose} className="h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button
              onClick={save}
              disabled={busy || aiBusy}
              className="h-10 px-5 rounded-full text-white text-sm font-bold shadow-md inline-flex items-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? "Publish" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Small UI bits ============================== */

function SectionCard({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
        {right}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AiBtn({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-white text-[11px] font-bold shadow-sm disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
    >
      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {children}
    </button>
  );
}

function LinkIconLocal() {
  // tiny placeholder so we don't pull a new import; small chain glyph
  return <span aria-hidden className="text-slate-400">🔗</span>;
}

function Field({ label, value, onChange, type = "text", disabled, placeholder, big }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string; big?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        type={type} value={value} disabled={disabled} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full ${big ? "h-12 text-base font-semibold" : "h-10 text-sm"} px-3 rounded-md border border-slate-200 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100 disabled:text-slate-500`}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: { label?: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
      <textarea
        value={value} rows={rows} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${label ? "mt-1.5" : ""} w-full px-3 py-2 rounded-md border border-slate-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100`}
      />
    </label>
  );
}
