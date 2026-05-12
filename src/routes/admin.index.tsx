import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShoppingBag, DollarSign, BarChart3, Users, Box, Settings,
  CheckCircle2, ChevronRight, TrendingUp, TrendingDown, Sparkles,
  PackageSearch, TicketPercent, Megaphone, LifeBuoy, Bot, FileText,
  Activity, Zap, ArrowUpRight, Clock, Star,
  Eye, Ear, Accessibility, Bug, AlertTriangle, Bell, Smartphone, Monitor, Tablet,
  Globe, MessageSquare, UserCheck, ShieldCheck,
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

      {/* ───────── PREMIUM CONTROL CENTER MODULES ───────── */}

      {/* Accessibility Monitoring */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center shadow-md">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Accessibility Control</div>
              <div className="text-lg font-extrabold text-slate-900">Monitoring & Reports</div>
            </div>
          </div>
          <Link to="/admin/reports" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
            View all reports <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Vision Issues", value: 12, sub: "+3 this week", icon: Eye, grad: "from-blue-500 to-indigo-600", chip: "bg-blue-50 text-blue-700" },
            { label: "Hearing Issues", value: 4, sub: "1 critical", icon: Ear, grad: "from-violet-500 to-purple-600", chip: "bg-violet-50 text-violet-700" },
            { label: "Mobility Issues", value: 7, sub: "2 in review", icon: Accessibility, grad: "from-emerald-500 to-teal-500", chip: "bg-emerald-50 text-emerald-700" },
            { label: "Bug Reports", value: 18, sub: "5 resolved today", icon: Bug, grad: "from-rose-500 to-red-500", chip: "bg-rose-50 text-rose-700" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                <div className={`pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${c.grad} opacity-10 blur-2xl group-hover:opacity-25 transition`} />
                <div className="flex items-start justify-between relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} text-white grid place-items-center shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.chip}`}>LIVE</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight tabular-nums relative">{c.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium relative">{c.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 relative">{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reports list + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-slate-900">Recent accessibility reports</div>
            <Link to="/admin/reports" className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1">
              All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            {[
              { user: "Rahim Uddin", issue: "Screen reader skips checkout step 2", type: "Vision", status: "critical", time: "12 min ago" },
              { user: "Sumi Akter", issue: "Keyboard focus lost in modal", type: "Mobility", status: "in_review", time: "1 hr ago" },
              { user: "Anonymous", issue: "Caption missing on tutorial video", type: "Hearing", status: "pending", time: "3 hr ago" },
              { user: "Karim Ahmed", issue: "Low contrast on warning badges", type: "UI", status: "resolved", time: "Yesterday" },
              { user: "Nadia Islam", issue: "Bangla numerals not announced", type: "Vision", status: "in_review", time: "2 days ago" },
            ].map((r, i) => {
              const statusStyle: Record<string, string> = {
                critical: "bg-rose-50 text-rose-700 ring-rose-200",
                in_review: "bg-sky-50 text-sky-700 ring-sky-200",
                pending: "bg-amber-50 text-amber-700 ring-amber-200",
                resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
              };
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center text-[11px] font-bold shrink-0">
                    {r.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{r.issue}</div>
                    <div className="text-[11px] text-slate-500">{r.user} · {r.type} · {r.time}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${statusStyle[r.status]}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="font-bold text-slate-900 mb-1">Issue status breakdown</div>
          <div className="text-xs text-slate-500 mb-5">Across all accessibility reports</div>
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#fee2e2" strokeWidth="3.5" strokeDasharray="20 100" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#dbeafe" strokeWidth="3.5" strokeDasharray="30 100" strokeDashoffset="-20" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#fef3c7" strokeWidth="3.5" strokeDasharray="15 100" strokeDashoffset="-50" />
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#dcfce7" strokeWidth="3.5" strokeDasharray="35 100" strokeDashoffset="-65" />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-slate-900">41</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Critical", val: 8, color: "bg-rose-400" },
              { label: "In Review", val: 12, color: "bg-blue-400" },
              { label: "Pending", val: 6, color: "bg-amber-400" },
              { label: "Resolved", val: 15, color: "bg-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-slate-700 font-medium flex-1">{s.label}</span>
                <span className="text-slate-900 font-bold tabular-nums">{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support Tickets + Notifications + Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Support tickets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white grid place-items-center"><LifeBuoy className="w-4 h-4" /></div>
              <div>
                <div className="font-bold text-slate-900">Support tickets</div>
                <div className="text-xs text-slate-500">9 open · 3 urgent</div>
              </div>
            </div>
            <Link to="/admin/tickets" className="text-xs font-semibold text-slate-700 hover:text-slate-900">All</Link>
          </div>
          <div className="space-y-2">
            {[
              { id: "TKT-2841", subject: "Cannot reset password", priority: "urgent", user: "Rahim U." },
              { id: "TKT-2840", subject: "Subscription renewal failed", priority: "high", user: "Sumi A." },
              { id: "TKT-2839", subject: "Need invoice for ChatGPT plan", priority: "normal", user: "Karim A." },
              { id: "TKT-2838", subject: "Voice navigation not working", priority: "high", user: "Nadia I." },
            ].map((t) => {
              const pStyle: Record<string, string> = {
                urgent: "bg-rose-100 text-rose-700",
                high: "bg-amber-100 text-amber-700",
                normal: "bg-slate-100 text-slate-700",
              };
              return (
                <div key={t.id} className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{t.id}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${pStyle[t.priority]}`}>{t.priority}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1 truncate">{t.subject}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.user}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white grid place-items-center relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Live notifications</div>
                <div className="text-xs text-slate-500">Real-time activity</div>
              </div>
            </div>
            <Link to="/admin/notifications" className="text-xs font-semibold text-slate-700 hover:text-slate-900">All</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { type: "order", icon: ShoppingBag, color: "from-emerald-500 to-teal-500", text: "New order ৳1,200 from Anika R.", time: "Just now" },
              { type: "alert", icon: AlertTriangle, color: "from-rose-500 to-red-500", text: "Critical accessibility issue reported", time: "5 min ago" },
              { type: "user", icon: UserCheck, color: "from-blue-500 to-indigo-500", text: "12 new users joined today", time: "1 hr ago" },
              { type: "ticket", icon: MessageSquare, color: "from-violet-500 to-fuchsia-500", text: "Support ticket TKT-2841 opened", time: "2 hr ago" },
              { type: "system", icon: ShieldCheck, color: "from-amber-500 to-orange-500", text: "Backup completed successfully", time: "4 hr ago" },
            ].map((n, i) => {
              const Icon = n.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${n.color} text-white grid place-items-center shrink-0 shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 leading-snug">{n.text}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{n.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Device analytics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white grid place-items-center"><Monitor className="w-4 h-4" /></div>
              <div>
                <div className="font-bold text-slate-900">Device analytics</div>
                <div className="text-xs text-slate-500">Visitor breakdown</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+18%</span>
          </div>
          <div className="space-y-3.5">
            {[
              { label: "Mobile", val: 68, icon: Smartphone, color: "from-violet-500 to-fuchsia-500" },
              { label: "Desktop", val: 24, icon: Monitor, color: "from-blue-500 to-cyan-500" },
              { label: "Tablet", val: 8, icon: Tablet, color: "from-emerald-500 to-teal-500" },
            ].map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.label}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${d.color} text-white grid place-items-center shadow-sm`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 flex-1">{d.label}</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">{d.val}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${d.color} transition-all`} style={{ width: `${d.val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Top browsers</div>
            <div className="space-y-1.5">
              {[
                { label: "Chrome", val: "62%" },
                { label: "Safari", val: "21%" },
                { label: "Firefox", val: "9%" },
                { label: "Edge", val: "8%" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-xs">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-600 flex-1">{b.label}</span>
                  <span className="text-slate-900 font-bold tabular-nums">{b.val}</span>
                </div>
              ))}
            </div>
          </div>
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
