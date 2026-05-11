import { Link } from "@tanstack/react-router";
import {
  Crown,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Search,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  ChevronRight,
  LogIn,
  UserCircle2,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";

const NAV: Array<{
  label: string;
  to: "/" | "/products" | "/streaming" | "/ai-tools" | "/education" | "/faq" | "/contact";
}> = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/products" },
  { label: "Streaming", to: "/streaming" },
  { label: "AI Tools", to: "/ai-tools" },
  { label: "Education", to: "/education" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function TopUtilityBar() {
  return (
    <div className="relative z-40 border-b border-white/10 bg-background/40 backdrop-blur-2xl text-xs">
      {/* aurora hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-9 flex items-center justify-between">
        <div className="flex items-center gap-4 text-white/75">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Zap className="w-3 h-3 text-aqua" />
            Fast • Secure • Reliable
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-white/60">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            100% Verified Service
          </span>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-white/60">
            <Sparkles className="w-3 h-3 text-violet-300" />
            Instant Delivery
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 text-white/65">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="hover:text-aqua transition"
                aria-label="social"
              >
                <Icon className="w-3 h-3" />
              </a>
            ))}
          </div>
          <a
            href="tel:+8801580607614"
            className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-white transition"
          >
            <PhoneCall className="w-3 h-3 text-aqua" />
            +880 1580-607614
          </a>
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            Online · 11 AM – 11 PM
          </span>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <TopUtilityBar />
      <header className="sticky top-0 z-40">
        {/* aurora glow behind header */}
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 overflow-hidden">
          <div className="absolute left-1/4 top-0 w-[420px] h-[220px] rounded-full bg-primary/30 blur-[110px]" />
          <div className="absolute right-1/4 top-0 w-[420px] h-[220px] rounded-full bg-aqua/25 blur-[110px]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[600px] h-[160px] rounded-full bg-violet-500/20 blur-[120px]" />
        </div>

        <div
          className={[
            "relative border-b border-white/10 transition-all duration-300",
            scrolled
              ? "bg-background/65 backdrop-blur-2xl shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)]"
              : "bg-background/35 backdrop-blur-xl",
          ].join(" ")}
        >
          {/* top hairline */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/60 to-transparent" />

          <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-[68px] flex items-center justify-between gap-6">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0 group"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="relative grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,229,255,0.6)]">
                <Crown className="w-5 h-5" />
                <span className="absolute -inset-1 rounded-2xl bg-conic opacity-50 blur-md -z-10 animate-aurora-pan" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-semibold tracking-[0.22em] uppercase text-white/55">
                  Premium Access
                </span>
                <span className="block text-lg font-bold tracking-tight text-white">
                  AccessNow <span className="text-aurora">BD</span>
                </span>
              </span>
            </Link>

            {/* Nav — pill glass */}
            <nav className="hidden lg:flex items-center gap-1 px-2 h-12 rounded-full glass-soft border border-white/10 text-sm font-semibold backdrop-blur-2xl">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="relative px-4 py-2 rounded-full text-white/75 hover:text-white transition-colors"
                  activeProps={{
                    className:
                      "text-white bg-gradient-to-r from-primary/30 via-violet-500/20 to-aqua/25 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-10px_rgba(0,229,255,0.55)]",
                  }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                to="/products"
                className="hidden md:inline-flex items-center gap-2 h-11 px-4 rounded-full glass-soft border border-white/10 text-sm text-white/80 hover:text-white hover:border-aqua/40 transition group"
                aria-label="Search products"
              >
                <Search className="w-4 h-4 text-aqua" />
                <span className="text-white/55 font-medium">Search products…</span>
                <span className="ml-2 hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-white/55 border border-white/10">
                  ⌘K
                </span>
              </Link>

              <AccountIcon />
              <CartIcon />

              {user ? (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground text-sm font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)] hover:scale-[1.03] transition"
                  >
                    <UserCircle2 className="w-4 h-4" />
                    <span className="max-w-[120px] truncate">
                      {user.email?.split("@")[0] ?? "Account"}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="grid place-items-center w-11 h-11 rounded-full glass-soft border border-white/10 text-white/80 hover:text-white hover:border-rose-400/40 transition"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground text-sm font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)] hover:scale-[1.03] transition"
                >
                  <LogIn className="w-4 h-4" /> Login / Sign Up
                </Link>
              )}

              <button
                onClick={() => setOpen((o) => !o)}
                className="lg:hidden grid place-items-center w-11 h-11 rounded-full glass-soft border border-white/10 text-white"
                aria-label="Menu"
              >
                {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* bottom soft hairline */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden relative border-b border-white/10 bg-background/85 backdrop-blur-2xl">
            <nav className="mx-auto max-w-[1440px] px-4 py-4 grid grid-cols-2 gap-2.5">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl glass-soft border border-white/10 text-sm font-semibold text-white hover:border-aqua/40 hover:bg-white/5 transition"
                >
                  {n.label}
                  <ChevronRight className="w-4 h-4 text-aqua" />
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-4 grid gap-2">
              {user ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground text-sm font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)]"
                  >
                    <UserCircle2 className="w-4 h-4" /> My Account
                  </Link>
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await handleLogout();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full glass-soft border border-white/10 text-white text-sm font-semibold hover:border-rose-400/40 transition"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground text-sm font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)]"
                >
                  <LogIn className="w-4 h-4" /> Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
