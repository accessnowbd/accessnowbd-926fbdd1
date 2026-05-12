import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Package, Clock, CheckCircle2, Wallet, User as UserIcon, ShoppingBag,
  ArrowRight, Sparkles, LifeBuoy, LogOut, LayoutDashboard, BarChart3, Activity,
  Shield, Smartphone, KeyRound, Cloud, CreditCard, ArrowDownToLine, ArrowUpFromLine,
  Receipt, Gift, Users, Trophy, Bell, Wrench, Link2, MessageSquare, BookOpen,
  Settings, Palette, Globe, Bell as BellIcon, Crown, ShieldCheck, Search, Menu,
  ChevronDown, X, Plus, Download, RefreshCw, Send, Zap, Star, TrendingUp,
  FileText, Lock, Mail, Phone, MapPin, Hash, Copy, Check, Sun, Moon, Megaphone,
  Headphones, Award, Coins, Languages, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "User Dashboard — AccessNow BD" },
      { name: "description", content: "আপনার অর্ডার, প্রোফাইল, wallet ও সব কিছু এক জায়গায়।" },
    ],
  }),
});

type OrderItem = { slug: string; planPeriod: string; qty: number; name?: string; emoji?: string; price?: number };
type Order = {
  id: string; full_name: string; email: string; items: OrderItem[];
  total: number; status: string; payment_method: string; created_at: string;
};

type SectionId =
  | "overview" | "analytics" | "activity"
  | "profile" | "edit-profile" | "security" | "2fa" | "devices"
  | "orders" | "active-services" | "expired" | "downloads" | "licenses" | "api" | "subscriptions"
  | "wallet" | "add-balance" | "withdraw" | "transactions" | "invoices" | "payment-methods"
  | "affiliate" | "referrals" | "earnings" | "rewards" | "coupons"
  | "alerts" | "system-notif" | "support-replies" | "announcements"
  | "tool-password" | "tool-license" | "tool-email" | "tool-url" | "tool-key" | "tool-api"
  | "open-ticket" | "my-tickets" | "live-chat" | "kb"
  | "settings-general" | "settings-theme" | "settings-language" | "settings-notif";

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
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "activity", label: "Activity Logs", icon: Activity },
  ]},
  { title: "Account", items: [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "edit-profile", label: "Edit Profile", icon: FileText },
    { id: "security", label: "Security", icon: Shield },
    { id: "2fa", label: "Two-Factor Auth", icon: ShieldCheck },
    { id: "devices", label: "Login Devices", icon: Smartphone },
  ]},
  { title: "Orders & Services", items: [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "active-services", label: "Active Services", icon: Zap },
    { id: "expired", label: "Expired Services", icon: Clock },
    { id: "downloads", label: "Downloads", icon: Download },
    { id: "licenses", label: "License Keys", icon: KeyRound },
    { id: "api", label: "API Access", icon: Cloud },
    { id: "subscriptions", label: "Subscription Plans", icon: Crown },
  ]},
  { title: "Billing", items: [
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "add-balance", label: "Add Balance", icon: Plus },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "payment-methods", label: "Payment Methods", icon: CreditCard },
  ]},
  { title: "Affiliate & Rewards", items: [
    { id: "affiliate", label: "Affiliate", icon: Users },
    { id: "referrals", label: "Referrals", icon: Link2 },
    { id: "earnings", label: "Earnings", icon: Coins },
    { id: "rewards", label: "Reward Points", icon: Trophy },
    { id: "coupons", label: "Coupons", icon: Gift },
  ]},
  { title: "Notifications", items: [
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "system-notif", label: "System", icon: BellIcon },
    { id: "support-replies", label: "Support Replies", icon: MessageSquare },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ]},
  { title: "Tools", items: [
    { id: "tool-password", label: "Password Generator", icon: Lock },
    { id: "tool-license", label: "License Checker", icon: ShieldCheck },
    { id: "tool-email", label: "Email Validator", icon: Mail },
    { id: "tool-url", label: "URL Shortener", icon: Link2 },
    { id: "tool-key", label: "Key Generator", icon: KeyRound },
    { id: "tool-api", label: "API Tester", icon: Wrench },
  ]},
  { title: "Support", items: [
    { id: "open-ticket", label: "Open Ticket", icon: LifeBuoy },
    { id: "my-tickets", label: "My Tickets", icon: MessageSquare },
    { id: "live-chat", label: "Live Chat", icon: Headphones },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
  ]},
  { title: "Settings", items: [
    { id: "settings-general", label: "General", icon: Settings },
    { id: "settings-theme", label: "Theme", icon: Palette },
    { id: "settings-language", label: "Language", icon: Globe },
    { id: "settings-notif", label: "Notifications", icon: BellIcon },
  ]},
];

