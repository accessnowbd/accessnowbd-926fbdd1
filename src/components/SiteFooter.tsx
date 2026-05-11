import { Link } from "@tanstack/react-router";
import { Crown, Facebook, Instagram, Youtube, Twitter, MessageCircle, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-8 border-t border-border bg-background/55 backdrop-blur-2xl">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-14 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 font-bold text-foreground text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground">
              <Crown className="w-4 h-4" />
              <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-40 blur-md -z-10" />
            </span>
            AccessNow <span className="text-aurora">BD</span>
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold mt-3">Fast • Secure • Reliable</p>
          <p className="text-sm text-muted-foreground mt-4 max-w-sm leading-relaxed">
            Bangladesh's premium digital product marketplace for subscriptions, software licenses, AI tools, education services and entertainment access.
          </p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="grid place-items-center w-9 h-9 rounded-full glass text-muted-foreground hover:text-primary transition" aria-label="social">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <a href="https://wa.me/8801000000000" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:scale-[1.02] transition shadow-[var(--shadow-glow-violet)]">
            <MessageCircle className="w-4 h-4" /> WhatsApp Support
          </a>
        </div>

        <FooterCol title="Shop" links={[
          { label: "All Products", to: "/products" },
          { label: "Streaming", to: "/streaming" },
          { label: "AI Tools", to: "/ai-tools" },
          { label: "Education", to: "/education" },
        ]} />
        <FooterCol title="Help" links={[
          { label: "FAQ", to: "/faq" },
          { label: "Contact", to: "/contact" },
          { label: "My Orders", to: "/orders" },
          { label: "Profile", to: "/profile" },
        ]} />
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Get in touch</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> accessnowbd01@gmail.com</li>
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> +880 1000 000000</li>
            <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} AccessNow BD · accessnowbd.com · All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-2">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-md glass-soft text-foreground text-[10px] font-semibold tracking-wide">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

type LinkTo = "/" | "/products" | "/streaming" | "/ai-tools" | "/education" | "/faq" | "/contact" | "/orders" | "/profile" | "/auth" | "/cart" | "/checkout";

function FooterCol({ title, links }: { title: string; links: { label: string; to: LinkTo }[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="hover:text-primary transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
