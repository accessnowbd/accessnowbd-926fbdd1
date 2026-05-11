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
  ChevronRight,
  Zap,
  ShieldCheck,
  Sparkles,
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

const COLUMNS: { title: string; links: { label: string; to: LinkTo }[] }[] = [
  {
    title: "Products",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Streaming", to: "/streaming" },
      { label: "AI Tools", to: "/ai-tools" },
      { label: "Education", to: "/education" },
      { label: "My Cart", to: "/cart" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "My Account", to: "/profile" },
      { label: "My Orders", to: "/orders" },
      { label: "Sign In", to: "/auth" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Privacy Policy", to: "/faq" },
      { label: "Terms & Conditions", to: "/faq" },
      { label: "Refund & Return", to: "/faq" },
      { label: "Order & Cancellation", to: "/faq" },
      { label: "Delivery Info", to: "/faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24">
      {/* Aurora ambient glow — matches header */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-[8%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute top-32 right-[6%] w-[460px] h-[460px] rounded-full bg-aqua/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[820px] h-[280px] rounded-full bg-violet-500/15 blur-[140px]" />
      </div>

      {/* Top hairline like header */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-8 pt-16 pb-8">
        {/* ===== Top: Brand + Newsletter row ===== */}
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
          {/* Brand block */}
          <div>
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

            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
              বাংলাদেশের সবচেয়ে{" "}
              <span className="font-semibold text-aqua">বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস</span> —
              ভেরিফাইড সাবস্ক্রিপশন, সফটওয়্যার লাইসেন্স ও{" "}
              <span className="font-semibold text-violet-300">২৪/৭ লাইভ সাপোর্ট</span>।
            </p>

            {/* Trust strip */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Zap className="w-3.5 h-3.5 text-aqua" /> Fast Delivery
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Verified
              </span>
              <span className="inline-flex items-center gap-1.5 text-white/70">
                <Sparkles className="w-3.5 h-3.5 text-violet-300" /> 24/7 Support
              </span>
            </div>

            {/* Contact line */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <a
                href="tel:+8801580607614"
                className="group inline-flex items-center gap-2 text-white/75 hover:text-white transition"
              >
                <span className="grid place-items-center w-7 h-7 rounded-md bg-white/[0.04] border border-white/10 group-hover:border-aqua/40 group-hover:bg-aqua/10 transition">
                  <Phone className="w-3.5 h-3.5 text-aqua" />
                </span>
                +880 1580-607614
              </a>
              <a
                href="mailto:support@accessnowbd.com"
                className="group inline-flex items-center gap-2 text-white/75 hover:text-white transition"
              >
                <span className="grid place-items-center w-7 h-7 rounded-md bg-white/[0.04] border border-white/10 group-hover:border-violet-400/40 group-hover:bg-violet-500/10 transition">
                  <Mail className="w-3.5 h-3.5 text-violet-300" />
                </span>
                support@accessnowbd.com
              </a>
              <span className="inline-flex items-center gap-2 text-white/65">
                <span className="grid place-items-center w-7 h-7 rounded-md bg-white/[0.04] border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                Dhaka, Bangladesh
              </span>
            </div>
          </div>

          {/* Newsletter / CTA */}
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/40 to-transparent" />
            <h4
              className="text-base font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              নিউজলেটারে যুক্ত হোন
            </h4>
            <p className="mt-1.5 text-xs text-white/60">
              নতুন প্রোডাক্ট, অফার ও ডিসকাউন্ট সরাসরি আপনার ইনবক্সে।
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-background/40 backdrop-blur-md p-1.5 focus-within:border-aqua/50 transition"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/35 px-3 py-2"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-primary via-violet-500 to-aqua hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,0.7)] transition"
              >
                Subscribe <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-2.5">
              {[
                { Icon: Facebook, href: "#", label: "Facebook" },
                { Icon: MessageCircle, href: "https://wa.me/8801580607614", label: "WhatsApp" },
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Youtube, href: "#", label: "YouTube" },
                { Icon: Send, href: "#", label: "Telegram" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:border-aqua/50 hover:bg-aqua/10 transition"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* divider */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* ===== Link columns — Glassmorphism cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {COLUMNS.map((col, idx) => {
            const accents = [
              { ring: "from-primary/60", glow: "rgba(124,58,237,0.35)", dot: "bg-primary" },
              { ring: "from-aqua/60", glow: "rgba(0,229,255,0.32)", dot: "bg-aqua" },
              { ring: "from-violet-400/60", glow: "rgba(167,139,250,0.32)", dot: "bg-violet-400" },
            ][idx % 3];
            return (
              <div
                key={col.title}
                className="group/card relative rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.06] hover:border-white/[0.14]"
                style={{
                  boxShadow:
                    "0 24px 60px -30px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)",
                }}
              >
                {/* Top hairline accent */}
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accents.ring} to-transparent`}
                />
                {/* Soft radial glow inside */}
                <div
                  className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
                  style={{ background: accents.glow }}
                />
                {/* Subtle grid texture */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />

                <h5
                  className="relative text-[11px] font-extrabold tracking-[0.28em] uppercase text-white mb-4 flex items-center gap-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${accents.dot} shadow-[0_0_12px_currentColor]`} />
                  {col.title}
                  <span className="flex-1 h-px bg-gradient-to-r from-white/15 to-transparent" />
                </h5>
                <ul className="relative space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.to + l.label}>
                      <Link
                        to={l.to}
                        className="group/link inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition"
                      >
                        <ChevronRight className="w-3 h-3 text-white/30 group-hover/link:text-aqua group-hover/link:translate-x-0.5 transition" />
                        <span className="group-hover/link:underline underline-offset-4 decoration-aqua/50">
                          {l.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ===== Bottom Bar ===== */}
        <div className="relative mt-12 pt-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1.5 text-white/60">
              <span className="text-white/40">©</span>
              <span className="text-white/85 font-semibold">2026</span>
              <span className="text-white/25">·</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua font-extrabold tracking-wide">
                AccessNow BD
              </span>
              <span className="text-white/25">·</span>
              <span className="text-white/50">All Rights Reserved</span>
              <span className="text-white/25">·</span>
              <span className="text-white/50">Designed &amp; Developed by</span>
              <a
                href="https://shahedit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/15 hover:border-primary/60 hover:bg-white/10 hover:shadow-[0_0_18px_-4px_var(--color-primary)] transition"
              >
                <span className="text-white font-extrabold tracking-wide">Shahed IT</span>
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/40 mr-1">
                We accept
              </span>
              {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/80 text-[10px] font-bold tracking-wide hover:border-aqua/40 hover:text-white transition"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
