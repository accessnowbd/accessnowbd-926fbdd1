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
    <div className="relative text-white text-xs border-b border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-9 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/60">
          <Zap className="w-3 h-3 text-amber-300" />
          <span className="font-medium">Fast • Secure • Reliable</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-white/50">
            {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
              <a key={i} href="#" className="hover:text-white transition" aria-label="social"><Icon className="w-3 h-3" /></a>
            ))}
          </div>
          <div className="font-semibold tracking-wide text-white/75">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 align-middle animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
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
      <header className="sticky top-0 z-40 bg-[rgba(12,8,32,0.6)] backdrop-blur-2xl border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="relative grid place-items-center w-10 h-10 rounded-2xl bg-aurora text-white shadow-[var(--shadow-glow-violet)]">
              <Crown className="w-4 h-4" />
              <span className="absolute -inset-0.5 rounded-2xl bg-conic opacity-40 blur-md -z-10 animate-aurora-pan" />
            </span>
            <span className="tracking-tight text-white">AccessNow <span className="text-aurora">BD</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3.5 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                activeProps={{ className: "text-white bg-white/10" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/products" className="hidden sm:grid place-items-center w-10 h-10 rounded-full bg-white/8 border border-white/10 text-white/80 hover:bg-white/15 hover:text-white transition" aria-label="Search products">
              <Search className="w-4 h-4" />
            </Link>
            <AccountIcon />
            <CartIcon />
            <button onClick={() => setOpen((o) => !o)} className="lg:hidden grid place-items-center w-10 h-10 rounded-full bg-white/8 border border-white/10 text-white" aria-label="Menu">
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-white/10 bg-[rgba(12,8,32,0.85)] backdrop-blur-2xl">
            <nav className="mx-auto max-w-[1440px] px-4 py-3 grid grid-cols-2 gap-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white hover:bg-white/10">
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
