import { Link } from "@tanstack/react-router";
import { Crown, Facebook, Instagram, Youtube, Twitter, Search, Menu, X, Zap } from "lucide-react";
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
    <div className="relative border-b border-border bg-[#0a1325]/95 text-xs">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-9 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-3 h-3 text-primary" />
          <span className="font-semibold">Fast • Secure • Reliable</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-muted-foreground">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="hover:text-primary transition" aria-label="social"><Icon className="w-3 h-3" /></a>
            ))}
          </div>
          <div className="font-semibold tracking-wide text-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 align-middle animate-pulse" />
            Online · 11 AM – 11 PM
          </div>
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
      <header className="sticky top-0 z-40 border-b border-border bg-[#0a1325]/95">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]">
              <Crown className="w-4 h-4" />
              <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-40 blur-md -z-10 animate-aurora-pan" />
            </span>
            <span className="tracking-tight text-foreground">AccessNow <span className="text-aurora">BD</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "text-primary bg-secondary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/products" className="hidden sm:grid place-items-center w-10 h-10 rounded-full glass text-foreground hover:text-primary transition" aria-label="Search products">
              <Search className="w-4 h-4" />
            </Link>
            <AccountIcon />
            <CartIcon />
            <button onClick={() => setOpen((o) => !o)} className="lg:hidden grid place-items-center w-10 h-10 rounded-full glass text-foreground" aria-label="Menu">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border bg-[#0a1325]/97">
            <nav className="mx-auto max-w-[1440px] px-4 py-3 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl glass-soft text-sm font-semibold text-foreground hover:shadow-[var(--shadow-glass)]">
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
