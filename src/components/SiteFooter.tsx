import { Link } from "@tanstack/react-router";
import {
  Crown,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Send,
  Mail,
  MapPin,
  PhoneCall,
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Twitter,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type LinkTo =
  | "/"
  | "/products"
  | "/streaming"
  | "/ai-tools"
  | "/education"
  | "/faq"
  | "/contact"
  | "/orders"
  | "/profile"
  | "/auth"
  | "/cart"
  | "/checkout";

const FOOTER_NAV: { label: string; to: LinkTo }[] = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/products" },
  { label: "Streaming", to: "/streaming" },
  { label: "AI Tools", to: "/ai-tools" },
  { label: "Education", to: "/education" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

const COLUMNS: {
  title: string;
  hover: string;
  links: { label: string; to: LinkTo }[];
}[] = [
  {
    title: "Explore",
    hover: "hover:text-aqua",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Streaming", to: "/streaming" },
      { label: "AI Tools", to: "/ai-tools" },
      { label: "Education", to: "/education" },
      { label: "My Cart", to: "/cart" },
    ],
  },
  {
    title: "Account",
    hover: "hover:text-primary",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "My Account", to: "/profile" },
      { label: "My Orders", to: "/orders" },
      { label: "Sign In", to: "/auth" },
    ],
  },
  {
    title: "Legal",
    hover: "hover:text-white",
    links: [
      { label: "Privacy Policy", to: "/faq" },
      { label: "Terms & Conditions", to: "/faq" },
      { label: "Refund & Return", to: "/faq" },
      { label: "Order & Cancellation", to: "/faq" },
      { label: "Delivery Info", to: "/faq" },
    ],
  },
];

const SOCIALS = [
  { Icon: Facebook, href: "#", label: "Facebook" },
  { Icon: MessageCircle, href: "https://wa.me/8801580607614", label: "WhatsApp" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Youtube, href: "#", label: "YouTube" },
  { Icon: Send, href: "#", label: "Telegram" },
];

const PAYMENTS = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard"];

