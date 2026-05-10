import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Check, Clock, Shield, ArrowLeft, Star, Zap, Headphones, Loader2 } from "lucide-react";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { badgeColorFor } from "@/lib/badgeColor";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  head: () => ({ meta: [{ title: "Subscription details — AccessNow BD" }] }),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-2">Product not found</h1>
        <Link to="/" className="text-primary underline">Back to home</Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { product, isLoading } = useProduct(slug);
  const { products } = useProducts();
  const navigate = useNavigate();
  const { add } = useCart();
  const [selected, setSelected] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-2">Product not found</h1>
          <Link to="/" className="text-primary underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const popularIdx = product.plans.findIndex((p) => p.popular);
  const safeSelected = Math.min(selected, Math.max(product.plans.length - 1, 0));
  const activeIdx = selected === 0 && popularIdx > 0 ? popularIdx : safeSelected;
  const plan = product.plans[activeIdx];
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  const addToCart = () => {
    if (!plan) return;
    add({ slug: product.slug, planPeriod: plan.period, qty: 1, price: parsePrice(plan.price), name: product.name, emoji: product.emoji, gradient: product.gradient });
  };
  const buyNow = () => { addToCart(); navigate({ to: "/checkout" }); };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-primary font-bold">A</span>
            AccessNow BD
          </Link>
          <div className="flex items-center gap-2"><AccountIcon /><CartIcon /></div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 pt-6">
        <nav className="text-sm text-muted-foreground flex items-center gap-2">
          <Link to="/" className="hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product Hero */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-8 grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className={`relative aspect-square md:aspect-[4/5] rounded-3xl bg-gradient-to-br ${product.gradient} flex items-center justify-center border border-border overflow-hidden`}>
          <span className="text-[180px] md:text-[220px]">{product.emoji}</span>
          <span className={`absolute top-5 left-5 ${badgeColorFor(product.badge)} px-3 py-1 rounded text-xs font-semibold`}>{product.badge ?? "New"}</span>
        </div>

        {/* Info */}
        <div>
          <span className="inline-block px-3 py-1 rounded bg-accent text-primary text-xs font-semibold">{product.category}</span>
          <h1 className="mt-4" style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p className="mt-3 text-base text-[#333333]">{product.tagline}</p>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-[var(--color-warning)] text-[var(--color-warning)]" />)}
            </div>
            <span className="text-muted-foreground">4.9 · 2,431 sold</span>
          </div>

          <p className="mt-6 text-sm text-[#333333] leading-relaxed">{product.description}</p>

          {/* Plan selector */}
          <div className="mt-7">
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>Choose your plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {product.plans.map((p, idx) => {
                const active = activeIdx === idx;
                return (
                  <button
                    key={p.period}
                    onClick={() => setSelected(idx)}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                      active ? "border-primary bg-accent" : "border-border bg-white hover:border-primary/40"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-3 bg-[var(--color-orange)] text-white text-[10px] font-semibold px-2 py-0.5 rounded">POPULAR</span>
                    )}
                    <div className="text-xs text-muted-foreground">{p.period}</div>
                    <div className="mt-1 font-semibold text-lg text-primary" style={{ fontFamily: "var(--font-heading)" }}>{p.price}</div>
                    {p.original && <div className="text-xs text-muted-foreground line-through">{p.original}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buy buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button onClick={buyNow} className="h-[48px] flex-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition inline-flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Buy Now — {plan?.price ?? ""}
            </button>
            <button onClick={addToCart} className="h-[48px] px-6 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition">
              Add to Cart
            </button>
          </div>

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Delivery</div>
                <div className="text-sm font-semibold">{product.deliveryTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Warranty</div>
                <div className="text-sm font-semibold">{product.warranty}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>What's included</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.features.map((f) => (
            <div key={f} className="flex items-start gap-3 p-4 bg-white border border-border rounded-xl">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-accent text-primary shrink-0">
                <Check className="w-4 h-4" />
              </span>
              <span className="text-sm text-[#333333] mt-1">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary py-12">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>How delivery works</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: ShoppingCart, title: "1. Place your order", desc: "Choose your plan and complete payment via bKash, Nagad, or card." },
              { icon: Zap, title: "2. Instant processing", desc: `We deliver your account details within ${product.deliveryTime} on email & WhatsApp.` },
              { icon: Headphones, title: "3. Enjoy & relax", desc: `Use immediately. Covered by our ${product.warranty} guarantee.` },
            ].map((s) => (
              <div key={s.title} className="bg-white rounded-xl p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-white grid place-items-center mb-4">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{s.title}</h3>
                <p className="text-sm text-[#333333] mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 500 }}>You might also like</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map((p) => (
            <Link
              to="/product/$slug"
              params={{ slug: p.slug }}
              key={p.slug}
              className="group bg-white rounded-xl overflow-hidden hover:shadow-[0_5px_40px_0_rgba(0,0,0,0.16)] hover:-translate-y-1 transition-all border border-border"
            >
              <div className={`relative aspect-[4/3] bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                <span className="text-6xl">{p.emoji}</span>
              </div>
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{p.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>{p.plans[0]?.price ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{p.plans[0]?.period ?? ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2026 AccessNow BD. All rights reserved.
      </footer>
    </div>
  );
}
