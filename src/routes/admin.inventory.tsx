import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package, XCircle, AlertTriangle, CheckCircle2, Minus, Plus,
  RefreshCw, Settings2, Search, Save, X, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
});

type ProductRow = {
  slug: string;
  name: string;
  emoji: string | null;
  image_url: string | null;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  plans: unknown;
};

type OrderRow = { items: unknown; status: string };

type Filter = "all" | "out" | "low" | "sufficient";

function stateOf(p: ProductRow): "out" | "low" | "sufficient" {
  if (p.stock <= 0) return "out";
  if (p.stock <= (p.low_stock_threshold ?? 5)) return "low";
  return "sufficient";
}

function priceFrom(plans: unknown): number | null {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const nums = (plans as Array<{ price?: unknown }>)
    .map((p) => Number(p?.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.min(...nums) : null;
}

function InventoryPage() {
  const { t, lang } = useAdminLang();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [salesBySlug, setSalesBySlug] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultLow, setDefaultLow] = useState(5);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, oRes] = await Promise.all([
      supabase.from("products")
        .select("slug,name,emoji,image_url,stock,low_stock_threshold,is_active,plans")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("orders").select("items,status").limit(1000),
    ]);
    if (pRes.error) toast.error(pRes.error.message);
    setRows((pRes.data ?? []) as ProductRow[]);

    // aggregate sold-qty per slug (exclude cancelled/failed)
    const map: Record<string, number> = {};
    (oRes.data ?? []).forEach((o: OrderRow) => {
      const status = (o.status || "").toLowerCase();
      if (status === "cancelled" || status === "failed") return;
      if (!Array.isArray(o.items)) return;
      (o.items as Array<{ slug?: string; qty?: number; quantity?: number }>).forEach((it) => {
        if (!it?.slug) return;
        const qty = Number(it.qty ?? it.quantity ?? 1) || 0;
        map[it.slug] = (map[it.slug] ?? 0) + qty;
      });
    });
    setSalesBySlug(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    let out = 0, low = 0, ok = 0;
    rows.forEach((r) => {
      const s = stateOf(r);
      if (s === "out") out++;
      else if (s === "low") low++;
      else ok++;
    });
    return { total: rows.length, out, low, ok };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && stateOf(r) !== filter) return false;
      if (!query) return true;
      return r.name.toLowerCase().includes(query) || r.slug.toLowerCase().includes(query);
    });
  }, [rows, filter, q]);

  const bump = async (slug: string, delta: number) => {
    setRows((prev) => prev.map((p) => p.slug === slug ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
    setSavingSlug(slug);
    const target = rows.find((p) => p.slug === slug);
    if (!target) return;
    const next = Math.max(0, target.stock + delta);
    const { error } = await supabase.from("products").update({ stock: next }).eq("slug", slug);
    setSavingSlug(null);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const setStock = async (slug: string, value: number) => {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    setRows((prev) => prev.map((p) => p.slug === slug ? { ...p, stock: v } : p));
    setSavingSlug(slug);
    const { error } = await supabase.from("products").update({ stock: v }).eq("slug", slug);
    setSavingSlug(null);
    if (error) toast.error(error.message);
  };

  const setThreshold = async (slug: string, value: number) => {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    setRows((prev) => prev.map((p) => p.slug === slug ? { ...p, low_stock_threshold: v } : p));
    const { error } = await supabase.from("products").update({ low_stock_threshold: v }).eq("slug", slug);
    if (error) toast.error(error.message);
  };

  const applyDefaultToAll = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from("products").update({ low_stock_threshold: defaultLow }).neq("slug", "");
    setSavingSettings(false);
    if (error) return toast.error(error.message);
    toast.success(t("Applied to all products", "সব প্রোডাক্টে প্রয়োগ হয়েছে"));
    setSettingsOpen(false);
    load();
  };

  // Stats card definitions
  const stats = [
    {
      label: t("Total products", "মোট প্রোডাক্ট"),
      value: counts.total,
      Icon: Package,
      tint: "bg-violet-50 text-violet-600",
      onClick: () => setFilter("all"),
      active: filter === "all",
    },
    {
      label: t("Stock out", "স্টক আউট"),
      value: counts.out,
      Icon: XCircle,
      tint: "bg-rose-50 text-rose-600",
      onClick: () => setFilter("out"),
      active: filter === "out",
    },
    {
      label: t("Low stock", "স্টক কম"),
      value: counts.low,
      Icon: AlertTriangle,
      tint: "bg-amber-50 text-amber-600",
      onClick: () => setFilter("low"),
      active: filter === "low",
    },
    {
      label: t("Sufficient stock", "পর্যাপ্ত স্টক"),
      value: counts.ok,
      Icon: CheckCircle2,
      tint: "bg-emerald-50 text-emerald-600",
      onClick: () => setFilter("sufficient"),
      active: filter === "sufficient",
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header row: title + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">
            {t("Inventory Alerts", "ইনভেন্টরি অ্যালার্ট")}
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {t("Stock monitoring & alert system", "স্টক মনিটরিং ও অ্যালার্ট সিস্টেম")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Settings2 className="w-3.5 h-3.5" /> {t("Settings", "সেটিংস")}
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> {t("Refresh", "রিফ্রেশ")}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className={`text-left admin-card rounded-2xl p-4 sm:p-5 transition ${
              s.active ? "ring-2 ring-violet-400" : "hover:ring-1 hover:ring-slate-200"
            }`}
          >
            <span className={`w-10 h-10 rounded-xl grid place-items-center ${s.tint}`}>
              <s.Icon className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <div className="mt-6 text-[28px] font-black text-slate-950 tabular-nums leading-none">
              {loading ? <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" /> : s.value}
            </div>
            <div className="mt-1.5 text-[12px] font-semibold text-slate-500 truncate">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search + filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search products…", "প্রোডাক্ট সার্চ…")}
            className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <div className="inline-flex items-center gap-1.5">
          {([
            { id: "all", label: t("All", "সব"), dot: "bg-slate-400" },
            { id: "out", label: t("Out", "আউট"), dot: "bg-rose-500" },
            { id: "low", label: t("Low", "কম"), dot: "bg-amber-500" },
            { id: "sufficient", label: t("OK", "পর্যাপ্ত"), dot: "bg-emerald-500" },
          ] as { id: Filter; label: string; dot: string }[]).map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-[12.5px] font-bold transition ${
                filter === p.id
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${p.dot}`} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory list */}
      <div className="admin-card rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-extrabold text-slate-900">
            {t("Inventory list", "ইনভেন্টরি তালিকা")} ({filtered.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">{t("Loading…", "লোড হচ্ছে…")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {t("No products match this filter.", "এই ফিল্টারে কোনো প্রোডাক্ট নেই।")}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const st = stateOf(p);
              const badgeTone =
                st === "out" ? "bg-rose-50 text-rose-700 border-rose-100"
                : st === "low" ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100";
              const badgeLabel =
                st === "out" ? t("Out of stock", "স্টক নেই")
                : st === "low" ? t("Low stock", "স্টক কম")
                : t("In stock", "স্টকে আছে");
              const price = priceFrom(p.plans);
              const sold = salesBySlug[p.slug] ?? 0;
              return (
                <li key={p.slug} className="px-5 sm:px-6 py-3.5 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3">
                    {/* Thumb */}
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-violet-100 via-pink-100 to-amber-100 grid place-items-center overflow-hidden ring-1 ring-slate-100">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{p.emoji ?? "📦"}</span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-slate-500 tabular-nums">
                        {price != null && <>৳{price.toLocaleString(lang === "bn" ? "bn-BD" : "en-IN")} · </>}
                        {sold} {t("sold", "সেল")}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${badgeTone}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st === "out" ? "bg-rose-500" : st === "low" ? "bg-amber-500" : "bg-emerald-500"}`} />
                      {badgeLabel}
                    </span>

                    {/* Stock controls */}
                    <div className="shrink-0 inline-flex items-center gap-1">
                      <button
                        onClick={() => bump(p.slug, -1)}
                        disabled={p.stock <= 0}
                        className="w-8 h-8 grid place-items-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={p.stock}
                        onChange={(e) => setRows((prev) => prev.map((r) => r.slug === p.slug ? { ...r, stock: Math.max(0, Number(e.target.value) || 0) } : r))}
                        onBlur={(e) => setStock(p.slug, Number(e.target.value))}
                        className="w-14 h-8 text-center rounded-full bg-white border border-slate-200 text-[13px] font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-200"
                      />
                      <button
                        onClick={() => bump(p.slug, 1)}
                        className="w-8 h-8 grid place-items-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {savingSlug === p.slug && (
                        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Per-product low threshold row */}
                  <div className="mt-2 pl-14 flex items-center gap-2 text-[11.5px] text-slate-500">
                    <span>{t("Low-stock at", "স্টক কম যখন")}:</span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={p.low_stock_threshold ?? 5}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== p.low_stock_threshold) setThreshold(p.slug, v);
                      }}
                      className="w-14 h-6 px-2 rounded-md bg-white border border-slate-200 text-[11.5px] font-semibold text-slate-700 tabular-nums focus:outline-none focus:ring-1 focus:ring-violet-200"
                    />
                    <span>{t("units", "ইউনিট")}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-[16px] font-bold text-slate-900">{t("Inventory settings", "ইনভেন্টরি সেটিংস")}</h2>
              <button onClick={() => setSettingsOpen(false)} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                  {t("Default low-stock threshold", "ডিফল্ট স্টক কম থ্রেশহোল্ড")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultLow}
                  onChange={(e) => setDefaultLow(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[14px] font-semibold text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <p className="mt-1.5 text-[11.5px] text-slate-500">
                  {t("Apply this threshold to every product at once.", "এই থ্রেশহোল্ড সব প্রোডাক্টে একসাথে প্রয়োগ করুন।")}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setSettingsOpen(false)} className="h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t("Cancel", "বাতিল")}
              </button>
              <button
                onClick={applyDefaultToAll}
                disabled={savingSettings}
                className="h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("Apply to all", "সবাইতে প্রয়োগ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
