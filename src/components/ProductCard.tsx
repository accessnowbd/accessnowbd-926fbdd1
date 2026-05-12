import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { badgeColorFor } from "@/lib/badgeColor";
import { ProductBanner } from "@/components/ProductBanner";
import type { Product } from "@/data/products";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

function ratingFor(slug: string): { rating: string; reviews: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = (4.6 + ((h % 40) / 100)).toFixed(2);
  const reviews = 18 + (h % 180);
  return { rating, reviews };
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const plan = product.plans[0];
  const hasOptions = product.plans.length > 1;
  const { rating, reviews } = ratingFor(product.slug);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!plan) return;
    add({
      slug: product.slug,
      planPeriod: plan.period,
      qty: 1,
      price: parsePrice(plan.price),
      name: product.name,
      emoji: product.emoji,
      gradient: product.gradient,
    });
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      preload="render"
      className="group gradient-border-card overflow-hidden flex flex-col h-full"
    >
      <div className="relative">
        <ProductBanner product={product} ratio="5/4" />
        {product.badge && (
          <span className={`absolute top-3 left-3 ${badgeColorFor(product.badge)} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-lg z-20`}>
            {product.badge}
          </span>
        )}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full glass text-[10px] font-bold text-foreground z-20">
          <Star className="w-2.5 h-2.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />
          {rating}
        </span>
      </div>

      <div className="relative p-4 flex flex-col flex-1 z-10">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="text-primary font-bold">{product.category}</span>
          <span>·</span>
          <span>({reviews}) reviews</span>
        </div>
        <h3 className="mt-1.5 text-sm font-extrabold tracking-tight line-clamp-2 min-h-[2.6rem] text-foreground">{product.name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{plan?.period}</p>

        <div className="mt-4 pt-3 border-t border-border flex items-end justify-between gap-2">
          <div>
            {plan?.original && (
              <div className="text-[11px] text-muted-foreground line-through leading-none">{plan.original}</div>
            )}
            <div className="text-lg font-extrabold text-aurora leading-tight">{plan?.price ?? "—"}</div>
          </div>
          {hasOptions ? (
            <span className="h-9 px-3.5 inline-flex items-center gap-1 rounded-full btn-aurora text-xs">
              Options
            </span>
          ) : (
            <button
              onClick={onAdd}
              className="grid place-items-center w-10 h-10 rounded-full btn-aurora"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
