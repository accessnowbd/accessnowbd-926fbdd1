import { Link } from "@tanstack/react-router";
import { Crown, Facebook, Instagram, Youtube, Twitter, Search, Menu, X } from "lucide-react";
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
    <div className="bg-[#0b0b1a] text-white text-xs">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-9 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white/70">
          <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white transition"><Facebook className="w-3.5 h-3.5" /></a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-white transition"><Instagram className="w-3.5 h-3.5" /></a>
          <a href="https://youtube.com" aria-label="YouTube" className="hover:text-white transition"><Youtube className="w-3.5 h-3.5" /></a>
          <a href="https://twitter.com" aria-label="X" className="hover:text-white transition"><Twitter className="w-3.5 h-3.5" /></a>
        </div>
        <div className="font-semibold tracking-wide">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mr-1.5 align-middle animate-pulse" />
          Office Hours: 11 AM – 11 PM
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
      <header className="sticky top-0 z-40 glass-soft">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-aurora text-white shadow-[var(--shadow-glow-violet)]">
              <Crown className="w-4 h-4" />
            </span>
            <span className="tracking-tight">AccessNow <span className="text-aurora">BD</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="px-3.5 py-2 rounded-xl hover:bg-white/60 hover:text-primary transition-colors" activeProps={{ className: "text-primary bg-white/70" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/products" className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-white text-primary hover:scale-105 transition" aria-label="Search products">
              <Search className="w-4 h-4" />
            </Link>
            <AccountIcon />
            <CartIcon />
            <button onClick={() => setOpen((o) => !o)} className="lg:hidden grid place-items-center w-10 h-10 rounded-full bg-white text-primary" aria-label="Menu">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-white/40">
            <nav className="mx-auto max-w-[1440px] px-4 py-3 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/60 text-sm font-semibold hover:bg-white">
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
