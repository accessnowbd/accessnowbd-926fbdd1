import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Twitter, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";

const NAV: Array<{ label: string; to: "/" | "/products" | "/streaming" | "/ai-tools" | "/education" | "/faq" | "/contact" }> = [
  { label: "All Products", to: "/products" },
  { label: "Streaming", to: "/streaming" },
  { label: "AI Tools", to: "/ai-tools" },
  { label: "Education", to: "/education" },
  { label: "FAQ", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function TopUtilityBar() {
  return (
    <div className="border-b border-foreground/10 text-foreground/70 text-[11px]">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-9 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="https://facebook.com" aria-label="Facebook" className="hover:text-foreground transition"><Facebook className="w-3.5 h-3.5" /></a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground transition"><Instagram className="w-3.5 h-3.5" /></a>
          <a href="https://youtube.com" aria-label="YouTube" className="hover:text-foreground transition"><Youtube className="w-3.5 h-3.5" /></a>
          <a href="https://twitter.com" aria-label="X" className="hover:text-foreground transition"><Twitter className="w-3.5 h-3.5" /></a>
        </div>
        <div className="editorial-eyebrow flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
          Office Hours · 11 AM – 11 PM
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TopUtilityBar />
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-foreground/10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="AccessNow BD home">
            <span className="display-serif text-xl tracking-tight">
              AccessNow<span className="italic font-medium">·</span>BD
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
                activeProps={{ className: "text-foreground bg-foreground/5" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link
              to="/products"
              className="hidden sm:grid place-items-center w-10 h-10 rounded-full border border-foreground/15 hover:bg-foreground hover:text-background transition"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
            </Link>
            <AccountIcon />
            <CartIcon />
            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden grid place-items-center w-10 h-10 rounded-full border border-foreground/15"
              aria-label="Menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-foreground/10 bg-background/95 backdrop-blur-xl">
            <nav className="mx-auto max-w-[1440px] px-4 py-3 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl border border-foreground/10 text-sm font-semibold hover:bg-foreground hover:text-background transition"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
