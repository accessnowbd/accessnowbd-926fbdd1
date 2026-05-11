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
              {/* Brand logo — clean round premium badge */}
              <span className="relative shrink-0">
                {/* Outer rotating gradient ring */}
                <span
                  aria-hidden
                  className="absolute -inset-[2px] rounded-full opacity-90"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #2f6dff, #1fc796, #f59e0b, #2f6dff)",
                    animation: "aurora-pan 6s linear infinite",
                    filter: "blur(0.5px)",
                  }}
                />
                {/* Soft outer glow */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-2 rounded-full opacity-60 blur-lg -z-10"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(56,128,255,0.55) 0%, rgba(31,199,150,0.3) 50%, transparent 75%)",
                  }}
                />
                {/* Inner round badge — frosted light bg so dark logo strokes stay readable */}
                <span
                  className="relative grid place-items-center w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-1 ring-white/40 shadow-[0_8px_24px_-6px_rgba(56,128,255,0.55)] backdrop-blur-xl group-hover:scale-105 transition-transform duration-500"
                  style={{
                    background:
                      "radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(225,236,255,0.9) 55%, rgba(196,218,255,0.88) 100%)",
                  }}
                >
                  {/* Top gloss highlight */}
                  <span className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-white/80 blur-[3px]" />
                  {/* Subtle aurora wash from bottom */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full opacity-50"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 50% 110%, rgba(31,199,150,0.35) 0%, transparent 70%)",
                    }}
                  />
                  {/* Bottom inner shadow */}
                  <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_-6px_12px_-6px_rgba(30,79,216,0.25)]" />
                  <img
                    src={accessNowLogo}
                    alt="AccessNow BD"
                    draggable={false}
                    className="relative w-[145%] h-[145%] object-contain translate-y-[2%] drop-shadow-[0_2px_4px_rgba(30,79,216,0.3)]"
                  />
                  {/* Sweeping shine effect on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.7) 50%, transparent 65%)",
                    }}
                  />
                </span>
              </span>

              {/* Wordmark — matches the official logo (Access · Now · BD + tagline) */}
              <span className="leading-[1.05] min-w-0">
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span
                    className="text-[17px] sm:text-[19px] md:text-[22px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #7cb6ff 0%, #2f6dff 55%, #1e3fb8 100%)",
                      filter:
                        "drop-shadow(0 1px 6px rgba(47,109,255,0.35))",
                    }}
                  >
                    Access
                  </span>
                  <span
                    className="text-[17px] sm:text-[19px] md:text-[22px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #6ce4b8 0%, #1fc796 55%, #0e9472 100%)",
                      filter:
                        "drop-shadow(0 1px 6px rgba(31,199,150,0.35))",
                    }}
                  >
                    Now
                  </span>
                  <span
                    className="text-[17px] sm:text-[19px] md:text-[22px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #ffd86b 0%, #f59e0b 55%, #c2780a 100%)",
                      filter:
                        "drop-shadow(0 1px 6px rgba(245,158,11,0.35))",
                    }}
                  >
                    BD
                  </span>
                </span>
                <span className="hidden sm:flex w-full items-center justify-between mt-1">
                  <span className="text-[8.5px] md:text-[9.5px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Fast
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#2f6dff] shadow-[0_0_6px_rgba(47,109,255,0.8)]" />
                  <span className="text-[8.5px] md:text-[9.5px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Secure
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#1fc796] shadow-[0_0_6px_rgba(31,199,150,0.8)]" />
                  <span className="text-[8.5px] md:text-[9.5px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Reliable
                  </span>
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
                className="hidden xl:inline-flex items-center gap-2 h-10 px-3.5 rounded-full glass-soft border border-white/10 text-sm text-white/80 hover:text-white hover:border-aqua/40 transition group shrink-0"
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
                className="xl:hidden grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white shrink-0"
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
      className="hidden lg:flex relative items-center gap-0.5 xl:gap-1 px-1.5 xl:px-2 h-12 rounded-full glass-soft border border-white/10 text-[13px] xl:text-sm font-semibold backdrop-blur-2xl shrink min-w-0"
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
          className="relative z-10 px-2.5 xl:px-4 py-2 rounded-full text-white/75 hover:text-white transition-colors whitespace-nowrap"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
