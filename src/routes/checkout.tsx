import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Lock, Smartphone, Loader2, Pencil, X, ChevronRight, Tag } from "lucide-react";
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
import { useAppliedCoupon, redeemCoupon } from "@/lib/coupons";
import { usePaymentMethods } from "@/hooks/useShopConfig";

const checkoutSearchSchema = z.object({
  step: fallback(z.union([z.literal(1), z.literal(2)]), 1).default(1),
  coupon: fallback(z.string(), "").default(""),
});


export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  validateSearch: zodValidator(checkoutSearchSchema),
  head: () => ({ meta: [{ title: "Checkout — AccessNow BD" }] }),
});

type PayMethod = {
  id: string;
  name: string;
  number: string;
  color: string;
  instructions?: string;
  logo_url?: string;
  brand_color?: string;
  send_money_label?: string;
};

const FALLBACK_METHODS: PayMethod[] = [
  { id: "bkash", name: "bKash", number: "01711-123456", color: "bg-[#E2136E]", brand_color: "#E2136E", send_money_label: "Send Money" },
  { id: "nagad", name: "Nagad", number: "01911-654321", color: "bg-[#EC1C24]", brand_color: "#EC1C24", send_money_label: "Send Money" },
  { id: "rocket", name: "Rocket", number: "01511-987654", color: "bg-[#8C3494]", brand_color: "#8C3494", send_money_label: "Send Money" },
];

const COLOR_BY_NAME: Record<string, string> = {
  bkash: "bg-[#E2136E]",
  nagad: "bg-[#EC1C24]",
  rocket: "bg-[#8C3494]",
};


const steps = [
  { label: "Contact" },
  { label: "Payment" },
];


