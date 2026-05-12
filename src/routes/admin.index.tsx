import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShoppingBag, DollarSign, BarChart3, Users, Box, Settings,
  CheckCircle2, ChevronRight, TrendingUp, TrendingDown, Sparkles,
  PackageSearch, TicketPercent, Megaphone, LifeBuoy, Bot, FileText,
  Activity, Zap, ArrowUpRight, Clock, Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    let revenue = 0, todayRev = 0, monthRev = 0, yRev = 0, todayCount = 0, monthCount = 0, pending = 0;
    orders.forEach((o) => {
      const t = Number(o.total) || 0;
      const d = new Date(o.created_at);
      const live = o.status !== "cancelled";
      if (live) revenue += t;
      if (live && d >= start) { todayRev += t; todayCount++; }
      if (live && d >= yStart && d < start) { yRev += t; }
      if (live && d >= monthStart) { monthRev += t; monthCount++; }
      if (o.status === "pending" || o.status === "processing") pending++;
    });
    const dayDelta = yRev > 0 ? Math.round(((todayRev - yRev) / yRev) * 100) : (todayRev > 0 ? 100 : 0);
    return { revenue, todayRev, monthRev, todayCount, monthCount, dayDelta, pending };
  }, [orders]);

  // Last 7 days revenue spark
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
      days.push({ d: day.toLocaleDateString("en", { weekday: "short" }), v });
    }
    return days;
  }, [orders]);

  const sparkMax = Math.max(1, ...spark.map((s) => s.v));

  const kpiCards = [
    {
      label: "Total revenue", value: fmtBDT(stats.revenue), sub: `${counts.orders} orders all-time`,
      icon: DollarSign, ring: "ring-emerald-200", grad: "from-emerald-500 via-emerald-400 to-teal-400",
      tint: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Today's sales", value: fmtBDT(stats.todayRev), sub: `${stats.todayCount} orders today`,
      icon: ShoppingBag, ring: "ring-amber-200", grad: "from-amber-500 via-orange-400 to-rose-400",
      tint: "text-amber-700", chip: "bg-amber-50 text-amber-700",
      delta: stats.dayDelta,
    },
    {
      label: "This month", value: fmtBDT(stats.monthRev), sub: `${stats.monthCount} orders MTD`,
      icon: BarChart3, ring: "ring-violet-200", grad: "from-violet-500 via-fuchsia-500 to-purple-500",
      tint: "text-violet-700", chip: "bg-violet-50 text-violet-700",
    },
    {
      label: "Customers", value: counts.users.toLocaleString("en-IN"), sub: `${counts.products} products live`,
      icon: Users, ring: "ring-sky-200", grad: "from-sky-500 via-cyan-500 to-blue-500",
      tint: "text-sky-700", chip: "bg-sky-50 text-sky-700",
    },
  ];

  const quickActions: { to: string; label: string; icon: any; grad: string }[] = [
    { to: "/admin/add-product", label: "Add product", icon: Plus, grad: "from-emerald-500 to-teal-500" },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag, grad: "from-orange-500 to-rose-500" },
    { to: "/admin/users", label: "Customers", icon: Users, grad: "from-sky-500 to-blue-600" },
    { to: "/admin/products", label: "Catalog", icon: PackageSearch, grad: "from-violet-500 to-fuchsia-500" },
    { to: "/admin/coupons", label: "Coupons", icon: TicketPercent, grad: "from-rose-500 to-pink-500" },
    { to: "/admin/marketing", label: "Marketing", icon: Megaphone, grad: "from-amber-500 to-orange-500" },
    { to: "/admin/tickets", label: "Support", icon: LifeBuoy, grad: "from-emerald-500 to-green-600" },
    { to: "/admin/ai-command", label: "AI Center", icon: Bot, grad: "from-violet-500 to-fuchsia-600" },
    { to: "/admin/reports", label: "Reports", icon: FileText, grad: "from-blue-500 to-indigo-600" },
    { to: "/admin/analytics", label: "Analytics", icon: Activity, grad: "from-cyan-500 to-blue-600" },
    { to: "/admin/settings", label: "Settings", icon: Settings, grad: "from-slate-600 to-slate-800" },
    { to: "/admin/notifications", label: "Alerts", icon: Zap, grad: "from-rose-500 to-red-500" },
  ];

  const lowStock = products.filter((p) => !p.is_active);
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; image: string; sold: number; revenue: number }>();
    orders.forEach((o) => {
      if (!Array.isArray(o.items)) return;
      (o.items as any[]).forEach((it) => {
        const key = it.slug || it.name;
        if (!key) return;
        const cur = map.get(key) ?? { name: it.name ?? key, image: it.image_url ?? "", sold: 0, revenue: 0 };
        cur.sold += Number(it.quantity ?? 1);
        cur.revenue += Number(it.price ?? it.total ?? 0) * Number(it.quantity ?? 1);
        map.set(key, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [orders]);

  const statusChip = (s: string) => {
    const k = (s || "").toLowerCase();
    if (k === "completed" || k === "paid") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    if (k === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
    if (k === "processing") return "bg-sky-50 text-sky-700 ring-sky-200";
    if (k === "cancelled" || k === "failed") return "bg-rose-50 text-rose-700 ring-rose-200";
    return "bg-slate-100 text-slate-700 ring-slate-200";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 p-6 md:p-8 text-white shadow-[0_20px_60px_-20px_rgba(76,29,149,0.55)]">
        <div className="pointer-events-none absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full bg-fuchsia-500/30 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-[320px] h-[320px] rounded-full bg-cyan-400/25 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">Welcome back 👋</h1>
            <p className="text-sm text-white/70 mt-1">Here's a snapshot of your store today.</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link to="/admin/add-product" className="h-10 px-4 rounded-full bg-white text-slate-900 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-white/90 transition">
                <Plus className="w-4 h-4" /> Add product
              </Link>
              <Link to="/admin/orders" className="h-10 px-4 rounded-full bg-white/10 ring-1 ring-white/20 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-white/15 transition">
                <ShoppingBag className="w-4 h-4" /> View orders
              </Link>
              <Link to="/admin/analytics" className="h-10 px-4 rounded-full bg-white/10 ring-1 ring-white/20 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-white/15 transition">
                <BarChart3 className="w-4 h-4" /> Analytics
              </Link>
            </div>
          </div>

          {/* mini live tile */}
          <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 backdrop-blur px-5 py-4 min-w-[220px]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60 font-bold">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
              Live revenue today
            </div>
            <div className="text-2xl font-extrabold mt-1">{loading ? "—" : fmtBDT(stats.todayRev)}</div>
            <div className="flex items-center gap-1 text-xs mt-1 text-white/70">
              {stats.dayDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-300" />}
              <span className={stats.dayDelta >= 0 ? "text-emerald-300 font-bold" : "text-rose-300 font-bold"}>{stats.dayDelta >= 0 ? "+" : ""}{stats.dayDelta}%</span>
              <span>vs yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
              <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${c.grad} opacity-10 blur-2xl group-hover:opacity-20 transition`} />
              <div className="flex items-start justify-between relative">
                <div className="text-xs text-slate-500 font-semibold">{c.label}</div>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} text-white grid place-items-center shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight relative">{loading ? "—" : c.value}</div>
              <div className="flex items-center gap-1.5 mt-1 relative">
                <div className="text-xs text-slate-500">{c.sub}</div>
                {typeof (c as any).delta === "number" && (
                  <span className={`ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${(c as any).delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {(c as any).delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {(c as any).delta >= 0 ? "+" : ""}{(c as any).delta}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-bold text-slate-900">Revenue · last 7 days</div>
              <div className="text-xs text-slate-500">Daily totals across all paid orders</div>
            </div>
            <Link to="/admin/reports" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
              Full report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-end gap-2 h-44">
            {spark.map((d, i) => {
              const h = Math.max(6, Math.round((d.v / sparkMax) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-36">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_4px_14px_-4px_rgba(139,92,246,0.5)] transition-all hover:opacity-90"
                      style={{ height: `${h}%` }}
                      title={fmtBDT(d.v)}
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">{d.d}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-900">Quick actions</div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shortcuts</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.grad} text-white grid place-items-center shadow-md group-hover:scale-110 transition`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 text-center leading-tight">{a.label}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending highlight + Top products + Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending action card */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white grid place-items-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Needs your attention</div>
              <div className="text-2xl font-extrabold text-amber-900">{stats.pending} pending</div>
            </div>
          </div>
          <p className="text-sm text-amber-900/70 mt-3">Pending or processing orders are waiting for action. Process them to keep customers happy.</p>
          <Link to="/admin/orders" className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-amber-900 text-white text-xs font-bold hover:bg-amber-950 transition">
            Process orders <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top products */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white grid place-items-center"><Star className="w-4 h-4" /></div>
              <div>
                <div className="font-bold text-slate-900">Top selling products</div>
                <div className="text-xs text-slate-500">Based on recent orders</div>
              </div>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topItems.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-10">No sales data yet.</div>
          ) : (
            <div className="space-y-1.5">
              {topItems.map((it, i) => {
                const max = Math.max(1, topItems[0].sold);
                const pct = Math.round((it.sold / max) * 100);
                return (
                  <div key={it.name} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-slate-50 transition">
                    <div className="w-7 text-sm font-extrabold text-slate-300 text-center tabular-nums">{i + 1}</div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center overflow-hidden shrink-0 border border-slate-200">
                      {it.image ? <img src={it.image} alt={it.name} className="max-h-[80%] max-w-[80%] object-contain" /> : <Box className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{it.name}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-slate-900 tabular-nums">{fmtBDT(it.revenue)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{it.sold} sold</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders + Stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders (wider) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white grid place-items-center"><ShoppingBag className="w-4 h-4" /></div>
              <div className="font-bold text-slate-900">Recent orders</div>
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="text-sm text-slate-500 text-center py-10">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-10">No orders yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 6).map((o) => (
                <Link key={o.id} to="/admin/orders" className="flex items-center gap-3 py-3 px-1 hover:bg-slate-50 rounded-lg transition">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 grid place-items-center text-slate-600 font-bold text-xs shrink-0">
                    {(o.full_name || o.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{o.full_name || o.email || "Guest"}</div>
                    <div className="text-[11px] text-slate-500 truncate">RxB-{o.id.slice(0, 6).toUpperCase()} · {new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${statusChip(o.status)} capitalize`}>
                    {o.status === "completed" && <CheckCircle2 className="inline w-3 h-3 mr-0.5" />}
                    {o.status || "—"}
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 tabular-nums w-24 text-right">{fmtBDT(Number(o.total) || 0)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 text-white grid place-items-center"><Box className="w-4 h-4" /></div>
              <div>
                <div className="font-bold text-slate-900">Stock alerts</div>
                <div className="text-xs text-slate-500">Inactive products</div>
              </div>
            </div>
            <Link to="/admin/inventory" className="text-xs font-semibold text-slate-700 hover:text-slate-900">View</Link>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-white grid place-items-center shadow"><Box className="w-5 h-5" /></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Out of stock</div>
              <div className="text-2xl font-extrabold text-rose-900">{lowStock.length}</div>
            </div>
          </div>

          {lowStock.length === 0 && !loading ? (
            <div className="text-sm text-slate-500 text-center py-6">All products are active 🎉</div>
          ) : (
            <div className="space-y-1.5">
              {lowStock.slice(0, 5).map((p) => (
                <Link key={p.slug} to="/admin/products" className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center overflow-hidden shrink-0 border border-slate-200">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="max-h-[80%] max-w-[80%] object-contain" /> : <span>{p.emoji}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500">Inactive</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">OUT</span>
                </Link>
              ))}
              {lowStock.length > 5 && (
                <div className="text-center text-xs text-slate-500 pt-2">+{lowStock.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
