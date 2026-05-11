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
    iconBg: "from-fuchsia-500 to-violet-600",
    bullet: "bg-fuchsia-400",
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
    iconBg: "from-sky-400 to-blue-600",
    bullet: "bg-sky-400",
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
    Icon: FileText,
    iconBg: "from-emerald-400 to-teal-600",
    bullet: "bg-emerald-400",
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
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua shadow-[0_12px_40px_-10px_rgba(124,58,237,0.7)]">
                <Crown className="w-6 h-6 text-white" />
              </span>
              <div className="text-left">
                <h3
                  className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary via-violet-300 to-aqua bg-clip-text text-transparent"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  AccessNow BD
                </h3>
                <p className="text-[10.5px] tracking-[0.32em] text-white/45 font-bold mt-0.5">
                  ACCESSNOWBD.COM
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-white/75">
              বাংলাদেশের সবচেয়ে{" "}
              <span className="text-white font-bold">বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস</span>{" "}
              — ভেরিফাইড সাবস্ক্রিপশন, সফটওয়্যার লাইসেন্স, AI টুলস ও{" "}
              <span className="text-white font-bold">২৪/৭ লাইভ সাপোর্টে</span>{" "}
              আপনার ডিজিটাল প্রয়োজন এক ক্লিকেই পূরণ।
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {[
                { Icon: PhoneCall, label: "+880 1580-607614", href: "tel:+8801580607614", iconBg: "from-fuchsia-500 to-violet-600" },
                { Icon: Mail, label: "support@accessnowbd.com", href: "mailto:support@accessnowbd.com", iconBg: "from-sky-400 to-blue-600" },
                { Icon: MapPin, label: "Dhaka, Bangladesh", href: "#", iconBg: "from-emerald-400 to-teal-600" },
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
