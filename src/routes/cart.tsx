import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { GlassCard } from "@/components/ui-glass/GlassCard";
import { GlassButton } from "@/components/ui-glass/GlassButton";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your Cart — AccessNow BD" }] }),
});

function CartPage() {
  const { items, remove, setQty, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="bg-aurora text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-full glass-strong text-primary font-bold">A</span>
            AccessNow BD
          </Link>
          <div className="flex items-center gap-2"><AccountIcon /><CartIcon /></div>
        </div>
      </header>

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

            <GlassCard className="h-fit lg:sticky lg:top-6">
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 600 }}>Order Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-aqua-deep font-semibold">FREE</span></div>
              </div>
              <div className="border-t border-[var(--glass-border-soft)] my-4" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-2xl font-semibold text-aurora" style={{ fontFamily: "var(--font-heading)" }}>৳{total.toLocaleString()}</span>
              </div>
              <GlassButton onClick={() => navigate({ to: "/checkout" })} fullWidth size="lg" className="mt-5">
                Proceed to Checkout
              </GlassButton>
              <p className="text-[11px] text-muted-foreground text-center mt-3">Secure payment with bKash & Nagad</p>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