function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<{ display_name?: string | null; phone?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
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
    const ordersP = supabase.from("orders").select("*").order("created_at", { ascending: false })
      .then((r) => { mark("orders fetch", tOrders); return r; });

    const tProfile = performance.now();
    const profileP = supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle()
      .then((r) => { mark("profile fetch", tProfile); return r; });

    Promise.all([ordersP, profileP])
      .then(([o, p]) => {
        if (cancelled) return;
        setOrders(((o.data as unknown) as Order[]) || []);
        setProfile((p.data as { display_name?: string | null; phone?: string | null } | null) || null);
      })
      .catch((err) => {
        console.error("[dashboard-perf] ❌ load failed after", Math.round(performance.now() - t0), "ms", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        const totalMs = mark("TOTAL dashboard load", t0);
        try {
          const w = window as unknown as { __dashboardPerf?: Array<{ at: string; totalMs: number; userId: string }> };
          w.__dashboardPerf = w.__dashboardPerf || [];
          w.__dashboardPerf.push({ at: new Date().toISOString(), totalMs, userId: user.id });
          if (w.__dashboardPerf.length > 20) w.__dashboardPerf.shift();
        } catch { /* noop */ }
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
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col glass-strong border-r border-[var(--glass-border)]">
          {/* Logo */}
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

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
            {NAV.map((group) => (
              <div key={group.title}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
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
                            ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_20px_-5px_var(--primary)]"
                            : "text-foreground/70 hover:text-foreground hover:bg-white/5 border border-transparent"
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

            {/* Special buttons */}
            <div className="pt-3 border-t border-[var(--glass-border)] space-y-2">
              <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--gradient-aurora)" }}>
                <Crown className="w-4 h-4" /> Upgrade Plan
              </button>
              <button className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold glass border border-[var(--glass-border)] hover:border-primary/40">
                <Award className="w-4 h-4" /> Become Seller
              </button>
            </div>
          </nav>

          {/* Bottom logout */}
          <div className="p-3 border-t border-[var(--glass-border)]">
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
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
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-full glass border border-[var(--glass-border)] w-72">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search..." className="flex-1 bg-transparent outline-none text-sm" />
            </div>
            <button className="relative w-9 h-9 rounded-full glass border border-[var(--glass-border)] grid place-items-center hover:border-primary/40">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <button className="hidden md:grid w-9 h-9 rounded-full glass border border-[var(--glass-border)] place-items-center hover:border-primary/40">
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-full glass border border-[var(--glass-border)]">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">৳1,250</span>
            </div>
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
                  <UserMenuItem icon={<Settings className="w-4 h-4" />} label="Account Settings" onClick={() => { setSection("settings-general"); setUserMenu(false); }} />
                  <UserMenuItem icon={<Wallet className="w-4 h-4" />} label="Billing" onClick={() => { setSection("wallet"); setUserMenu(false); }} />
                  <UserMenuItem icon={<Shield className="w-4 h-4" />} label="Security" onClick={() => { setSection("security"); setUserMenu(false); }} />
                  <UserMenuItem icon={<LifeBuoy className="w-4 h-4" />} label="Support" onClick={() => { setSection("open-ticket"); setUserMenu(false); }} />
                  <div className="my-1 h-px bg-[var(--glass-border)]" />
                  <UserMenuItem icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={handleSignOut} danger />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8">
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
    case "analytics": return <Analytics />;
    case "activity": return <ActivityLogs />;
    case "profile": return <ProfileView user={user} profile={profile} />;
    case "edit-profile": return <EditProfile profile={profile} />;
    case "security": return <SecuritySection />;
    case "2fa": return <TwoFactor />;
    case "devices": return <Devices />;
    case "orders": return <OrdersTable orders={orders} />;
    case "active-services": return <ServiceList kind="active" />;
    case "expired": return <ServiceList kind="expired" />;
    case "downloads": return <Downloads />;
    case "licenses": return <Licenses />;
    case "api": return <ApiAccess />;
    case "subscriptions": return <SubscriptionPlans />;
    case "wallet": return <WalletView />;
    case "add-balance": return <AddBalance />;
    case "withdraw": return <Withdraw />;
    case "transactions": return <Transactions />;
    case "invoices": return <Invoices orders={orders} />;
    case "payment-methods": return <PaymentMethods />;
    case "affiliate": return <AffiliateDashboard />;
    case "referrals": return <Referrals />;
    case "earnings": return <Earnings />;
    case "rewards": return <Rewards />;
    case "coupons": return <Coupons />;
    case "alerts":
    case "system-notif":
    case "support-replies":
    case "announcements":
      return <Notifications kind={section} />;
    case "tool-password": return <PasswordGenerator />;
    case "tool-license": return <LicenseChecker />;
    case "tool-email": return <EmailValidator />;
    case "tool-url": return <UrlShortener />;
    case "tool-key": return <KeyGenerator />;
    case "tool-api": return <ApiTester />;
    case "open-ticket": return <OpenTicket />;
    case "my-tickets": return <MyTickets />;
    case "live-chat": return <LiveChat />;
    case "kb": return <KnowledgeBase />;
    case "settings-general": return <GeneralSettings />;
    case "settings-theme": return <ThemeSettings />;
    case "settings-language": return <LanguageSettings />;
    case "settings-notif": return <NotifSettings />;
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
              Manage your account, services, orders and wallet from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/products" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white text-primary text-sm font-semibold hover:scale-[1.02] transition shadow-[var(--shadow-glow)]">
              <ShoppingBag className="w-4 h-4" /> Buy Service
            </Link>
            <button onClick={() => onNavigate("add-balance")} className="inline-flex items-center gap-2 h-11 px-5 rounded-full glass border border-white/15 text-primary-foreground text-sm font-semibold hover:bg-white/10 transition">
              <Plus className="w-4 h-4" /> Add Balance
            </button>
            <button onClick={() => onNavigate("open-ticket")} className="inline-flex items-center gap-2 h-11 px-5 rounded-full glass border border-white/15 text-primary-foreground text-sm font-semibold hover:bg-white/10 transition">
              <LifeBuoy className="w-4 h-4" /> Open Ticket
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat icon={<Package className="w-5 h-5" />} label="Total Orders" value={String(stats.total)} accent="from-primary/30 to-primary/5" />
        <Stat icon={<Zap className="w-5 h-5" />} label="Active Services" value={String(stats.pending + stats.delivered)} accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Wallet className="w-5 h-5" />} label="Wallet Balance" value="৳1,250" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Download className="w-5 h-5" />} label="Downloads" value="12" accent="from-pink-400/30 to-pink-400/5" />
        <Stat icon={<Trophy className="w-5 h-5" />} label="Reward Points" value="850" accent="from-fuchsia-400/30 to-fuchsia-400/5" />
        <Stat icon={<Users className="w-5 h-5" />} label="Affiliate" value="৳420" accent="from-violet-400/30 to-violet-400/5" />
        <Stat icon={<Smartphone className="w-5 h-5" />} label="Sessions" value="3" accent="from-violet-400/30 to-violet-400/5" />
        <Stat icon={<LifeBuoy className="w-5 h-5" />} label="Open Tickets" value="0" accent="from-pink-400/30 to-pink-400/5" />
      </section>

      <Card>
        <h2 className="text-base font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { i: ShoppingBag, l: "Purchase", s: "active-services" as SectionId },
            { i: RefreshCw, l: "Renew Plan", s: "subscriptions" as SectionId },
            { i: KeyRound, l: "API Key", s: "api" as SectionId },
            { i: Download, l: "Downloads", s: "downloads" as SectionId },
            { i: Send, l: "Transfer", s: "wallet" as SectionId },
            { i: LifeBuoy, l: "Support", s: "open-ticket" as SectionId },
          ].map(({ i: I, l, s }) => (
            <button key={l} onClick={() => onNavigate(s)} className="flex flex-col items-center gap-2 p-4 rounded-2xl glass border border-[var(--glass-border)] hover:border-primary/40 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl grid place-items-center text-primary" style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)" }}>
                <I className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{l}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
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

        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Wallet Summary</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-primary/30" style={{ background: "var(--gradient-violet)" }}>
              <div className="text-xs text-white/80">Current Balance</div>
              <div className="mt-1 text-3xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>৳1,250</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl glass border border-[var(--glass-border)]">
                <div className="text-xs text-muted-foreground">Total Spent</div>
                <div className="font-bold mt-1">৳{stats.spent.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl glass border border-[var(--glass-border)]">
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="font-bold mt-1">৳0</div>
              </div>
              <div className="p-3 rounded-xl glass border border-[var(--glass-border)]">
                <div className="text-xs text-muted-foreground">Affiliate</div>
                <div className="font-bold mt-1">৳420</div>
              </div>
              <div className="p-3 rounded-xl glass border border-[var(--glass-border)]">
                <div className="text-xs text-muted-foreground">Rewards</div>
                <div className="font-bold mt-1">850 pts</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Btn variant="primary" onClick={() => onNavigate("add-balance")} className="!h-9 !px-3 text-xs">Add</Btn>
              <Btn variant="ghost" onClick={() => onNavigate("withdraw")} className="!h-9 !px-3 text-xs">Withdraw</Btn>
              <Btn variant="ghost" className="!h-9 !px-3 text-xs">Transfer</Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Monthly Spending</h2>
          <MiniBarChart values={[120, 250, 180, 420, 320, 510, 380, 600, 450, 700, 540, 820]} />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Latest Notifications</h2>
          <div className="space-y-2">
            {[
              { t: "Order delivered", d: "Your Netflix subscription is active", c: "success" as const },
              { t: "Payment received", d: "৳500 added to your wallet", c: "primary" as const },
              { t: "Support replied", d: "Reply on ticket #1234", c: "warn" as const },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
                <Badge color={n.c}>New</Badge>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{n.t}</div>
                  <div className="text-xs text-muted-foreground">{n.d}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1.5 h-40">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-md transition-all hover:opacity-80" style={{ height: `${(v / max) * 100}%`, background: "var(--gradient-aurora)" }} title={`৳${v}`} />
      ))}
    </div>
  );
}

/* ===================== ANALYTICS ===================== */
function Analytics() {
  return (
    <div className="space-y-6">
      <PageHead title="Analytics" desc="Your activity and spending insights" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat icon={<TrendingUp className="w-5 h-5" />} label="This Month" value="৳3,420" accent="from-primary/30 to-primary/5" />
        <Stat icon={<ShoppingBag className="w-5 h-5" />} label="Purchases" value="14" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Users className="w-5 h-5" />} label="Referrals" value="8" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Star className="w-5 h-5" />} label="Avg Rating" value="4.9" accent="from-fuchsia-400/30 to-fuchsia-400/5" />
      </div>
      <Card><h3 className="font-semibold mb-4">Monthly Spending</h3><MiniBarChart values={[120, 250, 180, 420, 320, 510, 380, 600, 450, 700, 540, 820]} /></Card>
      <Card><h3 className="font-semibold mb-4">Purchase History</h3><MiniBarChart values={[2, 4, 1, 6, 3, 8, 5, 10, 4, 12, 6, 14]} /></Card>
    </div>
  );
}

