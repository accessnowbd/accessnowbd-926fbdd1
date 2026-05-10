import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Lock, Smartphone, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — AccessNow BD" }] }),
});

const methods = [
  { id: "bkash", name: "bKash", number: "01711-123456", color: "bg-[#E2136E]", logo: "bKash" },
  { id: "nagad", name: "Nagad", number: "01911-654321", color: "bg-[#EC1C24]", logo: "Nagad" },
] as const;

function AuroraHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="bg-aurora text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="grid place-items-center w-9 h-9 rounded-full glass-strong text-primary font-bold">A</span>
          AccessNow BD
        </Link>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", senderNumber: "", trxId: "", notes: "" });
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState<{ orderId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email || "" }));
  }, [user]);

  const selectedMethod = methods.find((m) => m.id === method)!;

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const copyNumber = async () => {
    await navigator.clipboard.writeText(selectedMethod.number.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          full_name: form.name,
          email: form.email,
          phone: form.phone,
          payment_method: method,
          transaction_id: form.trxId,
          items: items.map((it) => ({ slug: it.slug, planPeriod: it.planPeriod, qty: it.qty, name: it.name, emoji: it.emoji, gradient: it.gradient, price: it.price })),
          total,
        })
        .select("id")
        .single();
      if (error) throw error;
      clear();
      setSubmitted({ orderId: (data.id as string).slice(0, 8).toUpperCase() });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  if (!authLoading && !user && items.length > 0) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="glass-strong rounded-2xl p-8 text-center max-w-sm">
          <h1 className="text-2xl font-semibold text-aurora">Login to checkout</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in or create an account to place your order and track it later.</p>
          <Link to="/auth" className="inline-block mt-5 h-[44px] leading-[44px] px-6 rounded-full bg-aurora text-primary-foreground text-sm font-semibold glow-violet">
            Login / Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <Link to="/" className="text-primary underline mt-3 inline-block">Browse subscriptions</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <AuroraHeader />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-aurora grid place-items-center mx-auto glow-aqua">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="mt-6 text-aurora" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600 }}>Order placed!</h1>
          <p className="text-muted-foreground mt-2">Your order ID is <span className="font-semibold text-foreground">{submitted.orderId}</span></p>
          <p className="text-sm text-[#333333] mt-4">
            We're verifying your payment. You'll receive your subscription details on <span className="font-semibold">{form.email}</span> within 5-30 minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/orders" className="inline-block h-[48px] leading-[48px] px-8 rounded-full bg-aurora text-primary-foreground text-sm font-semibold hover:opacity-90 transition glow-violet">
              View my orders
            </Link>
            <Link to="/" className="inline-block h-[48px] leading-[48px] px-8 rounded-full glass-soft text-sm font-semibold hover:bg-[var(--glass-bg-strong)] transition">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AuroraHeader><AccountIcon /><CartIcon /></AuroraHeader>

      <div className="mx-auto max-w-[1100px] px-4 md:px-10 py-8">
        <button onClick={() => navigate({ to: "/cart" })} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to cart
        </button>
        <h1 className="text-aurora" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600 }}>Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {/* Contact */}
            <section className="glass-strong rounded-2xl p-6">
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>1. Contact details</h2>
              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} required placeholder="Mohammad Karim" />
                <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} required placeholder="you@email.com" />
                <Field label="WhatsApp number" value={form.phone} onChange={(v) => update("phone", v)} required placeholder="01XXXXXXXXX" />
              </div>
            </section>

            {/* Payment */}
            <section className="glass-strong rounded-2xl p-6">
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>2. Choose payment method</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {methods.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMethod(m.id as "bkash" | "nagad")}
                      className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${active ? "border-primary glass" : "border-transparent glass-soft hover:border-primary/40"}`}
                    >
                      <span className={`grid place-items-center w-12 h-12 rounded-lg ${m.color} text-white font-bold text-xs`}>{m.logo}</span>
                      <div className="text-left">
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-xs text-muted-foreground">Send Money</div>
                      </div>
                      {active && <Check className="w-4 h-4 text-primary absolute top-2 right-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Instructions */}
              <div className="mt-5 rounded-xl glass-soft p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">How to pay with {selectedMethod.name}</p>
                    <ol className="text-xs text-[#333333] mt-2 space-y-1.5 list-decimal pl-4">
                      <li>Open your {selectedMethod.name} app and tap <b>Send Money</b>.</li>
                      <li>Send <b>৳{total.toLocaleString()}</b> to our number below.</li>
                      <li>Copy the <b>Transaction ID (TrxID)</b> from your confirmation message.</li>
                      <li>Paste it in the form below and submit.</li>
                    </ol>
                    <div className="mt-3 flex items-center justify-between glass rounded-lg px-4 py-2.5">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{selectedMethod.name} Number</div>
                        <div className="text-base font-semibold tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>{selectedMethod.number}</div>
                      </div>
                      <button type="button" onClick={copyNumber} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-accent px-3 py-2 rounded-lg">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <Field label={`${selectedMethod.name} number you sent from`} value={form.senderNumber} onChange={(v) => update("senderNumber", v)} required placeholder="01XXXXXXXXX" />
                <Field label="Transaction ID (TrxID)" value={form.trxId} onChange={(v) => update("trxId", v.toUpperCase())} required placeholder="e.g. 9A8B7C6D5E" />
              </div>
            </section>

            {/* Notes */}
            <section className="glass-strong rounded-2xl p-6">
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>3. Order notes (optional)</h2>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                placeholder="Any special requests..."
                className="mt-3 w-full px-4 py-3 rounded-xl glass-soft text-sm outline-none focus:border-primary"
              />
            </section>
          </div>

          {/* Summary */}
          <aside className="glass-strong rounded-2xl p-6 h-fit lg:sticky lg:top-6">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Order summary</h3>
            <div className="mt-4 space-y-3 max-h-[260px] overflow-auto pr-1">
              {items.map((it) => (
                <div key={`${it.slug}-${it.planPeriod}`} className="flex gap-3 items-center">
                  <div className={`w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br ${it.gradient} grid place-items-center text-xl`}>{it.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.planPeriod} × {it.qty}</div>
                  </div>
                  <div className="text-sm font-semibold">৳{(it.price * it.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--glass-border-soft)] my-4" />
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-semibold text-aurora" style={{ fontFamily: "var(--font-heading)" }}>৳{total.toLocaleString()}</span>
            </div>
            {err && <p className="text-xs text-destructive mt-3 text-center">{err}</p>}
            <button type="submit" disabled={busy} className="mt-5 w-full h-[48px] rounded-full bg-aurora text-primary-foreground text-sm font-semibold hover:opacity-90 transition glow-violet inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {busy ? "Placing order…" : "Place Order"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">Your data is safe. We never share your details.</p>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#333333]">{label}{required && <span className="text-destructive"> *</span>}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full h-[42px] px-4 rounded-md glass-soft text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
