import { Link } from "@tanstack/react-router";
import accessNowLogo from "@/assets/accessnow-bd-mark.webp";
import {
  Crown,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Search,
  MoreVertical,
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
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { GlobalSearch, useGlobalSearch } from "@/components/GlobalSearch";

const NAV: Array<{
  label: string;
  to: "/" | "/categories" | "/education" | "/faq" | "/contact";
}> = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/categories" },
  { label: "Education", to: "/education" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function TopUtilityBar() {
  return (
    <div className="relative z-40 overflow-hidden bg-background">
      <div
        className="relative mx-auto max-w-[1440px] px-3 sm:px-5 md:px-10 flex items-center justify-between gap-3 text-white"
        style={{
          minHeight: "clamp(32px, 2.6vw, 40px)",
          fontSize: "clamp(10.5px, 0.78vw, 12.5px)",
        }}
      >
        {/* LEFT — trust chips */}
        <div className="flex items-center" style={{ gap: "clamp(6px, 0.7vw, 14px)" }}>
          <span
            className="inline-flex items-center gap-1.5 font-bold tracking-tight rounded-full border border-white/10"
            style={{
              padding: "2px clamp(6px, 0.7vw, 12px)",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(0,229,255,0.18))",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.06), 0 4px 14px -6px rgba(0,229,255,0.4)",
            }}
          >
            <Zap className="w-3 h-3 text-aqua" strokeWidth={2.5} />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#fff,#bce8ff)" }}>
              Fast · Secure · Reliable
            </span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-white/75 font-medium">
            <span className="grid place-items-center w-4 h-4 rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/40">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" strokeWidth={2.5} />
            </span>
            <span className="hidden md:inline">100% Verified</span>
            <span className="md:hidden">Verified</span>
          </span>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-white/75 font-medium">
            <Sparkles className="w-3 h-3 text-violet-300" strokeWidth={2.5} />
            Instant Delivery
          </span>
        </div>

        {/* RIGHT — socials, phone, status */}
        <div className="flex items-center" style={{ gap: "clamp(6px, 0.8vw, 16px)" }}>
          <div className="hidden sm:flex items-center gap-1">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="social"
                className="grid place-items-center w-6 h-6 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <Icon className="w-3 h-3" strokeWidth={2.2} />
              </a>
            ))}
          </div>
          <span className="hidden sm:block w-px h-3.5 bg-white/15" />
          <a
            href="tel:+8801580607614"
            className="hidden md:inline-flex items-center gap-1.5 text-white/85 hover:text-white transition font-semibold"
          >
            <span className="grid place-items-center w-5 h-5 rounded-full bg-aqua/15 ring-1 ring-aqua/35">
              <PhoneCall className="w-2.5 h-2.5 text-aqua" strokeWidth={2.5} />
            </span>
            <span className="tabular-nums tracking-tight">+880 1580-607614</span>
          </a>
          <span className="hidden md:block w-px h-3.5 bg-white/15" />
          <span
            className="inline-flex items-center gap-1.5 font-bold rounded-full border border-emerald-400/30"
            style={{
              padding: "2px clamp(6px, 0.6vw, 10px)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))",
            }}
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-emerald-200">Online</span>
            <span className="text-white/70 font-medium hidden sm:inline">· 11 AM – 11 PM</span>
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
        <div
          className={[
            "relative transition-[background-color,box-shadow,backdrop-filter] duration-300 will-change-[background-color]",
            scrolled
              ? "bg-background/65 backdrop-blur-2xl shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)]"
              : "bg-background/35 backdrop-blur-xl",
          ].join(" ")}
        >
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
                  className="relative grid place-items-center w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden ring-1 ring-white/30 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.6)] group-hover:scale-105 transition-transform duration-500"
                  style={{ background: "#ffffff" }}
                >
                  {/* Top gloss highlight */}
                  <span className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-white/60 blur-[3px]" />
                  {/* Bottom inner shadow */}
                  <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_-6px_12px_-6px_rgba(0,0,0,0.08)]" />
                  <img
                    src={accessNowLogo}
                    alt="AccessNow BD"
                    draggable={false}
                    className="relative w-[145%] h-[145%] object-contain -translate-y-[6%] drop-shadow-[0_2px_4px_rgba(30,79,216,0.25)]"
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

              {/* Wordmark — matches footer brand (Access · Now · BD + tagline) */}
              <span className="leading-[1.05] min-w-0">
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span
                    className="text-[18px] sm:text-[20px] md:text-[24px] font-extrabold tracking-normal bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #7cb6ff 0%, #2f6dff 55%, #1e3fb8 100%)",
                    }}
                  >
                    Access
                  </span>
                  <span
                    className="text-[18px] sm:text-[20px] md:text-[24px] font-extrabold tracking-normal bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #6ce4b8 0%, #1fc796 55%, #0e9472 100%)",
                    }}
                  >
                    Now
                  </span>
                  <span
                    className="text-[18px] sm:text-[20px] md:text-[24px] font-extrabold tracking-normal bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #ffd86b 0%, #f59e0b 55%, #c2780a 100%)",
                    }}
                  >
                    BD
                  </span>
                </span>
                <span className="mt-1 flex w-full max-w-[180px] md:max-w-[200px] items-center justify-between gap-2">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Fast
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#2f6dff] shadow-[0_0_6px_rgba(47,109,255,0.8)]" />
                  <span className="text-[9px] md:text-[10px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Secure
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#1fc796] shadow-[0_0_6px_rgba(31,199,150,0.8)]" />
                  <span className="text-[9px] md:text-[10px] uppercase tracking-[0.22em] font-bold text-white/70">
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
                aria-label="Open search"
                className="hidden md:flex items-center gap-2 w-[260px] lg:w-[320px] xl:w-[360px] h-11 pl-4 pr-1.5 rounded-full bg-white border border-slate-200 shadow-[0_4px_14px_-8px_rgba(15,23,42,0.18)] hover:border-violet-400 hover:shadow-[0_6px_18px_-8px_rgba(124,58,237,0.35)] transition text-left"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="flex-1 text-sm text-slate-400 truncate">প্রোডাক্ট সার্চ করুন...</span>
                <kbd className="hidden lg:inline-flex items-center h-6 px-1.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-500 border border-slate-200">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="md:hidden grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white shrink-0"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-aqua" />
              </button>

              <div className="hidden md:flex items-center gap-1.5 md:gap-2">
                <ThemeSwitcher />

                <CartIcon />

                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-0 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)] hover:scale-[1.03] transition whitespace-nowrap"
                    style={{
                      paddingLeft: "clamp(10px, 1vw, 18px)",
                      paddingRight: "clamp(10px, 1vw, 18px)",
                      fontSize: "clamp(11.5px, 0.9vw, 14px)",
                    }}
                  >
                    <UserCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[120px] truncate">Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 h-8 sm:h-9 px-3.5 sm:px-4 rounded-full text-white text-[12px] sm:text-[13px] font-semibold tracking-tight bg-gradient-to-r from-primary via-violet-500 to-aqua shadow-[0_8px_22px_-10px_rgba(124,58,237,0.55)] hover:brightness-110 transition"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Login
                  </Link>
                )}
              </div>

              <button
                onClick={() => setOpen((o) => !o)}
                className="md:hidden grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white shrink-0"
                aria-label="Menu"
                aria-expanded={open}
              >
                {open ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile horizontal nav strip removed — nav lives in the three-dot menu */}

          {/* bottom hairline removed */}
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
                <div className="w-full inline-flex items-center p-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full text-white text-sm font-semibold hover:bg-white/[0.08] transition"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground text-sm font-bold shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)]"
                  >
                    Register
                  </Link>
                </div>
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
      className="hidden lg:flex relative items-center h-14 rounded-full border border-[#e4e7ff] font-semibold shrink min-w-0 max-w-full whitespace-nowrap overflow-hidden"
      style={{
        gap: "clamp(2px, 0.3vw, 6px)",
        paddingLeft: "clamp(10px, 0.9vw, 18px)",
        paddingRight: "clamp(10px, 0.9vw, 18px)",
        fontSize: "clamp(13px, 0.95vw, 15px)",
        background: "#ffffff",
        boxShadow: "0 6px 18px -10px rgba(79,70,229,0.22)",
      }}
    >
      {/* Sliding pill — light lavender with purple border (reference style) */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-11 rounded-full transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.visible ? 1 : 0,
          background: "#eef0ff",
          border: "1.5px solid #a5b0ff",
        }}
      />
      {NAV.map((n, i) => {
        const isActive = i === activeIndex;
        return (
          <Link
            key={n.to}
            to={n.to}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className={`relative z-10 py-2.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${
              isActive ? "text-[#4f46e5]" : "text-slate-700 hover:text-[#4f46e5]"
            }`}
            style={{
              paddingLeft: "clamp(12px, 1.2vw, 22px)",
              paddingRight: "clamp(12px, 1.2vw, 22px)",
            }}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
