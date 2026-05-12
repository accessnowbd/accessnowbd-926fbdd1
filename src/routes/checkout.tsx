import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Lock, Smartphone, Loader2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui-glass/GlassCard";
import { GlassButton } from "@/components/ui-glass/GlassButton";
import { GlassField } from "@/components/ui-glass/GlassField";
import { Stepper } from "@/components/ui-glass/Stepper";
import { RadioCard } from "@/components/ui-glass/RadioCard";
import { AuroraHeader } from "@/components/ui-glass/AuroraHeader";
import { OrderSummary, SummaryRow } from "@/components/ui-glass/OrderSummary";
import { applyCoupon } from "@/lib/coupons";

const checkoutSearchSchema = z.object({
  step: fallback(z.union([z.literal(1), z.literal(2), z.literal(3)]), 1).default(1),
  coupon: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  validateSearch: zodValidator(checkoutSearchSchema),
  head: () => ({ meta: [{ title: "Checkout — AccessNow BD" }] }),
});

const methods = [
  { id: "bkash", name: "BKash", number: "01711-123456", color: "bg-[#E2136E]" },
  { id: "nagad", name: "Nagad", number: "01911-654321", color: "bg-[#EC1C24]" },
  { id: "rocket", name: "Rocket", number: "01511-987654", color: "bg-[#8C3494]" },
] as const;

type MethodId = typeof methods[number]["id"];

