import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { Minus, Plus, Star, ArrowLeft, Loader2, CreditCard, MessageCircle, ShoppingCart, Check } from "lucide-react";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { badgeColorFor } from "@/lib/badgeColor";
import { useEffect, useState } from "react";
import { recordRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCart } from "@/context/CartContext";
import { ProductBanner } from "@/components/ProductBanner";
import { useShopConfig } from "@/hooks/useShopConfig";
import { getProduct } from "@/lib/products.functions";
import { ProductMarkdown } from "@/components/ProductMarkdown";
import { SiteFooter } from "@/components/SiteFooter";
import { GlassCard } from "@/components/ui-glass/GlassCard";
import { GlassButton } from "@/components/ui-glass/GlassButton";
import { waOrderUrl } from "@/lib/whatsapp";
import { ProductReviews } from "@/components/ProductReviews";

const parsePrice = (p: unknown): number => {
  try {
    if (p == null) return 0;
    if (typeof p === "number") return Number.isFinite(p) ? p : 0;
    const s = typeof p === "string" ? p : String(p);
    const n = Number(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
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
  const popularIdx = (loaderProduct?.plans ?? product?.plans ?? []).findIndex((p: { popular?: boolean }) => p.popular);
  const [selected, setSelected] = useState(() => (popularIdx > 0 ? popularIdx : 0));
  const [qty, setQty] = useState(1);
  
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

  const activeIdx = Math.min(selected, Math.max(product.plans.length - 1, 0));
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

      {/* Ambient glow orbs — tamer on mobile for readability */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-[260px] w-[260px] md:h-[420px] md:w-[420px] rounded-full bg-teal-300/20 md:bg-teal-300/30 blur-[90px] md:blur-[120px]" />
      <div className="pointer-events-none absolute top-40 -right-32 h-[300px] w-[300px] md:h-[480px] md:w-[480px] rounded-full bg-emerald-300/15 md:bg-emerald-300/25 blur-[100px] md:blur-[140px]" />
      <div className="pointer-events-none hidden md:block absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-200/25 blur-[130px]" />

      <div className="relative mx-auto max-w-[1200px] px-4 md:px-8 pt-4 md:pt-6">
        <nav className="text-sm text-slate-500 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-[1200px] px-4 md:px-8 py-4 md:py-6 grid md:grid-cols-2 gap-5 md:gap-12">
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
              <span
                style={{ background: "linear-gradient(90deg,#14b8a6,#10b981)", color: "#fff" }}
                className="text-[11px] font-bold px-2 py-0.5 rounded shadow-[0_2px_8px_-2px_rgba(20,184,166,0.5)]"
              >
                Sale
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-500">12 reviews</span>
          </div>

          {/* Duration & pricing plans */}
          {product.plans.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-700 mb-3">মেয়াদ ও মূল্য পরিকল্পনা</div>
              <div role="radiogroup" aria-label="Plan" className="space-y-2.5">
                {product.plans.map((p, idx) => {
                  const active = activeIdx === idx;
                  const price = parsePrice(p.price);
                  const original = p.original ? parsePrice(p.original) : 0;
                  const hasOff = original > price;
                  const off = hasOff ? Math.round(((original - price) / original) * 100) : 0;
                  return (
                    <label
                      key={`${idx}-${p.period}`}
                      className={[
                        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition text-left cursor-pointer select-none",
                        active
                          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-300/60 shadow-[0_10px_28px_-14px_rgba(124,58,237,0.45)]"
                          : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="plan-period"
                        className="sr-only"
                        checked={active}
                        onChange={() => setSelected(idx)}
                      />
                      <span
                        aria-hidden="true"
                        className={[
                          "grid place-items-center w-5 h-5 rounded-full border-2 shrink-0 transition pointer-events-none",
                          active ? "border-violet-600 bg-violet-600" : "border-slate-300 bg-white",
                        ].join(" ")}
                      >
                        {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 font-bold text-[15px] pointer-events-none ${active ? "text-violet-700" : "text-slate-800"}`}>
                        {p.period}
                      </span>
                      {hasOff && (
                        <span className="text-slate-400 text-[13px] line-through pointer-events-none">৳{original.toLocaleString()}</span>
                      )}
                      <span className="text-violet-700 font-extrabold text-[15px] pointer-events-none">৳{price.toLocaleString()}</span>
                      {hasOff && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[11px] font-bold pointer-events-none">
                          -{off}%
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-700 mb-2">Quantity</div>
            <div className="inline-flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease"
                className="w-10 h-10 grid place-items-center transition"
                style={{ color: "#7c3aed", background: "#f5f3ff" }}
              >
                <Minus className="w-5 h-5" style={{ color: "#7c3aed" }} strokeWidth={2.5} />
              </button>
              <input
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))}
                style={{ color: "#0f172a" }}
                className="w-12 h-10 text-center text-sm font-bold bg-transparent focus:outline-none"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase"
                className="w-10 h-10 grid place-items-center transition"
                style={{ color: "#7c3aed", background: "#f5f3ff" }}
              >
                <Plus className="w-5 h-5" style={{ color: "#7c3aed" }} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Buy actions card */}
          <div className="mt-6 relative rounded-3xl p-3 bg-white border-2 border-sky-400/70 shadow-[0_18px_50px_-18px_rgba(56,189,248,0.55),0_0_0_4px_rgba(186,230,253,0.4)]">
            <button
              onClick={buyNow}
              className="product-buy-button w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-[15px] hover:opacity-95 active:scale-[0.99] transition"
            >
              <CreditCard className="w-4 h-4" /> Buy Now
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href={plan ? waOrderUrl([{ name: product.name, planPeriod: plan.period, qty, price: parsePrice(plan.price) }]) : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="product-whatsapp-button h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl font-bold text-[13px] hover:opacity-95 transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <button
                onClick={addToCart}
                className="product-cart-button h-11 inline-flex items-center justify-center gap-1.5 rounded-2xl font-bold text-[13px] hover:opacity-95 transition"
              >
                <ShoppingCart className="w-4 h-4" /> Cart
              </button>
            </div>
          </div>

        </GlassCard>
      </section>

      {/* Product Description — always visible */}
      <section className="relative mx-auto max-w-[1200px] px-4 md:px-8 pb-2 pt-2">
        <h2 className="flex items-center gap-3 text-xl md:text-2xl font-extrabold text-slate-900 mb-4">
          <span className="inline-block w-1.5 h-6 md:h-7 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          Product Description
        </h2>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]">
          <div className="p-5 md:p-8 text-sm md:text-base text-slate-800 leading-relaxed">
            <ProductMarkdown source={product.description} />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ProductReviews slug={slug} />

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
