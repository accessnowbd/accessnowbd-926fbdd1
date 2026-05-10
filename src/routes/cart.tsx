import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Your Cart — AccessNow BD" }] }),
});

function CartPage() {
  const { items, remove, setQty, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-primary font-bold">A</span>
            AccessNow BD
          </Link>
          <div className="flex items-center gap-2"><AccountIcon /><CartIcon /></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 md:px-10 py-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500 }}>Your Cart</h1>
        <p className="text-muted-foreground mt-1">{count} {count === 1 ? "item" : "items"}</p>

        {items.length === 0 ? (
          <div className="mt-12 border border-dashed border-border rounded-2xl py-20 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mt-2">Add a subscription to get started.</p>
            <Link to="/" className="inline-block mt-5 h-[42px] leading-[42px] px-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
              Browse subscriptions
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="space-y-3">
              {items.map((it) => {
                const lineTotal = it.price * it.qty;
                return (
                  <div key={`${it.slug}-${it.planPeriod}`} className="bg-white border border-border rounded-xl p-4 flex gap-4">
                    <div className={`w-20 h-20 shrink-0 rounded-lg bg-gradient-to-br ${it.gradient} grid place-items-center text-3xl`}>
                      {it.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 600 }}>{it.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{it.planPeriod} · ৳{it.price.toLocaleString()}</p>
                        </div>
                        <button onClick={() => remove(it.slug, it.planPeriod)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-border rounded-full">
                          <button onClick={() => setQty(it.slug, it.planPeriod, it.qty - 1)} className="w-8 h-8 grid place-items-center hover:text-primary"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                          <button onClick={() => setQty(it.slug, it.planPeriod, it.qty + 1)} className="w-8 h-8 grid place-items-center hover:text-primary"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <span className="text-base font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>৳{lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <aside className="bg-white border border-border rounded-2xl p-6 h-fit lg:sticky lg:top-6">
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 18, fontWeight: 600 }}>Order Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-[var(--color-teal)] font-semibold">FREE</span></div>
              </div>
              <div className="border-t border-border my-4" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-2xl font-semibold text-primary" style={{ fontFamily: "var(--font-heading)" }}>৳{total.toLocaleString()}</span>
              </div>
              <button
                onClick={() => navigate({ to: "/checkout" })}
                className="mt-5 w-full h-[48px] rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
              >
                Proceed to Checkout
              </button>
              <p className="text-[11px] text-muted-foreground text-center mt-3">Secure payment with bKash, Nagad & cards</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
