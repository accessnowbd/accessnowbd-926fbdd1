import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { badgeColorFor } from "@/lib/badgeColor";
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
      className="group gradient-border-card overflow-hidden flex flex-col"
    >
      {/* Hero */}
      <div className={`relative aspect-[5/4] bg-gradient-to-br ${product.gradient} overflow-hidden`}>
        {/* Mesh blobs */}
        <div className="absolute -top-12 -left-10 w-48 h-48 rounded-full bg-white/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 -right-8 w-56 h-56 rounded-full bg-black/30 blur-3xl" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:32px_32px]" />
        {/* Sweep shimmer on hover */}
        <div className="pointer-events-none absolute -inset-x-1/2 -top-1/2 h-[200%] w-[60%] rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-200%] group-hover:translate-x-[300%] transition-transform duration-[1400ms] ease-out" />

        {/* Glass plate with brand logo */}
        <div className="absolute inset-4 rounded-2xl bg-white/12 border border-white/25 backdrop-blur-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-[0.97] overflow-hidden">
          {product.imageUrl ? (
            <>
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="relative z-10 max-h-[62%] max-w-[72%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.style.display = "none";
                  const fb = t.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "block";
                }}
              />
              <span style={{ display: "none" }} className="text-7xl drop-shadow-2xl">{product.emoji}</span>
            </>
          ) : (
            <span className="text-7xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{product.emoji}</span>
          )}
        </div>

        {product.badge && (
          <span className={`absolute top-3 left-3 ${badgeColorFor(product.badge)} px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-lg z-20`}>
            {product.badge}
          </span>
        )}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/45 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 z-20">
          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
          {rating}
        </span>
      </div>

      {/* Body */}
      <div className="relative p-4 flex flex-col flex-1 z-10">
        <div className="flex items-center gap-1.5 text-[11px] text-white/60">
          <span className="text-white/85 font-semibold">{product.category}</span>
          <span className="opacity-50">·</span>
          <span>({reviews}) reviews</span>
        </div>
        <h3 className="mt-1.5 text-sm font-bold tracking-tight line-clamp-2 min-h-[2.6rem] text-white">{product.name}</h3>
        <p className="text-[11px] text-white/55 mt-0.5">{plan?.period}</p>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between gap-2">
          <div>
            {plan?.original && (
              <div className="text-[11px] text-white/40 line-through leading-none">{plan.original}</div>
            )}
            <div className="text-lg font-extrabold text-aurora-strong leading-tight">{plan?.price ?? "—"}</div>
          </div>
          {hasOptions ? (
            <span className="h-9 px-3.5 inline-flex items-center gap-1 rounded-full btn-aurora text-xs">
              <Sparkles className="w-3 h-3" /> Options
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
