import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Package, Wallet, User as UserIcon, ShoppingBag,
  ArrowRight, Sparkles, LifeBuoy, LogOut,
  KeyRound, Receipt, Bell, MessageSquare,
  Menu, X, Plus, Download,
  FileText, Mail, Phone, MapPin, Hash, Copy, Check, Shield,
  Heart, Users, Globe, MapPinned, Smartphone, ChevronRight, Gift,
  Lock, AtSign, BadgeCheck, Bookmark, CreditCard, Star, Edit3, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { rememberReturnTo } from "@/lib/auth-return-to";

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
  | "profile" | "edit-profile" | "addresses" | "security"
  | "orders" | "licenses" | "downloads" | "subscriptions" | "wishlist" | "notifications"
  | "wallet" | "points" | "referral"
  | "language" | "install-app"
  | "active-services" | "expired" | "open-ticket" | "my-tickets";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
  processing: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
};

type NavItem = {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "ACCOUNT",
    items: [
      { id: "profile", label: "Profile", icon: UserIcon },
      { id: "addresses", label: "Addresses", icon: MapPinned },
      { id: "security", label: "Security", icon: Lock },
    ],
  },
  {
    title: "ACTIVITY",
    items: [
      { id: "orders", label: "My Orders", icon: Package },
      { id: "licenses", label: "My Licenses", icon: KeyRound },
      { id: "downloads", label: "Downloads", icon: Download },
      { id: "subscriptions", label: "Subscriptions", icon: RefreshIcon },
      { id: "wishlist", label: "Wishlist", icon: Heart },
      { id: "notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "REWARDS",
    items: [
      { id: "wallet", label: "Wallet", icon: Wallet },
      { id: "points", label: "Points", icon: Star },
      { id: "referral", label: "Referral", icon: Share2Icon },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { id: "language", label: "Language", icon: Globe },
      { id: "install-app", label: "Install App", icon: Smartphone },
    ],
  },
];

// inline icon aliases to avoid extra imports
function RefreshIcon(props: { className?: string }) {
  return <Bookmark {...props} />;
}
function Share2Icon(props: { className?: string }) {
  return <Users {...props} />;
}

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { rememberReturnTo(); navigate({ to: "/login" }); return; }
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

  const stats4 = {
    orders: stats.total,
    spent: stats.spent,
    wishlist: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground" aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl grid place-items-center text-primary-foreground font-bold text-sm" style={{ background: "var(--gradient-aurora, linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef))" }}>
              A
            </div>
            <span className="text-sm font-bold text-foreground">My Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* TOP WELCOME CARD — gradient border */}
        <WelcomeCard greetingName={greetingName} email={user?.email ?? ""} stats={stats4} />

        {/* WELCOME GIFT BANNER */}
        <GiftBanner onClaim={() => navigate({ to: "/wallet" })} />

        {/* LAYOUT: sidebar + main */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky lg:top-6 inset-y-0 left-0 z-40 w-[300px] lg:w-auto transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="h-full lg:h-auto lg:max-h-[calc(100vh-3rem)] overflow-y-auto bg-card border border-border lg:rounded-3xl shadow-sm">
              <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border">
                <span className="text-sm font-bold text-foreground">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="px-3 pb-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">{group.title}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((it) => {
                        const Icon = it.icon;
                        const active = section === it.id;
                        return (
                          <button
                            key={it.id}
                            onClick={() => { setSection(it.id); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition ${
                              active
                                ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                                : "text-foreground/85 hover:bg-accent/60 font-medium"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                            <span>{it.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bottom CTA buttons */}
                <div className="pt-3 border-t border-border space-y-2">
                  <button
                    onClick={() => setSection("referral")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold text-primary-foreground shadow-md"
                    style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }}
                  >
                    <Users className="w-4 h-4" /> Affiliate Program
                  </button>
                  <Link
                    to="/ai-tools"
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold text-amber-950 shadow-md"
                    style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }}
                  >
                    <Wrench className="w-4 h-4" /> Free Tools
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setSidebarOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-bold text-primary-foreground shadow-md"
                      style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)" }}
                    >
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" />
          )}

          {/* Main content */}
          <main className="min-w-0">
            <SectionRenderer
              section={section}
              stats={stats}
              orders={orders}
              greetingName={greetingName}
              user={user}
              profile={profile}
              onNavigate={setSection}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

/* ========== Top Welcome Card ========== */
function WelcomeCard({ greetingName, email, stats }: { greetingName: string; email: string; stats: { orders: number; spent: number; wishlist: number } }) {
  const initial = greetingName.charAt(0).toUpperCase();
  return (
    <div className="relative rounded-[2rem] p-[1.5px]" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #06b6d4)" }}>
      <div className="rounded-[calc(2rem-1.5px)] bg-card p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl grid place-items-center text-primary-foreground text-2xl font-bold shadow-lg" style={{ background: "linear-gradient(135deg,#8b5cf6,#6366f1)" }}>
                {initial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 grid place-items-center text-white text-[10px] ring-2 ring-card">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">WELCOME BACK</div>
              <div className="mt-0.5 flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate" style={{ fontFamily: "var(--font-heading)" }}>
                  {greetingName}
                </h1>
                <Check className="w-4 h-4 text-sky-500 shrink-0" strokeWidth={3} />
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5 inline-flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {email}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  <AtSign className="w-3 h-3" /> {(greetingName || "user").toLowerCase().replace(/\s+/g, "")}
                </span>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <StatPill icon={Package} tint="text-sky-500" label="ORDER" value={String(stats.orders)} />
            <StatPill icon={Receipt} tint="text-violet-500" label="TOTAL" value={`৳${stats.spent.toLocaleString()}`} />
            <StatPill icon={Heart} tint="text-rose-500" label="WISHLIST" value={String(stats.wishlist)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, tint, label, value }: { icon: React.ComponentType<{ className?: string }>; tint: string; label: string; value: string }) {
  return (
    <div className="min-w-[88px] rounded-2xl bg-background border border-border px-3 py-2.5 text-center shadow-sm">
      <div className={`mx-auto w-7 h-7 rounded-full grid place-items-center bg-muted ${tint}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="mt-1 text-[9px] font-bold tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-bold text-foreground tabular-nums leading-tight">{value}</div>
    </div>
  );
}

function GiftBanner({ onClaim }: { onClaim: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-4 md:p-5 bg-card border border-border shadow-sm">
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(236,72,153,0.18), rgba(251,191,36,0.18), rgba(139,92,246,0.18))" }} />
      <div className="relative flex flex-wrap items-center gap-4">
        <div className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-primary-foreground shadow-lg" style={{ background: "linear-gradient(135deg,#ec4899,#a855f7)" }}>
          <Gift className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold tracking-[0.18em] text-pink-500 dark:text-pink-300">WELCOME GIFT</div>
          <div className="text-sm md:text-[15px] font-bold text-foreground mt-0.5">🎁 আপনার বিশেষ ছাড় দাবি করুন</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Lucky Spin ঘুরিয়ে ৳১০০–১৫০ পর্যন্ত ছাড় পেতে পারেন</div>
        </div>
        <button
          onClick={onClaim}
          className="shrink-0 inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition"
          style={{ background: "linear-gradient(90deg,#ec4899,#a855f7)" }}
        >
          Claim Now <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function UserMenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${danger ? "text-rose-500 hover:bg-rose-500/10" : "text-foreground hover:bg-accent"}`}>
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
    case "profile": return <ProfileView user={user} profile={profile} onNavigate={onNavigate} />;
    case "edit-profile": return <EditProfile profile={profile} onSaved={() => onNavigate("profile")} onCancel={() => onNavigate("profile")} />;
    case "orders": return <OrdersTable orders={orders} />;
    case "active-services": return <ServiceList kind="active" />;
    case "expired": return <ServiceList kind="expired" />;
    case "downloads": return <Downloads orders={orders} />;
    case "licenses": return <Licenses />;
    case "subscriptions": return <ServiceList kind="active" />;
    case "wishlist": return <ComingSoon title="Wishlist" desc="আপনার সংরক্ষিত পণ্যগুলি।" />;
    case "notifications": return <ComingSoon title="Notifications" desc="অর্ডার ও প্রমোশন আপডেট।" />;
    case "wallet": return <WalletRedirect />;
    case "points": return <ComingSoon title="Reward Points" desc="পয়েন্ট জমা ও রিডিম করুন।" />;
    case "referral": return <ComingSoon title="Referral Program" desc="রেফার করে আয় করুন।" />;
    case "addresses": return <ComingSoon title="Addresses" desc="ডেলিভারি ঠিকানা ম্যানেজ করুন।" />;
    case "security": return <ComingSoon title="Security" desc="পাসওয়ার্ড ও 2FA সেটিংস।" />;
    case "language": return <ComingSoon title="Language" desc="বাংলা / English নির্বাচন করুন।" />;
    case "install-app": return <ComingSoon title="Install App" desc="PWA হিসেবে যুক্ত করুন।" />;
    case "open-ticket": return <OpenTicket />;
    case "my-tickets": return <MyTickets />;
    default: return null;
  }
}






function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <PageHead title={title} desc={desc} />
      <Card><Empty icon={<Sparkles className="w-6 h-6" />} msg="শীঘ্রই আসছে" /></Card>
    </div>
  );
}

function WalletRedirect() {
  return (
    <div className="space-y-6">
      <PageHead title="ওয়ালেট" desc="ব্যালেন্স, টপ-আপ ও লেনদেন ইতিহাস" />
      <Card>
        <div className="text-center py-6">
          <Wallet className="w-10 h-10 mx-auto text-primary mb-3" />
          <h3 className="text-lg font-bold mb-1">My Wallet</h3>
          <p className="text-sm text-muted-foreground mb-4">Balance দেখুন, টপ-আপ করুন এবং লেনদেন ইতিহাস ব্রাউজ করুন।</p>
          <Link to="/wallet" className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}>
            Open Wallet <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
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
const STAT_TILES = [
  { tint: "text-blue-500", tintBg: "bg-blue-500/10" },
  { tint: "text-emerald-500", tintBg: "bg-emerald-500/10" },
  { tint: "text-purple-500", tintBg: "bg-purple-500/10" },
  { tint: "text-orange-500", tintBg: "bg-orange-500/10" },
];

const HUB_TILES: Array<{
  id: SectionId | "shop";
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  tintBg: string;
  surface: string;
  to?: string;
}> = [
  { id: "orders", label: "আমার অর্ডার", desc: "অর্ডার ট্র্যাক ও ইতিহাস", icon: Package, tint: "text-blue-500", tintBg: "bg-blue-500/10", surface: "bg-blue-500/5 border-blue-500/15" },
  { id: "overview", label: "উইশলিস্ট", desc: "সংরক্ষিত পণ্য", icon: Heart, tint: "text-rose-500", tintBg: "bg-rose-500/10", surface: "bg-rose-500/5 border-rose-500/15" },
  { id: "downloads", label: "ডাউনলোডস", desc: "ডিজিটাল ফাইল", icon: Download, tint: "text-emerald-500", tintBg: "bg-emerald-500/10", surface: "bg-emerald-500/5 border-emerald-500/15" },
  { id: "wallet", label: "ওয়ালেট", desc: "ব্যালেন্স ও টপ-আপ", icon: Wallet, tint: "text-purple-500", tintBg: "bg-purple-500/10", surface: "bg-purple-500/5 border-purple-500/15" },
  { id: "overview", label: "অ্যাফিলিয়েট", desc: "রেফার ও আয় করুন", icon: Users, tint: "text-amber-500", tintBg: "bg-amber-500/10", surface: "bg-amber-500/5 border-amber-500/15" },
  { id: "open-ticket", label: "সাপোর্ট", desc: "টিকিট ও চ্যাট", icon: LifeBuoy, tint: "text-cyan-500", tintBg: "bg-cyan-500/10", surface: "bg-cyan-500/5 border-cyan-500/15" },
  { id: "overview", label: "রিফান্ড আবেদন", desc: "রিফান্ড পলিসি অনুযায়ী", icon: Receipt, tint: "text-orange-500", tintBg: "bg-orange-500/10", surface: "bg-orange-500/5 border-orange-500/15" },
  { id: "overview", label: "অর্ডার ট্র্যাক", desc: "পাবলিক ট্র্যাকিং", icon: MapPin, tint: "text-indigo-500", tintBg: "bg-indigo-500/10", surface: "bg-indigo-500/5 border-indigo-500/15" },
  { id: "shop", label: "শপ", desc: "সকল প্রোডাক্ট", icon: ShoppingBag, tint: "text-fuchsia-500", tintBg: "bg-fuchsia-500/10", surface: "bg-fuchsia-500/5 border-fuchsia-500/15", to: "/products" },
  { id: "install-app", label: "অ্যাপ ইনস্টল", desc: "PWA হিসেবে যুক্ত করুন", icon: Smartphone, tint: "text-teal-500", tintBg: "bg-teal-500/10", surface: "bg-teal-500/5 border-teal-500/15" },
];

function Overview({ stats, orders, greetingName, onNavigate }: { stats: { total: number; pending: number; delivered: number; spent: number }; orders: Order[]; greetingName: string; onNavigate: (s: SectionId) => void }) {
  void orders;
  const statItems = [
    { icon: Package, label: "অর্ডার", value: String(stats.total) },
    { icon: Receipt, label: "মোট খরচ", value: `৳${stats.spent.toLocaleString()}` },
    { icon: Wallet, label: "ওয়ালেট", value: "৳০" },
    { icon: Globe, label: "ভাষা", value: "বাংলা" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <section className="relative overflow-hidden rounded-3xl p-6 md:p-10 bg-slate-900 dark:bg-slate-900 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: "var(--gradient-aurora)" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">স্বাগতম ফিরে এসেছেন</p>
            <h1 className="mt-1 flex items-center gap-3 text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              {greetingName} <span className="text-3xl">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-md">আপনার অর্ডার, ওয়ালেট এবং পছন্দ এক জায়গায় কন্ট্রোল করুন।</p>
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full inline-flex items-center gap-2 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Premium Member
          </div>
        </div>

        <div className="relative mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">VIP প্রগ্রেস</span>
            <span className="text-xs text-slate-300 inline-flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> সর্বোচ্চ স্তর</span>
          </div>
          <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full w-full" style={{ background: "linear-gradient(90deg, #6366f1, #a855f7, #fbbf24)" }} />
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statItems.map((s, i) => {
          const t = STAT_TILES[i];
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className={`w-11 h-11 rounded-2xl grid place-items-center mb-3 ${t.tintBg}`}>
                <Icon className={`w-5 h-5 ${t.tint}`} />
              </div>
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              <div className="text-2xl font-bold text-foreground mt-1" style={{ fontFamily: "var(--font-heading)" }}>{s.value}</div>
            </div>
          );
        })}
      </section>

      {/* Control Hub */}
      <section className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">কন্ট্রোল হাব</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-1" style={{ fontFamily: "var(--font-heading)" }}>সবকিছু এক জায়গায়</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-foreground hover:text-primary inline-flex items-center gap-1 transition">
            শপিং করুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {HUB_TILES.map((tile, idx) => {
            const Icon = tile.icon;
            const inner = (
              <>
                <div className="w-10 h-10 rounded-2xl bg-card border border-border shadow-sm grid place-items-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${tile.tint}`} />
                </div>
                <div className="text-sm font-bold text-foreground">{tile.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{tile.desc}</div>
              </>
            );
            const cls = `group cursor-pointer p-5 rounded-3xl border ${tile.surface} hover:shadow-lg transition-all text-left`;
            return tile.to ? (
              <Link key={idx} to={tile.to} className={cls}>{inner}</Link>
            ) : (
              <button key={idx} onClick={() => onNavigate(tile.id as SectionId)} className={cls}>{inner}</button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ===================== PROFILE ===================== */
function ProfileView({ user, profile, onNavigate }: { user: { email?: string; id?: string } | null; profile: { display_name?: string | null; phone?: string | null } | null; onNavigate: (s: SectionId) => void }) {
  return (
    <div className="space-y-6">
      <PageHead
        title="My Profile"
        desc="Your personal information"
        action={<Btn variant="primary" onClick={() => onNavigate("edit-profile")}>তথ্য এডিট করুন</Btn>}
      />
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

function EditProfile({ profile, onSaved, onCancel }: { profile: { display_name?: string | null; phone?: string | null } | null; onSaved: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    phone: profile?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okAt, setOkAt] = useState<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErr(null);
    const name = form.display_name.trim();
    const phone = form.phone.trim();
    if (!name) { setErr("নাম দিন"); return; }
    if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone)) { setErr("সঠিক ফোন নম্বর দিন"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name, phone: phone || null }, { onConflict: "id" });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setOkAt(Date.now());
    setTimeout(() => { onSaved(); }, 700);
  };

  return (
    <div className="space-y-6">
      <PageHead title="Edit Profile" desc="আপনার ব্যক্তিগত তথ্য আপডেট করুন" />
      <Card>
        <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-4">
          <Field label="পুরো নাম">
            <Input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="আপনার নাম"
              maxLength={100}
            />
          </Field>
          <Field label="ফোন নম্বর">
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="01XXXXXXXXX"
              maxLength={20}
            />
          </Field>
          <Field label="ইমেইল">
            <Input value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
          </Field>
          <div />
          {err && (
            <div className="md:col-span-2 rounded-xl bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] text-sm px-4 py-3">
              {err}
            </div>
          )}
          {okAt && (
            <div className="md:col-span-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm px-4 py-3 inline-flex items-center gap-2">
              <Check className="w-4 h-4" /> সংরক্ষণ হয়েছে
            </div>
          )}
          <div className="md:col-span-2 flex gap-3">
            <Btn variant="primary" type="submit">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save Changes"}
            </Btn>
            <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
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

type DownloadLink = {
  productSlug: string;
  productName: string;
  productImage?: string | null;
  label: string;
  url: string;
  orderId?: string;
  orderDate?: string;
};

function extractLinksFromMeta(meta: unknown): Array<{ label: string; url: string }> {
  const out: Array<{ label: string; url: string }> = [];
  if (!meta || typeof meta !== "object") return out;
  const m = meta as Record<string, unknown>;
  const push = (label: string, url: unknown) => {
    if (typeof url === "string" && /^https?:\/\//i.test(url)) out.push({ label, url });
  };
  push("Download", m.download_url);
  push("Download", m.download_link);
  push("Setup file", m.setup_url);
  const arrays = [m.downloads, m.download_links, m.files];
  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      arr.forEach((item, i) => {
        if (typeof item === "string") push(`File ${i + 1}`, item);
        else if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const url = (o.url ?? o.link ?? o.href) as unknown;
          const label = (o.label ?? o.name ?? o.title ?? `File ${i + 1}`) as string;
          push(String(label), url);
        }
      });
    }
  }
  return out;
}

function Downloads({ orders }: { orders: Order[] }) {
  const [links, setLinks] = useState<DownloadLink[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const slugs = Array.from(new Set(orders.flatMap((o) => (o.items || []).map((it) => it.slug)).filter(Boolean)));
      if (slugs.length === 0) { if (!cancelled) setLinks([]); return; }
      const { data } = await supabase
        .from("products")
        .select("slug, name, image_url, meta")
        .in("slug", slugs);
      if (cancelled) return;
      const bySlug = new Map<string, { name: string; image_url: string | null; meta: unknown }>();
      (data || []).forEach((p) => bySlug.set(p.slug, { name: p.name, image_url: p.image_url, meta: p.meta }));

      const collected: DownloadLink[] = [];
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const p = bySlug.get(it.slug);
          if (!p) return;
          const linksFromMeta = extractLinksFromMeta(p.meta);
          linksFromMeta.forEach((l) => collected.push({
            productSlug: it.slug, productName: p.name, productImage: p.image_url,
            label: l.label, url: l.url, orderId: o.id, orderDate: o.created_at,
          }));
        });
      });

      // De-duplicate by url+slug
      const seen = new Set<string>();
      const unique = collected.filter((l) => {
        const k = `${l.productSlug}::${l.url}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
      setLinks(unique);
    })();
    return () => { cancelled = true; };
  }, [orders]);

  const doCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied((c) => (c === url ? null : c)), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHead title="ডাউনলোড লিংক" desc="আপনার কেনা প্রোডাক্টের ডাউনলোড লিংক এক জায়গায়।" />
      <Card>
        {links === null ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> লোড হচ্ছে...
          </div>
        ) : links.length === 0 ? (
          <Empty icon={<Download className="w-6 h-6" />} msg="আপনার অর্ডারকৃত প্রোডাক্টে এখনো কোনো ডাউনলোড লিংক যোগ করা হয়নি।" />
        ) : (
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={`${l.productSlug}-${i}`} className="flex flex-wrap items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
                {l.productImage ? (
                  <img src={l.productImage} alt={l.productName} loading="lazy" className="w-11 h-11 rounded-lg object-cover border border-[var(--glass-border)]" />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-primary/10 grid place-items-center text-primary"><FileText className="w-5 h-5" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{l.productName}</div>
                  <div className="text-xs text-muted-foreground truncate">{l.label} • {l.url}</div>
                </div>
                <button onClick={() => doCopy(l.url)} className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-xs font-semibold glass border border-[var(--glass-border)] hover:border-primary/40">
                  {copied === l.url ? <><Check className="w-3.5 h-3.5" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                </button>
                <a href={l.url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90">
                  <Download className="w-3.5 h-3.5" />Download
                </a>
              </div>
            ))}
          </div>
        )}
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
