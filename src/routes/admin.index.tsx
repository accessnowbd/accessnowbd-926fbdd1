import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, ShoppingBag, Tag, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, promotions: 0, users: 0 });

  useEffect(() => {
    (async () => {
      const [p, o, pr, u] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("promotions").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        products: p.count ?? 0,
        orders: o.count ?? 0,
        promotions: pr.count ?? 0,
        users: u.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, icon: <Package className="w-5 h-5" />, color: "from-blue-500 to-indigo-500" },
    { label: "Orders", value: stats.orders, icon: <ShoppingBag className="w-5 h-5" />, color: "from-emerald-500 to-teal-500" },
    { label: "Promotions", value: stats.promotions, icon: <Tag className="w-5 h-5" />, color: "from-amber-500 to-orange-500" },
    { label: "Users", value: stats.users, icon: <Users className="w-5 h-5" />, color: "from-pink-500 to-rose-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Overview of your store.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-border rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-lg text-white grid place-items-center bg-gradient-to-br ${c.color}`}>
              {c.icon}
            </div>
            <div className="mt-3 text-2xl font-semibold">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white border border-border rounded-2xl p-6">
        <h2 className="font-semibold">Welcome to the Admin Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use the sidebar to manage products, promotions, orders, and users. Full CRUD interfaces will appear here.
        </p>
      </div>
    </div>
  );
}
