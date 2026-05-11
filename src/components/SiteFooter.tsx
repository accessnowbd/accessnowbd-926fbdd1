import { Link } from "@tanstack/react-router";
import {
  Crown,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Heart,
  Clock,
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-24">
      {/* Aurora ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-[15%] w-[560px] h-[560px] rounded-full bg-primary/25 blur-[150px] animate-blob" />
        <div className="absolute top-20 right-[10%] w-[480px] h-[480px] rounded-full bg-aqua/20 blur-[140px] animate-blob" style={{ animationDelay: "4s" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-violet-500/20 blur-[140px]" />
      </div>

      {/* CTA — floating glass card */}
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 -translate-y-12">
        <div className="relative gradient-border-card overflow-hidden p-7 md:p-9">
          <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-aqua/30 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-violet-500/30 blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-white shadow-[0_14px_36px_-10px_rgba(0,229,255,0.6)] shrink-0">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.18em] uppercase text-aqua mb-2">
                  <Zap className="w-3 h-3" /> Newsletter
                </div>
                <div className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  Get exclusive deals & early access
                </div>
                <div className="text-xs md:text-sm text-white/65 mt-1 max-w-md">
                  Weekly drops on premium subscriptions, AI tools & more — no spam, ever.
                </div>
              </div>
            </div>
            <form
              className="flex items-center gap-2 w-full md:w-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="relative flex-1 md:w-80">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full h-12 rounded-full pl-11 pr-4 text-sm bg-white/5 border border-white/15 text-white placeholder:text-white/45 outline-none focus:border-aqua/60 focus:bg-white/10 transition"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua text-white text-sm font-bold inline-flex items-center gap-1.5 hover:scale-[1.04] transition shadow-[0_14px_30px_-10px_rgba(124,58,237,0.7)]"
              >
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="relative">
        {/* top hairline */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aqua/50 to-transparent" />

        <div className="relative glass border-y border-white/10 backdrop-blur-2xl">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10 pt-14 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-5">
              <Link to="/" className="inline-flex items-center gap-3 group">
                <span className="relative grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-white shadow-[0_12px_30px_-8px_rgba(0,229,255,0.55)]">
                  <Crown className="w-5 h-5" />
                  <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-50 blur-md -z-10 animate-aurora-pan" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] font-semibold tracking-[0.22em] uppercase text-white/55">
                    Premium Access
                  </span>
                  <span
                    className="block text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    AccessNow <span className="text-aurora">BD</span>
                  </span>
                </span>
              </Link>

              <p className="text-sm text-white/70 mt-5 max-w-md leading-relaxed">
                Bangladesh's premium digital marketplace for subscriptions, software licenses,
                AI tools, education and entertainment access — delivered instantly with verified support.
              </p>

              {/* Trust badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { icon: ShieldCheck, label: "Verified Seller", color: "text-emerald-300" },
                  { icon: Zap, label: "Instant Delivery", color: "text-aqua" },
                  { icon: Clock, label: "24/7 Support", color: "text-violet-300" },
                ].map(({ icon: Icon, label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-soft border border-white/10 text-xs font-semibold text-white/85"
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
                  </span>
                ))}
              </div>

              {/* Socials + WhatsApp */}
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <div className="flex gap-2">
                  {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                    <a
                      key={i}
                      href="#"
                      aria-label="social"
                      className="grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white/75 hover:text-white hover:border-aqua/60 hover:bg-aqua/10 hover:-translate-y-0.5 transition"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
                <a
                  href="https://wa.me/8801580607614"
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-[0_12px_30px_-10px_rgba(16,185,129,0.7)] hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Us
                </a>
              </div>
            </div>

            {/* Links */}
            <FooterCol
              className="md:col-span-2"
              title="Shop"
              links={[
                { label: "All Products", to: "/products" },
                { label: "Streaming", to: "/streaming" },
                { label: "AI Tools", to: "/ai-tools" },
                { label: "Education", to: "/education" },
              ]}
            />
            <FooterCol
              className="md:col-span-2"
              title="Help"
              links={[
                { label: "FAQ", to: "/faq" },
                { label: "Contact", to: "/contact" },
                { label: "My Orders", to: "/orders" },
                { label: "Profile", to: "/profile" },
              ]}
            />

            {/* Contact */}
            <div className="col-span-2 md:col-span-3">
              <h4
                className="text-sm font-bold text-white mb-4 tracking-[0.16em] uppercase"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <span className="text-aurora">Get</span> in touch
              </h4>
              <ul className="space-y-3 text-sm text-white/75">
                <ContactRow
                  icon={Mail}
                  label="support@accessnowbd.com"
                  href="mailto:support@accessnowbd.com"
                />
                <ContactRow icon={Phone} label="+880 1580-607614" href="tel:+8801580607614" />
                <ContactRow icon={MapPin} label="Dhaka, Bangladesh" />
              </ul>

              <div className="mt-5 p-3.5 rounded-2xl glass-soft border border-white/10">
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-aqua mb-1">
                  Support Hours
                </div>
                <div className="text-sm font-semibold text-white">
                  Daily · 11:00 AM – 11:00 PM
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar — premium */}
          <div className="relative mt-2">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-px blur-sm bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-5 text-xs">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1.5 text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-white/50">©</span>
                  <span className="text-white/90 font-semibold tracking-wide">2026</span>
                </span>
                <span className="text-white/30">·</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-glow to-[var(--color-aqua)] font-extrabold tracking-wide">
                  AccessNow BD
                </span>
                <span className="text-white/30">·</span>
                <span className="text-white/60">All Rights Reserved</span>
                <span className="text-white/30">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-white/60">Designed &amp; Developed by</span>
                  <a
                    href="https://shahedit.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/25 hover:bg-white/15 hover:border-primary/60 transition-all duration-300 hover:shadow-[0_0_20px_-4px_var(--color-primary)]"
                  >
                    <span className="text-white font-extrabold tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      Shahed IT
                    </span>
                  </a>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/45 mr-1">
                  We accept
                </span>
                {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-md glass-soft border border-white/10 text-white/90 text-[10px] font-bold tracking-wide hover:border-primary/40 hover:text-white transition-colors"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

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

function FooterCol({
  title,
  links,
  className = "",
}: {
  title: string;
  links: { label: string; to: LinkTo }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h4
        className="text-sm font-bold text-white mb-4 tracking-[0.16em] uppercase"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-2 text-white/70 hover:text-white transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-aqua/0 group-hover:bg-aqua transition shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
              <span className="group-hover:translate-x-0.5 transition-transform">
                {l.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Mail;
  label: string;
  href?: string;
}) {
  const content = (
    <span className="inline-flex items-center gap-2.5 hover:text-white transition group">
      <span className="grid place-items-center w-9 h-9 rounded-xl glass-soft border border-white/10 text-aqua group-hover:border-aqua/50 group-hover:bg-aqua/10 transition">
        <Icon className="w-4 h-4" />
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
  return <li>{href ? <a href={href}>{content}</a> : content}</li>;
}