function ActivityLogs() {
  const logs = [
    { a: "Logged in", t: "2 hours ago", ip: "103.230.xx.xx" },
    { a: "Purchased Netflix Premium", t: "Yesterday", ip: "103.230.xx.xx" },
    { a: "Updated profile", t: "3 days ago", ip: "103.230.xx.xx" },
    { a: "Password changed", t: "1 week ago", ip: "103.230.xx.xx" },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="Activity Logs" desc="Recent actions on your account" />
      <Card>
        <div className="space-y-2">
          {logs.map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
              <div className="w-9 h-9 rounded-lg glass grid place-items-center text-primary"><Activity className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{l.a}</div>
                <div className="text-xs text-muted-foreground">{l.t} · {l.ip}</div>
              </div>
            </div>
          ))}
        </div>
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
              <Badge color="warn">Phone Pending</Badge>
              <Badge color="muted">KYC: Not Started</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
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
        <Card>
          <h3 className="font-semibold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Connected Accounts</h3>
          <div className="space-y-2">
            {[{ n: "Google", c: false }, { n: "Facebook", c: false }, { n: "GitHub", c: false }].map((a) => (
              <div key={a.n} className="flex items-center justify-between p-3 rounded-xl glass border border-[var(--glass-border)]">
                <span className="text-sm font-medium">{a.n}</span>
                <Btn variant={a.c ? "ghost" : "outline"} className="!h-8 !px-3 text-xs">{a.c ? "Disconnect" : "Connect"}</Btn>
              </div>
            ))}
          </div>
        </Card>
      </div>
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
          <Field label="Username"><Input placeholder="@username" /></Field>
          <Field label="Phone"><Input defaultValue={profile?.phone || ""} placeholder="+880 1XXX-XXXXXX" /></Field>
          <Field label="Country"><Input defaultValue="Bangladesh" /></Field>
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

