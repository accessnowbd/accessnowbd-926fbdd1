import { Link } from "@tanstack/react-router";
import { ShoppingCart, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductBanner } from "@/components/ProductBanner";
import type { Product } from "@/data/products";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

function priceRange(product: Product) {
  if (!product.plans.length) return { min: "—", max: null as string | null };
  const nums = product.plans.map((p) => parsePrice(p.price)).filter((n) => n > 0);
  if (nums.length === 0) return { min: product.plans[0].price, max: null };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return { min: `৳${min.toLocaleString("en-US")}`, max: null };
  return { min: `৳${min.toLocaleString("en-US")}`, max: `৳${max.toLocaleString("en-US")}` };
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const plan = product.plans[0];
  const hasOptions = product.plans.length > 1;
  const { min, max } = priceRange(product);
  const original = !hasOptions ? plan?.original : null;

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
      className="product-card flex flex-col h-full group"
    >
      {/* Banner — full bleed */}
      <div className="relative overflow-hidden">
        <ProductBanner product={product} ratio="1/1" />
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-destructive text-white text-[10px] font-extrabold tracking-wide uppercase shadow z-20">
            {product.badge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[14px] font-bold leading-snug line-clamp-2 min-h-[2.6rem] text-foreground">
          {product.name}
        </h3>

        <div className="mt-2 inline-flex items-center gap-1.5 text-[12px]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-success font-semibold">In Stock</span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15px] font-extrabold text-primary">
            {min}
            {max && <span className="font-bold"> — {max}</span>}
          </span>
          {original && (
            <span className="text-[12px] text-muted-foreground line-through">{original}</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {hasOptions ? (
            <button
              onClick={(e) => e.preventDefault()}
              className="btn-black w-full h-10 inline-flex items-center justify-center gap-1.5 text-[12px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" /> Choose Plan
            </button>
          ) : (
            <button
              onClick={onAdd}
              className="btn-black w-full h-10 inline-flex items-center justify-center gap-1.5 text-[12px]"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
