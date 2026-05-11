import { Link } from "@tanstack/react-router";
import { Search, Heart, ShoppingCart, User, Phone, Menu, X, Headphones, Facebook } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

const NAV: Array<{ label: string; to: "/" | "/products" | "/education" | "/contact" }> = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/products" },
  { label: "Educational Tools", to: "/education" },
  { label: "Contact Information", to: "/contact" },
];

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.4z M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.4 5L2 22l5.2-1.3c1.4.8 3 1.3 4.8 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
    </svg>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Top utility bar */}
      <div className="w-full bg-white border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 h-12 flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="w-3.5 h-3.5 text-foreground" />
            <span><span className="text-muted-foreground">Office Hours:</span> <span className="font-semibold">9 AM – 12 AM</span></span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/8801321109245"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex pill-card items-center gap-1.5 px-3 h-8 text-xs font-semibold text-foreground hover:text-[#25D366] transition"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp
            </a>
            <a
              href="#"
              className="hidden sm:inline-flex pill-card items-center gap-1.5 px-3 h-8 text-xs font-semibold text-foreground hover:text-primary transition"
            >
              <Headphones className="w-3.5 h-3.5 text-primary" /> Live Support
            </a>
            <a
              href="#"
              className="hidden sm:inline-flex pill-card items-center gap-1.5 px-3 h-8 text-xs font-semibold text-foreground hover:text-[#1877F2] transition"
            >
              <Facebook className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook
            </a>
            <Link
              to="/auth"
              className="btn-black inline-flex items-center gap-1.5 px-3.5 h-8 text-xs"
            >
              <User className="w-3.5 h-3.5" /> Login / Register
            </Link>
          </div>
        </div>
      </div>

      {/* Main header — sticky */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 h-[78px] flex items-center gap-5">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 pill-card px-3.5 h-12">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-[#0a0a0a] text-white font-black text-sm tracking-tight">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 18 L12 4 L20 18 M8 14 H16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="leading-tight">
                <div className="font-black text-[13px] tracking-tight text-foreground">
                  RXB <span className="text-primary">PREMIUM STORE</span>
                </div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Your Trusted Online Store</div>
              </div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative pill-card flex items-center h-12 px-4">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="search"
                placeholder="Search products..."
                className="ml-2.5 flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              <span className="ml-2 px-2 py-0.5 rounded border border-border text-[10px] font-semibold text-muted-foreground tracking-wider">⌘K</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 rounded-lg text-foreground/80 hover:text-foreground transition"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-1 ml-auto lg:ml-0">
            <button className="grid place-items-center w-10 h-10 rounded-full text-foreground hover:bg-secondary transition" aria-label="Search">
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button className="grid place-items-center w-10 h-10 rounded-full text-foreground hover:bg-secondary transition" aria-label="Wishlist">
              <Heart className="w-[18px] h-[18px]" />
            </button>
            <Link to="/cart" className="relative grid place-items-center w-10 h-10 rounded-full text-foreground hover:bg-secondary transition" aria-label="Cart">
              <ShoppingCart className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid place-items-center w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold">{cartCount}</span>
              )}
            </Link>
            <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden grid place-items-center w-10 h-10 rounded-full text-foreground hover:bg-secondary transition" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white">
            <nav className="mx-auto max-w-[1440px] px-4 py-3 grid gap-1.5">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-secondary"
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
