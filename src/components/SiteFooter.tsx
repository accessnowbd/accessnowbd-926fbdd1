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
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-20">
      {/* Ambient glow backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-primary/25 blur-[140px]" />
        <div className="absolute top-10 right-1/4 w-[480px] h-[480px] rounded-full bg-aqua/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] rounded-full bg-violet-500/15 blur-[120px]" />
      </div>

      {/* Top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* CTA Strip */}
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 -translate-y-10">
        <div className="glass-strong rounded-3xl border border-white/10 px-6 md:px-10 py-7 md:py-8 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-aqua text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,229,255,0.5)]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="text-base md:text-lg font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                Get exclusive deals & launch alerts
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Subscribe for weekly drops on premium subscriptions, AI tools & more.
              </div>
            </div>
          </div>
          <form className="flex items-center gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 md:w-72 h-11 rounded-full px-4 text-sm bg-white/5 border border-white/15 text-white placeholder:text-muted-foreground/70 outline-none focus:border-primary/60 focus:bg-white/10 transition"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-full bg-gradient-to-r from-primary to-aqua text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 hover:scale-[1.03] transition shadow-[0_10px_30px_-8px_rgba(124,58,237,0.6)]"
            >
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Main footer body */}
      <div className="relative border-t border-white/10 bg-background/40 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 pt-12 pb-10 grid grid-cols-2 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <span className="relative grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-aqua text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,229,255,0.55)]">
                <Crown className="w-5 h-5" />
                <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-50 blur-md -z-10" />
              </span>
              <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                AccessNow <span className="text-aurora">BD</span>
              </span>
            </Link>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-soft border border-white/10">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-300">
                Fast • Secure • Reliable
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
              Bangladesh's premium digital marketplace for subscriptions, software licenses, AI tools,
              education and entertainment access — delivered instantly with verified support.
            </p>

            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: "Verified Seller" },
                { icon: Zap, label: "Instant Delivery" },
                { icon: Sparkles, label: "24/7 Support" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-soft border border-white/10 text-xs text-white/85"
                >
                  <Icon className="w-3.5 h-3.5 text-aqua" /> {label}
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
                    className="grid place-items-center w-10 h-10 rounded-full glass-soft border border-white/10 text-white/80 hover:text-white hover:border-primary/60 hover:bg-primary/15 transition"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
              <a
                href="https://wa.me/8801000000000"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)]"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Support
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
            <h4 className="text-sm font-bold text-white mb-4 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
              Get in touch
            </h4>
            <ul className="space-y-3 text-sm text-white/75">
              <ContactRow icon={Mail} label="accessnowbd01@gmail.com" href="mailto:accessnowbd01@gmail.com" />
              <ContactRow icon={Phone} label="+880 1000 000000" href="tel:+8801000000000" />
              <ContactRow icon={MapPin} label="Dhaka, Bangladesh" />
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div>
              © {new Date().getFullYear()} <span className="text-white/85 font-semibold">AccessNow BD</span> · accessnowbd.com · All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 mr-1">We accept</span>
              {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-md glass-soft border border-white/10 text-white/90 text-[10px] font-semibold tracking-wide"
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

type LinkTo =
  | "/" | "/products" | "/streaming" | "/ai-tools" | "/education"
  | "/faq" | "/contact" | "/orders" | "/profile" | "/auth" | "/cart" | "/checkout";

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
      <h4 className="text-sm font-bold text-white mb-4 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link
              to={l.to}
              className="group inline-flex items-center gap-1.5 text-white/70 hover:text-white transition"
            >
              <span className="w-1 h-1 rounded-full bg-primary/0 group-hover:bg-primary transition" />
              <span className="group-hover:translate-x-0.5 transition-transform">{l.label}</span>
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
    <span className="inline-flex items-center gap-2.5 hover:text-white transition">
      <span className="grid place-items-center w-8 h-8 rounded-lg glass-soft border border-white/10 text-aqua">
        <Icon className="w-3.5 h-3.5" />
      </span>
      {label}
    </span>
  );
  return <li>{href ? <a href={href}>{content}</a> : content}</li>;
}