const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bdPhoneRe = /^01[3-9]\d{8}$/;

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { step, coupon } = Route.useSearch();
  const setStep = (n: 1 | 2) =>
    navigate({ to: "/checkout", search: { step: n, coupon }, replace: false });

  // Scroll to top whenever the active step changes (incl. browser back/forward).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", senderNumber: "", trxId: "", notes: "" });
  const { data: dynamicMethods } = usePaymentMethods("checkout");
  const methods: PayMethod[] = useMemo(() => {
    const list = (dynamicMethods ?? []).map((m) => ({
      id: (m.id || m.name || "").toLowerCase().replace(/\s+/g, "-") || m.name,
      name: m.name,
      number: m.number,
      color: m.color || COLOR_BY_NAME[m.name?.toLowerCase()] || "bg-slate-700",
      instructions: m.instructions,
      logo_url: m.logo_url,
      brand_color: m.brand_color,
      send_money_label: m.send_money_label,
    }));
    return list.length > 0 ? list : FALLBACK_METHODS;
  }, [dynamicMethods]);
  const [method, setMethod] = useState<string>("bkash");
  const [agree, setAgree] = useState(false);
  const [copied, setCopied] = useState(false);
  const [couponInput, setCouponInput] = useState(coupon || "");
  const [screenshotUrl, setScreenshotUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, email: f.email || user.email || "" }));
  }, [user]);

  // Ensure selected method exists in current list
  useEffect(() => {
    if (methods.length && !methods.find((m) => m.id === method)) {
      setMethod(methods[0].id);
    }
  }, [methods, method]);

  const selectedMethod = methods.find((m) => m.id === method) ?? methods[0];
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

  // Guard direct deep links: if user lands on step 2 without step 1 valid, bounce back.
  useEffect(() => {
    if (step === 2 && !step1Valid) {
      setTouched((t) => ({ ...t, name: true, email: true, phone: true }));
      navigate({ to: "/checkout", search: { step: 1, coupon }, replace: true });
    }
  }, [step, step1Valid, navigate, coupon]);


  const applied = useAppliedCoupon(coupon, total);
  const grandTotal = Math.max(0, total - applied.discount);

  const copyNumber = async () => {
    await navigator.clipboard.writeText(selectedMethod.number.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate({ to: "/login" });
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
          payment_screenshot_url: screenshotUrl || null,
          items: items.map((it) => ({ slug: it.slug, planPeriod: it.planPeriod, qty: it.qty, name: it.name, emoji: it.emoji, gradient: it.gradient, price: it.price })),
          total: grandTotal,
        })
        .select("id")
        .single();
      if (error) throw error;
      const newId = data.id as string;
      if (applied.valid && applied.code) {
        redeemCoupon(applied.code).catch(() => {});
      }
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
          <GlassButton onClick={() => navigate({ to: "/login" })} size="lg" className="mt-5">Login / Sign up</GlassButton>
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
    }
  };
  const goBack = () => { if (step > 1) setStep((step - 1) as 1 | 2); };

  // Compact single-card layout for Step 1 (matches reference design)
  if (step === 1) {
    const firstItem = items[0];
    const title = items.length === 1 ? firstItem.name : `${items.length} items`;
    const applyCouponNow = () => {
      const code = couponInput.trim().toUpperCase();
      navigate({ to: "/checkout", search: { step: 1, coupon: code }, replace: true });
    };
    return (
      <div className="min-h-screen grid place-items-center px-4 py-10 bg-slate-50">
        <GlassCard className="w-full max-w-[480px] !p-0 overflow-hidden rounded-[2.5rem] shadow-2xl border border-violet-100 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${firstItem.gradient} grid place-items-center text-lg`}>
                {firstItem.emoji}
              </div>
              <h1 className="text-[15px] font-semibold text-slate-900 truncate" style={{ fontFamily: "var(--font-heading)" }}>
                {title}
              </h1>

            </div>
            <button
              onClick={() => navigate({ to: "/cart" })}
              aria-label="Close"
              className="p-1.5 rounded-full hover:bg-foreground/5 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-px bg-[var(--glass-border-soft)] mx-5" />

          {/* Step header */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2.5">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">১</span>
              <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>
                আপনার তথ্য দিন
              </h2>

            </div>
            {user && (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
                লগইন আছে <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Fields */}
          <div className="px-5 mt-4 space-y-3">
            <PillField
              label="পুরো নাম"
              value={form.name}
              onChange={(v) => update("name", v)}
              onBlur={() => blur("name")}
              error={touched.name ? errors.name : null}
              placeholder="আপনার নাম"
            />
            <PillField
              label="ইমেইল"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              onBlur={() => blur("email")}
              error={touched.email ? errors.email : null}
              placeholder="you@email.com"
            />
            <PillField
              label="ফোন নম্বর"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              onBlur={() => blur("phone")}
              error={touched.phone ? errors.phone : null}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
            />

            {/* Coupon */}
            <div>
              <label className="text-[12px] font-medium text-slate-700 ml-3">কুপন কোড (ঐচ্ছিক)</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-11 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="SAVE20"
                    className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
                  />
                </div>
                <button
                  onClick={applyCouponNow}
                  className="h-11 px-5 rounded-full border border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Apply
                </button>
              </div>
              {coupon && (
                <p className={`text-[11px] mt-1.5 ml-3 ${applied.valid ? "text-emerald-600" : "text-destructive"}`}>
                  {applied.valid ? `প্রয়োগ হয়েছে: ${applied.label}` : "কুপন কোডটি সঠিক নয়"}
                </p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="mx-5 mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-500">মূল্য</span>
              <span className="text-slate-900 font-medium">৳{total.toLocaleString()}</span>
            </div>
            {applied.discount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 text-sm border-t border-slate-100">
                <span className="text-emerald-600">ছাড় ({applied.code})</span>
                <span className="text-emerald-600 font-medium">−৳{applied.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
              <span className="text-[15px] font-semibold text-slate-900">মোট</span>
              <span className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                ৳{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>


          {/* CTA */}
          <div className="px-5 py-5">
            <button
              onClick={goNext}
              disabled={!step1Valid}
              className="w-full h-12 rounded-full text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-lg shadow-primary/25"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}
            >
              পেমেন্টে যান <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        </GlassCard>
      </div>
    );
  }

  // ----- Step 2: unified payment card matching reference design -----
  const firstItem = items[0];
  const cardTitle = items.length === 1 ? firstItem.name : `${items.length} items`;
  const brand = selectedMethod.brand_color || "#7c3aed";
  const sendLabel = selectedMethod.send_money_label || "Send Money";

  // Parse instructions: one step per line. Fallback to default 6 Bangla steps.
  const instructionLines = (selectedMethod.instructions || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const steps2 = instructionLines.length > 0 ? instructionLines : [
    `আপনার ${selectedMethod.name} অ্যাপ বা *247# ডায়াল করুন`,
    `"${sendLabel}" অপশনটি সিলেক্ট করুন`,
    `নম্বর বক্সে উপরের নম্বরটি পেস্ট করুন`,
    `পরিমাণ লিখুন ও PIN দিয়ে কনফার্ম করুন`,
    `Transaction ID কপি করুন`,
    `নিচের বক্সে TrxID পেস্ট করে অর্ডার সম্পন্ন করুন`,
  ];

  const handleScreenshot = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { setErr("ফাইল সর্বোচ্চ ৫MB হতে হবে"); return; }
    setUploading(true);
    setErr(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-screenshots").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      // Bucket is private; store a long-lived signed URL so admins can review the screenshot.
      const { data: signed, error: signErr } = await supabase
        .storage
        .from("payment-screenshots")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      setScreenshotUrl(signed.signedUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-slate-50">
      <GlassCard className="w-full max-w-[520px] !p-0 overflow-hidden rounded-[2.5rem] shadow-2xl border border-violet-100 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br ${firstItem.gradient} grid place-items-center text-lg`}>
              {firstItem.emoji}
            </div>
            <h1 className="text-[15px] font-semibold text-slate-900 truncate" style={{ fontFamily: "var(--font-heading)" }}>
              {cardTitle}
            </h1>
          </div>
          <button onClick={() => navigate({ to: "/cart" })} aria-label="Close" className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-slate-200 mx-5" />

        {/* Step header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">২</span>
            <h2 className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>পেমেন্ট করুন</h2>
          </div>
          <button onClick={() => setStep(1)} className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium">
            ← পিছনে
          </button>
        </div>

        {/* Payment method tiles */}
        <div className="px-5 mt-4 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Payment method">
          {methods.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                role="radio"
                aria-checked={active}
                className={`relative rounded-2xl border-2 bg-white px-3 py-3 flex flex-col items-center gap-1.5 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? "border-primary ring-2 ring-primary/20" : "border-slate-200 hover:border-primary/40"
                }`}
              >
                <div className="w-12 h-12 grid place-items-center">
                  {m.logo_url ? (
                    <img src={m.logo_url} alt={m.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${m.color} grid place-items-center text-white text-[10px] font-bold`}>
                      {m.name.slice(0, 4)}
                    </div>
                  )}
                </div>
                <div className="text-[12px] font-semibold text-slate-900 text-center leading-tight">{m.name}</div>
              </button>
            );
          })}
        </div>

        {/* Brand instruction card — premium violet */}
        <div className="mx-5 mt-5 rounded-3xl bg-violet-50 border border-violet-100 p-5 space-y-4">
          {/* Header strip */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg grid place-items-center bg-white shrink-0 shadow-sm">
                {selectedMethod.logo_url ? (
                  <img src={selectedMethod.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Smartphone className="w-4 h-4" style={{ color: brand }} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{selectedMethod.name}</div>
                <div className="text-[13px] font-bold text-slate-800">{sendLabel} করুন</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">মোট পাঠাবেন</div>
              <div className="text-[16px] font-bold text-violet-600">৳{grandTotal.toLocaleString()}</div>
            </div>
          </div>

          {/* Number card with full-width copy CTA */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center border border-violet-100 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">{sendLabel} নম্বর</span>
            <button
              onClick={copyNumber}
              className="text-[22px] sm:text-[24px] font-black text-slate-900 tracking-wider mb-3 tabular-nums hover:text-violet-700 transition"
              style={{ fontFamily: "var(--font-heading)" }}
              title="ক্লিক করে কপি করুন"
            >
              {selectedMethod.number}
            </button>
            <button
              onClick={copyNumber}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-violet-200"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "কপি হয়েছে" : "নম্বরটি কপি করুন"}
            </button>
            <p className="text-[10px] text-slate-400 mt-2 italic">👆 নম্বরটি ক্লিক করলেই কপি হবে</p>
          </div>

          {/* Numbered steps */}
          <div className="space-y-2 text-[12px] text-slate-700 font-medium px-1">
            {steps2.map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-5 h-5 bg-violet-200 text-violet-700 rounded-full flex-shrink-0 grid place-items-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TrxID input */}
        <div className="px-5 mt-5">
          <label className="text-[12px] font-medium text-slate-700">
            Transaction ID (TrxID) <span className="text-destructive">*</span>
          </label>
          <div
            className={`mt-1 flex items-center rounded-full border bg-white px-4 h-11 shadow-sm transition ${
              touched.trxId && errors.trxId ? "border-destructive/60" : "border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
            }`}
          >
            <input
              value={form.trxId}
              onChange={(e) => update("trxId", e.target.value.toUpperCase())}
              onBlur={() => blur("trxId")}
              placeholder="যেমন: 8F3K2P9X"
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500 tracking-wide"
            />
          </div>
          {touched.trxId && errors.trxId && (
            <p className="text-[11px] text-destructive mt-1 ml-3">{errors.trxId}</p>
          )}
        </div>

        {/* Screenshot upload */}
        <div className="px-5 mt-4">
          <div className="flex items-baseline justify-between">
            <label className="text-[13px] font-semibold text-slate-800">📷 পেমেন্ট স্ক্রিনশট</label>
            <span className="text-[11px] text-slate-500">(ঐচ্ছিক)</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">পেমেন্ট প্রমাণ হিসেবে স্ক্রিনশট দিলে দ্রুত ভেরিফাই হবে</p>
          <label className="mt-2 block rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-5 px-4 text-center cursor-pointer hover:bg-slate-100 hover:border-primary/40 transition">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScreenshot(f);
              }}
            />
            {uploading ? (
              <span className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                <Loader2 className="w-4 h-4 animate-spin" /> আপলোড হচ্ছে…
              </span>
            ) : screenshotUrl ? (
              <span className="inline-flex items-center gap-2 text-[13px] text-emerald-600 font-medium">
                <Check className="w-4 h-4" /> স্ক্রিনশট আপলোড হয়েছে — পরিবর্তন করতে ক্লিক করুন
              </span>
            ) : (
              <>
                <div className="text-[13px] font-semibold text-slate-800">↑ স্ক্রিনশট সিলেক্ট করুন</div>
                <div className="text-[10px] text-slate-500 mt-0.5">JPG, PNG • সর্বোচ্চ ৫MB</div>
              </>
            )}
          </label>
        </div>

        {/* Total */}
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-[14px] font-semibold text-slate-900">পেমেন্ট মোট</span>
            <span className="text-[20px] font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              ৳{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {err && <p role="alert" className="px-5 mt-3 text-[12px] text-destructive text-center">{err}</p>}

        {/* CTA */}
        <div className="px-5 py-5">
          <button
            onClick={handleSubmit}
            disabled={busy || !!errors.trxId || !form.trxId}
            className="w-full h-12 rounded-full text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-lg shadow-primary/25"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {busy ? "অর্ডার তৈরি হচ্ছে…" : `অর্ডার কনফার্ম করুন  ৳${grandTotal.toLocaleString()}`}
          </button>
          <p className="text-[11px] text-slate-600 text-center mt-3">
            🔒 নিরাপদ পেমেন্ট — আপনার তথ্য সুরক্ষিত
          </p>
        </div>
      </GlassCard>
    </div>
  );
}



function PillField({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "email" | "tel";
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-slate-700 ml-3">{label}</label>
      <div
        className={`mt-1 flex items-center rounded-full border bg-white px-4 h-11 transition shadow-sm ${
          error ? "border-destructive/60" : "border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
        }`}
      >
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-500"
        />
      </div>
      {error && <p className="text-[11px] text-destructive mt-1 ml-3">{error}</p>}
    </div>
  );
}



