import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy, CreditCard, Loader2, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type PaymentMethod, usePaymentMethods } from "@/hooks/useShopConfig";

export const Route = createFileRoute("/pay/$slug")({
  component: PaymentLinkPage,
  head: () => ({
    meta: [
      { title: "Payment Link — AccessNow BD" },
      { name: "description", content: "Secure AccessNow BD payment link for quick digital service payments." },
      { property: "og:title", content: "Payment Link — AccessNow BD" },
      { property: "og:description", content: "Secure AccessNow BD payment link for quick digital service payments." },
    ],
  }),
});

type PaymentLinkData = {
  title?: string;
  slug?: string;
  amount?: number;
  currency?: string;
  description?: string;
  expires_at?: string;
  single_use?: boolean;
  uses?: number;
};

type PaymentLinkRow = {
  id: string;
  data: PaymentLinkData;
  is_active: boolean;
  created_at: string;
};

type ProductPlan = { label?: string; price?: number; duration?: string; original_price?: number };
type ProductRow = { slug: string; name: string; image_url?: string | null; plans: ProductPlan[] | null };

const fallbackMethods: PaymentMethod[] = [
  { id: "bkash", name: "bKash", number: "01580607614", color: "bg-primary", brand_color: "#8b5cf6", send_money_label: "Send Money" },
  { id: "nagad", name: "Nagad", number: "01580607614", color: "bg-primary", brand_color: "#8b5cf6", send_money_label: "Send Money" },
];

const normalizePhone = (value: string) => {
  const compact = value.replace(/[\s-]/g, "");
  if (compact.startsWith("+880")) return `0${compact.slice(4)}`;
  if (compact.startsWith("880")) return `0${compact.slice(3)}`;
  return compact;
};

const isValidPhone = (value: string) => /^01[3-9]\d{8}$/.test(normalizePhone(value));
const formatMoney = (value: number, currency = "BDT") => `${currency === "BDT" ? "৳" : `${currency} `}${Math.round(value).toLocaleString("en-IN")}`;

async function fetchPaymentLink(slug: string): Promise<PaymentLinkRow | null> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("id,data,is_active,created_at")
    .eq("kind", "payment_link")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) throw error;
  const rows = ((data ?? []) as unknown) as PaymentLinkRow[];
  return rows.find((row) => row.data?.slug === slug) ?? null;
}

async function fetchActiveProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("slug,name,image_url,plans")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown) as ProductRow[];
}

