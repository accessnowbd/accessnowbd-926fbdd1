import { Link } from "@tanstack/react-router";
import accessNowLogo from "@/assets/accessnow-bd-mark.png";
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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { GlobalSearch, useGlobalSearch } from "@/components/GlobalSearch";

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
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();

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

          <div className="mx-auto max-w-[1440px] px-3 sm:px-4 md:px-10 h-[64px] md:h-[68px] flex items-center justify-between gap-2 md:gap-5 flex-nowrap">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {/* Brand logo image with soft aurora glow */}
              <span className="relative shrink-0">
                <span
                  className="absolute -inset-1.5 rounded-[18px] opacity-60 blur-md -z-10"
                  style={{
                    background:
                      "conic-gradient(from 0deg, rgba(56,128,255,0.85), rgba(34,197,160,0.85), rgba(245,158,11,0.7), rgba(56,128,255,0.85))",
                    animation: "aurora-pan 6s linear infinite",
                  }}
                />
                <span className="relative grid place-items-center w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white shadow-[0_12px_32px_-8px_rgba(56,128,255,0.55)] ring-1 ring-white/20 overflow-hidden group-hover:scale-105 group-hover:rotate-[-4deg] transition-transform duration-500">
                  <img
                    src={accessNowLogo}
                    alt="AccessNow BD"
                    className="w-9 h-9 md:w-10 md:h-10 object-contain"
                    draggable={false}
                  />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0a1f] shadow-[0_0_10px_rgba(16,185,129,0.7)]">
                  <ShieldCheck className="w-2 h-2 text-emerald-900" strokeWidth={3} />
                </span>
              </span>

              {/* Wordmark — matches logo color story (blue / green / amber) */}
              <span className="leading-[1.05] min-w-0">
                <span className="flex items-baseline gap-1 whitespace-nowrap">
                  <span
                    className="text-[16px] sm:text-[18px] md:text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #5aa8ff 0%, #1e4fd8 100%)",
                    }}
                  >
                    Access
                  </span>
                  <span
                    className="text-[16px] sm:text-[18px] md:text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #4ad6a8 0%, #16a37a 100%)",
                    }}
                  >
                    Now
                  </span>
                  <span
                    className="text-[16px] sm:text-[18px] md:text-[20px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #fcd34d 0%, #d97706 100%)",
                    }}
                  >
                    BD
                  </span>
                </span>
                <span className="hidden sm:flex items-center gap-1.5 mt-0.5">
                  <span className="h-px w-3 bg-gradient-to-r from-transparent to-white/30" />
                  <span className="text-[8.5px] md:text-[9px] uppercase tracking-[0.32em] font-bold text-white/45">
                    Fast · Secure · Reliable
                  </span>
                  <span className="h-px w-3 bg-gradient-to-l from-transparent to-white/30" />
                </span>
              </span>
            </Link>

            {/* Nav — pill glass with magnetic sliding indicator */}
            <MagneticNav />

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden lg:inline-flex items-center gap-2 h-10 px-3.5 rounded-full glass-soft border border-white/10 text-sm text-white/80 hover:text-white hover:border-aqua/40 transition group"
                aria-label="Search products"
              >
                <Search className="w-4 h-4 text-aqua" />
                <span className="text-white/55 font-medium">Search…</span>
                <span className="ml-1 hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/10 text-white/55 border border-white/10">
                  ⌘K
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white shrink-0"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-aqua" />
              </button>


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
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-white text-sm font-semibold tracking-tight bg-gradient-to-r from-primary/30 via-violet-500/20 to-aqua/25 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-10px_rgba(0,229,255,0.55)] hover:from-primary/40 hover:via-violet-500/30 hover:to-aqua/35 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  Login / Register
                </Link>
              )}

              <button
                onClick={() => setOpen((o) => !o)}
                className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white shrink-0"
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
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function MagneticNav() {
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeIndex = NAV.findIndex((n) =>
    n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to)
  );

  // Position pill on the active item / hovered item
  useLayoutEffect(() => {
    const targetIdx = hoverIndex ?? activeIndex;
    const el = targetIdx >= 0 ? itemRefs.current[targetIdx] : null;
    const nav = navRef.current;
    if (!el || !nav) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - navRect.left, width: r.width, visible: true });
  }, [hoverIndex, activeIndex, location.pathname]);

  // Recompute on resize
  useEffect(() => {
    const onResize = () => {
      const targetIdx = hoverIndex ?? activeIndex;
      const el = targetIdx >= 0 ? itemRefs.current[targetIdx] : null;
      const nav = navRef.current;
      if (!el || !nav) return;
      const navRect = nav.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setPill({ left: r.left - navRect.left, width: r.width, visible: true });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hoverIndex, activeIndex]);

  // Mouse tracking on the nav container — magnet to nearest item
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const nav = navRef.current;
    if (!nav) return;
    const x = e.clientX;
    let nearest = 0;
    let nearestDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const dist = Math.abs(center - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    if (nearest !== hoverIndex) setHoverIndex(nearest);
  };

  const handleMouseLeave = () => setHoverIndex(null);

  return (
    <nav
      ref={navRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex relative items-center gap-1 px-2 h-12 rounded-full glass-soft border border-white/10 text-sm font-semibold backdrop-blur-2xl"
    >
      {/* Magnetic sliding pill */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-gradient-to-r from-primary/30 via-violet-500/20 to-aqua/25 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-10px_rgba(0,229,255,0.55)] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.visible ? 1 : 0,
        }}
      />
      {NAV.map((n, i) => (
        <Link
          key={n.to}
          to={n.to}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          className="relative z-10 px-4 py-2 rounded-full text-white/75 hover:text-white transition-colors"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
