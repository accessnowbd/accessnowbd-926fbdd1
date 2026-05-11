import type { CartItem } from "@/context/CartContext";
import { GlassCard } from "./GlassCard";

interface OrderSummaryProps {
  items: CartItem[];
  total: number;
  /** Shown under the total line. Defaults to a privacy note. */
  footer?: string;
  /** Show as a tall scrollable mini-summary (checkout) vs simple subtotal/delivery (cart). */
  variant?: "lineitems" | "totals";
  /** Optional CTA / extra slot rendered above footer text (e.g. Proceed button). */
  action?: React.ReactNode;
  className?: string;
}

export function OrderSummary({
  items,
  total,
  footer = "Your data is safe. We never share your details.",
  variant = "lineitems",
  action,
  className,
}: OrderSummaryProps) {
  return (
    <GlassCard className={`h-fit lg:sticky lg:top-6 ${className ?? ""}`}>
      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>
        Order summary
      </h3>

      {variant === "lineitems" ? (
        <div className="mt-4 space-y-3 max-h-[260px] overflow-auto pr-1">
          {items.map((it) => (
            <div key={`${it.slug}-${it.planPeriod}`} className="flex gap-3 items-center">
              <div
                className={`w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br ${it.gradient} grid place-items-center text-xl`}
              >
                {it.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  {it.planPeriod} × {it.qty}
                </div>
              </div>
              <div className="text-sm font-semibold">
                ৳{(it.price * it.qty).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>৳{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-aqua-deep font-semibold">FREE</span>
          </div>
        </div>
      )}

      <div className="border-t border-[var(--glass-border-soft)] my-4" />
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold">Total</span>
        <span
          className="text-2xl font-semibold text-aurora"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          ৳{total.toLocaleString()}
        </span>
      </div>

      {action}

      {footer && (
        <p className="text-[11px] text-muted-foreground text-center mt-3">{footer}</p>
      )}
    </GlassCard>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}