function PaymentLinkPage() {
  const { slug } = Route.useParams();
  const { data: link, isLoading, isError } = useQuery({
    queryKey: ["payment-link", slug],
    queryFn: () => fetchPaymentLink(slug),
    staleTime: 60_000,
    retry: 1,
  });
  const { data: products } = useQuery({
    queryKey: ["pay-products"],
    queryFn: fetchActiveProducts,
    staleTime: 5 * 60_000,
  });
  const { data: configuredMethods } = usePaymentMethods("checkout");
  const methods = useMemo(() => (configuredMethods?.length ? configuredMethods : fallbackMethods), [configuredMethods]);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "bkash");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", senderNumber: "", txnId: "", note: "" });
  const [customAmount, setCustomAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Product / plan selection
  const [pickMode, setPickMode] = useState<"product" | "manual">("product");
  const [productSlug, setProductSlug] = useState<string>("");
  const [planIndex, setPlanIndex] = useState<number>(0);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDuration, setManualDuration] = useState("");

  const selectedProduct = useMemo(
    () => (products ?? []).find((p) => p.slug === productSlug) ?? null,
    [products, productSlug],
  );
  const selectedPlan: ProductPlan | null =
    selectedProduct && Array.isArray(selectedProduct.plans) && selectedProduct.plans.length
      ? selectedProduct.plans[Math.min(planIndex, selectedProduct.plans.length - 1)]
      : null;

  useEffect(() => {
    if (methods.length && !methods.some((m) => m.id === methodId)) setMethodId(methods[0].id);
  }, [methods, methodId]);

  const selectedMethod = methods.find((m) => m.id === methodId) ?? methods[0];
  const savedAmount = Number(link?.data?.amount ?? 0);
  const planAmount = Number(selectedPlan?.price ?? 0);
  const amount =
    savedAmount > 0
      ? savedAmount
      : pickMode === "product" && planAmount > 0
        ? planAmount
        : Number(customAmount || 0);
  const currency = link?.data?.currency || "BDT";
  const expired = Boolean(link?.data?.expires_at && new Date(`${link.data.expires_at}T23:59:59`).getTime() < Date.now());
  const needsManualAmount = !link || savedAmount <= 0;
  const showManualAmountInput =
    needsManualAmount && !(pickMode === "product" && planAmount > 0);
  const unavailable = !isLoading && expired;

  const submitPayment = useMutation({
    mutationFn: async () => {
      if (!selectedMethod) throw new Error("Payment method unavailable");
      if (amount <= 0) throw new Error("পেমেন্ট অ্যামাউন্ট দিন");
      if (!form.fullName.trim()) throw new Error("আপনার নাম দিন");
      if (!isValidPhone(form.phone)) throw new Error("সঠিক বাংলাদেশি মোবাইল নম্বর দিন");
      if (!isValidPhone(form.senderNumber)) throw new Error("যে নম্বর থেকে টাকা পাঠিয়েছেন সেটি দিন");
      if (form.txnId.trim().length < 6) throw new Error("সঠিক Transaction ID দিন");
      if (pickMode === "product" && !selectedProduct) throw new Error("Product বেছে নিন অথবা Manual দিন");
      if (pickMode === "manual" && !manualTitle.trim()) throw new Error("আপনি কী নিচ্ছেন তা লিখুন");

      const productInfo =
        pickMode === "product" && selectedProduct
          ? {
              product_slug: selectedProduct.slug,
              product_name: selectedProduct.name,
              plan_label: selectedPlan?.label ?? null,
              duration: selectedPlan?.duration ?? null,
              plan_price: selectedPlan?.price ?? null,
            }
          : {
              product_slug: null,
              product_name: manualTitle.trim(),
              plan_label: null,
              duration: manualDuration.trim() || null,
              plan_price: null,
              is_manual: true,
            };

      const payload = {
        kind: "payment_link_submission",
        is_active: false,
        data: {
          link_id: link?.id ?? null,
          link_slug: slug,
          link_title: link?.data?.title ?? "Manual Payment Link",
          ...productInfo,
          full_name: form.fullName.trim(),
          phone: normalizePhone(form.phone),
          email: form.email.trim() || null,
          sender_number: normalizePhone(form.senderNumber),
          txn_id: form.txnId.trim(),
          payment_method: selectedMethod.name,
          amount,
          currency,
          status: "pending",
          note: form.note.trim() || null,
        } as never,
      };

      const { error } = await supabase.from("admin_records").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Payment submitted");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Submission failed"),
  });

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:py-10">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-primary hover:opacity-80">AccessNow BD</Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] font-semibold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure payment
          </span>
        </div>


        <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-lg sm:p-6">
          {isLoading ? (
            <div className="grid min-h-[420px] place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : isError || unavailable ? (
            <EmptyState expired={expired} />
          ) : submitted ? (
            <SuccessState />
          ) : (
            <>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-bold uppercase text-primary">Payment request</p>
                <h1 className="mt-1 text-xl font-extrabold leading-tight text-foreground">{link?.data?.title || "AccessNow BD Payment"}</h1>
                {link?.data?.description ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{link.data.description}</p>
                ) : needsManualAmount ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">পেমেন্ট অ্যামাউন্ট লিখে নিচের তথ্য পূরণ করুন।</p>
                ) : null}
                <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
                  <span className="text-sm font-semibold text-muted-foreground">Amount</span>
                  {showManualAmountInput ? (
                    <input
                      type="number"
                      min="1"
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      placeholder="৳0"
                      className="h-12 w-36 rounded-xl border border-border bg-card px-3 text-right text-xl font-extrabold text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <strong className="text-3xl font-extrabold text-primary">{formatMoney(amount, currency)}</strong>
                  )}
                </div>
              </div>

              {/* Product / plan picker */}
              <div className="mt-5 space-y-3">
                <h2 className="text-sm font-extrabold text-foreground">কী কিনতে চান?</h2>
                <div className="inline-flex w-full rounded-xl border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setPickMode("product")}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition ${pickMode === "product" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    Product থেকে বেছে নিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickMode("manual")}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition ${pickMode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    নিজে লিখুন
                  </button>
                </div>

                {pickMode === "product" ? (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Product</span>
                      <select
                        value={productSlug}
                        onChange={(e) => { setProductSlug(e.target.value); setPlanIndex(0); }}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">— Product বেছে নিন —</option>
                        {(products ?? []).map((p) => (
                          <option key={p.slug} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    {selectedProduct && Array.isArray(selectedProduct.plans) && selectedProduct.plans.length > 0 && (
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold text-muted-foreground">Plan / Duration</span>
                        <select
                          value={planIndex}
                          onChange={(e) => setPlanIndex(Number(e.target.value))}
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {selectedProduct.plans.map((pl, i) => (
                            <option key={i} value={i}>
                              {(pl.label || pl.duration || `Plan ${i + 1}`)}{pl.price ? ` — ৳${pl.price}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input label="Service / Product এর নাম" value={manualTitle} onChange={setManualTitle} />
                    <Input label="কতদিনের জন্য (Duration)" value={manualDuration} onChange={setManualDuration} />
                  </div>
                )}
              </div>


              <div className="mt-5 space-y-3">
                <h2 className="text-sm font-extrabold text-foreground">পেমেন্ট মেথড</h2>
                <div className="grid gap-2">
                  {methods.map((method, index) => {
                    const active = method.id === methodId;
                    return (
                      <button
                        key={`${method.id}-${index}`}
                        type="button"
                        onClick={() => setMethodId(method.id)}
                        className={`flex min-h-16 items-center justify-between rounded-xl border p-3 text-left transition ${active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <Smartphone className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-foreground">{method.name}</span>
                            <span className="block text-xs font-semibold text-muted-foreground">{method.send_money_label || "Send Money"} · {method.number}</span>
                          </span>
                        </span>
                        {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
                {selectedMethod?.number && <CopyLine value={selectedMethod.number} />}
              </div>

              <form
                className="mt-5 space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitPayment.mutate();
                }}
              >
                <Input label="আপনার নাম" value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} autoComplete="name" />
                <Input label="আপনার মোবাইল নম্বর" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} inputMode="tel" autoComplete="tel" />
                <Input label="যে নম্বর থেকে পাঠিয়েছেন" value={form.senderNumber} onChange={(v) => setForm((f) => ({ ...f, senderNumber: v }))} inputMode="tel" />
                <Input label="Transaction ID" value={form.txnId} onChange={(v) => setForm((f) => ({ ...f, txnId: v }))} />
                <Input label="ইমেইল (optional)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} inputMode="email" autoComplete="email" />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-muted-foreground">নোট (optional)</span>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitPayment.isPending}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-60"
                >
                  {submitPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Submit Payment
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function CopyLine({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value.replace(/\D/g, "")).then(() => toast.success("Number copied"))}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm font-bold text-foreground"
    >
      <span>{value}</span>
      <Copy className="h-4 w-4 text-primary" />
    </button>
  );
}

function Input({ label, value, onChange, inputMode, autoComplete }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "text" | "tel" | "email"; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function EmptyState({ expired }: { expired: boolean }) {
  return (
    <div className="grid min-h-[420px] place-items-center text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <XCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-foreground">{expired ? "এই পেমেন্ট লিঙ্কের মেয়াদ শেষ" : "পেমেন্ট লিঙ্ক পাওয়া যায়নি"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">সঠিক লিঙ্ক ব্যবহার করুন অথবা সাপোর্টে যোগাযোগ করুন।</p>
        <Link to="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
          Products দেখুন
        </Link>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="grid min-h-[420px] place-items-center text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-foreground">Payment submitted</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">আমরা পেমেন্ট যাচাই করে দ্রুত আপনার সাথে যোগাযোগ করব।</p>
        <Link to="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground">
          Home
        </Link>
      </div>
    </div>
  );
}