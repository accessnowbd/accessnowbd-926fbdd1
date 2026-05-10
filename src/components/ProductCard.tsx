import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { badgeColorFor } from "@/lib/badgeColor";
import type { Product } from "@/data/products";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

// Deterministic pseudo-rating from slug so each card has stable numbers
function ratingFor(slug: string): { rating: string; reviews: number } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const rating = (4.6 + ((h % 40) / 100)).toFixed(2); // 4.60–4.99
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
      className="group glass rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-[var(--shadow-glass-lg)] transition-all flex flex-col"
    >
      <div className={`relative aspect-square bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <span className="relative text-7xl drop-shadow-md">{product.emoji}</span>
        {product.badge && (
          <span className={`absolute top-3 left-3 ${badgeColorFor(product.badge)} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm`}>
            {product.badge}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3 fill-[var(--color-gold)] text-[var(--color-gold)]" />
          <span className="font-semibold text-foreground">{rating}</span>
          <span>/ 5.0</span>
          <span className="opacity-60">·</span>
          <span>({reviews}) reviews</span>
        </div>
        <h3 className="mt-1.5 text-sm font-bold tracking-tight line-clamp-2 min-h-[2.6rem]">{product.name}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{plan?.period} • {product.category}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {plan?.original && (
              <div className="text-[11px] text-muted-foreground line-through leading-none">{plan.original}</div>
            )}
            <div className="text-lg font-extrabold text-aurora leading-tight">{plan?.price ?? "—"}</div>
          </div>
          {hasOptions ? (
            <span className="h-9 px-3 inline-flex items-center rounded-full bg-aurora text-white text-xs font-semibold glow-violet group-hover:scale-105 transition">
              Choose options
            </span>
          ) : (
            <button
              onClick={onAdd}
              className="grid place-items-center w-10 h-10 rounded-full bg-aurora text-white hover:scale-110 transition glow-violet"
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
