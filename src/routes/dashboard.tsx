import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Package, Clock, Wallet, User as UserIcon, ShoppingBag,
  ArrowRight, Sparkles, LifeBuoy, LogOut, LayoutDashboard,
  KeyRound, Receipt, Bell, MessageSquare,
  Menu, ChevronDown, X, Plus, Download,
  FileText, Mail, Phone, MapPin, Hash, Copy, Check, Zap, Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "User Dashboard — AccessNow BD" },
      { name: "description", content: "আপনার অর্ডার, প্রোফাইল ও সব কিছু এক জায়গায়।" },
    ],
  }),
});

type OrderItem = { slug: string; planPeriod: string; qty: number; name?: string; emoji?: string; price?: number };
type Order = {
  id: string; full_name: string; email: string; items: OrderItem[];
  total: number; status: string; payment_method: string; created_at: string;
};

type SectionId =
  | "overview"
  | "profile" | "edit-profile"
  | "orders" | "active-services" | "expired" | "downloads" | "licenses"
  | "open-ticket" | "my-tickets";

const statusColors: Record<string, string> = {
  pending: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  processing: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  delivered: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  cancelled: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

type NavItem = { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { title: "Main", items: [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { title: "Account", items: [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "edit-profile", label: "Edit Profile", icon: FileText },
  ]},
  { title: "Orders & Services", items: [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "active-services", label: "Active Services", icon: Zap },
    { id: "expired", label: "Expired Services", icon: Clock },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "licenses", label: "License Keys", icon: KeyRound },
  ]},
  { title: "Support", items: [
    { id: "open-ticket", label: "Open Ticket", icon: LifeBuoy },
    { id: "my-tickets", label: "My Tickets", icon: MessageSquare },
  ]},
];

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    let cancelled = false;
    setLoading(true);
    const t0 = performance.now();
    const mark = (label: string, start: number) => {
      const ms = Math.round(performance.now() - start);
      const tag = ms > 1500 ? "🐢 SLOW" : ms > 600 ? "⚠️" : "✅";
      console.info(`[dashboard-perf] ${tag} ${label}: ${ms}ms`);
      return ms;
    };

    const tOrders = performance.now();
    const ordersP = supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then((r) => { mark("orders fetch", tOrders); return r; });

    const tProfile = performance.now();
    const profileP = supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle()
      .then((r) => { mark("profile fetch", tProfile); return r; });

    const roleP = supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();

    Promise.all([ordersP, profileP, roleP])
      .then(([o, p, r]) => {
        if (cancelled) return;
        setOrders(((o.data as unknown) as Order[]) || []);
        setProfile((p.data as { display_name?: string | null; phone?: string | null } | null) || null);
        setIsAdmin(!!r.data);
      })
      .catch((err) => {
        console.error("[dashboard-perf] ❌ load failed after", Math.round(performance.now() - t0), "ms", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        mark("TOTAL dashboard load", t0);
      });
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total || 0), 0);
    return { total, pending, delivered, spent };
  }, [orders]);

  const greetingName = profile?.display_name || user?.email?.split("@")[0] || "Friend";
  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentLabel = NAV.flatMap((g) => g.items).find((i) => i.id === section)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col glass-strong border-r border-[var(--glass-border)]">
          <div className="px-5 py-5 flex items-center justify-between border-b border-[var(--glass-border)]">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl grid place-items-center text-white font-bold" style={{ background: "var(--gradient-aurora)" }}>
                A
              </div>
              <div>
                <div className="text-sm font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>AccessNow BD</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">User Panel</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
            {NAV.map((group) => (
              <div key={group.title}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((it) => {
                    const Icon = it.icon;
                    const active = section === it.id;
                    return (
                      <button
                        key={it.id}
                        onClick={() => { setSection(it.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition group ${
                          active
                            ? "bg-primary/15 text-primary border border-primary/40 shadow-[0_0_20px_-5px_var(--primary)]"
                            : "text-foreground hover:text-primary hover:bg-primary/10 border border-transparent"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                        <span className="font-medium">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-[var(--glass-border)] space-y-2">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.55)]"
                style={{ background: "var(--gradient-aurora)" }}
              >
                <Shield className="w-4 h-4" /> Admin Panel
              </Link>
            )}
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 glass-strong border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3 px-4 md:px-6 h-16">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{currentLabel}</span>
            </div>
            <div className="flex-1" />
            <button className="relative w-9 h-9 rounded-full glass border border-[var(--glass-border)] grid place-items-center hover:border-primary/40">
              <Bell className="w-4 h-4" />
            </button>
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 pl-1 pr-3 h-9 rounded-full glass border border-[var(--glass-border)] hover:border-primary/40">
                <div className="w-7 h-7 rounded-full grid place-items-center text-white text-xs font-bold" style={{ background: "var(--gradient-aurora)" }}>
                  {greetingName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{greetingName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {userMenu && (
                <div onMouseLeave={() => setUserMenu(false)} className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl border border-[var(--glass-border)] p-2 shadow-2xl">
                  <UserMenuItem icon={<UserIcon className="w-4 h-4" />} label="My Profile" onClick={() => { setSection("profile"); setUserMenu(false); }} />
                  <UserMenuItem icon={<Package className="w-4 h-4" />} label="My Orders" onClick={() => { setSection("orders"); setUserMenu(false); }} />
                  <UserMenuItem icon={<LifeBuoy className="w-4 h-4" />} label="Support" onClick={() => { setSection("open-ticket"); setUserMenu(false); }} />
                  {isAdmin && (
                    <>
                      <div className="my-1 h-px bg-[var(--glass-border)]" />
                      <Link to="/admin" onClick={() => setUserMenu(false)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    </>
                  )}
                  <div className="my-1 h-px bg-[var(--glass-border)]" />
                  <UserMenuItem icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={handleSignOut} danger />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8">
          <SectionRenderer
            section={section}
            stats={stats}
            orders={orders}
            greetingName={greetingName}
            user={user}
            profile={profile}
            onNavigate={setSection}
          />
        </div>

        <footer className="px-6 py-5 border-t border-[var(--glass-border)] text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 AccessNow BD. All Rights Reserved.</span>
          <div className="flex gap-4">
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function UserMenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${danger ? "text-red-300 hover:bg-red-500/10" : "hover:bg-white/5"}`}>
      {icon} {label}
    </button>
  );
}

/* ===================== SECTION RENDERER ===================== */
function SectionRenderer({
  section, stats, orders, greetingName, user, profile, onNavigate,
}: {
  section: SectionId;
  stats: { total: number; pending: number; delivered: number; spent: number };
  orders: Order[];
  greetingName: string;
  user: { email?: string; id?: string } | null;
  profile: { display_name?: string | null; phone?: string | null } | null;
  onNavigate: (s: SectionId) => void;
}) {
  switch (section) {
    case "overview": return <Overview stats={stats} orders={orders} greetingName={greetingName} onNavigate={onNavigate} />;
    case "profile": return <ProfileView user={user} profile={profile} />;
    case "edit-profile": return <EditProfile profile={profile} />;
    case "orders": return <OrdersTable orders={orders} />;
    case "active-services": return <ServiceList kind="active" />;
    case "expired": return <ServiceList kind="expired" />;
    case "downloads": return <Downloads />;
    case "licenses": return <Licenses />;
    case "open-ticket": return <OpenTicket />;
    case "my-tickets": return <MyTickets />;
    default: return null;
  }
}

/* ===================== SHARED PRIMITIVES ===================== */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-strong rounded-3xl p-5 md:p-6 border border-[var(--glass-border)] ${className}`}>{children}</div>;
}
function PageHead({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
        {desc && <p className="text-sm text-muted-foreground mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden glass-strong rounded-2xl p-4 md:p-5 border border-[var(--glass-border)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-60 pointer-events-none`} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
          <div className="mt-1 text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{value}</div>
        </div>
        <div className="w-10 h-10 rounded-xl glass grid place-items-center text-primary">{icon}</div>
      </div>
    </div>
  );
}
function Empty({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--glass-border)] p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl glass grid place-items-center text-muted-foreground">{icon}</div>
      <p className="mt-3 text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}
function Badge({ children, color = "primary" }: { children: React.ReactNode; color?: "primary" | "success" | "warn" | "danger" | "muted" }) {
  const c = {
    primary: "bg-primary/15 text-primary border-primary/30",
    success: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    warn: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    danger: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    muted: "bg-white/5 text-muted-foreground border-[var(--glass-border)]",
  }[color];
  return <span className={`inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${c}`}>{children}</span>;
}
function Btn({ children, onClick, variant = "primary", className = "", type = "button" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline"; className?: string; type?: "button" | "submit" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    ghost: "glass border border-[var(--glass-border)] hover:border-primary/40",
    outline: "border border-primary/40 text-primary hover:bg-primary/10",
  }[variant];
  return <button type={type} onClick={onClick} className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full text-sm font-semibold transition ${v} ${className}`}>{children}</button>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full h-11 px-4 rounded-xl glass border border-[var(--glass-border)] outline-none text-sm focus:border-primary/50 ${props.className ?? ""}`} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full p-4 rounded-xl glass border border-[var(--glass-border)] outline-none text-sm focus:border-primary/50 ${props.className ?? ""}`} />;
}

/* ===================== OVERVIEW ===================== */
function Overview({ stats, orders, greetingName, onNavigate }: { stats: { total: number; pending: number; delivered: number; spent: number }; orders: Order[]; greetingName: string; onNavigate: (s: SectionId) => void }) {
  const recent = orders.slice(0, 5);
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl glass-strong p-6 md:p-10 border border-[var(--glass-border)]">
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "var(--gradient-aurora)" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full glass text-primary-foreground/90 border border-white/15">
              <Sparkles className="w-3.5 h-3.5" /> Welcome back
            </div>
            <h1 className="mt-3 text-primary-foreground" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, lineHeight: 1.1 }}>
              Welcome Back, {greetingName} 👋
            </h1>
            <p className="mt-2 text-sm md:text-base text-primary-foreground/80 max-w-xl">
              Manage your account, services and orders from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/products" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-primary text-sm font-semibold hover:scale-[1.02] transition shadow-[var(--shadow-glow)]">
              <ShoppingBag className="w-4 h-4" /> Buy Service
            </Link>
            <button onClick={() => onNavigate("open-ticket")} className="inline-flex items-center gap-2 h-11 px-5 rounded-full glass border border-white/15 text-primary-foreground text-sm font-semibold hover:bg-white/10 transition">
              <LifeBuoy className="w-4 h-4" /> Open Ticket
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat icon={<Package className="w-5 h-5" />} label="Total Orders" value={String(stats.total)} accent="from-primary/30 to-primary/5" />
        <Stat icon={<Zap className="w-5 h-5" />} label="Active Services" value={String(stats.pending + stats.delivered)} accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Receipt className="w-5 h-5" />} label="Total Spent" value={`৳${stats.spent.toLocaleString()}`} accent="from-violet-400/30 to-violet-400/5" />
        <Stat icon={<Download className="w-5 h-5" />} label="Downloads" value="—" accent="from-pink-400/30 to-pink-400/5" />
      </section>

      <Card>
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Recent Orders</h2>
          <button onClick={() => onNavigate("orders")} className="text-xs text-primary font-semibold inline-flex items-center gap-1 hover:underline">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </header>
        {recent.length === 0 ? (
          <Empty icon={<Package className="w-6 h-6" />} msg="এখনো কোন order নেই।" />
        ) : (
          <ul className="space-y-3">
            {recent.map((o) => (
              <li key={o.id}>
                <Link to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 p-3 rounded-2xl glass border border-[var(--glass-border)] hover:border-primary/40 hover:-translate-y-0.5 transition">
                  <div className="w-11 h-11 rounded-xl grid place-items-center text-lg" style={{ background: "var(--gradient-violet)" }}>
                    {o.items?.[0]?.emoji ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {o.items?.[0]?.name ?? o.items?.[0]?.slug ?? "Order"}
                      {o.items.length > 1 && <span className="text-muted-foreground font-normal"> +{o.items.length - 1} more</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · #{o.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>৳{Number(o.total).toLocaleString()}</div>
                    <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${statusColors[o.status] || "bg-secondary/30 text-foreground border-border"}`}>{o.status}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ===================== PROFILE ===================== */
function ProfileView({ user, profile }: { user: { email?: string; id?: string } | null; profile: { display_name?: string | null; phone?: string | null } | null }) {
  return (
    <div className="space-y-6">
      <PageHead title="My Profile" desc="Your personal information" />
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-20 h-20 rounded-2xl grid place-items-center text-white text-2xl font-bold" style={{ background: "var(--gradient-aurora)" }}>
            {(profile?.display_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{profile?.display_name || "Not set"}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-2 flex gap-2">
              <Badge color="success">Email Verified</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Personal Information</h3>
        <div className="space-y-3 text-sm">
          <Row icon={<UserIcon className="w-4 h-4" />} label="Full Name" value={profile?.display_name || "—"} />
          <Row icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email || "—"} />
          <Row icon={<Phone className="w-4 h-4" />} label="Phone" value={profile?.phone || "—"} />
          <Row icon={<MapPin className="w-4 h-4" />} label="Country" value="Bangladesh" />
          <Row icon={<Hash className="w-4 h-4" />} label="User ID" value={user?.id?.slice(0, 12) + "..." || "—"} />
        </div>
      </Card>
    </div>
  );
}
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass border border-[var(--glass-border)]">
      <span className="inline-flex items-center gap-2 text-muted-foreground"><span className="text-primary">{icon}</span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EditProfile({ profile }: { profile: { display_name?: string | null; phone?: string | null } | null }) {
  return (
    <div className="space-y-6">
      <PageHead title="Edit Profile" desc="Update your personal information" />
      <Card>
        <form className="grid md:grid-cols-2 gap-4">
          <Field label="Full Name"><Input defaultValue={profile?.display_name || ""} placeholder="Your name" /></Field>
          <Field label="Phone"><Input defaultValue={profile?.phone || ""} placeholder="+880 1XXX-XXXXXX" /></Field>
          <Field label="Country"><Input defaultValue="Bangladesh" /></Field>
          <div />
          <div className="md:col-span-2"><Field label="Address"><Textarea rows={3} placeholder="Street, City, Postal Code" /></Field></div>
          <div className="md:col-span-2 flex gap-3">
            <Btn variant="primary">Save Changes</Btn>
            <Btn variant="ghost">Cancel</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ===================== ORDERS / SERVICES ===================== */
function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6">
      <PageHead title="My Orders" desc="All your purchases" action={<Link to="/products"><Btn variant="primary"><Plus className="w-4 h-4" />New Order</Btn></Link>} />
      <Card>
        {orders.length === 0 ? (
          <Empty icon={<Package className="w-6 h-6" />} msg="এখনো কোন order নেই।" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-[var(--glass-border)]">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Product</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[var(--glass-border)]/50 hover:bg-white/5">
                    <td className="py-3 px-2 font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 px-2">{o.items?.[0]?.name ?? o.items?.[0]?.slug ?? "—"}</td>
                    <td className="py-3 px-2 font-bold text-primary">৳{Number(o.total).toLocaleString()}</td>
                    <td className="py-3 px-2"><span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${statusColors[o.status] || "border-border"}`}>{o.status}</span></td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2"><Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ServiceList({ kind }: { kind: "active" | "expired" }) {
  const items = kind === "active"
    ? [
        { n: "Netflix Premium", e: "15 Dec 2026", u: "78%" },
        { n: "Spotify Family", e: "22 Jan 2027", u: "45%" },
        { n: "ChatGPT Plus", e: "8 Feb 2027", u: "92%" },
      ]
    : [
        { n: "Disney+", e: "10 Oct 2026", u: "—" },
        { n: "Canva Pro", e: "5 Sep 2026", u: "—" },
      ];
  return (
    <div className="space-y-6">
      <PageHead title={kind === "active" ? "Active Services" : "Expired Services"} desc={kind === "active" ? "Currently running subscriptions" : "Subscriptions that need renewal"} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Card key={it.n}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{it.n}</div>
              <Badge color={kind === "active" ? "success" : "danger"}>{kind === "active" ? "Active" : "Expired"}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Expiry: {it.e}</div>
            {kind === "active" && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">Usage: {it.u}</div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: it.u, background: "var(--gradient-aurora)" }} />
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Btn variant="primary" className="!h-9 !px-4 text-xs flex-1">{kind === "active" ? "Manage" : "Renew"}</Btn>
              <Btn variant="ghost" className="!h-9 !px-4 text-xs">Details</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Downloads() {
  const files = [
    { n: "License-NF-2026.pdf", s: "120 KB" },
    { n: "Invoice-1284.pdf", s: "88 KB" },
    { n: "Setup-guide.zip", s: "2.4 MB" },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="Downloads" desc="All your downloadable files" />
      <Card>
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.n} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
              <FileText className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{f.n}</div>
                <div className="text-xs text-muted-foreground">{f.s}</div>
              </div>
              <Btn variant="outline" className="!h-9 !px-4 text-xs"><Download className="w-3.5 h-3.5" />Download</Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Licenses() {
  const keys = [
    { p: "Netflix Premium", k: "NFLX-XXXX-YYYY-ZZZZ-2026" },
    { p: "Adobe CC", k: "ADBE-AAAA-BBBB-CCCC-2027" },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="License Keys" desc="Your purchased license keys" />
      <Card>
        <div className="space-y-2">
          {keys.map((k) => <CopyRow key={k.p} label={k.p} value={k.k} />)}
        </div>
      </Card>
    </div>
  );
}
function CopyRow({ label, value }: { label: string; value: string }) {
  const [c, setC] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
      <KeyRound className="w-4 h-4 text-primary" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setC(true); setTimeout(() => setC(false), 1500); }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
        {c ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
      </button>
    </div>
  );
}

/* ===================== SUPPORT ===================== */
function OpenTicket() {
  return (
    <div className="space-y-6">
      <PageHead title="Open Support Ticket" desc="We'll get back to you ASAP" />
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Subject"><Input placeholder="Issue summary" /></Field>
          <Field label="Category">
            <select className="w-full h-11 px-4 rounded-xl glass border border-[var(--glass-border)] outline-none text-sm">
              <option>General</option><option>Billing</option><option>Technical</option><option>Refund</option>
            </select>
          </Field>
          <div className="md:col-span-2"><Field label="Message"><Textarea rows={6} placeholder="Describe your issue..." /></Field></div>
          <div className="md:col-span-2"><Btn variant="primary">Submit Ticket</Btn></div>
        </div>
      </Card>
    </div>
  );
}
function MyTickets() {
  const ts = [{ id: "T-1234", s: "Login issue", st: "open" as const }, { id: "T-1230", s: "Payment failed", st: "answered" as const }];
  return (
    <div className="space-y-6">
      <PageHead title="My Tickets" desc="Your support history" />
      <Card>
        <div className="space-y-2">
          {ts.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{t.s}</div>
                <div className="text-xs text-muted-foreground">{t.id}</div>
              </div>
              <Badge color={t.st === "open" ? "warn" : "success"}>{t.st}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
