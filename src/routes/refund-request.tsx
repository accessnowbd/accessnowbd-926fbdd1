import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sparkles,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ListChecks,
  FileText,
  Clock,
  ShieldCheck,
  MessageCircle,
  Upload,
  Send,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/refund-request")({
  component: RefundRequestPage,
  head: () => ({
    meta: [
      { title: "Refund Request — AccessNow BD" },
      { name: "description", content: "Submit a refund request for your AccessNow BD order. Fast review, 24/7 support." },
      { property: "og:title", content: "Refund Request — AccessNow BD" },
      { property: "og:description", content: "Submit your refund request quickly and track admin response." },
    ],
    links: [{ rel: "canonical", href: "https://accessnowbd.com/refund-request" }],
  }),
});

/* ---------------- schema ---------------- */

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer", "Card", "Wallet", "Other"] as const;
const REFUND_CHANNELS = ["bKash", "Nagad", "Rocket", "Bank Account", "Wallet Balance"] as const;
const REASONS = [
  { id: "not_delivered", labelBn: "পণ্য/সাবস্ক্রিপশন পাইনি" },
  { id: "not_working", labelBn: "কাজ করছে না / সমস্যা" },
  { id: "wrong_item", labelBn: "ভুল প্রোডাক্ট পেয়েছি" },
  { id: "duplicate", labelBn: "ডুপ্লিকেট পেমেন্ট হয়েছে" },
  { id: "changed_mind", labelBn: "অর্ডার বাতিল করতে চাই" },
  { id: "other", labelBn: "অন্যান্য" },
] as const;

const schema = z.object({
  fullName: z.string().trim().min(2, "নাম দিন").max(100),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  phone: z.string().trim().min(10, "সঠিক ফোন নম্বর দিন").max(20),
  orderId: z.string().trim().min(4, "Order ID দিন").max(64),
  productName: z.string().trim().min(2, "প্রোডাক্টের নাম দিন").max(150),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "সঠিক অ্যামাউন্ট দিন"),
  paymentMethod: z.enum(PAYMENT_METHODS, { message: "পেমেন্ট মেথড সিলেক্ট করুন" }),
  txnId: z.string().trim().max(80).optional().or(z.literal("")),
  reason: z.string().min(1, "একটি কারণ সিলেক্ট করুন"),
  details: z.string().trim().min(10, "কমপক্ষে ১০ অক্ষর লিখুন").max(1500),
  refundChannel: z.enum(REFUND_CHANNELS, { message: "রিফান্ড চ্যানেল সিলেক্ট করুন" }),
  refundNumber: z.string().trim().min(6, "রিফান্ড নম্বর/অ্যাকাউন্ট দিন").max(60),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  agree: z.literal(true, { message: "শর্তে সম্মতি দিন" }),
});

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  orderId: string;
  productName: string;
  amount: string;
  paymentMethod: string;
  txnId: string;
  reason: string;
  details: string;
  refundChannel: string;
  refundNumber: string;
  notes: string;
  agree: boolean;
};

const initial: FormState = {
  fullName: "",
  email: "",
  phone: "",
  orderId: "",
  productName: "",
  amount: "",
  paymentMethod: "",
  txnId: "",
  reason: "",
  details: "",
  refundChannel: "",
  refundNumber: "",
  notes: "",
  agree: false,
};

/* ---------------- page ---------------- */

function RefundRequestPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [policyOpen, setPolicyOpen] = useState(true);

  // Prefill from user metadata + recent order
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: f.email || user.email || "",
      fullName: f.fullName || (user.user_metadata?.full_name as string) || "",
      phone: f.phone || (user.user_metadata?.phone as string) || "",
    }));
    // Fetch last order to prefill
    supabase
      .from("orders")
      .select("id,full_name,phone,payment_method,total,items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const items = Array.isArray(data.items) ? (data.items as any[]) : [];
        const productName = items.map((i) => i?.name || i?.title).filter(Boolean).join(", ");
        setForm((f) => ({
          ...f,
          orderId: f.orderId || (data.id ? data.id.slice(0, 8).toUpperCase() : ""),
          fullName: f.fullName || data.full_name || "",
          phone: f.phone || data.phone || "",
          amount: f.amount || (data.total ? String(data.total) : ""),
          paymentMethod: f.paymentMethod || data.payment_method || "",
          productName: f.productName || productName,
        }));
      });
  }, [user]);

  const errors = useMemo(() => {
    const r = schema.safeParse(form);
    if (r.success) return {} as Record<string, string>;
    const o: Record<string, string> = {};
    for (const i of r.error.issues) {
      const k = i.path[0] as string;
      if (!o[k]) o[k] = i.message;
    }
    return o;
  }, [form]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("রিফান্ড রিকোয়েস্ট সাবমিট করতে লগইন করুন");
      navigate({ to: "/login" });
      return;
    }
    const r = schema.safeParse(form);
    if (!r.success) {
      toast.error("ফর্মে কিছু ভুল আছে — চেক করুন");
      return;
    }
    setSubmitting(true);
    try {
      let screenshotPath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${user.id}/refund-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("payment-screenshots").upload(key, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });
        if (up.error) throw up.error;
        screenshotPath = up.data.path;
      }

      const subject = `Refund: Order ${form.orderId} — ${form.productName}`.slice(0, 200);
      const reasonLabel = REASONS.find((x) => x.id === form.reason)?.labelBn || form.reason;
      const message = [
        `Order ID: ${form.orderId}`,
        `Product: ${form.productName}`,
        `Amount: ৳${form.amount}`,
        `Payment: ${form.paymentMethod}${form.txnId ? ` (TXN: ${form.txnId})` : ""}`,
        `Reason: ${reasonLabel}`,
        `Refund to: ${form.refundChannel} — ${form.refundNumber}`,
        `Contact: ${form.fullName} · ${form.phone} · ${form.email}`,
        screenshotPath ? `Screenshot: ${screenshotPath}` : null,
        "",
        "Details:",
        form.details,
        form.notes ? `\nNotes: ${form.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          category: "refund",
          priority: "high",
          status: "open",
          subject,
          message,
        })
        .select("id")
        .single();
      if (error) throw error;

      setSuccess({ id: data.id });
      toast.success("রিফান্ড রিকোয়েস্ট সাবমিট হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setForm(initial);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "সাবমিট করতে সমস্যা হচ্ছে — আবার চেষ্টা করুন");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dark-adapt min-h-screen bg-gradient-to-b from-white via-slate-50 to-white text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
        <div className="mx-auto h-[420px] max-w-6xl bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.10),transparent_60%),radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.08),transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Refund Request
          </div>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,#6D28D9_0%,#4F46E5_50%,#0891B2_100%)]">
              Refund Request
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            নিচের ফর্ম পূরণ করে রিকোয়েস্ট সাবমিট করুন — আমাদের টিম দ্রুত রিভিউ করবে।
          </p>
        </header>

        {/* Policy collapsible */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setPolicyOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              Refund &amp; Return Policy
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition ${policyOpen ? "rotate-180" : ""}`} />
          </button>

          {policyOpen && (
            <div className="space-y-4 border-t border-slate-200 px-5 py-5 text-[14px] leading-7 text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> যে ক্ষেত্রে রিফান্ড পাবেন
                  </p>
                  <p className="mt-1 text-[13px] text-emerald-900/80">
                    সার্ভিস ডেলিভার না হলে, ভুল প্রোডাক্ট, বা কাজ না করলে।
                  </p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-rose-700">
                    <XCircle className="h-4 w-4" /> যে ক্ষেত্রে পাবেন না
                  </p>
                  <p className="mt-1 text-[13px] text-rose-900/80">
                    সাবস্ক্রিপশন ব্যবহার শুরুর পর কারণ ছাড়া বাতিল।
                  </p>
                </div>
              </div>

              <PolicyBlock icon={ListChecks} title="রিফান্ডের জন্য যা যা দরকার">
                <ul>
                  <li>সঠিক Order ID ও প্রোডাক্টের নাম</li>
                  <li>পেমেন্টের তারিখ, মেথড ও TXN ID</li>
                  <li>সমস্যার বিস্তারিত স্ক্রিনশটসহ</li>
                  <li>রিফান্ড গ্রহণের bKash/Nagad নম্বর</li>
                </ul>
              </PolicyBlock>

              <PolicyBlock icon={FileText} title="রিফান্ডের ধরন ও পরিমাণ">
                <ul>
                  <li>ফুল রিফান্ড — সার্ভিস ডেলিভার না হলে</li>
                  <li>আংশিক রিফান্ড — আংশিক ব্যবহার হলে</li>
                  <li>রিপ্লেসমেন্ট — একই দামের অন্য প্রোডাক্ট</li>
                </ul>
              </PolicyBlock>

              <PolicyBlock icon={Clock} title="প্রক্রিয়া ও সময়সীমা">
                <ul>
                  <li>ভেরিফিকেশন: ২–৬ ঘণ্টা</li>
                  <li>অনুমোদন: ২৪ ঘণ্টার মধ্যে</li>
                  <li>টাকা ফেরত: ২৪–৭২ ঘণ্টা</li>
                </ul>
              </PolicyBlock>

              <p className="text-xs text-slate-500">
                বিস্তারিত পড়ুন{" "}
                <Link to="/refund-policy" className="font-semibold text-violet-700 underline underline-offset-4">
                  Refund &amp; Return Policy
                </Link>{" "}
                পেজে।
              </p>
            </div>
          )}
        </section>

        {/* Success state */}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-3 text-xl font-bold text-emerald-900">রিকোয়েস্ট গৃহীত হয়েছে</h2>
            <p className="mt-2 text-sm text-emerald-800">
              টিকেট আইডি: <span className="font-mono font-bold">RF-{success.id.slice(0, 8).toUpperCase()}</span>
              <br />
              আপনার ড্যাশবোর্ডে স্ট্যাটাস ট্র্যাক করতে পারবেন।
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                ড্যাশবোর্ডে যান
              </Link>
              <button
                onClick={() => setSuccess(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                নতুন রিকোয়েস্ট
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(79,70,229,0.25)] md:p-7"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[linear-gradient(135deg,#7C3AED,#0891B2)] text-white shadow-md">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">টিকেট সাবমিট করুন</h2>
                <p className="text-xs text-slate-500">সকল তথ্য সঠিকভাবে দিন</p>
              </div>
            </div>

            {!user && !authLoading && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  রিফান্ড রিকোয়েস্ট সাবমিট করতে{" "}
                  <Link to="/login" className="font-semibold underline">
                    লগইন
                  </Link>{" "}
                  করুন।
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="পূর্ণ নাম *" error={errors.fullName}>
                <input
                  className={inputCls}
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="আপনার নাম"
                />
              </Field>
              <Field label="ইমেইল *" error={errors.email}>
                <input
                  className={inputCls}
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="ফোন নম্বর *" error={errors.phone}>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </Field>
              <Field label="Order ID *" error={errors.orderId}>
                <input
                  className={inputCls}
                  value={form.orderId}
                  onChange={(e) => set("orderId", e.target.value)}
                  placeholder="ANB-XXXXXXX"
                />
              </Field>
              <Field label="প্রোডাক্টের নাম *" error={errors.productName}>
                <input
                  className={inputCls}
                  value={form.productName}
                  onChange={(e) => set("productName", e.target.value)}
                  placeholder="Netflix 1 Month"
                />
              </Field>
              <Field label="পেমেন্ট অ্যামাউন্ট (৳) *" error={errors.amount}>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="500"
                />
              </Field>
              <Field label="পেমেন্ট মেথড *" error={errors.paymentMethod}>
                <select
                  className={inputCls}
                  value={form.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                >
                  <option value="">-- সিলেক্ট করুন --</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="TXN ID (যদি থাকে)" error={errors.txnId}>
                <input
                  className={inputCls}
                  value={form.txnId}
                  onChange={(e) => set("txnId", e.target.value)}
                  placeholder="যেমন: 9X12ABCD"
                />
              </Field>
            </div>

            {/* Reason */}
            <Field label="রিফান্ডের কারণ *" error={errors.reason}>
              <div className="grid gap-2 sm:grid-cols-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                      form.reason === r.id
                        ? "border-violet-400 bg-violet-50 text-violet-900"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      className="h-4 w-4 accent-violet-600"
                      checked={form.reason === r.id}
                      onChange={() => set("reason", r.id)}
                    />
                    <span>{r.labelBn}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="বিস্তারিত বর্ণনা *" error={errors.details}>
              <textarea
                rows={4}
                className={inputCls}
                value={form.details}
                onChange={(e) => set("details", e.target.value)}
                placeholder="কী সমস্যা হচ্ছে — কখন কীভাবে, সংক্ষেপে স্পষ্টভাবে লিখুন"
              />
            </Field>

            {/* Upload */}
            <Field label="স্ক্রিনশট আপলোড (অপশনাল)">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/50 p-4 text-sm font-semibold text-violet-700 hover:bg-violet-50">
                <Upload className="h-4 w-4" />
                {file ? file.name : "স্ক্রিনশট সিলেক্ট করুন"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="রিফান্ড চ্যানেল *" error={errors.refundChannel}>
                <select
                  className={inputCls}
                  value={form.refundChannel}
                  onChange={(e) => set("refundChannel", e.target.value)}
                >
                  <option value="">-- সিলেক্ট করুন --</option>
                  {REFUND_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="রিফান্ড নম্বর/অ্যাকাউন্ট *" error={errors.refundNumber}>
                <input
                  className={inputCls}
                  value={form.refundNumber}
                  onChange={(e) => set("refundNumber", e.target.value)}
                  placeholder="01XXXXXXXXX বা A/C No."
                />
              </Field>
            </div>

            <Field label="অতিরিক্ত নোট (অপশনাল)">
              <textarea
                rows={2}
                className={inputCls}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="অন্য কিছু জানাতে চাইলে"
              />
            </Field>

            <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-violet-600"
                checked={form.agree}
                onChange={(e) => set("agree", e.target.checked)}
              />
              <span>
                আমি নিশ্চিত করছি প্রদত্ত সকল তথ্য সঠিক এবং{" "}
                <Link to="/refund-policy" className="font-semibold text-violet-700 underline">
                  Refund Policy
                </Link>{" "}
                অনুসরণ করতে সম্মত।
              </span>
            </label>
            {errors.agree && <p className="text-xs text-rose-600">{errors.agree}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7C3AED,#4F46E5,#0891B2)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "সাবমিট হচ্ছে..." : "রিফান্ড রিকোয়েস্ট সাবমিট করুন"}
            </button>

            <p className="text-center text-xs text-slate-500">
              অথবা সরাসরি WhatsApp করুন —{" "}
              <a
                href="https://wa.me/8801580607614"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> +880 1580-607614
              </a>
            </p>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

/* ---------------- helpers ---------------- */

const inputCls =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function PolicyBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Icon className="h-4 w-4 text-violet-600" />
        {title}
      </p>
      <div className="mt-1.5 text-[13px] leading-6 text-slate-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
