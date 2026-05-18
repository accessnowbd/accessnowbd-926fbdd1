import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ChevronDown, Minus, Plus, Star, ArrowLeft, Loader2 } from "lucide-react";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { badgeColorFor } from "@/lib/badgeColor";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductBanner } from "@/components/ProductBanner";
import { useShopConfig } from "@/hooks/useShopConfig";
import { getProduct } from "@/lib/products.functions";
import { ProductMarkdown } from "@/components/ProductMarkdown";
import { SiteFooter } from "@/components/SiteFooter";
import { GlassCard } from "@/components/ui-glass/GlassCard";

const parsePrice = (p: unknown) => {
  if (typeof p === "number") return Number.isFinite(p) ? p : 0;
  if (typeof p !== "string") return 0;
  return Number(p.replace(/[^\d]/g, "")) || 0;
};

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
  const { product: loaderProduct } = Route.useLoaderData();
  const { product, isLoading } = useProduct(slug, loaderProduct);
  const { products } = useProducts();
  const navigate = useNavigate();
  const { add } = useCart();
  useShopConfig();
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [descOpen, setDescOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (isLoading) return <ProductSkeleton />;
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
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 8);

  const addToCart = () => {
    if (!plan) return;
    for (let i = 0; i < qty; i++) {
      add({ slug: product.slug, planPeriod: plan.period, qty: 1, price: parsePrice(plan.price), name: product.name, emoji: product.emoji, gradient: product.gradient });
    }
  };
  const buyNow = () => { addToCart(); navigate({ to: "/checkout" }); };

  const hasDiscount = !!plan?.original && parsePrice(plan.original) > parsePrice(plan.price);

  const faqs = buildFaqs(product);

  return (
    <div key={product.slug} className="relative min-h-screen text-slate-900 animate-[product-in_460ms_cubic-bezier(0.22,1,0.36,1)_both] overflow-hidden bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <style>{`@keyframes product-in {0%{opacity:0;transform:translateY(14px);filter:blur(4px)}60%{opacity:1;filter:blur(0)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}`}</style>

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-teal-300/30 blur-[120px]" />
      <div className="pointer-events-none absolute top-40 -right-32 h-[480px] w-[480px] rounded-full bg-emerald-300/25 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-200/25 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px] px-4 md:px-8 pt-6">
        <nav className="text-sm text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-[1200px] px-4 md:px-8 py-6 grid md:grid-cols-2 gap-8 md:gap-12">
        <GlassCard tint="teal" blur="lg" glow="md" padding="sm" rounded="2xl" className="relative">
          <ProductBanner product={product} ratio="1/1" spheres={6} priority className="rounded-xl overflow-hidden" />
          {product.badge && (
            <span className={`absolute top-6 left-6 z-20 ${badgeColorFor(product.badge)} px-3 py-1 rounded-full text-xs font-semibold shadow`}>
              {product.badge}
            </span>
          )}
        </GlassCard>

        <GlassCard tint="teal" blur="lg" glow="md" padding="lg" rounded="2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{product.name}</h1>

          {/* Price */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">Tk {parsePrice(plan!.original!)}.00 BDT</span>
            )}
            <span className="text-base font-semibold text-slate-900">Tk {plan ? parsePrice(plan.price) : 0}.00 BDT</span>
            {hasDiscount && (
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded">Sale</span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />
              ))}
            </div>
            <span className="text-slate-500">12 reviews</span>
          </div>

          {/* Duration */}
          {product.plans.length > 0 && (
            <div className="mt-5">
              <div className="text-xs text-slate-500 mb-2">Duration</div>
              <div className="flex flex-wrap gap-2">
                {product.plans.map((p, idx) => {
                  const active = activeIdx === idx;
                  return (
                    <button
                      key={p.period}
                      onClick={() => setSelected(idx)}
                      className={`px-4 h-9 rounded-xl text-sm font-medium backdrop-blur-md border transition-all ${
                        active
                          ? "bg-teal-500/30 text-teal-900 border-teal-400/60 shadow-[0_4px_20px_-4px_rgba(20,184,166,0.5)]"
                          : "bg-white/40 text-slate-800 border-white/60 hover:bg-white/60 hover:border-teal-300/60"
                      }`}
                    >
                      {p.period}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-5">
            <div className="text-xs text-slate-500 mb-2">Quantity</div>
            <div className="inline-flex items-center border border-white/60 rounded-xl overflow-hidden backdrop-blur-md bg-white/40 shadow-[0_4px_20px_-6px_rgba(20,184,166,0.25)]">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10 grid place-items-center hover:bg-teal-500/20 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
                className="w-12 h-10 text-center text-sm bg-transparent focus:outline-none"
              />
              <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10 grid place-items-center hover:bg-teal-500/20 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buy buttons */}
          <div className="mt-5 space-y-3 max-w-md">
            <button
              onClick={addToCart}
              className="w-full h-11 rounded-xl backdrop-blur-md bg-white/40 border border-teal-400/50 text-teal-900 text-sm font-semibold hover:bg-white/60 hover:border-teal-400/80 shadow-[0_4px_20px_-6px_rgba(20,184,166,0.4)] transition-all"
            >
              Add to cart
            </button>
            <button
              onClick={buyNow}
              className="w-full h-11 rounded-xl backdrop-blur-md bg-gradient-to-r from-teal-500/70 to-emerald-500/70 border border-white/40 text-white text-sm font-semibold hover:from-teal-500/85 hover:to-emerald-500/85 shadow-[0_8px_28px_-6px_rgba(20,184,166,0.55)] transition-all"
            >
              Buy it now
            </button>
          </div>

          {/* Product Description accordion */}
          <div className="mt-6 max-w-2xl">
            <button
              onClick={() => setDescOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 h-11 rounded-xl backdrop-blur-xl bg-gradient-to-r from-white/50 to-teal-50/40 border border-white/70 text-sm font-medium text-slate-900 hover:from-white/70 hover:to-teal-50/60 hover:border-teal-300/70 shadow-[0_6px_24px_-8px_rgba(20,184,166,0.3)] transition-all"
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 rounded-sm border border-teal-400/60 bg-teal-500/20 inline-block" /> Product Description
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${descOpen ? "rotate-180" : ""}`} />
            </button>
            {descOpen && (
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/60 backdrop-blur-2xl bg-gradient-to-br from-white/60 via-white/40 to-teal-50/50 shadow-[0_10px_40px_-12px_rgba(20,184,166,0.35)]">
                <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-teal-300/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/40" />
                <div className="relative p-6 text-sm text-slate-700">
                  <ProductMarkdown source={product.description} />
                </div>
              </div>
            )}
          </div>

        </GlassCard>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-[1200px] px-4 md:px-8 py-10">
        <h2 className="text-lg font-bold text-slate-900 mb-4">FAQ</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <GlassCard key={i} tint="teal" blur="lg" glow="sm" padding="none" rounded="xl">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 h-11 text-left text-sm font-medium text-slate-800"
                >
                  <span>{f.q}</span>
                  <span className="text-teal-600 text-lg leading-none">{open ? "−" : "+"}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4 text-sm text-slate-700 leading-relaxed">
                    {f.a}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="relative mx-auto max-w-[1200px] px-4 md:px-8 py-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Related products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((p) => {
              const first = p.plans[0];
              const hasOrig = !!first?.original && parsePrice(first.original) > parsePrice(first.price);
              return (
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  key={p.slug}
                  className="group block rounded-xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 hover:bg-white/60 hover:border-teal-300/60 shadow-[0_4px_20px_-8px_rgba(20,184,166,0.25)] hover:shadow-[0_10px_30px_-10px_rgba(20,184,166,0.45)] hover:-translate-y-0.5 transition-all"
                >
                  <ProductBanner product={p} ratio="1/1" spheres={4} className="rounded-none" />
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{p.name}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      {hasOrig && (
                        <span className="text-slate-400 line-through">Tk {parsePrice(first!.original!)}.00 BDT</span>
                      )}
                      <span className="font-semibold text-slate-900">
                        {p.plans.length > 1 ? "From " : ""}Tk {first ? parsePrice(first.price) : 0}.00 BDT
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="relative">
        <SiteFooter />
      </div>
    </div>
  );
}

function buildFaqs(product: {
  name: string;
  category?: string;
  delivery_time?: string;
  warranty?: string;
  plans?: { period: string; price: string }[];
}): { q: string; a: string }[] {
  const name = product.name;
  const category = product.category || "subscription";
  const delivery = product.delivery_time || "Within 30 mins";
  const warranty = product.warranty || "Full warranty";
  const plans = product.plans || [];
  const durations = plans.map((p) => p.period).filter(Boolean);
  const minPrice = plans
    .map((p) => parsePrice(p.price))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)[0];

  const durationLine =
    durations.length > 0
      ? `Available durations: ${durations.join(", ")}.`
      : `Multiple duration options are available — pick one above.`;
  const priceLine =
    minPrice && minPrice > 0
      ? `Plans start from ৳${minPrice.toLocaleString()} — the exact price for your selected duration is shown above the duration selector.`
      : `The current price is shown above the duration selector for the selected plan.`;

  return [
    {
      q: `Can I use ${name} in Bangladesh?`,
      a: `Yes — ${name} works fully in Bangladesh through AccessNow BD. We provide verified ${category} access that runs on any device without restrictions.`,
    },
    {
      q: `How fast will I receive my ${name} access?`,
      a: `Delivery time: ${delivery}. After payment is confirmed, your ${name} login or activation details are sent to your email and WhatsApp automatically.`,
    },
    {
      q: `What warranty do I get with ${name}?`,
      a: `Every ${name} order from AccessNow BD includes ${warranty}. If anything stops working during your plan period, contact support and we'll replace or fix it free of charge.`,
    },
    {
      q: `How do I subscribe to ${name} via AccessNow BD?`,
      a: `Choose your duration above, add to cart and complete payment with bKash, Nagad, Rocket, or card. ${durationLine}`,
    },
    {
      q: `How much does ${name} cost in Bangladesh via AccessNow BD?`,
      a: priceLine,
    },
    {
      q: `How do I renew my ${name} subscription with AccessNow BD?`,
      a: `Simply place a new order for ${name} when your current plan is about to expire. We'll keep your existing access active where possible, and your new ${delivery.toLowerCase()} delivery applies to renewals too.`,
    },
  ];
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-fade-in">
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
      <div className="mx-auto max-w-[1200px] px-4 md:px-8 pt-6">
        <Shimmer className="h-4 w-64" />
      </div>
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 py-6 grid md:grid-cols-2 gap-10">
        <Shimmer className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Shimmer className="h-10 w-3/4" />
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-4 w-32" />
          <div className="pt-2 grid grid-cols-4 gap-2">
            <Shimmer className="h-9" /><Shimmer className="h-9" /><Shimmer className="h-9" /><Shimmer className="h-9" />
          </div>
          <Shimmer className="h-10 w-32" />
          <Shimmer className="h-11 w-full max-w-md" />
          <Shimmer className="h-11 w-full max-w-md" />
          <div className="flex items-center gap-2 pt-3">
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            <span className="text-xs text-slate-500">Loading product…</span>
          </div>
        </div>
      </section>
    </div>
  );
}
