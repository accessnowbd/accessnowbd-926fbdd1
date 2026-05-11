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
  Phone,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  Sparkles,
  Clock,
  Terminal,
  ArrowUp,
} from "lucide-react";

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

const COLUMNS: { num: string; title: string; links: { label: string; to: LinkTo }[] }[] = [
  {
    num: "01",
    title: "Explore",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Streaming", to: "/streaming" },
      { label: "AI Tools", to: "/ai-tools" },
      { label: "Education", to: "/education" },
      { label: "My Cart", to: "/cart" },
    ],
  },
  {
    num: "02",
    title: "Account",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "My Account", to: "/profile" },
      { label: "My Orders", to: "/orders" },
      { label: "Sign In", to: "/auth" },
    ],
  },
  {
    num: "03",
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/faq" },
      { label: "Terms & Conditions", to: "/faq" },
      { label: "Refund & Return", to: "/faq" },
      { label: "Order & Cancellation", to: "/faq" },
      { label: "Delivery Info", to: "/faq" },
    ],
  },
];

const TICKER = [
  { icon: Zap, label: "INSTANT DELIVERY" },
  { icon: ShieldCheck, label: "100% VERIFIED" },
  { icon: Sparkles, label: "24/7 LIVE SUPPORT" },
  { icon: Crown, label: "5000+ HAPPY CUSTOMERS" },
  { icon: Clock, label: "~2 MIN RESPONSE" },
];