function SecuritySection() {
  return (
    <div className="space-y-6">
      <PageHead title="Security" desc="Keep your account safe" />
      <Card>
        <h3 className="font-semibold mb-4">Change Password</h3>
        <form className="grid md:grid-cols-2 gap-4">
          <Field label="Current Password"><Input type="password" placeholder="••••••••" /></Field>
          <div />
          <Field label="New Password"><Input type="password" placeholder="••••••••" /></Field>
          <Field label="Confirm Password"><Input type="password" placeholder="••••••••" /></Field>
          <div className="md:col-span-2"><Btn variant="primary">Update Password</Btn></div>
        </form>
      </Card>
      <Card>
        <h3 className="font-semibold mb-3">Security Recommendations</h3>
        <div className="space-y-2 text-sm">
          {[
            { i: ShieldCheck, l: "Enable Two-Factor Authentication", s: "warn" as const },
            { i: Lock, l: "Strong password set", s: "success" as const },
            { i: Smartphone, l: "Verify phone number", s: "warn" as const },
            { i: Mail, l: "Email verified", s: "success" as const },
          ].map((r) => {
            const I = r.i;
            return (
              <div key={r.l} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
                <I className="w-4 h-4 text-primary" />
                <span className="flex-1">{r.l}</span>
                <Badge color={r.s}>{r.s === "success" ? "Done" : "Action needed"}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function TwoFactor() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="space-y-6">
      <PageHead title="Two-Factor Authentication" desc="Add an extra layer of security" />
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-primary glass border border-[var(--glass-border)]"><ShieldCheck className="w-6 h-6" /></div>
            <div>
              <div className="font-semibold">Authenticator App</div>
              <div className="text-xs text-muted-foreground">Use Google Authenticator or Authy</div>
            </div>
          </div>
          <Btn variant={enabled ? "ghost" : "primary"} onClick={() => setEnabled(!enabled)}>
            {enabled ? "Disable" : "Enable 2FA"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

function Devices() {
  const devs = [
    { d: "Chrome on Windows", l: "Dhaka, BD", c: true },
    { d: "Safari on iPhone", l: "Dhaka, BD", c: false },
    { d: "Firefox on Linux", l: "Chittagong, BD", c: false },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="Login Devices" desc="Devices currently signed in to your account" />
      <Card>
        <div className="space-y-2">
          {devs.map((d) => (
            <div key={d.d} className="flex items-center gap-3 p-4 rounded-xl glass border border-[var(--glass-border)]">
              <Smartphone className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{d.d}</div>
                <div className="text-xs text-muted-foreground">{d.l}</div>
              </div>
              {d.c ? <Badge color="success">Current</Badge> : <Btn variant="ghost" className="!h-8 !px-3 text-xs">Sign out</Btn>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ===================== ORDERS / SERVICES ===================== */
function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6">
      <PageHead title="My Orders" desc="All your purchases" action={<Btn variant="primary"><Plus className="w-4 h-4" />New Order</Btn>} />
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

function ApiAccess() {
  return (
    <div className="space-y-6">
      <PageHead title="API Access" desc="Manage API keys for integrations" action={<Btn variant="primary"><Plus className="w-4 h-4" />Generate Key</Btn>} />
      <Card><CopyRow label="Production Key" value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx" /></Card>
    </div>
  );
}

function SubscriptionPlans() {
  const plans = [
    { n: "Starter", p: "Free", f: ["5 orders / month", "Email support", "Basic dashboard"] },
    { n: "Pro", p: "৳500/mo", f: ["Unlimited orders", "Priority support", "Affiliate tools", "API access"], hi: true },
    { n: "Enterprise", p: "Custom", f: ["Dedicated manager", "Custom SLA", "White-label"] },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="Subscription Plans" desc="Pick the plan that fits you" />
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((pl) => (
          <Card key={pl.n} className={pl.hi ? "ring-2 ring-primary shadow-[var(--shadow-glow)]" : ""}>
            {pl.hi && <Badge color="primary">Most Popular</Badge>}
            <div className="mt-2 text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{pl.n}</div>
            <div className="mt-2 text-3xl font-bold text-primary">{pl.p}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {pl.f.map((x) => <li key={x} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-300" />{x}</li>)}
            </ul>
            <Btn variant={pl.hi ? "primary" : "ghost"} className="w-full mt-5">{pl.n === "Starter" ? "Current" : "Upgrade"}</Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===================== BILLING ===================== */
function WalletView() {
  return (
    <div className="space-y-6">
      <PageHead title="Wallet" desc="Manage your funds" />
      <div className="rounded-3xl p-8 border border-[var(--glass-border)] relative overflow-hidden" style={{ background: "var(--gradient-aurora)" }}>
        <div className="text-sm text-white/80">Available Balance</div>
        <div className="mt-2 text-5xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>৳1,250</div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Btn variant="primary" className="!bg-white !text-primary"><Plus className="w-4 h-4" />Add Money</Btn>
          <Btn variant="ghost" className="!text-white !border-white/30"><ArrowUpFromLine className="w-4 h-4" />Withdraw</Btn>
          <Btn variant="ghost" className="!text-white !border-white/30"><Send className="w-4 h-4" />Transfer</Btn>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={<ArrowDownToLine className="w-5 h-5" />} label="Total Loaded" value="৳12,500" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<ArrowUpFromLine className="w-5 h-5" />} label="Total Spent" value="৳11,250" accent="from-fuchsia-400/30 to-fuchsia-400/5" />
        <Stat icon={<Coins className="w-5 h-5" />} label="Pending" value="৳0" accent="from-fuchsia-400/30 to-fuchsia-400/5" />
      </div>
    </div>
  );
}

function AddBalance() {
  const gateways = ["bKash", "Nagad", "Rocket", "SSLCommerz", "Stripe", "PayPal", "Binance Pay"];
  return (
    <div className="space-y-6">
      <PageHead title="Add Balance" desc="Top up your wallet" />
      <Card>
        <Field label="Amount (BDT)"><Input type="number" placeholder="500" /></Field>
        <div className="mt-4 text-xs font-semibold text-muted-foreground mb-2">Choose Gateway</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {gateways.map((g) => (
            <button key={g} className="p-3 rounded-xl glass border border-[var(--glass-border)] text-sm font-medium hover:border-primary/40">{g}</button>
          ))}
        </div>
        <Btn variant="primary" className="mt-5">Continue</Btn>
      </Card>
    </div>
  );
}

function Withdraw() {
  return (
    <div className="space-y-6">
      <PageHead title="Withdraw" desc="Cash out your balance" />
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Amount"><Input type="number" placeholder="500" /></Field>
          <Field label="Method"><Input placeholder="bKash / Bank" /></Field>
          <Field label="Account / Number"><Input placeholder="01XXXXXXXXX" /></Field>
          <Field label="Note"><Input placeholder="Optional note" /></Field>
        </div>
        <Btn variant="primary" className="mt-5">Request Withdrawal</Btn>
      </Card>
    </div>
  );
}

function Transactions() {
  const txns = [
    { id: "TXN001", m: "bKash", a: "+৳500", s: "success", d: "2 days ago" },
    { id: "TXN002", m: "Wallet", a: "-৳299", s: "success", d: "5 days ago" },
    { id: "TXN003", m: "Stripe", a: "+৳1,000", s: "pending", d: "1 week ago" },
  ];
  return (
    <div className="space-y-6">
      <PageHead title="Transactions" desc="All wallet movements" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-[var(--glass-border)]">
                <th className="py-3 px-2">ID</th><th className="py-3 px-2">Method</th><th className="py-3 px-2">Amount</th><th className="py-3 px-2">Status</th><th className="py-3 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-b border-[var(--glass-border)]/50 hover:bg-white/5">
                  <td className="py-3 px-2 font-mono">{t.id}</td>
                  <td className="py-3 px-2">{t.m}</td>
                  <td className={`py-3 px-2 font-bold ${t.a.startsWith("+") ? "text-cyan-300" : "text-red-300"}`}>{t.a}</td>
                  <td className="py-3 px-2"><Badge color={t.s === "success" ? "success" : "warn"}>{t.s}</Badge></td>
                  <td className="py-3 px-2 text-muted-foreground">{t.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Invoices({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6">
      <PageHead title="Invoices" desc="Download your invoices" />
      <Card>
        {orders.length === 0 ? <Empty icon={<FileText className="w-6 h-6" />} msg="No invoices yet." /> : (
          <div className="space-y-2">
            {orders.slice(0, 10).map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
                <FileText className="w-4 h-4 text-primary" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">Invoice #{o.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · ৳{Number(o.total).toLocaleString()}</div>
                </div>
                <Btn variant="ghost" className="!h-8 !px-3 text-xs"><Download className="w-3.5 h-3.5" />PDF</Btn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PaymentMethods() {
  return (
    <div className="space-y-6">
      <PageHead title="Payment Methods" desc="Saved cards & wallets" action={<Btn variant="primary"><Plus className="w-4 h-4" />Add Method</Btn>} />
      <Empty icon={<CreditCard className="w-6 h-6" />} msg="No saved payment methods yet." />
    </div>
  );
}

/* ===================== AFFILIATE ===================== */
function AffiliateDashboard() {
  const link = "https://accessnowbd.com/?ref=user123";
  return (
    <div className="space-y-6">
      <PageHead title="Affiliate Dashboard" desc="Earn by referring friends" />
      <Card>
        <div className="text-xs text-muted-foreground mb-2">Your referral link</div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-0 px-4 h-11 rounded-xl glass border border-[var(--glass-border)] flex items-center font-mono text-sm truncate">{link}</div>
          <Btn variant="primary" onClick={() => navigator.clipboard.writeText(link)}><Copy className="w-4 h-4" />Copy</Btn>
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat icon={<Eye className="w-5 h-5" />} label="Clicks" value="245" accent="from-primary/30 to-primary/5" />
        <Stat icon={<Users className="w-5 h-5" />} label="Conversions" value="18" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Coins className="w-5 h-5" />} label="Earnings" value="৳420" accent="from-cyan-400/30 to-cyan-400/5" />
        <Stat icon={<Wallet className="w-5 h-5" />} label="Withdrawable" value="৳420" accent="from-fuchsia-400/30 to-fuchsia-400/5" />
      </div>
    </div>
  );
}

function Referrals() {
  return (
    <div className="space-y-6">
      <PageHead title="Referrals" desc="Friends you brought in" />
      <Empty icon={<Users className="w-6 h-6" />} msg="No referrals yet. Share your link to start earning." />
    </div>
  );
}
function Earnings() {
  return (
    <div className="space-y-6">
      <PageHead title="Earnings" desc="Affiliate commission breakdown" />
      <Card><MiniBarChart values={[10, 20, 15, 30, 25, 50, 40, 70, 60, 90, 75, 110]} /></Card>
    </div>
  );
}
function Rewards() {
  return (
    <div className="space-y-6">
      <PageHead title="Reward Points" desc="Earn XP and unlock perks" />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Current Level</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Silver 🥈</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground text-right">XP Points</div>
            <div className="text-2xl font-bold text-primary">850 / 2000</div>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: "42.5%", background: "var(--gradient-aurora)" }} />
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
          {["Bronze", "Silver", "Gold", "Platinum", "VIP"].map((l, i) => (
            <div key={l} className={`p-3 rounded-xl border ${i === 1 ? "border-primary/40 bg-primary/10" : "border-[var(--glass-border)] glass"}`}>
              <div className="text-xs font-semibold">{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
function Coupons() {
  const cps = [{ c: "WELCOME10", d: "10% off first order", e: "31 Dec 2026" }, { c: "AFFIL5", d: "5% off any plan", e: "15 Jan 2027" }];
  return (
    <div className="space-y-6">
      <PageHead title="Coupons" desc="Available discount codes" />
      <div className="grid md:grid-cols-2 gap-4">
        {cps.map((c) => (
          <Card key={c.c}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-bold text-primary">{c.c}</div>
                <div className="text-sm text-muted-foreground">{c.d}</div>
                <div className="text-xs text-muted-foreground mt-1">Expires: {c.e}</div>
              </div>
              <Btn variant="outline" onClick={() => navigator.clipboard.writeText(c.c)}><Copy className="w-3.5 h-3.5" />Copy</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ===================== NOTIFICATIONS ===================== */
function Notifications({ kind }: { kind: SectionId }) {
  const titles: Partial<Record<SectionId, string>> = { alerts: "Alerts", "system-notif": "System Notifications", "support-replies": "Support Replies", announcements: "Announcements" };
  return (
    <div className="space-y-6">
      <PageHead title={titles[kind] || "Notifications"} />
      <Card>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl glass border border-[var(--glass-border)]">
              <div className="w-9 h-9 rounded-lg glass grid place-items-center text-primary"><Bell className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Notification #{i}</div>
                <div className="text-xs text-muted-foreground">This is a sample notification message.</div>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ===================== TOOLS ===================== */
function PasswordGenerator() {
  const [pw, setPw] = useState("");
  const [len, setLen] = useState(16);
  const gen = () => {
    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let s = "";
    for (let i = 0; i < len; i++) s += c[Math.floor(Math.random() * c.length)];
    setPw(s);
  };
  useEffect(gen, [len]);
  return (
    <div className="space-y-6">
      <PageHead title="Password Generator" desc="Create strong, random passwords" />
      <Card>
        <div className="p-4 rounded-xl glass border border-[var(--glass-border)] font-mono text-lg break-all">{pw}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Field label={`Length: ${len}`}><input type="range" min={8} max={32} value={len} onChange={(e) => setLen(Number(e.target.value))} className="w-48" /></Field>
          <Btn variant="primary" onClick={gen}><RefreshCw className="w-4 h-4" />Generate</Btn>
          <Btn variant="ghost" onClick={() => navigator.clipboard.writeText(pw)}><Copy className="w-4 h-4" />Copy</Btn>
        </div>
      </Card>
    </div>
  );
}
function LicenseChecker() {
  return (
    <div className="space-y-6">
      <PageHead title="License Checker" desc="Verify a license key" />
      <Card>
        <Field label="License Key"><Input placeholder="XXXX-XXXX-XXXX-XXXX" /></Field>
        <Btn variant="primary" className="mt-4">Check</Btn>
      </Card>
    </div>
  );
}
function EmailValidator() {
  const [e, setE] = useState("");
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  return (
    <div className="space-y-6">
      <PageHead title="Email Validator" desc="Check email format validity" />
      <Card>
        <Field label="Email"><Input value={e} onChange={(ev) => setE(ev.target.value)} placeholder="user@example.com" /></Field>
        {e && <div className="mt-3"><Badge color={ok ? "success" : "danger"}>{ok ? "Valid" : "Invalid"}</Badge></div>}
      </Card>
    </div>
  );
}
function UrlShortener() {
  const [u, setU] = useState("");
  const [s, setS] = useState("");
  return (
    <div className="space-y-6">
      <PageHead title="URL Shortener" desc="Shorten long URLs" />
      <Card>
        <Field label="Long URL"><Input value={u} onChange={(e) => setU(e.target.value)} placeholder="https://..." /></Field>
        <Btn variant="primary" className="mt-4" onClick={() => setS(`https://anow.bd/${Math.random().toString(36).slice(2, 7)}`)}>Shorten</Btn>
        {s && <div className="mt-4 p-3 rounded-xl glass border border-[var(--glass-border)] flex items-center justify-between"><span className="font-mono text-sm">{s}</span><Btn variant="ghost" onClick={() => navigator.clipboard.writeText(s)} className="!h-8 !px-3 text-xs"><Copy className="w-3.5 h-3.5" />Copy</Btn></div>}
      </Card>
    </div>
  );
}
function KeyGenerator() {
  const [k, setK] = useState("");
  const gen = () => setK("KEY-" + Math.random().toString(36).slice(2, 10).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase());
  useEffect(gen, []);
  return (
    <div className="space-y-6">
      <PageHead title="Random Key Generator" desc="Generate random keys" />
      <Card>
        <div className="p-4 rounded-xl glass border border-[var(--glass-border)] font-mono">{k}</div>
        <div className="mt-4 flex gap-2"><Btn variant="primary" onClick={gen}><RefreshCw className="w-4 h-4" />Generate</Btn><Btn variant="ghost" onClick={() => navigator.clipboard.writeText(k)}><Copy className="w-4 h-4" />Copy</Btn></div>
      </Card>
    </div>
  );
}
function ApiTester() {
  return (
    <div className="space-y-6">
      <PageHead title="API Tester" desc="Test an API endpoint" />
      <Card>
        <Field label="Endpoint URL"><Input placeholder="https://api.example.com/..." /></Field>
        <div className="mt-3"><Field label="Headers (JSON)"><Textarea rows={3} placeholder='{"Authorization": "Bearer ..."}' /></Field></div>
        <Btn variant="primary" className="mt-4">Send Request</Btn>
      </Card>
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
function LiveChat() {
  return (
    <div className="space-y-6">
      <PageHead title="Live Chat" desc="Chat with our team in real-time" />
      <Card><Empty icon={<Headphones className="w-6 h-6" />} msg="Live chat agents will be available here. Use the floating support widget for now." /></Card>
    </div>
  );
}
function KnowledgeBase() {
  const arts = ["Getting started", "How payments work", "Subscription renewal", "Troubleshooting common issues"];
  return (
    <div className="space-y-6">
      <PageHead title="Knowledge Base" desc="Self-help articles" />
      <Card>
        <div className="space-y-2">
          {arts.map((a) => (
            <div key={a} className="flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)] hover:border-primary/40 cursor-pointer">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium flex-1">{a}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ===================== SETTINGS ===================== */
function GeneralSettings() {
  return (
    <div className="space-y-6">
      <PageHead title="General Settings" />
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Language"><Input defaultValue="বাংলা" /></Field>
          <Field label="Timezone"><Input defaultValue="Asia/Dhaka" /></Field>
          <Field label="Currency"><Input defaultValue="BDT (৳)" /></Field>
        </div>
        <Btn variant="primary" className="mt-5">Save</Btn>
      </Card>
    </div>
  );
}
function ThemeSettings() {
  const [t, setT] = useState<"dark" | "light" | "system">("dark");
  return (
    <div className="space-y-6">
      <PageHead title="Theme Settings" />
      <Card>
        <div className="grid grid-cols-3 gap-3">
          {([["dark", Moon], ["light", Sun], ["system", Settings]] as const).map(([v, I]) => (
            <button key={v} onClick={() => setT(v)} className={`p-5 rounded-2xl border ${t === v ? "border-primary bg-primary/10" : "border-[var(--glass-border)] glass"}`}>
              <I className="w-6 h-6 text-primary mx-auto" />
              <div className="mt-2 text-sm font-semibold capitalize">{v}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
function LanguageSettings() {
  const langs = [{ c: "bn", n: "বাংলা" }, { c: "en", n: "English" }, { c: "hi", n: "हिन्दी" }];
  return (
    <div className="space-y-6">
      <PageHead title="Language Settings" />
      <Card>
        <div className="space-y-2">
          {langs.map((l) => (
            <button key={l.c} className="w-full flex items-center gap-3 p-3 rounded-xl glass border border-[var(--glass-border)] hover:border-primary/40">
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium flex-1 text-left">{l.n}</span>
              <span className="text-xs text-muted-foreground uppercase">{l.c}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
function NotifSettings() {
  const opts = ["Email alerts", "SMS alerts", "Push notifications", "Marketing emails"];
  return (
    <div className="space-y-6">
      <PageHead title="Notification Settings" />
      <Card>
        <div className="space-y-2">
          {opts.map((o) => (
            <label key={o} className="flex items-center justify-between p-3 rounded-xl glass border border-[var(--glass-border)] cursor-pointer">
              <span className="text-sm font-medium">{o}</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
