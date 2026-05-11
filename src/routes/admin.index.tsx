import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus, ShoppingBag, DollarSign, BarChart3, Users, Box, Settings,
  CheckCircle2, AlertTriangle, ChevronRight,
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
        supabase.from("orders").select("id,created_at,status,total,full_name,email,payment_method,items").order("created_at", { ascending: false }).limit(50),
        supabase.from("products").select("slug,name,emoji,image_url,category,is_active,created_at").order("created_at", { ascending: false }).limit(50),
      ]);
      setCounts({ products: pAll.count ?? 0, orders: oAll.count ?? 0, users: uAll.count ?? 0 });
      setOrders((recentOrders.data ?? []) as OrderRow[]);
      setProducts((recentProducts.data ?? []) as ProductRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let revenue = 0, todayRev = 0, monthRev = 0, todayCount = 0, monthCount = 0;
    orders.forEach((o) => {
      const t = Number(o.total) || 0;
      const d = new Date(o.created_at);
      if (o.status !== "cancelled") revenue += t;
      if (d >= start && o.status !== "cancelled") { todayRev += t; todayCount++; }
      if (d >= monthStart && o.status !== "cancelled") { monthRev += t; monthCount++; }
    });
    return { revenue, todayRev, monthRev, todayCount, monthCount };
  }, [orders]);

  const cards = [
    { label: "Total revenue", value: fmtBDT(stats.revenue), sub: `${counts.orders} orders`, icon: <DollarSign className="w-4 h-4" />, grad: "from-emerald-100 to-emerald-50", iconBg: "bg-emerald-500" },
    { label: "Today's sales", value: fmtBDT(stats.todayRev), sub: `${stats.todayCount} orders`, icon: <ShoppingBag className="w-4 h-4" />, grad: "from-amber-100 to-amber-50", iconBg: "bg-amber-500" },
    { label: "This month", value: fmtBDT(stats.monthRev), sub: `${stats.monthCount} orders`, icon: <BarChart3 className="w-4 h-4" />, grad: "from-violet-100 to-violet-50", iconBg: "bg-violet-500" },
    { label: "Customers", value: counts.users, sub: `${counts.products} products`, icon: <Users className="w-4 h-4" />, grad: "from-sky-100 to-sky-50", iconBg: "bg-sky-500" },
  ];

  // Stock alerts: products with no active flag treat as out
  const lowStock = products.filter((p) => !p.is_active);
  const topItems = useMemo(() => {
    // aggregate items from orders
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

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">Dashboard</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mt-3">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/add-product" className="h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50">
              <Plus className="w-4 h-4" /> Add product
            </Link>
            <Link to="/admin/orders" className="h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-800">
              <ShoppingBag className="w-4 h-4" /> View orders
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="text-xs text-slate-500 font-medium">{c.label}</div>
              <div className={`w-8 h-8 rounded-lg ${c.iconBg} text-white grid place-items-center`}>{c.icon}</div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">{loading ? "—" : c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Stock alerts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center text-slate-600"><Box className="w-4 h-4" /></div>
            <div>
              <div className="font-bold text-slate-900">Stock alerts</div>
              <div className="text-xs text-slate-500">Threshold ≤ 3</div>
            </div>
          </div>
          <Link to="/admin/inventory" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
            <Settings className="w-3.5 h-3.5" /> View all
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <Box className="w-5 h-5 text-amber-600" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Low stock</div>
            <div className="text-2xl font-extrabold text-amber-900">{lowStock.length}</div>
          </div>
        </div>

        <div className="space-y-2">
          {lowStock.slice(0, 6).map((p) => (
            <div key={p.slug} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50">
              <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center overflow-hidden shrink-0">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="max-h-[80%] max-w-[80%] object-contain" /> : <span>{p.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500">Out of stock</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">OUT</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            </div>
          ))}
          {lowStock.length === 0 && !loading && (
            <div className="text-sm text-slate-500 text-center py-6">No stock alerts.</div>
          )}
          {lowStock.length > 6 && (
            <div className="text-center text-xs text-slate-500 pt-2">+{lowStock.length - 6} আরও দেখুন</div>
          )}
        </div>
      </div>

      {/* Top selling */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-slate-900">Top selling products</div>
          <div className="text-xs text-slate-500">This month</div>
        </div>
        {topItems.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">No sales data yet.</div>
        ) : (
          <div className="space-y-1">
            {topItems.map((it, i) => (
              <div key={it.name} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50">
                <div className="w-6 text-sm font-bold text-slate-400 text-center">{i + 1}</div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 grid place-items-center overflow-hidden shrink-0">
                  {it.image ? <img src={it.image} alt={it.name} className="max-h-[80%] max-w-[80%] object-contain" /> : <Box className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{it.name}</div>
                  <div className="text-[11px] text-slate-500">{it.sold} sold</div>
                </div>
                <div className="text-sm font-extrabold text-slate-900 tabular-nums">{fmtBDT(it.revenue)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-slate-900">Recent orders</div>
          <Link to="/admin/orders" className="text-xs font-semibold text-slate-700 inline-flex items-center gap-1 hover:text-slate-900">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="text-sm text-slate-500 text-center py-6">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-6">No orders yet.</div>
        ) : (
          <div className="space-y-1">
            {orders.slice(0, 5).map((o) => (
              <Link key={o.id} to="/admin/orders" className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">RxB-{o.id.slice(0, 6).toUpperCase()}</div>
                  <div className="text-[11px] text-slate-500 truncate">{o.full_name || o.email}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {o.status === "completed" ? "Completed" : o.status}
                </span>
                <div className="text-sm font-extrabold text-slate-900 tabular-nums">{fmtBDT(Number(o.total) || 0)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