const SOCIALS = [
  { Icon: Facebook, href: "#", label: "Facebook" },
  { Icon: MessageCircle, href: "https://wa.me/8801580607614", label: "WhatsApp" },
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Youtube, href: "#", label: "YouTube" },
  { Icon: Send, href: "#", label: "Telegram" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Aurora ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-10 left-[8%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute top-32 right-[6%] w-[460px] h-[460px] rounded-full bg-aqua/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[820px] h-[280px] rounded-full bg-violet-500/15 blur-[140px]" />
      </div>

      {/* ===== 1. Marquee ticker strip ===== */}
      <div className="relative border-y border-white/10 bg-gradient-to-r from-primary/10 via-violet-500/10 to-aqua/10 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#070922] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#070922] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-12 py-3 animate-marquee whitespace-nowrap">
          {[...TICKER, ...TICKER, ...TICKER].map(({ icon: Icon, label }, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-[11px] font-extrabold tracking-[0.25em] text-white/80">
              <Icon className="w-3.5 h-3.5 text-aqua" />
              {label}
              <span className="ml-12 w-1.5 h-1.5 rounded-full bg-white/30" />
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-8 pt-16 pb-6">
        {/* ===== 2. Main grid: brand statement (left) + numbered columns (right) ===== */}
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1.4fr]">
          {/* === LEFT: Brand block === */}
          <div className="space-y-7">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <span className="relative grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-white shadow-[0_14px_36px_-10px_rgba(0,229,255,0.6)]">
                <Crown className="w-6 h-6" />
                <span className="absolute -inset-0.5 rounded-xl bg-conic opacity-40 blur-md -z-10 animate-aurora-pan" />
              </span>
              <span className="leading-tight">
                <span
                  className="block text-2xl font-extrabold bg-gradient-to-r from-primary via-violet-400 to-aqua bg-clip-text text-transparent"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  AccessNow BD
                </span>
                <span className="text-[10px] font-bold tracking-[0.28em] uppercase text-white/55">
                  ACCESSNOWBD.COM
                </span>
              </span>
            </Link>

            {/* Manifesto / large statement */}
            <p
              className="text-[22px] md:text-[26px] leading-[1.25] font-bold text-white/90 max-w-md"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="text-white/40">Digital subscriptions,</span>{" "}
              <span className="bg-gradient-to-r from-primary via-violet-300 to-aqua bg-clip-text text-transparent">
                delivered in minutes
              </span>{" "}
              <span className="text-white/40">— not days.</span>
            </p>

            {/* Live status card */}
            <div className="relative max-w-md rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] backdrop-blur-md p-4 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
              <div className="flex items-center gap-3">
                <span className="relative grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400">
                    <span className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </span>
                </span>
                <div className="flex-1 leading-tight">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-300/90">
                    Live · Right Now
                  </div>
                  <div className="text-[13px] font-bold text-white mt-0.5">
                    আমরা এখন অনলাইনে — চ্যাট করুন
                  </div>
                </div>
                <a
                  href="https://wa.me/8801580607614"
                  className="grid place-items-center w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30 hover:text-white transition"
                  aria-label="WhatsApp"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Contact rail */}
            <div className="space-y-2.5">
              {[
                { Icon: Phone, label: "+880 1580-607614", href: "tel:+8801580607614", tint: "text-aqua" },
                { Icon: Mail, label: "support@accessnowbd.com", href: "mailto:support@accessnowbd.com", tint: "text-violet-300" },
                { Icon: MapPin, label: "Dhaka, Bangladesh", href: "#", tint: "text-emerald-400" },
              ].map(({ Icon, label, href, tint }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-3 text-sm text-white/70 hover:text-white transition"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 group-hover:border-white/30 group-hover:bg-white/[0.06] transition">
                    <Icon className={`w-3.5 h-3.5 ${tint}`} />
                  </span>
                  <span className="font-mono tracking-tight">{label}</span>
                  <span className="ml-auto opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all text-white/40">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* === RIGHT: Numbered columns + newsletter === */}
          <div className="space-y-8">
            {/* Numbered link columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {COLUMNS.map((col) => (
                <div key={col.num} className="relative">
                  <div className="flex items-baseline gap-2 mb-4 pb-3 border-b border-white/10">
                    <span
                      className="text-[11px] font-mono font-bold text-white/30 tracking-wider"
                      style={{ fontFamily: "var(--font-mono, monospace)" }}
                    >
                      / {col.num}
                    </span>
                    <h5
                      className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-white"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {col.title}
                    </h5>
                  </div>
                  <ul className="space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.to + l.label}>
                        <Link
                          to={l.to}
                          className="group/link inline-flex items-center gap-2 text-sm text-white/65 hover:text-white transition"
                        >
                          <span className="w-0 group-hover/link:w-4 h-px bg-gradient-to-r from-primary to-aqua transition-all duration-300" />
                          <span className="group-hover/link:translate-x-0.5 transition-transform duration-300">
                            {l.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Terminal-style newsletter */}
            <div className="relative rounded-2xl border border-white/10 bg-[#05060e]/80 backdrop-blur-xl overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.03]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                  <Terminal className="w-3 h-3" />
                  newsletter ~ subscribe
                </span>
              </div>

              <div className="p-5">
                <div className="font-mono text-[12px] text-white/55 mb-3 leading-relaxed">
                  <span className="text-emerald-400">$</span> subscribe --offers --early-access
                  <br />
                  <span className="text-aqua">→</span> নতুন প্রোডাক্ট, কুপন ও অফার সরাসরি ইনবক্সে।
                </div>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 focus-within:border-aqua/50 focus-within:ring-2 focus-within:ring-aqua/20 transition"
                >
                  <span className="pl-2 text-aqua font-mono text-sm">›</span>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30 px-2 py-2 font-mono"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-primary via-violet-500 to-aqua hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,0.7)] transition"
                  >
                    Subscribe <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 3. Huge animated wordmark ===== */}
        <div className="relative mt-16 mb-6 select-none">
          <div className="absolute inset-x-0 -top-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div
            aria-hidden
            className="relative text-center font-extrabold leading-[0.85] tracking-tighter"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(60px, 14vw, 200px)",
              backgroundImage:
                "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 60%, transparent 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "1px rgba(255,255,255,0.08)",
            }}
          >
            ACCESSNOW
            <span
              className="block bg-clip-text text-transparent animate-aurora-pan"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, rgba(124,58,237,0.6), rgba(0,229,255,0.7), rgba(167,139,250,0.6), rgba(0,229,255,0.7))",
                backgroundSize: "300% 100%",
                WebkitTextStroke: "0",
              }}
            >
              BD ✦
            </span>
          </div>
        </div>

        {/* ===== 4. Bottom utility bar ===== */}
        <div className="relative pt-6 border-t border-white/10">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] items-center">
            {/* Left: copy */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-white/55">
              <span className="text-white/30">©</span>
              <span className="text-white/80 font-semibold">2026</span>
              <span className="text-white/20">·</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua font-extrabold">
                AccessNow BD
              </span>
              <span className="text-white/20">·</span>
              <span>Crafted by</span>
              <a
                href="https://shahedit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/15 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_18px_-4px_var(--color-primary)] transition text-white font-extrabold"
              >
                Shahed IT
              </a>
            </div>

            {/* Center: socials orbit */}
            <div className="flex items-center justify-center gap-2">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="group relative grid place-items-center w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-aqua/50 hover:bg-aqua/10 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/20 via-violet-500/20 to-aqua/20 blur-md -z-10" />
                </a>
              ))}
            </div>

            {/* Right: payment + back to top */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/35 mr-1">
                We accept
              </span>
              {["bKash", "Nagad", "Rocket", "Visa"].map((p) => (
                <span
                  key={p}
                  className="px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/75 text-[10px] font-bold tracking-wide hover:border-aqua/40 hover:text-white transition"
                >
                  {p}
                </span>
              ))}
              <button
                onClick={() =>
                  typeof window !== "undefined" &&
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
                aria-label="Back to top"
                className="ml-2 grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary via-violet-500 to-aqua text-white shadow-[0_10px_28px_-10px_rgba(124,58,237,0.7)] hover:scale-110 transition"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