const steps = [
  { label: "Contact" },
  { label: "Payment" },
  { label: "Review" },
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bdPhoneRe = /^01[3-9]\d{8}$/;

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { step, coupon } = Route.useSearch();
  const setStep = (n: 1 | 2 | 3) =>
    navigate({ to: "/checkout", search: { step: n, coupon }, replace: false });

  // Scroll to top whenever the active step changes (incl. browser back/forward).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", senderNumber: "", trxId: "", notes: "" });
  const [method, setMethod] = useState<MethodId>("bkash");
  const [agree, setAgree] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email || "" }));
  }, [user]);

  const selectedMethod = methods.find((m) => m.id === method)!;
  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!emailRe.test(form.email)) e.email = "Enter a valid email";
    if (!bdPhoneRe.test(form.phone)) e.phone = "Enter a valid 11-digit BD number (01XXXXXXXXX)";
    if (!bdPhoneRe.test(form.senderNumber)) e.senderNumber = "Enter the 11-digit number you sent from";
    if (form.trxId.trim().length < 6) e.trxId = "TrxID looks too short";
    return e;
  }, [form]);

  const step1Valid = !errors.name && !errors.email && !errors.phone;
  const step2Valid = !errors.senderNumber && !errors.trxId;

  // Guard direct deep links: if user lands on step 2/3 without prior steps valid, bounce back.
  useEffect(() => {
    if ((step === 2 || step === 3) && !step1Valid) {
      setTouched((t) => ({ ...t, name: true, email: true, phone: true }));
      navigate({ to: "/checkout", search: { step: 1, coupon }, replace: true });
      return;
    }
    if (step === 3 && !step2Valid) {
      setTouched((t) => ({ ...t, senderNumber: true, trxId: true }));
      navigate({ to: "/checkout", search: { step: 2, coupon }, replace: true });
    }
  }, [step, step1Valid, step2Valid, navigate, coupon]);

  const applied = useMemo(() => applyCoupon(coupon, total), [coupon, total]);
  const grandTotal = Math.max(0, total - applied.discount);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(selectedMethod.number.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async () => {
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
          total: grandTotal,
        })
        .select("id")
        .single();
      if (error) throw error;
      const newId = data.id as string;
      clear();
      navigate({ to: "/orders/$id", params: { id: newId }, search: { new: 1 } });
      return;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  // ----- Auth/empty guards -----
  if (!authLoading && !user && items.length > 0) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <GlassCard className="text-center max-w-sm">
          <h1 className="text-2xl font-semibold text-aurora">Login to checkout</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in or create an account to place your order and track it later.</p>
          <GlassButton onClick={() => navigate({ to: "/auth" })} size="lg" className="mt-5">Login / Sign up</GlassButton>
        </GlassCard>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <GlassCard className="text-center">
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <Link to="/" className="text-primary underline mt-3 inline-block">Browse subscriptions</Link>
        </GlassCard>
      </div>
    );
  }

  // ----- Wizard -----
  const goNext = () => {
    if (step === 1) {
      setTouched({ name: true, email: true, phone: true });
      if (step1Valid) setStep(2);
    } else if (step === 2) {
      setTouched((t) => ({ ...t, senderNumber: true, trxId: true }));
      if (step2Valid) setStep(3);
    }
  };
  const goBack = () => { if (step > 1) setStep((step - 1) as 1 | 2); };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 md:px-10 py-8">
        <button onClick={() => navigate({ to: "/cart" })} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to cart
        </button>
        <h1 className="text-aurora" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600 }}>Checkout</h1>

        <div className="mt-6">
          <Stepper steps={steps} current={step} onStepClick={(n) => setStep(n as 1 | 2 | 3)} />
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            {/* Step 1 */}
            {step === 1 && (
              <GlassCard>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Contact details</h2>
                <p className="text-xs text-muted-foreground mt-1">We'll send order updates here.</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <GlassField
                    label="Full name"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    onBlur={() => blur("name")}
                    error={touched.name ? errors.name : null}
                    placeholder="Mohammad Karim"
                  />
                  <GlassField
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() => blur("email")}
                    error={touched.email ? errors.email : null}
                    placeholder="you@email.com"
                  />
                  <GlassField
                    label="WhatsApp number"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    onBlur={() => blur("phone")}
                    error={touched.phone ? errors.phone : null}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                  />
                </div>
                <div className="mt-6 flex justify-end">
                  <GlassButton onClick={goNext} size="lg" disabled={!step1Valid}>Continue to Payment</GlassButton>
                </div>
              </GlassCard>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <GlassCard>
                <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Choose payment method</h2>
                <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                  {methods.map((m) => (
                    <RadioCard key={m.id} checked={method === m.id} onClick={() => setMethod(m.id)} ariaLabel={m.name}>
                      <div className="flex items-center gap-3">
                        <span className={`grid place-items-center w-12 h-12 rounded-lg ${m.color} text-white font-bold text-xs`}>{m.name}</span>
                        <div>
                          <div className="text-sm font-semibold">{m.name}</div>
                          <div className="text-xs text-muted-foreground">Send Money</div>
                        </div>
                      </div>
                    </RadioCard>
                  ))}
                </div>

                <div className="mt-5 rounded-xl glass-soft p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">How to pay with {selectedMethod.name}</p>
                      <ol className="text-xs text-foreground/80 mt-2 space-y-1.5 list-decimal pl-4">
                        <li>Open your {selectedMethod.name} app and tap <b>Send Money</b>.</li>
                        <li>Send <b>৳{grandTotal.toLocaleString()}</b> to our number below.</li>
                        <li>Copy the <b>Transaction ID (TrxID)</b> from your confirmation message.</li>
                        <li>Paste it in the form below and continue.</li>
                      </ol>
                      <div className="mt-3 flex items-center justify-between glass rounded-lg px-4 py-2.5">
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{selectedMethod.name} Number</div>
                          <div className="text-base font-semibold tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>{selectedMethod.number}</div>
                        </div>
                        <GlassButton type="button" variant="ghost" size="sm" onClick={copyNumber}>
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied" : "Copy"}
                        </GlassButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <GlassField
                    label={`${selectedMethod.name} number you sent from`}
                    required
                    value={form.senderNumber}
                    onChange={(e) => update("senderNumber", e.target.value)}
                    onBlur={() => blur("senderNumber")}
                    error={touched.senderNumber ? errors.senderNumber : null}
                    placeholder="01XXXXXXXXX"
                    inputMode="numeric"
                  />
                  <GlassField
                    label="Transaction ID (TrxID)"
                    required
                    value={form.trxId}
                    onChange={(e) => update("trxId", e.target.value.toUpperCase())}
                    onBlur={() => blur("trxId")}
                    error={touched.trxId ? errors.trxId : null}
                    placeholder="e.g. 9A8B7C6D5E"
                  />
                </div>

                <div className="mt-6 flex justify-between gap-3">
                  <GlassButton variant="secondary" size="lg" onClick={goBack}>Back</GlassButton>
                  <GlassButton size="lg" onClick={goNext} disabled={!step2Valid}>Review Order</GlassButton>
                </div>
              </GlassCard>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Contact</h2>
                    <button onClick={() => setStep(1)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                    <SummaryRow label="Name" value={form.name} />
                    <SummaryRow label="Email" value={form.email} />
                    <SummaryRow label="WhatsApp" value={form.phone} />
                  </dl>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center justify-between">
                    <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Payment</h2>
                    <button onClick={() => setStep(2)} className="text-xs text-primary inline-flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <dl className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                    <SummaryRow label="Method" value={selectedMethod.name} />
                    <SummaryRow label="Sent from" value={form.senderNumber} />
                    <SummaryRow label="TrxID" value={form.trxId} />
                  </dl>
                </GlassCard>

                <GlassCard>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 600 }}>Order notes (optional)</h2>
                  <div className="mt-3">
                    <GlassField
                      label="Notes"
                      multiline
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      placeholder="Any special requests..."
                    />
                  </div>
                </GlassCard>

                <GlassCard tone="soft">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm text-foreground/90">
                      I confirm the TrxID above is correct and I've sent <b>৳{grandTotal.toLocaleString()}</b> via {selectedMethod.name}.
                    </span>
                  </label>
                </GlassCard>

                {err && <p role="alert" className="text-sm text-destructive text-center">{err}</p>}

                <div className="flex justify-between gap-3">
                  <GlassButton variant="secondary" size="lg" onClick={goBack}>Back</GlassButton>
                  <GlassButton size="lg" disabled={!agree || busy} onClick={handleSubmit}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {busy ? "Placing order…" : "Place Order"}
                  </GlassButton>
                </div>
              </>
            )}
          </div>

          <OrderSummary
            items={items}
            total={total}
            discount={applied.discount}
            couponCode={applied.valid ? applied.code : undefined}
            variant="lineitems"
          />
        </div>
      </div>
    </div>
  );
}

