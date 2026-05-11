import { Link } from "@tanstack/react-router";
import {
  
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Send,
  Mail,
  MapPin,
  PhoneCall,
  Package,
  Info,
  FileText,
} from "lucide-react";
import accessNowLogo from "@/assets/accessnow-bd-mark.png";

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
  | "/login"
  | "/register"
  | "/forgot-password"
  | "/cart"
  | "/checkout";

const COLUMNS: {
  title: string;
  Icon: typeof Package;
  iconBg: string;
  bullet: string;
  links: { label: string; to: LinkTo }[];
}[] = [
  {
    title: "Products",
    Icon: Package,
    iconBg: "from-primary to-aqua",
    bullet: "bg-aqua",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Streaming", to: "/streaming" },
      { label: "AI Tools", to: "/ai-tools" },
      { label: "Education", to: "/education" },
      { label: "My Cart", to: "/cart" },
      { label: "Checkout", to: "/checkout" },
    ],
  },
  {
    title: "Information",
    Icon: Info,
    iconBg: "from-primary to-aqua",
    bullet: "bg-aqua",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "My Account", to: "/profile" },
      { label: "My Orders", to: "/orders" },
      { label: "Sign In", to: "/login" },
      { label: "Create Account", to: "/register" },
      { label: "Forgot Password", to: "/forgot-password" },
    ],
  },
  {
    title: "Policies",
    Icon: FileText,
    iconBg: "from-primary to-aqua",
    bullet: "bg-aqua",
    links: [
      { label: "Privacy Policy", to: "/faq" },
      { label: "Terms & Conditions", to: "/faq" },
      { label: "Refund & Return Policy", to: "/faq" },
      { label: "Order & Cancellation", to: "/faq" },
      { label: "Delivery Info", to: "/faq" },
      { label: "Refund Request", to: "/contact" },
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

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/10 bg-background/35 backdrop-blur-xl">
      {/* aurora glow behind footer */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 overflow-hidden">
        <div className="absolute left-1/4 top-0 w-[420px] h-[220px] rounded-full bg-primary/30 blur-[110px]" />
        <div className="absolute right-1/4 top-0 w-[420px] h-[220px] rounded-full bg-aqua/25 blur-[110px]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-6 w-[600px] h-[160px] rounded-full bg-violet-500/20 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-aqua/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-10 pt-12 pb-8">
        {/* ===== Brand hero card ===== */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent backdrop-blur-xl p-8 md:p-10 overflow-hidden">
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[640px] h-[260px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="relative flex flex-col items-center text-center">
            {/* === Brand lockup — same construction as header, scaled up === */}
            <Link to="/" className="group inline-flex items-center gap-3 sm:gap-4">
              {/* Round badge */}
              <span className="relative shrink-0">
                {/* Outer rotating gradient ring */}
                <span
                  aria-hidden
                  className="absolute -inset-[2.5px] rounded-full opacity-90"
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
                  className="pointer-events-none absolute -inset-3 rounded-full opacity-60 blur-xl -z-10"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(56,128,255,0.55) 0%, rgba(31,199,150,0.3) 50%, transparent 75%)",
                  }}
                />
                {/* Inner round badge */}
                <span
                  className="relative grid place-items-center w-16 h-16 md:w-[72px] md:h-[72px] rounded-full overflow-hidden ring-1 ring-white/40 shadow-[0_10px_28px_-6px_rgba(56,128,255,0.55)] backdrop-blur-xl group-hover:scale-105 transition-transform duration-500"
                  style={{
                    background:
                      "radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(225,236,255,0.9) 55%, rgba(196,218,255,0.88) 100%)",
                  }}
                >
                  <span className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-white/80 blur-[3px]" />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full opacity-50"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 50% 110%, rgba(31,199,150,0.35) 0%, transparent 70%)",
                    }}
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_-6px_12px_-6px_rgba(30,79,216,0.25)]" />
                  <img
                    src={accessNowLogo}
                    alt="AccessNow BD"
                    draggable={false}
                    className="relative w-[145%] h-[145%] object-contain translate-y-[2%] drop-shadow-[0_2px_4px_rgba(30,79,216,0.3)]"
                  />
                </span>
              </span>

              {/* Wordmark */}
              <span className="leading-[1.05] min-w-0 text-left">
                <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                  <span
                    className="text-[24px] sm:text-[28px] md:text-[32px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #7cb6ff 0%, #2f6dff 55%, #1e3fb8 100%)",
                      filter: "drop-shadow(0 1px 6px rgba(47,109,255,0.35))",
                    }}
                  >
                    Access
                  </span>
                  <span
                    className="text-[24px] sm:text-[28px] md:text-[32px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #6ce4b8 0%, #1fc796 55%, #0e9472 100%)",
                      filter: "drop-shadow(0 1px 6px rgba(31,199,150,0.35))",
                    }}
                  >
                    Now
                  </span>
                  <span
                    className="text-[24px] sm:text-[28px] md:text-[32px] font-extrabold tracking-tight bg-clip-text text-transparent"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #ffd86b 0%, #f59e0b 55%, #c2780a 100%)",
                      filter: "drop-shadow(0 1px 6px rgba(245,158,11,0.35))",
                    }}
                  >
                    BD
                  </span>
                </span>
                <span className="flex w-full items-center justify-between mt-1.5">
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Fast
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#2f6dff] shadow-[0_0_6px_rgba(47,109,255,0.8)]" />
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Secure
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#1fc796] shadow-[0_0_6px_rgba(31,199,150,0.8)]" />
                  <span className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-white/70">
                    Reliable
                  </span>
                </span>
              </span>
            </Link>

            <p className="mt-3 text-[10.5px] tracking-[0.32em] text-white/45 font-bold">
              ACCESSNOWBD.COM
            </p>

            <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-white/75">
              বাংলাদেশের সবচেয়ে{" "}
              <span className="text-white font-bold">বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস</span>{" "}
              — ভেরিফাইড সাবস্ক্রিপশন, সফটওয়্যার লাইসেন্স, AI টুলস ও{" "}
              <span className="text-white font-bold">২৪/৭ লাইভ সাপোর্টে</span>{" "}
              আপনার ডিজিটাল প্রয়োজন এক ক্লিকেই পূরণ।
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {[
                { Icon: PhoneCall, label: "+880 1580-607614", href: "tel:+8801580607614", iconBg: "from-primary to-aqua" },
                { Icon: Mail, label: "support@accessnowbd.com", href: "mailto:support@accessnowbd.com", iconBg: "from-primary to-aqua" },
                { Icon: MapPin, label: "Dhaka, Bangladesh", href: "#", iconBg: "from-primary to-aqua" },
              ].map(({ Icon, label, href, iconBg }) => (
                <a
                  key={label}
                  href={href}
                  className="group inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-aqua/40 transition"
                >
                  <span className={`grid place-items-center w-7 h-7 rounded-full bg-gradient-to-br ${iconBg} text-white`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-white/85 group-hover:text-white">
                    {label}
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-3">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center w-11 h-11 rounded-full border border-white/10 bg-white/[0.04] text-white/75 hover:text-white hover:border-aqua/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Three column grid ===== */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <div
              key={col.title}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent backdrop-blur-xl p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className={`grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br ${col.iconBg} text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]`}>
                  <col.Icon className="w-5 h-5" />
                </span>
                <h4
                  className="text-white font-extrabold text-[13px] uppercase tracking-[0.28em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {col.title}
                </h4>
              </div>
              <ul className="space-y-3.5">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-2.5 text-[14px] text-white/70 hover:text-white transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${col.bullet} opacity-80 group-hover:scale-125 transition-transform`} />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== Bottom bar ===== */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-[12.5px] text-white/55 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>© 2026</span>
            <span className="text-white/30">·</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua font-extrabold">
              AccessNow BD
            </span>
            <span className="text-white/30">·</span>
            <span>All Rights Reserved</span>
            <span className="text-white/30">·</span>
            <span>Designed &amp; Developed by</span>
            <a
              href="https://shahedit.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded-full border border-white/15 bg-white/[0.04] text-white font-bold hover:border-aqua/40 hover:text-aqua transition"
            >
              Shahed IT
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-white/40 mr-1">
              We accept
            </span>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-white/80 text-[11px] font-bold hover:border-aqua/40 hover:text-white transition"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
