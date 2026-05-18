import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ShoppingCart, Check, Clock, Shield, ArrowLeft, Star, Zap, Headphones, Loader2, MessageCircle } from "lucide-react";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { badgeColorFor } from "@/lib/badgeColor";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductBanner } from "@/components/ProductBanner";
import { useShopConfig } from "@/hooks/useShopConfig";
import { waOrderUrl } from "@/lib/whatsapp";
import { getProduct } from "@/lib/products.functions";
import { ProductMarkdown } from "@/components/ProductMarkdown";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData({
      queryKey: ["product", params.slug],
      queryFn: () => getProduct({ data: { slug: params.slug } }),
      staleTime: 10 * 60_000,
    });
    if (!product) throw notFound();
    return { product };
  },
  component: ProductPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.product ? `${loaderData.product.name} — AccessNow BD` : "Subscription details — AccessNow BD" },
      ...(loaderData?.product
        ? [
            { name: "description", content: loaderData.product.tagline ?? loaderData.product.description ?? "" },
            { property: "og:title", content: loaderData.product.name },
            { property: "og:description", content: loaderData.product.tagline ?? loaderData.product.description ?? "" },
            ...(loaderData.product.imageUrl
              ? [{ property: "og:image", content: loaderData.product.imageUrl }]
              : []),
          ]
        : []),
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Link to="/" className="text-primary underline">Back to home</Link>
      </div>
    </div>
  ),
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
  const { data: shopConfig } = useShopConfig();
  const [selected, setSelected] = useState(0);

  if (isLoading) {
    return <ProductSkeleton />;
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
    <div key={product.slug} className="min-h-screen animate-[product-in_460ms_cubic-bezier(0.22,1,0.36,1)_both]">
      <style>{`
        @keyframes product-in {
          0%   { opacity: 0; transform: translateY(14px); filter: blur(4px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
      {/* Top Nav */}

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
        <div className="relative">
          <ProductBanner product={product} ratio="1/1" spheres={6} priority className="rounded-3xl shadow-[var(--shadow-glass-lg)]" />
          <span className={`absolute top-5 left-5 z-20 ${badgeColorFor(product.badge)} px-3 py-1 rounded-full text-xs font-semibold shadow`}>{product.badge ?? "New"}</span>
        </div>

        {/* Info */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full glass-soft text-primary text-xs font-semibold">{product.category}</span>
          <h1 className="mt-4 text-aurora" style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p className="mt-3 text-base text-foreground">{product.tagline}</p>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-[var(--color-gold)] text-[var(--color-gold)]" />)}
            </div>
            <span className="text-muted-foreground">4.9 · 2,431 sold</span>
          </div>

          <div className="mt-6 prose prose-sm max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-p:leading-relaxed">
            <ProductMarkdown source={product.description} />
          </div>

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
                      active ? "border-primary glass" : "border-transparent glass-soft hover:border-primary/40"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">POPULAR</span>
                    )}
                    <div className="text-xs text-muted-foreground">{p.period}</div>
                    <div className="mt-1 font-semibold text-lg text-aurora" style={{ fontFamily: "var(--font-heading)" }}>{p.price}</div>
                    {p.original && <div className="text-xs text-muted-foreground line-through">{p.original}</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buy buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={buyNow}
              className="product-action-button product-buy-button h-[52px] flex-1 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4" /> Buy Now — {plan?.price ?? ""}
            </button>
            <button
              onClick={addToCart}
              className="product-action-button product-cart-button h-[52px] px-6 rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>

          {/* WhatsApp direct order */}
          <a
            href={
              plan
                ? waOrderUrl(
                    [{ name: product.name, planPeriod: plan.period, qty: 1, price: parsePrice(plan.price) }],
                    { number: shopConfig?.whatsapp_number },
                  )
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="product-action-button product-whatsapp-button mt-3 h-[52px] w-full rounded-full text-sm font-bold inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4" /> Order via WhatsApp — {plan?.period ?? ""}
          </a>


          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl glass-soft">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Delivery</div>
                <div className="text-sm font-semibold">{product.deliveryTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl glass-soft">
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
        <h2 className="text-aurora" style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 600 }}>What's included</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.features.map((f) => (
            <div key={f} className="flex items-start gap-3 p-4 glass rounded-xl">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
                <Check className="w-4 h-4" />
              </span>
              <span className="text-sm text-foreground mt-1">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
        <div className="relative mx-auto max-w-[1440px] px-4 md:px-10">
          <h2 className="text-aurora" style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 600 }}>How delivery works</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: ShoppingCart, title: "1. Place your order", desc: "Choose your plan and complete payment via BKash, Nagad, or card." },
              { icon: Zap, title: "2. Instant processing", desc: `We deliver your account details within ${product.deliveryTime} on email & WhatsApp.` },
              { icon: Headphones, title: "3. Enjoy & relax", desc: `Use immediately. Covered by our ${product.warranty} guarantee.` },
            ].map((s) => (
              <div key={s.title} className="glass-strong rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center mb-4 glow-violet">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{s.title}</h3>
                <p className="text-sm text-foreground mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
        <h2 className="text-aurora" style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 600 }}>You might also like</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map((p) => (
            <Link
              to="/product/$slug"
              params={{ slug: p.slug }}
              key={p.slug}
              className="group glass rounded-2xl overflow-hidden hover:-translate-y-1 hover:glow-violet transition-all"
            >
              <ProductBanner product={p} ratio="4/3" spheres={4} className="rounded-none" />
              <div className="p-4">
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{p.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-aurora" style={{ fontFamily: "var(--font-heading)" }}>{p.plans[0]?.price ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{p.plans[0]?.period ?? ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--glass-border-soft)] py-6 text-center text-xs text-muted-foreground">
        © 2026 AccessNow BD. All rights reserved.
      </footer>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-muted/60 rounded-xl ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="min-h-screen animate-fade-in">
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>

      {/* Top nav placeholder */}

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-4 md:px-10 pt-6">
        <Shimmer className="h-4 w-64" />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-8 grid md:grid-cols-2 gap-10">
        <Shimmer className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Shimmer className="h-6 w-24 rounded-full" />
          <Shimmer className="h-10 w-3/4" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-5/6" />
          <div className="flex items-center gap-3 pt-2">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-4 w-20" />
          </div>
          <Shimmer className="h-20 w-full" />

          <div className="pt-4">
            <Shimmer className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Shimmer className="h-24" />
              <Shimmer className="h-24" />
              <Shimmer className="h-24" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Shimmer className="h-12 w-40 rounded-full" />
            <Shimmer className="h-12 w-40 rounded-full" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <Shimmer className="h-16" />
            <Shimmer className="h-16" />
            <Shimmer className="h-16" />
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-8">
        <Shimmer className="h-6 w-48 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Shimmer className="aspect-[4/3]" />
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