function FooterUtilityBar() {
  return (
    <div className="relative z-10 border-b border-white/10 bg-background/40 backdrop-blur-2xl text-xs">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/60 to-transparent" />
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

function MagneticFooterNav() {
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = hoverIndex != null ? itemRefs.current[hoverIndex] : null;
    const nav = navRef.current;
    if (!el || !nav) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - navRect.left, width: r.width, visible: true });
  }, [hoverIndex]);

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

  return (
    <nav
      ref={navRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
      className="hidden lg:flex relative items-center gap-1 px-2 h-12 rounded-full glass-soft border border-white/10 text-sm font-semibold backdrop-blur-2xl"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-gradient-to-r from-primary/30 via-violet-500/20 to-aqua/25 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_24px_-10px_rgba(0,229,255,0.55)] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: pill.left,
          width: pill.width,
          opacity: pill.visible ? 1 : 0,
        }}
      />
      {FOOTER_NAV.map((n, i) => (
        <Link
          key={n.to + n.label}
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

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-background/35 backdrop-blur-xl">
      {/* aurora glow behind footer — same as header */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 overflow-hidden">
        <div className="absolute left-1/4 top-0 w-[420px] h-[220px] rounded-full bg-primary/30 blur-[110px]" />
        <div className="absolute right-1/4 top-0 w-[420px] h-[220px] rounded-full bg-aqua/25 blur-[110px]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[600px] h-[160px] rounded-full bg-violet-500/20 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-aqua/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/60 to-transparent" />

      <FooterUtilityBar />

      {/* ===== Header-style brand + nav strip ===== */}
      <div className="relative bg-background/35 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-4 md:px-10 h-[64px] md:h-[68px] flex items-center justify-between gap-2 md:gap-5 flex-nowrap">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="relative shrink-0">
              <span
                className="absolute -inset-1.5 rounded-[18px] opacity-70 blur-md -z-10"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(124,58,237,0.9), rgba(0,229,255,0.9), rgba(168,85,247,0.9), rgba(0,229,255,0.9), rgba(124,58,237,0.9))",
                  animation: "aurora-pan 6s linear infinite",
                }}
              />
              <span className="relative grid place-items-center w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-primary-foreground shadow-[0_12px_32px_-8px_rgba(0,229,255,0.7)] ring-1 ring-white/20 group-hover:scale-105 group-hover:rotate-[-4deg] transition-transform duration-500">
                <Crown className="w-4 h-4 md:w-5 md:h-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
                <span className="absolute inset-x-1 top-1 h-3 rounded-full bg-white/25 blur-[2px]" />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0a1f] shadow-[0_0_10px_rgba(16,185,129,0.7)]">
                <ShieldCheck className="w-2 h-2 text-emerald-900" strokeWidth={3} />
              </span>
            </span>
            <span className="leading-[1.05] min-w-0">
              <span className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-[16px] sm:text-[18px] md:text-[19px] font-extrabold tracking-tight text-white">
                  AccessNow
                </span>
                <span
                  className="text-[16px] sm:text-[18px] md:text-[19px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua animate-aurora-pan"
                  style={{ backgroundSize: "200% 100%" }}
                >
                  BD
                </span>
              </span>
            </span>
          </Link>

          <MagneticFooterNav />
        </div>
        {/* mobile nav — pill grid like header mobile menu */}
        <nav className="lg:hidden mx-auto max-w-[1440px] px-4 pb-4 grid grid-cols-2 gap-2.5">
          {FOOTER_NAV.map((n) => (
            <Link
              key={n.to + n.label}
              to={n.to}
              className="flex items-center justify-between px-4 py-3 rounded-2xl glass-soft border border-white/10 text-sm font-semibold text-white hover:border-aqua/40 hover:bg-white/5 transition"
            >
              {n.label}
              <ArrowRight className="w-4 h-4 text-aqua" />
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      {/* ===== Body ===== */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 mb-16">
          {/* Brand & mission */}
          <div className="lg:col-span-4 space-y-8">
            <p className="text-[13.5px] leading-relaxed text-white/55 max-w-sm">
              Premium digital subscription marketplace. Get instant access to
              global services with local convenience.
              <span className="block mt-2 text-white/45">
                প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশন এখন আরও সহজ এবং সাশ্রয়ী।
              </span>
            </p>

            <div className="space-y-3">
              {[
                { Icon: PhoneCall, label: "+880 1580-607614", href: "tel:+8801580607614", tint: "text-aqua" },
                { Icon: Mail, label: "support@accessnowbd.com", href: "mailto:support@accessnowbd.com", tint: "text-primary" },
                { Icon: MapPin, label: "Dhaka, Bangladesh", href: "#", tint: "text-emerald-400" },
              ].map(({ Icon, label, href, tint }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-3 text-[13.5px] text-white/75 hover:text-white transition"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-full glass-soft border border-white/10 group-hover:border-aqua/40 transition">
                    <Icon className={`w-3.5 h-3.5 ${tint}`} />
                  </span>
                  <span className="font-medium">{label}</span>
                </a>
              ))}
            </div>

            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-soft border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10.5px] font-extrabold text-emerald-300 uppercase tracking-[0.22em]">
                Servers Live · 11 AM – 11 PM
              </span>
            </div>
          </div>

          {/* Columns */}
          <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {COLUMNS.map((col) => (
              <div key={col.title} className="space-y-5">
                <h4
                  className="text-white font-bold text-[11px] uppercase tracking-[0.22em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-3.5">
                  {col.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className={`text-zinc-400 ${col.hover} text-[13.5px] transition-colors duration-300`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter & social */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-5 rounded-2xl glass-soft border border-white/10 space-y-4">
              <h4
                className="text-white font-bold text-[11px] uppercase tracking-[0.22em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Newsletter
              </h4>
              <p className="text-white/55 text-xs leading-relaxed">
                নতুন প্রোডাক্ট, কুপন ও অফার সরাসরি ইনবক্সে। No spam ever.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/40 transition-all"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 grid place-items-center w-9 h-9 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-primary-foreground shadow-[0_12px_30px_-10px_rgba(124,58,237,0.7)] hover:scale-105 transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2.5">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white/70 hover:text-white hover:border-aqua/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Trust + payment strip */}
        <div className="py-7 border-y border-white/10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/35 mr-2">
              We accept
            </span>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full glass-soft border border-white/10 text-white/75 text-[10.5px] font-bold tracking-wide hover:border-aqua/40 hover:text-white transition"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 glass-soft border border-white/10 rounded-full px-3 py-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-extrabold text-white tracking-[0.18em]">
                SSL SECURED
              </span>
            </div>
            <div className="flex items-center gap-2 glass-soft border border-white/10 rounded-full px-3 py-1.5">
              <ShieldCheck className="w-3 h-3 text-aqua" />
              <span className="text-[10px] font-extrabold text-white tracking-[0.18em]">
                ENCRYPTED
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left">
            <p className="text-xs text-white/55">
              © 2026{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua font-extrabold">
                AccessNow BD
              </span>
              . Crafted by{" "}
              <a
                href="https://shahedit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white font-bold hover:text-aqua transition"
              >
                Shahed IT
              </a>
              .
            </p>
            <p className="text-[10.5px] text-white/35 mt-1">
              অ্যাক্সেসনাউ বিডি — আপনার ডিজিটাল সঙ্গী।
            </p>
          </div>

          <button
            onClick={() =>
              typeof window !== "undefined" &&
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-full glass-soft border border-white/10 hover:border-aqua/40 transition-all"
          >
            <span className="text-xs text-white/70 group-hover:text-white transition-colors">
              Back to top
            </span>
            <ArrowUp className="w-3.5 h-3.5 text-white/55 group-hover:text-aqua group-hover:-translate-y-0.5 transition-all" />
          </button>
        </div>
      </div>
    </footer>
  );
}
