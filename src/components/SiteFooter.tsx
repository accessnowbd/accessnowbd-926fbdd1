import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Twitter, MessageCircle, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-foreground text-background relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 pt-20 pb-10">
        {/* Oversized editorial wordmark */}
        <div className="border-b border-background/15 pb-10">
          <div className="editorial-eyebrow text-background/55 mb-4">№ 04 · The Edition</div>
          <div className="display-serif leading-[0.85] text-background" style={{ fontSize: "clamp(64px, 14vw, 220px)" }}>
            AccessNow<span className="italic font-medium">·</span>BD
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-10 pt-10">
          <div className="md:col-span-2">
            <p className="text-sm text-background/70 max-w-sm leading-relaxed">
              Bangladesh's premium digital subscription marketplace. Instant
              delivery, verified accounts, full warranty.
            </p>
            <div className="mt-6 flex gap-2">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid place-items-center w-10 h-10 rounded-full border border-background/20 hover:bg-background hover:text-foreground transition"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <a
              href="https://wa.me/8801000000000"
              className="mt-5 inline-flex items-center gap-2 h-11 pl-5 pr-4 rounded-full bg-background text-foreground text-sm font-semibold hover:bg-background/90 transition"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
              <span className="grid place-items-center w-7 h-7 rounded-full bg-foreground text-background ml-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </div>

          <FooterCol
            title="Shop"
            links={[
              { label: "All Products", to: "/products" },
              { label: "Streaming", to: "/streaming" },
              { label: "AI Tools", to: "/ai-tools" },
              { label: "Education", to: "/education" },
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              { label: "FAQ", to: "/faq" },
              { label: "Contact", to: "/contact" },
              { label: "My Orders", to: "/orders" },
              { label: "Profile", to: "/profile" },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { label: "Sign in", to: "/auth" },
              { label: "Cart", to: "/cart" },
              { label: "Checkout", to: "/checkout" },
            ]}
          />
        </div>
      </div>

      <div className="border-t border-background/15">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-background/55">
          <div>© {new Date().getFullYear()} AccessNow BD. All rights reserved.</div>
          <div className="flex flex-wrap items-center gap-2">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded border border-background/20 text-background/70 text-[10px] font-semibold tracking-wide"
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

type LinkTo =
  | "/" | "/products" | "/streaming" | "/ai-tools" | "/education"
  | "/faq" | "/contact" | "/orders" | "/profile" | "/auth" | "/cart" | "/checkout";

function FooterCol({ title, links }: { title: string; links: { label: string; to: LinkTo }[] }) {
  return (
    <div>
      <h4 className="editorial-eyebrow text-background/55 mb-4">{title}</h4>
      <ul className="space-y-2.5 text-sm text-background/80">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="hover:text-background transition border-b border-transparent hover:border-background/40 pb-0.5">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
