import type * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Package, ShoppingBag, Tag, Users, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, ArrowUpRight, BadgeDollarSign, Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  full_name: string;
  email: string;
  payment_method: string;
  items: unknown;
};

type ProductRow = {
  slug: string;
  name: string;
  emoji: string;
  image_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
};

const statusMeta: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    cls: "bg-amber-500/15 text-amber-300 border-amber-400/30",     icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", cls: "bg-sky-500/15 text-sky-300 border-sky-400/30",            icon: <Loader2 className="w-3 h-3" /> },
  completed:  { label: "Completed",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled:  { label: "Cancelled",  cls: "bg-rose-500/15 text-rose-300 border-rose-400/30",         icon: <XCircle className="w-3 h-3" /> },
};

function fmtBDT(n: number) {
  return "৳" + Math.round(n).toLocaleString("en-IN");
}
function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function AdminDashboard() {
  const [counts, setCounts] = useState({ products: 0, orders: 0, promotions: 0, users: 0 });
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, o, pr, u, recentOrders, recentProducts] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("promotions").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("id,created_at,status,total,full_name,email,payment_method,items").order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("slug,name,emoji,image_url,category,is_active,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setCounts({
        products: p.count ?? 0,
        orders: o.count ?? 0,
        promotions: pr.count ?? 0,
        users: u.count ?? 0,
      });
      setOrders((recentOrders.data ?? []) as OrderRow[]);
      setProducts((recentProducts.data ?? []) as ProductRow[]);
      setLoading(false);
    })();
  }, []);

  const { revenue, todayRevenue, statusCounts } = useMemo(() => {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    let revenue = 0, todayRevenue = 0;
    const statusCounts: Record<string, number> = { pending: 0, processing: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      const t = Number(o.total) || 0;
      if (o.status !== "cancelled") revenue += t;
      if (new Date(o.created_at) >= startOfDay && o.status !== "cancelled") todayRevenue += t;
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    });
    return { revenue, todayRevenue, statusCounts };
  }, [orders]);

  const cards = [
    { label: "Total Revenue", value: fmtBDT(revenue), sub: `${fmtBDT(todayRevenue)} today`, icon: <BadgeDollarSign className="w-5 h-5" />, grad: "from-violet-500 to-fuchsia-500" },
    { label: "Orders", value: counts.orders, sub: `${statusCounts.pending ?? 0} pending`, icon: <ShoppingBag className="w-5 h-5" />, grad: "from-emerald-500 to-teal-500", to: "/admin/orders" },
    { label: "Products", value: counts.products, sub: "Active catalog", icon: <Package className="w-5 h-5" />, grad: "from-sky-500 to-indigo-500", to: "/admin/products" },
    { label: "Customers", value: counts.users, sub: `${counts.promotions} promotions`, icon: <Users className="w-5 h-5" />, grad: "from-rose-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-aurora">Dashboard</h1>
          <p className="text-sm text-white/60 mt-1">Welcome back — here's what's happening at AccessNow BD today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/orders" className="px-3 h-9 inline-flex items-center gap-1.5 rounded-full glass-soft text-xs font-semibold text-white/85 hover:text-white border border-white/10">
            View Orders <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/admin/products" className="px-3 h-9 inline-flex items-center gap-1.5 rounded-full btn-aurora text-xs">
            Manage Products <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl text-white grid place-items-center bg-gradient-to-br ${c.grad} shadow-lg`}>
                  {c.icon}
                </div>
                {c.to && <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />}
              </div>
              <div className="mt-4 text-2xl font-extrabold text-white tracking-tight">{loading ? "—" : c.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-white/50 mt-0.5">{c.label}</div>
              <div className="text-[11px] text-white/65 mt-1.5 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> {c.sub}</div>
            </>
          );
          return c.to ? (
            <Link key={c.label} to={c.to} className="group gradient-border-card p-4 block">{inner}</Link>
          ) : (
            <div key={c.label} className="gradient-border-card p-4">{inner}</div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent orders */}
        <div className="lg:col-span-2 gradient-border-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-violet-300" /> Recent Orders</h2>
            <Link to="/admin/orders" className="text-[11px] text-violet-300 hover:text-violet-200 font-semibold">View all →</Link>
          </div>
          {loading ? (
            <div className="text-sm text-white/50 py-8 text-center">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-white/50 py-8 text-center">No orders yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {orders.map((o) => {
                const meta = statusMeta[o.status] ?? statusMeta.pending;
                const itemCount = Array.isArray(o.items) ? o.items.length : 0;
                return (
                  <Link
                    key={o.id}
                    to="/admin/orders"
                    className="flex items-center gap-3 py-3 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 grid place-items-center text-xs font-bold text-white border border-white/10">
                      {(o.full_name || o.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{o.full_name || o.email}</div>
                      <div className="text-[11px] text-white/50 truncate">
                        {itemCount} item{itemCount === 1 ? "" : "s"} · {o.payment_method} · {timeAgo(o.created_at)}
                      </div>
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.cls}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <div className="text-sm font-extrabold text-aurora-strong tabular-nums">{fmtBDT(Number(o.total) || 0)}</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Status breakdown + recent products */}
        <div className="space-y-5">
          <div className="gradient-border-card p-5">
            <h2 className="font-bold text-white mb-4">Order Status</h2>
            <div className="space-y-2.5">
              {Object.entries(statusMeta).map(([key, meta]) => {
                const c = statusCounts[key] ?? 0;
                const total = Math.max(1, orders.length);
                const pct = Math.round((c / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="inline-flex items-center gap-1 text-white/80 font-semibold">{meta.icon} {meta.label}</span>
                      <span className="text-white/60 tabular-nums">{c}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${meta.cls.split(" ")[0]} bg-gradient-to-r from-current to-current opacity-80`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gradient-border-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white">New Products</h2>
              <Link to="/admin/products" className="text-[11px] text-violet-300 font-semibold">Manage →</Link>
            </div>
            {loading ? (
              <div className="text-sm text-white/50 py-6 text-center">Loading…</div>
            ) : products.length === 0 ? (
              <div className="text-sm text-white/50 py-6 text-center">No products yet.</div>
            ) : (
              <ul className="space-y-2.5">
                {products.map((p) => (
                  <li key={p.slug} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/8 border border-white/10 grid place-items-center overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="max-h-[70%] max-w-[80%] object-contain" loading="lazy" />
                      ) : (
                        <span className="text-base">{p.emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                      <div className="text-[10px] text-white/50 truncate">{p.category}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${p.is_active ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" : "bg-white/5 text-white/50 border-white/10"}`}>
                      {p.is_active ? "Live" : "Hidden"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/products" className="group gradient-border-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 grid place-items-center text-white"><Package className="w-5 h-5" /></div>
          <div className="flex-1"><div className="text-sm font-bold text-white">Add a product</div><div className="text-[11px] text-white/55">Create with plans, badge & gradient</div></div>
          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white" />
        </Link>
        <Link to="/admin/orders" className="group gradient-border-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white"><ShoppingBag className="w-5 h-5" /></div>
          <div className="flex-1"><div className="text-sm font-bold text-white">Process orders</div><div className="text-[11px] text-white/55">Update status & view receipts</div></div>
          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white" />
        </Link>
        <Link to="/admin" className="group gradient-border-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white"><Tag className="w-5 h-5" /></div>
          <div className="flex-1"><div className="text-sm font-bold text-white">Promotions</div><div className="text-[11px] text-white/55">{counts.promotions} active campaigns</div></div>
          <ArrowUpRight className="w-4 h-4 text-white/40 group-hover:text-white" />
        </Link>
      </div>
    </div>
  );
}
