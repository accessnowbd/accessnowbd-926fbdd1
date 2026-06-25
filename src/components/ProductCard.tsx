import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star, MessageCircle } from "lucide-react";
import { memo } from "react";
import { useCart } from "@/context/CartContext";
import { useShopConfigValue } from "@/context/ShopConfigContext";
import { badgeColorFor } from "@/lib/badgeColor";
import { ProductBanner } from "@/components/ProductBanner";
import { waAskUrl } from "@/lib/whatsapp";
import { captureAbandonedCheckout } from "@/lib/abandonedCheckout";
import type { Product } from "@/data/products";

const parsePrice = (p: unknown) => {
  if (typeof p === "number") return Number.isFinite(p) ? p : 0;
  if (typeof p !== "string") return 0;
  return Number(p.replace(/[^\d]/g, "")) || 0;
};

function ratingFor(slug: string): { rating: string; reviews: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = (4.6 + ((h % 40) / 100)).toFixed(2);
  const reviews = 18 + (h % 180);
  return { rating, reviews };
}

function ProductCardImpl({ product }: { product: Product }) {
  const { add } = useCart();
  const shopConfig = useShopConfigValue();

  const plan = product.plans[0];
  const hasOptions = product.plans.length > 1;
  const { rating, reviews } = ratingFor(product.slug);
  // Note: per-product prefetch removed. The full product list already contains
  // every field the detail page needs, and `useProduct` seeds itself from that
  // cache via `initialData`, so individual `?slug=X` fetches are redundant and
  // were causing dozens of duplicate API calls on the homepage.

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!plan) return;
    const item = {
      slug: product.slug,
      planPeriod: plan.period,
      qty: 1,
      price: parsePrice(plan.price),
      name: product.name,
      emoji: product.emoji,
      gradient: product.gradient,
    };
    add(item);
    captureAbandonedCheckout({
      items: [item],
      source: "product_card_cart",
      stage: "cart",
      metadata: { productSlug: product.slug, category: product.category },
    });
  };

  const captureIntent = () => {
    if (!plan) return;
    captureAbandonedCheckout({
      items: [{
        slug: product.slug,
        planPeriod: plan.period,
        qty: 1,
        price: parsePrice(plan.price),
        name: product.name,
        emoji: product.emoji,
        gradient: product.gradient,
      }],
      source: "product_card_click",
      stage: "intent",
      metadata: { productSlug: product.slug, category: product.category },
    });
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      preload="intent"
      onClick={captureIntent}
      className="group product-card-v2 relative overflow-hidden flex flex-col h-full rounded-lg border border-[var(--glass-border)] bg-card shadow-[var(--shadow-glass-sm)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-glass)] will-change-transform"
    >
      <div className="relative overflow-hidden [&_img]:transition-transform [&_img]:duration-[600ms] [&_img]:ease-[cubic-bezier(0.22,1,0.36,1)]">
        <ProductBanner product={product} ratio="1/1" />
        {/* Elegant hover: soft glow + diagonal shine sweep (desktop only) */}
        <div className="pointer-events-none absolute inset-0 z-10 hidden md:block opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 z-10 hidden md:block overflow-hidden">
          <div className="absolute top-0 -left-3/4 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-md opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-[260%] transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
        </div>
        {/* Discount + badge row, bottom-left of image — like reference */}
        <div className="absolute left-3 bottom-3 flex items-center gap-1.5 z-20">
          {plan?.original && plan?.price && (() => {
            const op = parsePrice(plan.original);
            const np = parsePrice(plan.price);
            if (op > 0 && np > 0 && np < op) {
              const pct = Math.round(((op - np) / op) * 100);
              return (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-gradient-to-r from-rose-500 to-red-500 shadow-md">
                  -{pct}%
                </span>
              );
            }
            return null;
          })()}
          {product.badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase shadow-md ${badgeColorFor(product.badge)}`}>
              {product.badge}
            </span>
          )}
        </div>
      </div>

      <div className="relative p-4 flex flex-col flex-1 z-10 gap-2.5">
        <h3 className="text-[14px] font-extrabold tracking-tight line-clamp-2 min-h-[2.6rem] text-foreground leading-snug">
          {product.name}
        </h3>

        {/* Rating row */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.round(Number(rating))
                    ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">({reviews})</span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-extrabold text-aurora leading-none">{plan?.price ?? "—"}</span>
          {plan?.original && (
            <span className="text-[12px] text-muted-foreground line-through">{plan.original}</span>
          )}
        </div>

        {/* Action stack — Buy Now on top, WhatsApp + Cart below */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <span
            className="product-action-button product-buy-button flex items-center justify-center gap-2 h-11 rounded-full text-[13px] font-bold"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(
                  waAskUrl(product.name, { number: shopConfig.whatsapp_number }),
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              aria-label="Order via WhatsApp"
              className="product-action-button product-whatsapp-button flex items-center justify-center gap-1.5 h-10 rounded-full text-[12px] font-bold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={onAdd}
              disabled={hasOptions}
              aria-label="Add to cart"
              className="product-action-button product-cart-button flex items-center justify-center gap-1.5 h-10 rounded-full text-[12px] font-bold transition disabled:opacity-100"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardImpl, (a, b) => a.product.slug === b.product.slug);

