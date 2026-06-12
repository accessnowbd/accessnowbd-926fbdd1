import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShoppingBag, Users, Package, TicketPercent, Megaphone,
  Palette, ShieldCheck, Wrench, BarChart3, AlertCircle, ArrowUpRight,
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Loader2,
  ChevronRight, Sparkles, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLang } from "@/context/AdminLangContext";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type OrderRow = {
  id: string; created_at: string; status: string; total: number;
  full_name: string; email: string; payment_method: string; items: unknown;
};
type ProductRow = {
  slug: string; name: string; emoji: string; image_url: string;
  category: string; is_active: boolean; created_at: string;
};

const fmtBDT = (n: number) => "৳" + Math.round(n).toLocaleString("en-IN");

function AdminDashboard() {
  const { t, lang } = useAdminLang();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [counts, setCounts] = useState({ products: 0, orders: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [pAll, oAll, uAll, recentOrders, recentProducts] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id,created_at,status,total,full_name,email,payment_method,items").order("created_at", { ascending: false }).limit(60),
        supabase.from("products").select("slug,name,emoji,image_url,category,is_active,created_at").order("created_at", { ascending: false }).limit(60),
      ]);
      setCounts({ products: pAll.count ?? 0, orders: oAll.count ?? 0, users: uAll.count ?? 0 });
      setOrders((recentOrders.data ?? []) as OrderRow[]);
      setProducts((recentProducts.data ?? []) as ProductRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const yStart = new Date(start); yStart.setDate(yStart.getDate() - 1);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let revenue = 0, todayRev = 0, monthRev = 0, yRev = 0, todayCount = 0, monthCount = 0, pending = 0, processing = 0;
    orders.forEach((o) => {
      const total = Number(o.total) || 0;
      const d = new Date(o.created_at);
      const live = o.status !== "cancelled";
      if (live) revenue += total;
      if (live && d >= start) { todayRev += total; todayCount++; }
      if (live && d >= yStart && d < start) { yRev += total; }
      if (live && d >= monthStart) { monthRev += total; monthCount++; }
      if (o.status === "pending") pending++;
      if (o.status === "processing") processing++;
    });
    const dayDelta = yRev > 0 ? Math.round(((todayRev - yRev) / yRev) * 100) : (todayRev > 0 ? 100 : 0);
    return { revenue, todayRev, monthRev, todayCount, monthCount, dayDelta, pending, processing };
  }, [orders]);

  // Last 7 days revenue sparkline
  const spark = useMemo(() => {
    const days: { d: string; v: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - i);
      const next = new Date(day); next.setDate(day.getDate() + 1);
      let v = 0;
      orders.forEach((o) => {
        const dd = new Date(o.created_at);
        if (dd >= day && dd < next && o.status !== "cancelled") v += Number(o.total) || 0;
      });
      days.push({ d: day.toLocaleDateString(lang === "bn" ? "bn-BD" : "en", { weekday: "short" }), v });
    }
    return days;
  }, [orders, lang]);

  const sparkMax = Math.max(1, ...spark.map((s) => s.v));

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; image: string; emoji: string; sold: number; revenue: number }>();
    orders.forEach((o) => {
      if (!Array.isArray(o.items)) return;
      (o.items as any[]).forEach((it) => {
        const key = it.slug || it.name;
        if (!key) return;
        const cur = map.get(key) ?? { name: it.name ?? key, image: it.image_url ?? "", emoji: it.emoji ?? "📦", sold: 0, revenue: 0 };
        cur.sold += Number(it.qty ?? it.quantity ?? 1);
        cur.revenue += Number(it.price ?? 0) * Number(it.qty ?? it.quantity ?? 1);
        map.set(key, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [orders]);

  const lowStock = products.filter((p) => !p.is_active).slice(0, 5);
  const recentOrders = orders.slice(0, 6);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

  // Quick actions — keyboard & tap friendly. Targets are real existing routes.
  const quickActions = [
    { to: "/admin/products", en: "Add product", bn: "প্রোডাক্ট যোগ", icon: Plus, accent: true },
    { to: "/admin/orders", en: "Orders", bn: "অর্ডার", icon: ShoppingBag, badge: pendingOrders },
    { to: "/admin/products", en: "Products", bn: "প্রোডাক্ট", icon: Package },
    { to: "/admin/users", en: "Customers", bn: "কাস্টমার", icon: Users },
    { to: "/admin/coupons", en: "Coupons", bn: "কুপন", icon: TicketPercent },
    { to: "/admin/promotions", en: "Promotions", bn: "প্রোমোশন", icon: Megaphone },
    { to: "/admin/themes", en: "Themes", bn: "থিম", icon: Palette },
    { to: "/admin/security", en: "Security", bn: "সিকিউরিটি", icon: ShieldCheck },
    { to: "/admin/quick-tools", en: "Tools", bn: "টুলস", icon: Wrench },
  ];

  const statusMeta = (s: string) => {
    const k = (s || "").toLowerCase();
    if (k === "completed" || k === "paid") return { cls: "bg-emerald-50 text-emerald-700 ring-emerald-100", Icon: CheckCircle2, en: "Completed", bn: "সম্পন্ন" };
    if (k === "processing") return { cls: "bg-blue-50 text-blue-700 ring-blue-100", Icon: Loader2, en: "Processing", bn: "প্রসেসিং" };
    if (k === "pending") return { cls: "bg-amber-50 text-amber-700 ring-amber-100", Icon: Clock, en: "Pending", bn: "অপেক্ষমাণ" };
    if (k === "cancelled" || k === "failed") return { cls: "bg-rose-50 text-rose-700 ring-rose-100", Icon: XCircle, en: "Cancelled", bn: "বাতিল" };
    return { cls: "bg-slate-50 text-slate-700 ring-slate-200", Icon: Clock, en: s || "—", bn: s || "—" };
  };

  const kpiCards = [
    {
      label: t("Today's sales", "আজকের সেল"), value: fmtBDT(stats.todayRev),
      sub: `${stats.todayCount} ${t("orders", "অর্ডার")}`,
      delta: stats.dayDelta, Icon: TrendingUp,
    },
    {
      label: t("Total revenue", "মোট আয়"), value: fmtBDT(stats.revenue),
      sub: `${counts.orders.toLocaleString("en-IN")} ${t("orders", "অর্ডার")}`,
      Icon: BarChart3,
    },
    {
      label: t("This month", "এই মাস"), value: fmtBDT(stats.monthRev),
      sub: `${stats.monthCount} ${t("orders", "অর্ডার")}`,
      Icon: Sparkles,
    },
    {
      label: t("Customers", "কাস্টমার"), value: counts.users.toLocaleString("en-IN"),
      sub: `${counts.products} ${t("products", "প্রোডাক্ট")}`,
      Icon: Users,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Welcome strip */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
            {t("Welcome back 👋", "আবার স্বাগতম 👋")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t("Here's what's happening with your store today.", "আজকে আপনার দোকানে যা হচ্ছে দেখে নিন।")}
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">{t("View orders", "অর্ডার দেখুন")}</span>
        </Link>
      </div>

      {/* Pending orders banner */}
      {pendingOrders > 0 && (
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 rounded-2xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 hover:bg-amber-100 transition"
        >
          <span className="w-9 h-9 rounded-xl bg-amber-100 grid place-items-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-amber-900 truncate">
              {pendingOrders} {t("orders need your attention", "অর্ডার আপনার মনোযোগ চাইছে")}
            </div>
            <div className="text-xs text-amber-700/80 truncate">
              {t("Approve payments and deliver credentials.", "পেমেন্ট অ্যাপ্রুভ করে ক্রেডেনশিয়াল পাঠান।")}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-700 shrink-0" />
        </Link>
      )}

      {/* Quick actions — horizontal scroll on mobile, grid on desktop */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-slate-700">{t("Quick actions", "দ্রুত অ্যাকশন")}</h2>
        </div>
        <div className="-mx-1 px-1 overflow-x-auto sm:overflow-visible scrollbar-none">
          <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-9 gap-2.5 min-w-max sm:min-w-0">
            {quickActions.map(({ to, en, bn, icon: Icon, accent, badge }) => (
              <Link
                key={en}
                to={to}
                className={`relative shrink-0 sm:shrink min-w-[112px] sm:min-w-0 flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-3.5 ring-1 transition active:scale-[0.97] ${
                  accent
                    ? "bg-[#3b82f6] text-white ring-[#3b82f6] hover:bg-[#2563eb] shadow-sm"
                    : "bg-white text-slate-700 ring-[#e8ecf1] hover:bg-slate-50 hover:ring-slate-300"
                }`}
              >
                <span className={`w-9 h-9 rounded-xl grid place-items-center ${accent ? "bg-white/20" : "bg-slate-50"}`}>
                  <Icon className={`w-4.5 h-4.5 ${accent ? "text-white" : "text-slate-600"}`} />
                </span>
                <span className="text-[11.5px] font-semibold text-center leading-tight">{t(en, bn)}</span>
                {badge && badge > 0 ? (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map(({ label, value, sub, delta, Icon }) => (
          <div key={label} className="rounded-2xl bg-white ring-1 ring-[#e8ecf1] p-4 sm:p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_4px_16px_-6px_rgba(15,23,42,0.1)] transition">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#3b82f6] grid place-items-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-slate-900 tracking-tight tabular-nums">
              {loading ? <span className="inline-block w-16 h-6 bg-slate-100 rounded animate-pulse" /> : value}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="text-slate-500 truncate">{sub}</span>
              {typeof delta === "number" && delta !== 0 && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold tabular-nums shrink-0 ${delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(delta)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 7-day revenue chart + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-[#e8ecf1] p-4 sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{t("Last 7 days revenue", "শেষ ৭ দিনের আয়")}</div>
              <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {fmtBDT(spark.reduce((s, x) => s + x.v, 0))}
              </div>
            </div>
            <Link to="/admin/orders" className="shrink-0 text-xs font-semibold text-[#3b82f6] hover:underline inline-flex items-center gap-0.5">
              {t("Details", "বিস্তারিত")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(() => {
            const W = 700, H = 180;
            const step = W / Math.max(1, spark.length - 1);
            const pts = spark.map((s, i) => [i * step, H - (s.v / sparkMax) * (H - 30) - 10] as [number, number]);
            if (pts.length === 0) return null;
            let d = `M ${pts[0][0]},${pts[0][1]}`;
            for (let i = 1; i < pts.length; i++) {
              const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
              const cx = (x1 + x2) / 2;
              d += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
            }
            const area = `${d} L ${W},${H} L 0,${H} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H + 26}`} className="w-full h-48">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#sparkGrad)" />
                <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="3.5" fill="#fff" stroke="#3b82f6" strokeWidth="2" />
                ))}
                {spark.map((s, i) => (
                  <text key={i} x={i * step} y={H + 20} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 11, fontWeight: 600 }}>
                    {s.d}
                  </text>
                ))}
              </svg>
            );
          })()}
        </div>

        {/* Top products */}
        <div className="rounded-2xl bg-white ring-1 ring-[#e8ecf1] p-4 sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4">
            <div className="font-bold text-slate-900 truncate">{t("Top products", "টপ প্রোডাক্ট")}</div>
            <Link to="/admin/products" className="shrink-0 text-xs font-semibold text-[#3b82f6] hover:underline">
              {t("All", "সব")}
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">
              {t("No sales yet", "এখনও কোনো সেল নেই")}
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.name + i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 grid place-items-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 ring-1 ring-slate-100 grid place-items-center overflow-hidden shrink-0">
                    {p.image ? <img src={p.image} alt="" className="max-w-[80%] max-h-[80%] object-contain" /> : <span>{p.emoji}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {p.sold} {t("sold", "বিক্রি")} · {fmtBDT(p.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-[#e8ecf1] p-4 sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4">
            <div className="font-bold text-slate-900 truncate">{t("Recent orders", "সাম্প্রতিক অর্ডার")}</div>
            <Link to="/admin/orders" className="shrink-0 text-xs font-semibold text-[#3b82f6] hover:underline inline-flex items-center gap-0.5">
              {t("View all", "সব দেখুন")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">
              {t("No orders yet", "এখনও কোনো অর্ডার নেই")}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((o) => {
                const meta = statusMeta(o.status);
                return (
                  <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {o.full_name || o.email || "Guest"}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        #{o.id.slice(0, 6).toUpperCase()} · {new Date(o.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-sm font-bold text-slate-900 tabular-nums">{fmtBDT(Number(o.total) || 0)}</div>
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full ring-1 ${meta.cls}`}>
                        <meta.Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{t(meta.en, meta.bn)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low stock / inactive products */}
        <div className="rounded-2xl bg-white ring-1 ring-[#e8ecf1] p-4 sm:p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-4">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{t("Inactive products", "ইনঅ্যাক্টিভ প্রোডাক্ট")}</div>
              <div className="text-[11px] text-slate-500">{t("Needs attention", "মনোযোগ দরকার")}</div>
            </div>
            <Link to="/admin/products" className="shrink-0 text-xs font-semibold text-[#3b82f6] hover:underline">
              {t("All", "সব")}
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-8">
              {t("All products active 🎉", "সব প্রোডাক্ট সক্রিয় 🎉")}
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <Link
                  key={p.slug}
                  to="/admin/products"
                  className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-50 grid place-items-center overflow-hidden ring-1 ring-slate-100 shrink-0">
                    {p.image_url ? <img src={p.image_url} alt="" className="max-w-[80%] max-h-[80%] object-contain" /> : <span className="text-sm">{p.emoji || "📦"}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.category || "—"}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100 shrink-0">
                    {t("OFF", "বন্ধ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
