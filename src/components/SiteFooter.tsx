import { Link } from "@tanstack/react-router";
import { Crown, Facebook, Instagram, Youtube, Twitter, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[#0b0b1a] text-white/80">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-14 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 font-bold text-white text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-aurora text-white"><Crown className="w-4 h-4" /></span>
            AccessNow <span className="text-aurora">BD</span>
          </div>
          <p className="text-sm text-white/60 mt-4 max-w-sm leading-relaxed">
            Bangladesh's premium digital subscription marketplace. Instant delivery, verified accounts, full warranty.
          </p>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition" aria-label="social">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <a href="https://wa.me/8801000000000" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition">
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
        <FooterCol title="Account" links={[
          { label: "Sign in", to: "/auth" },
          { label: "Cart", to: "/cart" },
          { label: "Checkout", to: "/checkout" },
        ]} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} AccessNow BD. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-2">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-[10px] font-semibold tracking-wide">{p}</span>
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
      <h4 className="text-sm font-bold text-white mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-white/60">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="hover:text-white transition">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
