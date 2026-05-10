import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShoppingCart, Sparkles, Shield, Zap, Headphones, ChevronRight, Check, Star, X, Crown } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { useProducts } from "@/hooks/useProducts";
import { badgeColorFor } from "@/lib/badgeColor";
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
  { name: "Streaming", icon: "🎬", tint: "from-violet-500/20 to-fuchsia-400/10" },
  { name: "AI Tools", icon: "🤖", tint: "from-cyan-400/25 to-teal-300/10" },
  { name: "Music", icon: "🎵", tint: "from-rose-400/20 to-orange-300/10" },
  { name: "Design", icon: "🎨", tint: "from-amber-300/25 to-pink-300/10" },
  { name: "Education", icon: "📚", tint: "from-emerald-400/20 to-cyan-300/10" },
  { name: "Productivity", icon: "⚡", tint: "from-indigo-400/25 to-violet-300/10" },
];

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

const features = [
  { icon: Zap, title: "Instant Delivery", desc: "Get access within minutes of purchase. No waiting, no hassle." },
  { icon: Shield, title: "100% Secure", desc: "All accounts verified and protected with our warranty system." },
  { icon: Headphones, title: "24/7 Support", desc: "Our Bangladesh-based team is always ready to help you." },
  { icon: Sparkles, title: "Best Prices", desc: "Lowest prices in Bangladesh with regular promotional offers." },
];

