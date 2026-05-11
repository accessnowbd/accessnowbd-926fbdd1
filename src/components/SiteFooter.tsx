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
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  Lock,
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

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/5 bg-[#050617]/80 backdrop-blur-2xl">
      {/* Ambient aurora glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full bg-aqua/10 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-20 pb-10">
        {/* ===== Main grid ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 mb-16">
          {/* === Brand & mission === */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-5">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <span className="relative grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-tr from-primary via-violet-500 to-aqua text-white shadow-[0_0_24px_rgba(124,58,237,0.45)]">
                  <Crown className="w-5 h-5" />
                </span>
                <span
                  className="text-[22px] font-extrabold tracking-tight text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  AccessNow
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-aqua">
                    {" "}BD
                  </span>
                </span>
              </Link>
              <p className="text-[13.5px] leading-relaxed text-white/55 max-w-sm">
                Premium digital subscription marketplace. Get instant access to
                global services with local convenience.
                <span className="block mt-2 text-white/45">
                  প্রিমিয়াম ডিজিটাল সাবস্ক্রিপশন এখন আরও সহজ এবং সাশ্রয়ী।
                </span>
              </p>
            </div>

            {/* Contact rail */}
            <div className="space-y-3">
              {[
                { Icon: Phone, label: "+880 1580-607614", href: "tel:+8801580607614", tint: "text-aqua" },
                { Icon: Mail, label: "support@accessnowbd.com", href: "mailto:support@accessnowbd.com", tint: "text-primary" },
                { Icon: MapPin, label: "Dhaka, Bangladesh", href: "#", tint: "text-emerald-400" },
              ].map(({ Icon, label, href, tint }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-3 text-[13.5px] text-white/75 hover:text-white transition"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 group-hover:border-white/25 transition">
                    <Icon className={`w-3.5 h-3.5 ${tint}`} />
                  </span>
                  <span className="font-medium">{label}</span>
                </a>
              ))}
            </div>

            {/* Live status pill */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10.5px] font-extrabold text-emerald-300 uppercase tracking-[0.22em]">
                Servers Live · 11 AM – 11 PM
              </span>
            </div>
          </div>

          {/* === Navigation columns === */}
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

          {/* === Newsletter & social === */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <h4
                className="text-white font-bold text-[11px] uppercase tracking-[0.22em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Newsletter
              </h4>
              <p className="text-white/55 text-xs leading-relaxed">
                নতুন প্রোডাক্ট, কুপন ও অফার সরাসরি ইনবক্সে। No spam ever.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative"
              >
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/40 transition-all"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 grid place-items-center w-9 h-9 bg-gradient-to-br from-primary to-violet-600 text-white rounded-md hover:brightness-110 transition"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-3">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid place-items-center w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 text-white/65 hover:text-white hover:bg-white/10 hover:border-aqua/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Trust + payment strip ===== */}
        <div className="py-7 border-y border-white/5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/35 mr-2">
              We accept
            </span>
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.04] text-white/75 text-[10.5px] font-bold tracking-wide hover:border-aqua/40 hover:text-white transition"
              >
                {p}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-1.5 bg-white/[0.03]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-extrabold text-white tracking-[0.18em]">
                SSL SECURED
              </span>
            </div>
            <div className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-1.5 bg-white/[0.03]">
              <ShieldCheck className="w-3 h-3 text-aqua" />
              <span className="text-[10px] font-extrabold text-white tracking-[0.18em]">
                ENCRYPTED
              </span>
            </div>
          </div>
        </div>

        {/* ===== Bottom bar ===== */}
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
            className="group flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-aqua/40 rounded-full transition-all"
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
