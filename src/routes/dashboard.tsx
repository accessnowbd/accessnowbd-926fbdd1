import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Package,
  Clock,
  CheckCircle2,
  Wallet,
  User as UserIcon,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "My Dashboard — AccessNow BD" },
      { name: "description", content: "আপনার অর্ডার, প্রোফাইল এবং সাবস্ক্রিপশন এক জায়গায় ম্যানেজ করুন।" },
    ],
  }),
});

type OrderItem = { slug: string; planPeriod: string; qty: number; name?: string; emoji?: string; gradient?: string; price?: number };
type Order = {
  id: string;
  full_name: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
};

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!user) return;
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle(),
    ]).then(([o, p]) => {
      setOrders(((o.data as unknown) as Order[]) || []);
      setProfile((p.data as { display_name?: string | null; phone?: string | null } | null) || null);
      setLoading(false);
    });
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    return { total, pending, delivered, spent };
  }, [orders]);

  const greetingName = profile?.display_name || user?.email?.split("@")[0] || "Friend";

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const recent = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-[1200px] px-4 md:px-10 py-8 md:py-12">
        {/* Hero / greeting */}
        <section className="relative overflow-hidden rounded-3xl glass-strong p-6 md:p-10 border border-[var(--glass-border)]">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{ background: "var(--gradient-aurora)" }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full glass text-primary-foreground/90 border border-white/15">
                <Sparkles className="w-3.5 h-3.5" /> Welcome back
              </div>
              <h1
                className="mt-3 text-primary-foreground"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, lineHeight: 1.1 }}
              >
                হ্যালো, {greetingName} 👋
              </h1>
              <p className="mt-2 text-sm md:text-base text-primary-foreground/80 max-w-xl">
                আপনার সব subscription, order এবং profile এক জায়গায়। নিচে আপনার সাম্প্রতিক কার্যকলাপ দেখুন।
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-primary text-sm font-semibold hover:scale-[1.02] transition shadow-[var(--shadow-glow)]"
              >
                <ShoppingBag className="w-4 h-4" /> Browse subscriptions
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full glass border border-white/15 text-primary-foreground text-sm font-semibold hover:bg-white/10 transition"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={<Package className="w-5 h-5" />} label="Total orders" value={String(stats.total)} accent="from-primary/30 to-primary/5" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="In progress" value={String(stats.pending)} accent="from-amber-400/30 to-amber-400/5" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Delivered" value={String(stats.delivered)} accent="from-emerald-400/30 to-emerald-400/5" />
          <StatCard icon={<Wallet className="w-5 h-5" />} label="Total spent" value={`৳${stats.spent.toLocaleString()}`} accent="from-cyan-400/30 to-cyan-400/5" />
        </section>

        <div className="mt-6 grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Recent orders */}
          <section className="lg:col-span-2 glass-strong rounded-3xl p-5 md:p-6 border border-[var(--glass-border)]">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Recent orders
              </h2>
              <Link to="/orders" className="text-xs text-primary font-semibold inline-flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </header>

            {recent.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--glass-border)] p-10 text-center">
                <Package className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">এখনো কোন order নেই।</p>
                <Link to="/products" className="inline-block mt-4 h-10 leading-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  Start shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link
                      to="/orders/$id"
                      params={{ id: o.id }}
                      className="flex items-center gap-3 p-3 rounded-2xl glass border border-[var(--glass-border)] hover:border-primary/40 hover:-translate-y-0.5 transition"
                    >
                      <div className="w-11 h-11 rounded-xl grid place-items-center text-lg" style={{ background: "var(--gradient-violet)" }}>
                        {o.items?.[0]?.emoji ?? "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {o.items?.[0]?.name ?? o.items?.[0]?.slug ?? "Order"}
                          {o.items.length > 1 && <span className="text-muted-foreground font-normal"> +{o.items.length - 1} more</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()} · #{o.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                          ৳{Number(o.total).toLocaleString()}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${statusColors[o.status] || "bg-secondary/30 text-foreground border-border"}`}>
                          {o.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Side panel: Profile + quick links */}
          <aside className="space-y-4">
            <div className="glass-strong rounded-3xl p-5 md:p-6 border border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full grid place-items-center text-white font-bold text-lg" style={{ background: "var(--gradient-aurora)" }}>
                  {greetingName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate" style={{ fontFamily: "var(--font-heading)" }}>
                    {profile?.display_name || "Add your name"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{profile?.phone || "—"}</span>
                </div>
              </div>
              <Link
                to="/profile"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
              >
                <UserIcon className="w-4 h-4" /> Edit profile
              </Link>
            </div>

            <div className="glass-strong rounded-3xl p-5 md:p-6 border border-[var(--glass-border)]">
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Quick links
              </h3>
              <div className="grid gap-2">
                <QuickLink to="/cart" icon={<ShoppingBag className="w-4 h-4" />} label="My cart" />
                <QuickLink to="/orders" icon={<Package className="w-4 h-4" />} label="All orders" />
                <QuickLink to="/contact" icon={<LifeBuoy className="w-4 h-4" />} label="Support" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden glass-strong rounded-2xl p-4 md:p-5 border border-[var(--glass-border)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 pointer-events-none`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className="mt-1 text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {value}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl glass grid place-items-center text-primary">{icon}</div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: "/cart" | "/orders" | "/contact"; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-3 rounded-xl glass border border-[var(--glass-border)] hover:border-primary/40 transition group"
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
