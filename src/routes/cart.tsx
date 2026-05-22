import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, X, Check, MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useCart } from "@/context/CartContext";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { GlassCard } from "@/components/ui-glass/GlassCard";
import { GlassButton } from "@/components/ui-glass/GlassButton";
import { AuroraHeader } from "@/components/ui-glass/AuroraHeader";
import { OrderSummary } from "@/components/ui-glass/OrderSummary";
import { applyCouponWith, useActiveCoupons } from "@/lib/coupons";
import { waOrderUrl } from "@/lib/whatsapp";
import { useShopConfig } from "@/hooks/useShopConfig";

const cartSearchSchema = z.object({
  coupon: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/cart")({
  component: CartPage,
  validateSearch: zodValidator(cartSearchSchema),
  head: () => ({ meta: [{ title: "Your Cart — AccessNow BD" }] }),
});

function CartPage() {
  const { items, remove, setQty, total, count } = useCart();
  const navigate = useNavigate();
  const { coupon } = Route.useSearch();
  const { data: shopConfig } = useShopConfig();

  const coupons = useActiveCoupons();
  const applied = useMemo(() => applyCouponWith(coupons, coupon, total), [coupons, coupon, total]);
  const [input, setInput] = useState(coupon);
  useEffect(() => { setInput(coupon); }, [coupon]);

  const setCouponParam = (val: string) =>
    navigate({ to: "/cart", search: { coupon: val }, replace: true });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 md:px-10 py-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
        </Link>
        <h1 className="text-aurora" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600 }}>Your Cart</h1>
        <p className="text-muted-foreground mt-1">{count} {count === 1 ? "item" : "items"}</p>

        {items.length === 0 ? (
          <GlassCard tone="soft" className="mt-12 py-20 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-primary/70" />
            <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mt-2">Add a subscription to get started.</p>
            <GlassButton onClick={() => navigate({ to: "/" })} className="mt-5">
              Browse subscriptions
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {items.map((it) => {
                const lineTotal = it.price * it.qty;
                return (
                  <GlassCard key={`${it.slug}-${it.planPeriod}`} className="!p-4 flex gap-4 transition hover:-translate-y-0.5">
                    <div className={`w-20 h-20 shrink-0 rounded-xl bg-gradient-to-br ${it.gradient} grid place-items-center text-3xl shadow-inner`}>
                      {it.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{it.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{it.planPeriod} · ৳{it.price.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => remove(it.slug, it.planPeriod)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Remove ${it.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center glass-soft rounded-full" role="group" aria-label="Quantity">
                          <button onClick={() => setQty(it.slug, it.planPeriod, it.qty - 1)} className="w-9 h-9 grid place-items-center hover:text-primary rounded-l-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Decrease quantity"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{it.qty}</span>
                          <button onClick={() => setQty(it.slug, it.planPeriod, it.qty + 1)} className="w-9 h-9 grid place-items-center hover:text-primary rounded-r-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Increase quantity"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <span className="text-base font-semibold text-aurora" style={{ fontFamily: "var(--font-heading)" }}>৳{lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            <OrderSummary
              items={items}
              total={total}
              variant="totals"
              discount={applied.discount}
              couponCode={applied.valid ? applied.code : undefined}
              footer="Secure payment with BKash & Nagad"
              extra={
                <form
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCouponParam(input.trim().toUpperCase());
                  }}
                >
                  <label htmlFor="coupon" className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Coupon code
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      id="coupon"
                      value={input}
                      onChange={(e) => setInput(e.target.value.toUpperCase())}
                      placeholder="SAVE10"
                      className="flex-1 glass-soft rounded-lg px-3 py-2 text-sm font-medium tracking-wider uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-invalid={coupon ? !applied.valid : undefined}
                      aria-describedby="coupon-status"
                    />
                    {applied.valid ? (
                      <GlassButton type="button" variant="ghost" size="sm" onClick={() => setCouponParam("")} aria-label="Remove coupon">
                        <X className="w-3.5 h-3.5" /> Remove
                      </GlassButton>
                    ) : (
                      <GlassButton type="submit" variant="secondary" size="sm" disabled={!input.trim()}>
                        Apply
                      </GlassButton>
                    )}
                  </div>
                  <p id="coupon-status" className="text-[11px] mt-1.5 min-h-[14px]" role={coupon && !applied.valid ? "alert" : undefined}>
                    {applied.valid ? (
                      <span className="text-aqua-deep inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> {applied.label} applied
                      </span>
                    ) : coupon ? (
                      <span className="text-destructive">{applied.reason || "Invalid coupon code"}</span>
                    ) : (
                      <span className="text-muted-foreground">Have a code? Enter it above.</span>
                    )}
                  </p>
                </form>
              }
              action={
                <div className="mt-5 space-y-2">
                  <GlassButton
                    onClick={() => navigate({ to: "/checkout", search: { step: 1, coupon: applied.valid ? applied.code : "" } })}
                    fullWidth
                    size="lg"
                  >
                    Proceed to Checkout
                  </GlassButton>
                  <a
                    href={waOrderUrl(items, { number: shopConfig?.whatsapp_number })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-12 w-full rounded-full bg-[#25D366] text-white text-sm font-bold hover:opacity-90 transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Order via WhatsApp
                  </a>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
