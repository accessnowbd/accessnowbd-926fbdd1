import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Sparkles, Shield, Zap, Headphones, ChevronRight, Check, Star, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { products as catalog } from "@/data/products";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AccessNow BD — Premium Digital Subscriptions in Bangladesh" },
      { name: "description", content: "Buy Netflix, ChatGPT Plus, Spotify, Canva Pro and more premium subscriptions at the best prices in Bangladesh. Instant delivery, secure payments." },
    ],
  }),
});

const categories = [
  { name: "Streaming", icon: "🎬", color: "bg-primary" },
  { name: "AI Tools", icon: "🤖", color: "bg-[var(--color-teal)]" },
  { name: "Music", icon: "🎵", color: "bg-[var(--color-orange)]" },
  { name: "Design", icon: "🎨", color: "bg-[var(--color-cyan-deep)]" },
  { name: "Education", icon: "📚", color: "bg-[var(--color-coral)]" },
  { name: "Productivity", icon: "⚡", color: "bg-primary-dark" },
];

const products = catalog;

const features = [
  { icon: Zap, title: "Instant Delivery", desc: "Get access within minutes of purchase. No waiting, no hassle." },
  { icon: Shield, title: "100% Secure", desc: "All accounts verified and protected with our warranty system." },
  { icon: Headphones, title: "24/7 Support", desc: "Our Bangladesh-based team is always ready to help you." },
  { icon: Sparkles, title: "Best Prices", desc: "Lowest prices in Bangladesh with regular promotional offers." },
];

