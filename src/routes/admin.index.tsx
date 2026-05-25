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
 label: "Today's Sale", value: fmtBDT(stats.todayRev), delta: stats.dayDelta, deltaLabel: "vs yesterday",
 tint: " to-white", stroke: "#94a3b8", fill: "rgba(100,116,139,0.18)",
 },
 {
 label: "Total Sales", value: fmtBDT(stats.revenue), delta: -14, deltaLabel: "vs last month",
 tint: " to-white", stroke: "#94a3b8", fill: "rgba(100,116,139,0.18)",
 },
 {
 label: "Total Orders", value: counts.orders.toLocaleString("en-IN"), delta: 36, deltaLabel: "vs last month",
 tint: " to-white", stroke: "#94a3b8", fill: "rgba(100,116,139,0.18)",
 },
 ];

 const quickActions: { to: string; label: string; icon: any; grad: string }[] = [
 { to: "/admin/add-product", label: "Add product", icon: Plus, grad: " " },
 { to: "/admin/orders", label: "Orders", icon: ShoppingBag, grad: " " },
 { to: "/admin/users", label: "Customers", icon: Users, grad: " " },
 { to: "/admin/products", label: "Catalog", icon: PackageSearch, grad: " " },
 { to: "/admin/coupons", label: "Coupons", icon: TicketPercent, grad: " " },
 { to: "/admin/marketing", label: "Marketing", icon: Megaphone, grad: " " },
 { to: "/admin/tickets", label: "Support", icon: LifeBuoy, grad: " " },
 { to: "/admin/ai-command", label: "AI Center", icon: Bot, grad: " " },
 { to: "/admin/reports", label: "Reports", icon: FileText, grad: " " },
 { to: "/admin/analytics", label: "Analytics", icon: Activity, grad: " " },
 { to: "/admin/settings", label: "Settings", icon: Settings, grad: " " },
 { to: "/admin/notifications", label: "Alerts", icon: Zap, grad: " " },
 ];

 // Sparkline path generator (smooth area)
 const sparkPath = (vals: number[], w = 200, h = 60) => {
 const max = Math.max(1, ...vals);
 const step = w / Math.max(1, vals.length - 1);
 const pts = vals.map((v, i) => [i * step, h - (v / max) * (h - 6) - 3] as [number, number]);
 let d = `M ${pts[0][0]},${pts[0][1]}`;
 for (let i = 1; i < pts.length; i++) {
 const [x1, y1] = pts[i - 1];
 const [x2, y2] = pts[i];
 const cx = (x1 + x2) / 2;
 d += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
 }
 const area = `${d} L ${w},${h} L 0,${h} Z`;
 return { line: d, area };
 };

 const kpiSeries = [
 spark.map((s) => s.v).concat([100, 140, 110, 180, 160, 220]).slice(-12),
 [120, 140, 110, 160, 130, 175, 150, 200, 180, 230, 210, 260],
 [80, 110, 95, 130, 115, 155, 140, 180, 165, 210, 195, 245],
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
 if (k === "completed" || k === "paid") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
 if (k === "pending") return "bg-rose-100 text-rose-600 ring-rose-200";
 if (k === "processing") return "bg-blue-100 text-blue-700 ring-blue-200";
 if (k === "cancelled" || k === "failed") return "bg-slate-100 text-slate-600 ring-slate-200";
 return "bg-slate-100 text-slate-700 ring-slate-200";
 };

 // Sales report mock series
 const salesMonths = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan"];
 const seriesA = [220,260,300,250,330,290,340,420,380,460,500,560];
 const seriesB = [120,140,170,150,200,180,220,260,240,300,340,380];
 const trafficSources = [
 { label: "Direct", val: 143382, pct: 92, grad: "from-blue-400 to-blue-600" },
 { label: "Referral", val: 87974, pct: 66, grad: "from-orange-400 to-orange-600" },
 { label: "Social Media", val: 45211, pct: 42, grad: "from-indigo-400 to-indigo-600" },
 { label: "Twitter", val: 21893, pct: 22, grad: "from-sky-400 to-sky-500" },
 { label: "Facebook", val: 21893, pct: 22, grad: "from-blue-500 to-blue-700" },
 ];

 // Order status breakdown (real)
 const orderStatusBreakdown = useMemo(() => {
 const buckets = { completed: 0, pending: 0, processing: 0, cancelled: 0 } as Record<string, number>;
 orders.forEach((o) => {
 const k = (o.status || "pending").toLowerCase();
 if (k in buckets) buckets[k]++; else buckets.pending++;
 });
 const total = Object.values(buckets).reduce((a, b) => a + b, 0) || 1;
 return [
 { label: "Completed", val: buckets.completed, color: "#3b82f6", soft: "bg-blue-500" },
 { label: "Processing", val: buckets.processing, color: "#fbbf24", soft: "bg-amber-400" },
 { label: "Pending", val: buckets.pending, color: "#f97316", soft: "bg-orange-500" },
 { label: "Cancelled", val: buckets.cancelled, color: "#f43f5e", soft: "bg-rose-500" },
 ].map((s) => ({ ...s, pct: (s.val / total) * 100, total }));
 }, [orders]);

 // Recent customers (real, from orders) — matches reference table
 const recentCustomers = useMemo(() => {
 return orders.slice(0, 6).map((o) => {
 const item = Array.isArray(o.items) && (o.items as any[])[0];
 return {
 id: o.id,
 orderId: "#" + o.id.slice(0, 6).toUpperCase(),
 name: o.full_name || o.email || "Guest",
 date: new Date(o.created_at),
 price: Number(o.total) || 0,
 status: (o.status || "pending").toLowerCase(),
 image: item?.image_url || "",
 emoji: item?.emoji || "📦",
 product: item?.name || "Order",
 };
 });
 }, [orders]);

 const lowStockItems = lowStock.slice(0, 6);

 return (
 <div className="space-y-5 animate-fade-in">
 {/* Welcome hero card */}
 <div className="rounded-3xl bg-white ring-1 ring-slate-200/70 shadow-[0_10px_30px_-18px_rgba(100,116,139,0.18)] p-6 md:p-8 flex items-start md:items-center justify-between gap-6 flex-wrap">
 <div className="min-w-0">
 <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
 Dashboard
 </span>
 <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
 <p className="text-sm text-slate-500 mt-1.5">Here's what's happening with your store today.</p>
 </div>
 <div className="flex items-center gap-2.5">
 <Link to="/admin/add-product" className="h-12 px-5 rounded-2xl bg-white ring-1 ring-slate-200 text-sm font-semibold text-slate-900 inline-flex items-center gap-2 hover:bg-slate-50 transition">
 <Plus className="w-4 h-4" /> Add product
 </Link>
 <Link to="/admin/orders" className="h-12 px-5 rounded-2xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-slate-800 transition">
 <ShoppingBag className="w-4 h-4" /> View orders
 </Link>
 </div>
 </div>

 {/* KPI cards — clean white */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: "Total revenue", value: fmtBDT(stats.revenue), sub: `${counts.orders} orders`, Icon: DollarSign },
 { label: "Today's sales", value: fmtBDT(stats.todayRev), sub: `${stats.todayCount} orders`, Icon: ShoppingBag },
 { label: "This month", value: fmtBDT(stats.monthRev), sub: `${stats.monthCount} orders`, Icon: BarChart3 },
 { label: "Customers", value: counts.users.toLocaleString("en-IN"), sub: `${counts.products} products`, Icon: Users },
 ].map(({ label, value, sub, Icon }) => (
 <div key={label} className="rounded-3xl bg-white ring-1 ring-slate-200/70 p-5 shadow-[0_8px_24px_-18px_rgba(100,116,139,0.18)]">
 <div className="flex items-start justify-between gap-3">
 <div className="text-sm text-slate-500 font-medium">{label}</div>
 <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 grid place-items-center">
 <Icon className="w-4 h-4" />
 </span>
 </div>
 <div className="mt-4 text-3xl md:text-[34px] font-extrabold text-slate-900 tracking-tight tabular-nums">
 {loading ? "—" : value}
 </div>
 <div className="mt-1.5 text-xs text-slate-500">{sub}</div>
 </div>
 ))}
 </div>

 {/* Stock alerts */}
 <div className="rounded-3xl bg-white ring-1 ring-slate-200/70 p-5 md:p-6 shadow-[0_8px_24px_-18px_rgba(100,116,139,0.18)]">
 <div className="flex items-start justify-between gap-3 mb-4">
 <div className="flex items-center gap-3">
 <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 grid place-items-center">
 <Box className="w-5 h-5" />
 </span>
 <div>
 <div className="font-extrabold text-slate-900">Stock alerts</div>
 <div className="text-xs text-slate-500">Threshold ≤ 3</div>
 </div>
 </div>
 <Link to="/admin/products" className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
 <Settings className="w-3.5 h-3.5" /> View all <ChevronRight className="w-3.5 h-3.5" />
 </Link>
 </div>
 <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-4 mb-3">
 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 inline-flex items-center gap-1.5">
 <Box className="w-3.5 h-3.5" /> Low stock
 </div>
 <div className="text-3xl font-extrabold text-slate-700 mt-1 tabular-nums">{lowStockItems.length}</div>
 </div>
 <div className="space-y-2">
 {lowStockItems.length === 0 ? (
 <div className="text-sm text-slate-500 text-center py-6">All products in stock 🎉</div>
 ) : lowStockItems.map((p) => (
 <div key={p.slug} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
 <div className="w-10 h-10 rounded-xl bg-white grid place-items-center overflow-hidden ring-1 ring-slate-200 shrink-0">
 {p.image_url ? (
 <img src={p.image_url} alt={p.name} className="max-w-[80%] max-h-[80%] object-contain" />
 ) : (
 <span className="text-base">{p.emoji || "📦"}</span>
 )}
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
 <div className="text-[11px] text-slate-500">Out of stock</div>
 </div>
 <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-slate-500 text-white tracking-wider">OUT</span>
 <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200 inline-flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> Done
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Sales Report + Traffic Sources */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 rounded-2xl p-5 ring-1 ring-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(100,116,139,0.15)]">
 <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
 <div className="font-extrabold text-slate-900">Sales Report</div>
 <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/70">
 {["12 MONTHS","6 MONTHS","30 DAYS","7 DAYS"].map((t,i)=>(
 <button key={t} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${i===0?"bg-white shadow-sm text-slate-900":"text-slate-500 hover:text-slate-700"}`}>{t}</button>
 ))}
 </div>
 <button className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50">
 <FileText className="w-3.5 h-3.5" /> EXPORT PDF
 </button>
 </div>
 {(() => {
 const W=720, H=200;
 const max = Math.max(...seriesA, ...seriesB);
 const step = W/(seriesA.length-1);
 const toPath = (arr:number[]) => {
 const pts = arr.map((v,i)=>[i*step, H - (v/max)*(H-30) - 10] as [number,number]);
 let d = `M ${pts[0][0]},${pts[0][1]}`;
 for (let i=1;i<pts.length;i++){
 const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
 const cx=(x1+x2)/2;
 d+=` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
 }
 return d;
 };
 return (
 <svg viewBox={`0 0 ${W} ${H+30}`} className="w-full h-56">
 <path d={toPath(seriesA)} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
 <path d={toPath(seriesB)} fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
 {salesMonths.map((m,i)=>(
 <text key={m} x={i*step} y={H+22} textAnchor="middle" className="fill-slate-400" style={{fontSize:11,fontWeight:600}}>{m}</text>
 ))}
 </svg>
 );
 })()}
 </div>

 <div className="rounded-2xl p-5 ring-1 ring-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(100,116,139,0.15)]">
 <div className="flex items-center justify-between mb-5">
 <div className="font-extrabold text-slate-900">Traffic Sources</div>
 <button className="text-[11px] font-bold text-slate-500 inline-flex items-center gap-1">LAST 7 DAYS</button>
 </div>
 <div className="space-y-4">
 {trafficSources.map((t)=>(
 <div key={t.label}>
 <div className="flex items-center justify-between text-xs mb-1.5">
 <span className="text-slate-700 font-semibold">{t.label}</span>
 <span className="text-slate-900 font-bold tabular-nums">{t.val.toLocaleString("en-IN")}</span>
 </div>
 <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
 <div className="h-full rounded-full bg-slate-500" style={{ width: `${t.pct}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Orders Breakdown (donut) + Recent Customers — matches reference */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Donut */}
 <div className="rounded-3xl p-5 ring-1 ring-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(100,116,139,0.15)]">
 <div className="flex items-center justify-between mb-4">
 <div className="font-extrabold text-slate-900">Orders Breakdown</div>
 <button className="text-slate-500 hover:text-slate-700">⋮</button>
 </div>
 {(() => {
 const total = orderStatusBreakdown[0]?.total ?? 0;
 // build donut segments
 let acc = 0;
 const R = 15.915;
 return (
 <>
 <div className="relative w-44 h-44 mx-auto">
 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
 <circle cx="18" cy="18" r={R} fill="transparent" stroke="#94a3b8" strokeWidth="5" />
 {orderStatusBreakdown.map((s) => {
 if (s.pct <= 0) return null;
 const dash = `${s.pct} ${100 - s.pct}`;
 const offset = -acc;
 acc += s.pct;
 return (
 <circle
 key={s.label}
 cx="18" cy="18" r={R}
 fill="transparent"
 stroke={s.color}
 strokeWidth="5"
 strokeDasharray={dash}
 strokeDashoffset={offset}
 strokeLinecap="butt"
 />
 );
 })}
 </svg>
 <div className="absolute inset-0 grid place-items-center">
 <div className="text-center">
 <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{total}</div>
 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total</div>
 </div>
 </div>
 </div>
 <div className="mt-5 space-y-2">
 {orderStatusBreakdown.map((s) => (
 <div key={s.label} className="flex items-center gap-2 text-xs">
 <span className={`w-2.5 h-2.5 rounded-full ${s.soft}`} />
 <span className="text-slate-700 font-semibold flex-1 capitalize">{s.label}</span>
 <span className="text-slate-900 font-extrabold tabular-nums">{s.val}</span>
 </div>
 ))}
 </div>
 </>
 );
 })()}
 </div>

 {/* Recent Customers table */}
 <div className="lg:col-span-2 rounded-3xl p-5 ring-1 ring-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(100,116,139,0.15)]">
 <div className="flex items-center justify-between mb-4">
 <div className="font-extrabold text-slate-900">Recent Customers</div>
 <Link to="/admin/orders" className="text-xs font-bold text-slate-600 inline-flex items-center gap-1 hover:underline">
 View All <ArrowUpRight className="w-3.5 h-3.5" />
 </Link>
 </div>
 {loading ? (
 <div className="text-sm text-slate-500 text-center py-10">Loading…</div>
 ) : recentCustomers.length === 0 ? (
 <div className="text-sm text-slate-500 text-center py-10">No orders yet.</div>
 ) : (
 <div className="overflow-x-auto -mx-2">
 <table className="w-full text-sm">
 <thead>
 <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
 <th className="text-left py-2 px-2 font-bold">Product</th>
 <th className="text-left py-2 px-2 font-bold">Order ID</th>
 <th className="text-left py-2 px-2 font-bold">Customer</th>
 <th className="text-left py-2 px-2 font-bold">Date</th>
 <th className="text-left py-2 px-2 font-bold">Price</th>
 <th className="text-left py-2 px-2 font-bold">Status</th>
 </tr>
 </thead>
 <tbody>
 {recentCustomers.map((c) => (
 <tr key={c.id} className="border-t border-slate-100/80 hover:bg-white/60 transition">
 <td className="py-2.5 px-2">
 <div className="w-9 h-9 rounded-xl bg-slate-100 grid place-items-center overflow-hidden border border-slate-200">
 {c.image ? (
 <img src={c.image} alt={c.product} className="max-h-[80%] max-w-[80%] object-contain" />
 ) : (
 <span className="text-base">{c.emoji}</span>
 )}
 </div>
 </td>
 <td className="py-2.5 px-2 text-slate-700 font-semibold tabular-nums">{c.orderId}</td>
 <td className="py-2.5 px-2 text-slate-900 font-semibold truncate max-w-[160px]">{c.name}</td>
 <td className="py-2.5 px-2 text-slate-600">
 <span className="inline-flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5 text-slate-500" />
 {c.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
 </span>
 </td>
 <td className="py-2.5 px-2 text-slate-900 font-extrabold tabular-nums">{fmtBDT(c.price)}</td>
 <td className="py-2.5 px-2">
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 capitalize ${statusChip(c.status)}`}>
 {c.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* Quick actions */}
 <div className="rounded-2xl p-5 ring-1 ring-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_-12px_rgba(100,116,139,0.15)]">
 <div className="flex items-center justify-between mb-4">
 <div className="font-extrabold text-slate-900">Quick actions</div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Shortcuts</span>
 </div>
 <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
 {quickActions.map((a) => {
 const Icon = a.icon;
 return (
 <Link
 key={a.to}
 to={a.to}
 className="group flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/80 ring-1 ring-white/70 hover:ring-slate-200 hover:shadow-md transition-all"
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

 {/* Pending highlight + Top products + Stock */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Pending action card */}
 <div className="bg-white/70 backdrop-blur-md ring-1 ring-slate-200 border border-slate-200 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-2xl bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center shadow-md">
 <Clock className="w-5 h-5" />
 </div>
 <div>
 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Needs your attention</div>
 <div className="text-2xl font-extrabold text-slate-900">{stats.pending} pending</div>
 </div>
 </div>
 <p className="text-sm text-slate-900/70 mt-3">Pending or processing orders are waiting for action. Process them to keep customers happy.</p>
 <Link to="/admin/orders" className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-950 transition">
 Process orders <ChevronRight className="w-3.5 h-3.5" />
 </Link>
 </div>

 {/* Top products */}
 <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center"><Star className="w-4 h-4" /></div>
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
 {it.image ? <img src={it.image} alt={it.name} className="max-h-[80%] max-w-[80%] object-contain" /> : <Box className="w-4 h-4 text-slate-500" />}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-sm font-semibold text-slate-900 truncate">{it.name}</div>
 <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
 <div className="h-full rounded-full bg-white/70 backdrop-blur-md ring-1 ring-slate-200" style={{ width: `${pct}%` }} />
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
 <div className="w-9 h-9 rounded-xl bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center shadow-md">
 <Accessibility className="w-5 h-5" />
 </div>
 <div>
 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Accessibility Control</div>
 <div className="text-lg font-extrabold text-slate-900">Monitoring & Reports</div>
 </div>
 </div>
 <Link to="/admin/reports" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
 View all reports <ArrowUpRight className="w-3.5 h-3.5" />
 </Link>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: "Vision Issues", value: 12, sub: "+3 this week", icon: Eye, grad: " ", chip: "bg-slate-50 text-slate-700" },
 { label: "Hearing Issues", value: 4, sub: "1 critical", icon: Ear, grad: " ", chip: "bg-slate-50 text-slate-700" },
 { label: "Mobility Issues", value: 7, sub: "2 in review", icon: Accessibility, grad: " ", chip: "bg-slate-50 text-slate-700" },
 { label: "Bug Reports", value: 18, sub: "5 resolved today", icon: Bug, grad: " ", chip: "bg-slate-50 text-slate-700" },
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
 <div className="text-[11px] text-slate-500 mt-0.5 relative">{c.sub}</div>
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
 critical: "bg-slate-50 text-slate-700 ring-slate-200",
 in_review: "bg-slate-50 text-slate-700 ring-slate-200",
 pending: "bg-slate-50 text-slate-700 ring-slate-200",
 resolved: "bg-slate-50 text-slate-700 ring-slate-200",
 };
 return (
 <div key={i} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 transition">
 <div className="w-9 h-9 rounded-full bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center text-[11px] font-bold shrink-0">
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
 <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="20 100" />
 <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="30 100" strokeDashoffset="-20" />
 <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="15 100" strokeDashoffset="-50" />
 <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#94a3b8" strokeWidth="3.5" strokeDasharray="35 100" strokeDashoffset="-65" />
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
 { label: "Critical", val: 8, color: "bg-slate-400" },
 { label: "In Review", val: 12, color: "bg-slate-400" },
 { label: "Pending", val: 6, color: "bg-slate-400" },
 { label: "Resolved", val: 15, color: "bg-slate-400" },
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
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center"><LifeBuoy className="w-4 h-4" /></div>
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
 urgent: "bg-slate-100 text-slate-700",
 high: "bg-slate-100 text-slate-700",
 normal: "bg-slate-100 text-slate-700",
 };
 return (
 <div key={t.id} className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[10px] font-bold text-slate-500 tabular-nums">{t.id}</span>
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
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center relative">
 <Bell className="w-4 h-4" />
 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-white" />
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
 { type: "order", icon: ShoppingBag, color: " ", text: "New order ৳1,200 from Anika R.", time: "Just now" },
 { type: "alert", icon: AlertTriangle, color: " ", text: "Critical accessibility issue reported", time: "5 min ago" },
 { type: "user", icon: UserCheck, color: " ", text: "12 new users joined today", time: "1 hr ago" },
 { type: "ticket", icon: MessageSquare, color: " ", text: "Support ticket TKT-2841 opened", time: "2 hr ago" },
 { type: "system", icon: ShieldCheck, color: " ", text: "Backup completed successfully", time: "4 hr ago" },
 ].map((n, i) => {
 const Icon = n.icon;
 return (
 <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
 <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${n.color} text-white grid place-items-center shrink-0 shadow-sm`}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-sm text-slate-800 leading-snug">{n.text}</div>
 <div className="text-[11px] text-slate-500 mt-0.5">{n.time}</div>
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
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center"><Monitor className="w-4 h-4" /></div>
 <div>
 <div className="font-bold text-slate-900">Device analytics</div>
 <div className="text-xs text-slate-500">Visitor breakdown</div>
 </div>
 </div>
 <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full">+18%</span>
 </div>
 <div className="space-y-3.5">
 {[
 { label: "Mobile", val: 68, icon: Smartphone, color: " " },
 { label: "Desktop", val: 24, icon: Monitor, color: " " },
 { label: "Tablet", val: 8, icon: Tablet, color: " " },
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
 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Top browsers</div>
 <div className="space-y-1.5">
 {[
 { label: "Chrome", val: "62%" },
 { label: "Safari", val: "21%" },
 { label: "Firefox", val: "9%" },
 { label: "Edge", val: "8%" },
 ].map((b) => (
 <div key={b.label} className="flex items-center gap-2 text-xs">
 <Globe className="w-3 h-3 text-slate-500" />
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
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center"><ShoppingBag className="w-4 h-4" /></div>
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
 <div className="w-9 h-9 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-slate-200 grid place-items-center text-slate-600 font-bold text-xs shrink-0">
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
 <div className="w-8 h-8 rounded-lg bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center"><Box className="w-4 h-4" /></div>
 <div>
 <div className="font-bold text-slate-900">Stock alerts</div>
 <div className="text-xs text-slate-500">Inactive products</div>
 </div>
 </div>
 <Link to="/admin/inventory" className="text-xs font-semibold text-slate-700 hover:text-slate-900">View</Link>
 </div>

 <div className="bg-white/70 backdrop-blur-md ring-1 ring-slate-200 border border-slate-200 rounded-xl p-4 mb-4 flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-slate-100 ring-1 ring-slate-200 text-slate-600 grid place-items-center shadow"><Box className="w-5 h-5" /></div>
 <div>
 <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Out of stock</div>
 <div className="text-2xl font-extrabold text-slate-900">{lowStock.length}</div>
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
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">OUT</span>
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