function Index() {
  const { add } = useCart();
  const { products } = useProducts();
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
  }, [query, category, products]);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickCategory = (c: string) => {
    setCategory((cur) => (cur === c ? null : c));
    scrollToProducts();
  };

  const isFiltering = query.trim().length > 0 || category !== null;

  return (
    <div className="min-h-screen relative">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-40 glass-soft">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-aurora text-white shadow-[var(--shadow-glow-violet)]">
              <Crown className="w-4 h-4" />
            </span>
            <span className="tracking-tight">AccessNow <span className="text-aurora">BD</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {["Home", "Categories", "Deals", "How it Works", "Support"].map((l) => (
              <a key={l} href="#" className="px-4 py-2 rounded-xl hover:bg-white/50 hover:text-primary transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5"><AccountIcon /><CartIcon /></div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* aurora glow blobs */}
        <div className="pointer-events-none absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="pointer-events-none absolute -top-20 right-0 w-[420px] h-[420px] rounded-full bg-[var(--color-aqua)]/35 blur-[120px]" />

        <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-14 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> #1 Subscription Marketplace in BD
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 5.5vw, 56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.025em" }}>
              Premium subscriptions, <span className="text-aurora">instant access</span>, BD prices.
            </h1>
            <p className="mt-5 text-base text-muted-foreground max-w-lg leading-relaxed">
              Get Netflix, ChatGPT Plus, Spotify, Canva Pro and 50+ more premium digital products at unbeatable prices. Pay with bKash, Nagad, or card.
            </p>

            {/* Glass search */}
            <div className="mt-8 flex items-center glass rounded-full h-[56px] pl-5 pr-1.5 max-w-xl focus-within:ring-2 focus-within:ring-primary/30 transition">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for Netflix, ChatGPT, Spotify..."
                className="flex-1 px-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              />
              {query && (
                <button onClick={() => setQuery("")} className="grid place-items-center w-8 h-8 rounded-full hover:bg-white/60 text-muted-foreground" aria-label="Clear">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={scrollToProducts} className="h-11 px-6 rounded-full bg-aurora text-white text-sm font-semibold hover:opacity-95 transition glow-violet">
                Search
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[var(--color-aqua-deep)]" /> Instant delivery</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[var(--color-aqua-deep)]" /> bKash & Nagad</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[var(--color-aqua-deep)]" /> 7-day warranty</div>
            </div>
          </div>

          <div className="relative">
            <div className="glass-strong rounded-3xl p-3 rotate-1">
              <img src={heroImg} alt="Digital subscriptions" width={1280} height={960} className="w-full h-auto rounded-2xl" />
            </div>
            <div className="absolute -bottom-5 -left-5 glass-strong rounded-2xl px-5 py-3.5 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map((i) => <div key={i} className="w-8 h-8 rounded-full bg-aurora border-2 border-white" />)}
              </div>
              <div>
                <div className="text-sm font-bold">10,000+ happy users</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="w-3 h-3 fill-[var(--color-gold)] text-[var(--color-gold)]" />)}
                  <span className="ml-1">4.9/5</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-2 glass rounded-2xl px-4 py-2.5 hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span className="text-xs font-semibold">Live orders: 23 today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800 }}>Browse Categories</h2>
            <p className="text-muted-foreground mt-1">Find the perfect subscription for you</p>
          </div>
          <button
            onClick={() => setCategory(null)}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong text-sm font-semibold hover:bg-white transition"
          >
            All Categories <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((c) => {
            const active = category === c.name;
            return (
              <button
                key={c.name}
                onClick={() => pickCategory(c.name)}
                className={`relative overflow-hidden glass rounded-2xl p-5 flex flex-col items-start gap-3 hover:-translate-y-1 hover:shadow-[var(--shadow-glass-lg)] transition-all ${
                  active ? "ring-2 ring-primary -translate-y-1 shadow-[var(--shadow-glass-lg)]" : ""
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${c.tint} opacity-80`} />
                <span className="relative text-3xl">{c.icon}</span>
                <span className="relative text-sm font-bold tracking-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10">
        <div className="relative rounded-3xl p-8 md:p-12 bg-aurora text-white overflow-hidden glow-violet">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -left-10 -bottom-16 w-64 h-64 rounded-full bg-[var(--color-gold)]/30 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--color-gold)] text-black mb-4">
                <Sparkles className="w-3 h-3" /> LIMITED OFFER
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
                Save 30% on yearly plans
              </h3>
              <p className="mt-3 text-white/85 max-w-md">Lock in the best rates of the year. Switch to annual billing and stack the savings on every premium subscription.</p>
            </div>
            <div className="flex md:justify-end gap-3">
              <button className="h-11 px-6 rounded-full bg-white text-primary text-sm font-bold hover:scale-105 transition">Claim Offer</button>
              <button className="h-11 px-6 rounded-full border border-white/40 text-sm font-semibold hover:bg-white/10 transition">Learn more</button>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section ref={productsRef} className="mx-auto max-w-[1440px] px-4 md:px-10 py-16 scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800 }}>
              {isFiltering ? "Search Results" : "Trending Subscriptions"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isFiltering
                ? `${filtered.length} ${filtered.length === 1 ? "product" : "products"} found${category ? ` in ${category}` : ""}${query ? ` for "${query}"` : ""}`
                : "Most popular choices in Bangladesh this week"}
            </p>
          </div>
          {isFiltering && (
            <button onClick={() => { setQuery(""); setCategory(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-semibold hover:bg-white/80 transition">
              <X className="w-4 h-4" /> Clear filters
            </button>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="glass rounded-3xl py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold">No products found</h3>
            <p className="text-sm text-muted-foreground mt-2">Try a different search term or category.</p>
            <button onClick={() => { setQuery(""); setCategory(null); }}
              className="mt-5 h-11 px-6 rounded-full bg-aurora text-white text-sm font-semibold hover:opacity-95 transition glow-violet">
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
              className="group glass rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-[var(--shadow-glass-lg)] transition-all block"
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                <span className="relative text-6xl drop-shadow-md">{p.emoji}</span>
                <span className={`absolute top-3 left-3 ${badgeColorFor(p.badge)} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm`}>{p.badge ?? "New"}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold tracking-tight">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{p.plans[0]?.period ?? ""} subscription</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-aurora">{p.plans[0]?.price ?? "—"}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const plan = p.plans[0];
                      if (!plan) return;
                      add({ slug: p.slug, planPeriod: plan.period, qty: 1, price: parsePrice(plan.price), name: p.name, emoji: p.emoji, gradient: p.gradient });
                    }}
                    className="grid place-items-center w-10 h-10 rounded-full bg-aurora text-white hover:scale-110 transition glow-violet"
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
      <section className="py-20 relative">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800 }}>Why <span className="text-aurora">AccessNow BD</span>?</h2>
            <p className="text-muted-foreground mt-2">We make premium digital products accessible, affordable, and reliable for everyone in Bangladesh.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-[var(--shadow-glass-lg)] transition">
                <div className="w-12 h-12 rounded-2xl bg-aurora grid place-items-center mb-4 glow-violet">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-20">
        <div className="relative rounded-3xl glass-strong p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-aurora opacity-20 blur-3xl" />
          <div className="relative">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Ready to unlock <span className="text-aurora">premium</span>?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Join thousands of Bangladeshis enjoying premium subscriptions at the best prices.</p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <button className="h-12 px-8 rounded-full bg-aurora text-white text-sm font-bold hover:scale-105 transition glow-violet">Get Started</button>
              <button className="h-12 px-8 rounded-full glass text-sm font-semibold hover:bg-white transition">Browse Catalog</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-soft mt-10">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-12 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-aurora text-white"><Crown className="w-4 h-4" /></span>
              AccessNow <span className="text-aurora">BD</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">Premium digital subscriptions made simple for Bangladesh.</p>
          </div>
          {[
            { title: "Shop", links: ["Streaming", "AI Tools", "Music", "Design"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Support", links: ["Help Center", "Refund Policy", "Terms", "Privacy"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold mb-3">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => <li key={l}><a href="#" className="hover:text-primary transition">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 py-5 text-center text-xs text-muted-foreground">
          © 2026 AccessNow BD. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
