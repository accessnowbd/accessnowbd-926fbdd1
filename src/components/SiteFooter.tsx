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
  Package,
  Info,
  FileText,
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

export function SiteFooter() {
  return (
    <footer className="relative mt-24 pb-10">
      {/* Aurora ambient glow — matches header */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-[10%] w-[520px] h-[520px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute top-32 right-[8%] w-[460px] h-[460px] rounded-full bg-aqua/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[760px] h-[280px] rounded-full bg-violet-500/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 md:px-8 space-y-8">
        {/* ===== Brand Hero Card ===== */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-background/40 backdrop-blur-2xl px-6 py-10 md:px-12 md:py-12 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
          {/* corner glows */}
          <div className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/25 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-aqua/20 blur-[100px]" />
          {/* hairlines */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative flex flex-col items-center text-center">
            {/* Logo + Brand */}
            <Link to="/" className="inline-flex items-center gap-4 group">
              <span className="relative grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-white shadow-[0_14px_36px_-10px_rgba(0,229,255,0.6)]">
                <Crown className="w-7 h-7" />
                <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-40 blur-md -z-10 animate-aurora-pan" />
              </span>
              <span className="leading-tight text-left">
                <span
                  className="block text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary via-violet-400 to-aqua bg-clip-text text-transparent"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  AccessNow BD
                </span>
                <span className="mt-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-white/55">
                  <span className="h-px w-6 bg-white/30" />
                  ACCESSNOWBD.COM
                  <span className="h-px w-6 bg-white/30" />
                </span>
              </span>
            </Link>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-sm md:text-[15px] leading-relaxed text-white/75">
              বাংলাদেশের সবচেয়ে{" "}
              <span className="font-bold text-aqua">বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস</span> —
              ভেরিফাইড সাবস্ক্রিপশন, সফটওয়্যার লাইসেন্স, AI টুলস ও{" "}
              <span className="font-bold text-violet-300">২৪/৭ লাইভ সাপোর্টে</span> আপনার
              ডিজিটাল প্রয়োজন এক ক্লিকেই পূরণ।
            </p>

            {/* Contact pills */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <ContactPill
                icon={Phone}
                label="+880 1580-607614"
                href="tel:+8801580607614"
                tone="violet"
              />
              <ContactPill
                icon={Mail}
                label="support@accessnowbd.com"
                href="mailto:support@accessnowbd.com"
                tone="aqua"
              />
              <ContactPill icon={MapPin} label="Dhaka, Bangladesh" tone="emerald" />
            </div>

            {/* Socials */}
            <div className="mt-7 flex items-center justify-center gap-3">
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
                  className="grid place-items-center w-11 h-11 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-aqua/60 hover:bg-aqua/10 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-10px_rgba(0,229,255,0.6)] transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Three Column Cards ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FooterColumn
            icon={Package}
            tone="violet"
            title="PRODUCTS"
            links={[
              { label: "All Products", to: "/products" },
              { label: "Streaming", to: "/streaming" },
              { label: "AI Tools", to: "/ai-tools" },
              { label: "Education", to: "/education" },
              { label: "My Cart", to: "/cart" },
              { label: "Checkout", to: "/checkout" },
            ]}
          />
          <FooterColumn
            icon={Info}
            tone="aqua"
            title="INFORMATION"
            links={[
              { label: "FAQ", to: "/faq" },
              { label: "Contact Us", to: "/contact" },
              { label: "My Account", to: "/profile" },
              { label: "My Orders", to: "/orders" },
              { label: "Sign In", to: "/auth" },
            ]}
          />
          <FooterColumn
            icon={FileText}
            tone="emerald"
            title="POLICIES"
            links={[
              { label: "Privacy Policy", to: "/faq" },
              { label: "Terms & Conditions", to: "/faq" },
              { label: "Refund & Return Policy", to: "/faq" },
              { label: "Order & Cancellation", to: "/faq" },
              { label: "Delivery Info", to: "/faq" },
              { label: "Refund Request", to: "/contact" },
            ]}
          />
        </div>

        {/* ===== Bottom Bar ===== */}
        <div className="relative pt-6">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1.5 text-white/65">
              <span className="text-white/45">©</span>
              <span className="text-white/90 font-semibold">2026</span>
              <span className="text-white/30">·</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua font-extrabold tracking-wide">
                AccessNow BD
              </span>
              <span className="text-white/30">·</span>
              <span className="text-white/55">All Rights Reserved</span>
              <span className="text-white/30">·</span>
              <span className="text-white/55">Designed &amp; Developed by</span>
              <a
                href="https://shahedit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 hover:border-primary/60 hover:bg-white/15 hover:shadow-[0_0_18px_-4px_var(--color-primary)] transition"
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
                  className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-white/85 text-[10px] font-bold tracking-wide hover:border-aqua/40 hover:text-white transition"
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

/* ============== Sub-components ============== */

type Tone = "violet" | "aqua" | "emerald";

const TONE_GRADIENT: Record<Tone, string> = {
  violet: "from-violet-500 to-fuchsia-500 shadow-[0_10px_24px_-8px_rgba(168,85,247,0.6)]",
  aqua: "from-cyan-400 to-blue-500 shadow-[0_10px_24px_-8px_rgba(0,229,255,0.55)]",
  emerald: "from-emerald-400 to-teal-500 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.55)]",
};

const TONE_DOT: Record<Tone, string> = {
  violet: "bg-violet-400/70",
  aqua: "bg-aqua/80",
  emerald: "bg-emerald-400/80",
};

const TONE_HOVER: Record<Tone, string> = {
  violet: "group-hover:text-violet-200",
  aqua: "group-hover:text-aqua",
  emerald: "group-hover:text-emerald-200",
};

function ContactPill({
  icon: Icon,
  label,
  href,
  tone,
}: {
  icon: typeof Mail;
  label: string;
  href?: string;
  tone: Tone;
}) {
  const inner = (
    <span className="inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition group">
      <span
        className={`grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br ${TONE_GRADIENT[tone]} text-white`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-sm font-semibold text-white/90 group-hover:text-white">
        {label}
      </span>
    </span>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function FooterColumn({
  icon: Icon,
  tone,
  title,
  links,
}: {
  icon: typeof Package;
  tone: Tone;
  title: string;
  links: { label: string; to: LinkTo }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-background/40 backdrop-blur-2xl p-6 md:p-7 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)] hover:border-white/20 transition">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="flex items-center gap-3 mb-5">
        <span
          className={`grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br ${TONE_GRADIENT[tone]} text-white`}
        >
          <Icon className="w-5 h-5" />
        </span>
        <h4
          className="text-sm font-extrabold tracking-[0.22em] uppercase text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h4>
      </div>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white transition"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[tone]} transition group-hover:scale-125`}
              />
              <span className={`transition-transform group-hover:translate-x-0.5 ${TONE_HOVER[tone]}`}>
                {l.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