function Index() {
  const { add } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = !category || p.category === category;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, category]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickCategory = (c: string) => {
    setCategory((cur) => (cur === c ? null : c));
    scrollToProducts();
  };

  const isFiltering = query.trim().length > 0 || category !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-primary font-bold">A</span>
            AccessNow BD
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {["Home", "Categories", "Deals", "How it Works", "Support"].map((l) => (
              <a key={l} href="#" className="px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden sm:inline-flex h-9 px-4 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold transition-colors">Sign in</button>
            <div className="flex items-center gap-2"><AccountIcon /><CartIcon /></div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-primary text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" /> #1 Subscription Marketplace in BD
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 500, lineHeight: 1.15 }}>
              Premium subscriptions, <span className="text-primary">instant access</span>, Bangladeshi prices.
            </h1>
            <p className="mt-5 text-base text-[#333333] max-w-lg">
              Get Netflix, ChatGPT Plus, Spotify, Canva Pro and 50+ more premium digital products at unbeatable prices. Pay with bKash, Nagad, or card.
            </p>

            {/* Search */}
            <div className="mt-8 flex items-center bg-white rounded-full border border-border h-[52px] pl-5 pr-1.5 shadow-[0_0_3px_0_rgba(0,0,0,0.15)] max-w-xl focus-within:border-primary transition">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for Netflix, ChatGPT, Spotify..."
                className="flex-1 px-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="grid place-items-center w-8 h-8 rounded-full hover:bg-secondary text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={scrollToProducts}
                className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
              >
                Search
              </button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-[#333333]">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Instant delivery</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> bKash & Nagad</div>
              <div className="hidden sm:flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 7-day warranty</div>
            </div>
          </div>

          <div className="relative">
            <img src={heroImg} alt="Digital subscriptions" width={1280} height={960} className="w-full h-auto rounded-3xl shadow-[0_5px_40px_0_rgba(135,3,249,0.25)]" />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-5 py-3 shadow-[0_5px_40px_0_rgba(0,0,0,0.16)] flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map((i) => <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark border-2 border-white" />)}
              </div>
              <div>
                <div className="text-sm font-semibold">10,000+ happy users</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="w-3 h-3 fill-[var(--color-warning)] text-[var(--color-warning)]" />)}
                  4.9/5 rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>Browse Categories</h2>
            <p className="text-muted-foreground mt-1">Find the perfect subscription for you</p>
          </div>
          <button
            onClick={() => setCategory(null)}
            className="hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
          >
            All Categories <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
          {categories.map((c) => {
            const active = category === c.name;
            return (
              <button
                key={c.name}
                onClick={() => pickCategory(c.name)}
                className={`${c.color} text-white rounded-xl p-6 flex flex-col items-start gap-3 hover:shadow-[0_5px_40px_0_rgba(0,0,0,0.16)] hover:scale-[1.02] transition-all ${
                  active ? "ring-4 ring-primary/40 scale-[1.02] shadow-[0_5px_40px_0_rgba(0,0,0,0.16)]" : ""
                }`}
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10">
        <div className="rounded-2xl p-8 md:p-12 bg-gradient-to-r from-primary via-primary to-primary-dark text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-[var(--color-warning)] text-black mb-4">LIMITED OFFER</span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, lineHeight: 1.2 }}>
                Save 30% on yearly plans
              </h3>
              <p className="mt-3 text-white/80 max-w-md">Lock in the best rates of the year. Switch to annual billing and stack the savings on every premium subscription.</p>
            </div>
            <div className="flex md:justify-end gap-3">
              <button className="h-[42px] px-5 rounded-md bg-white text-primary text-sm font-semibold hover:shadow-[0_0_3px_0_rgba(0,0,0,0.15)] transition">Claim Offer</button>
              <button className="h-[42px] px-5 rounded-md border border-white/40 text-sm font-semibold hover:bg-white/10 transition">Learn more</button>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section ref={productsRef} className="mx-auto max-w-[1440px] px-4 md:px-10 py-16 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>
              {isFiltering ? "Search Results" : "Trending Subscriptions"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isFiltering
                ? `${filtered.length} ${filtered.length === 1 ? "product" : "products"} found${category ? ` in ${category}` : ""}${query ? ` for "${query}"` : ""}`
                : "Most popular choices in Bangladesh this week"}
            </p>
          </div>
          {isFiltering && (
            <button
              onClick={() => { setQuery(""); setCategory(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition"
            >
              <X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>No products found</h3>
            <p className="text-sm text-muted-foreground mt-2">Try a different search term or category.</p>
            <button
              onClick={() => { setQuery(""); setCategory(null); }}
              className="mt-5 h-[42px] px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
            >
              Reset filters
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <Link
              to="/product/$slug"
              params={{ slug: p.slug }}
              key={p.slug}
              className="group bg-white rounded-xl overflow-hidden hover:shadow-[0_5px_40px_0_rgba(0,0,0,0.16)] hover:-translate-y-1 transition-all border border-border block"
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                <span className="text-6xl">{p.emoji}</span>
                <span className={`absolute top-3 left-3 ${p.badgeColor} text-white px-3 py-1 rounded text-xs font-semibold`}>{p.badge}</span>
              </div>
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{p.plans[0].period} subscription</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{p.plans[0].price}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); add({ slug: p.slug, planPeriod: p.plans[0].period, qty: 1 }); }}
                    className="grid place-items-center w-9 h-9 rounded-full bg-primary text-primary-foreground group-hover:bg-primary/90 transition"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>Why AccessNow BD?</h2>
            <p className="text-muted-foreground mt-2">We make premium digital products accessible, affordable, and reliable for everyone in Bangladesh.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 hover:shadow-[0_0_3px_0_rgba(0,0,0,0.15)] transition">
                <div className="w-12 h-12 rounded-full bg-accent grid place-items-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{f.title}</h3>
                <p className="text-sm text-[#333333] mt-2">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-20">
        <div className="rounded-2xl bg-[var(--color-cyan-deep)] text-white p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
          <div className="relative">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, lineHeight: 1.4 }}>Ready to unlock premium?</h2>
            <p className="text-white/80 mt-3 max-w-xl mx-auto">Join thousands of Bangladeshis enjoying premium subscriptions at the best prices.</p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <button className="h-[48px] px-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">Get Started</button>
              <button className="h-[48px] px-8 rounded-full border border-white/30 text-sm font-semibold hover:bg-white/10 transition">Browse Catalog</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-10 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              <span className="grid place-items-center w-9 h-9 rounded-full bg-primary text-white font-bold">A</span>
              AccessNow BD
            </div>
            <p className="text-sm text-muted-foreground mt-3">Premium digital subscriptions made simple for Bangladesh.</p>
          </div>
          {[
            { title: "Shop", links: ["Streaming", "AI Tools", "Music", "Design"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Support", links: ["Help Center", "Refund Policy", "Terms", "Privacy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>{col.title}</h4>
              <ul className="space-y-2 text-sm text-[#767676]">
                {col.links.map((l) => <li key={l}><a href="#" className="hover:text-primary">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 AccessNow BD. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
