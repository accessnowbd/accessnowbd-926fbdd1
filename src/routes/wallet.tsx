import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet, ArrowLeft, Loader2, Check, Upload, RefreshCw, Copy,
  ChevronRight, ChevronLeft, ArrowDownCircle, ArrowUpCircle, Gift, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { rememberReturnTo } from "@/lib/auth-return-to";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({ meta: [{ title: "My Wallet — AccessNow BD" }] }),
});

type Txn = {
  id: string;
  amount: number;
  type: "topup" | "refund" | "cashback" | "referral" | "spend" | "adjustment";
  reason: string | null;
  balance_after: number;
  created_at: string;
  ref_order_id: string | null;
};

type Topup = {
  id: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "rejected";
  txn_id: string | null;
  admin_note: string | null;
  created_at: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  number: string;
  color?: string;
  logo_url?: string;
  instructions?: string;
  enable_wallet?: boolean;
};

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const typeMeta: Record<Txn["type"], { label: string; bn: string; icon: any; color: string }> = {
  topup:      { label: "Top-up",     bn: "টপ-আপ",     icon: ArrowDownCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  refund:     { label: "Refund",     bn: "রিফান্ড",    icon: RefreshCw,       color: "text-blue-600 bg-blue-50 border-blue-200" },
  cashback:   { label: "Cashback",   bn: "ক্যাশব্যাক", icon: Sparkles,        color: "text-amber-600 bg-amber-50 border-amber-200" },
  referral:   { label: "Referral",   bn: "রেফারেল",   icon: Gift,            color: "text-pink-600 bg-pink-50 border-pink-200" },
  spend:      { label: "Order pay",  bn: "অর্ডার পেমেন্ট", icon: ArrowUpCircle, color: "text-rose-600 bg-rose-50 border-rose-200" },
  adjustment: { label: "Adjustment", bn: "অ্যাডজাস্টমেন্ট", icon: Wallet,    color: "text-violet-600 bg-violet-50 border-violet-200" },
};

function WalletPage() {
  return (
    <div className="dark-adapt min-h-screen bg-gradient-to-b from-violet-50/40 via-slate-50 to-white text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
        </div>
        <WalletInline />
      </div>
    </div>
  );
}

export function WalletInline() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [balance, setBalance] = useState<number>(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [w, tx, tp, pm] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("wallet_topups").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("admin_records").select("data,sort_order").eq("kind", "payment_method").eq("is_active", true).order("sort_order"),
    ]);
    setBalance(Number(w.data?.balance ?? 0));
    setTxns((tx.data as any) || []);
    setTopups((tp.data as any) || []);
    const pmList = ((pm.data as any[]) || []).map((r) => r.data as PaymentMethod).filter((m) => m.enable_wallet !== false);
    setMethods(pmList);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) { rememberReturnTo(); navigate({ to: "/login" }); }
  }, [authLoading, user, navigate]);

  useEffect(() => { load(); }, [load]);

  if (authLoading || !user) {
    return <div className="py-16 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button onClick={load} className="inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700">
          <RefreshCw className="w-3.5 h-3.5" /> {t("রিফ্রেশ", "Refresh")}
        </button>
      </div>


        {/* Header card */}
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-violet-100 text-violet-700">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-violet-700 leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
              {t("ওয়ালেট", "Wallet")}
            </div>
            <div className="text-[12px] text-slate-500 -mt-0.5">{t("টপ-আপ ও লেনদেন", "Top-up & transactions")}</div>
          </div>
        </div>

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 55%, #a855f7 100%)" }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-3 w-10 h-10 rounded-full bg-white/10 grid place-items-center">
            <Wallet className="w-4 h-4 text-white/80" />
          </div>
          <div className="relative flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl grid place-items-center bg-white/15 backdrop-blur">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">{t("আমার ওয়ালেট", "My Wallet")}</div>
              <div className="text-[11px] text-white/80 -mt-0.5">{t("স্টোর ব্যালেন্স", "Store Balance")}</div>
            </div>
          </div>
          <div className="relative mt-4 text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            ৳{balance.toLocaleString()}
          </div>
          <div className="relative text-[12px] text-white/85 mt-1">{t("উপলব্ধ ব্যালেন্স", "Available Balance")}</div>
        </div>

        {/* Top-up wizard */}
        <TopupWizard userId={user.id} methods={methods} onDone={load} />

        {/* Transactions */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-bold text-slate-800 inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 grid place-items-center">
                <RefreshCw className="w-3 h-3" />
              </span>
              {t("লেনদেনের ইতিহাস", "Transaction History")}
            </div>
            <button onClick={load} className="text-slate-400 hover:text-slate-700" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />{t("লোড হচ্ছে…", "Loading…")}</div>
          ) : topups.length === 0 && txns.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">{t("এখনো কোনো লেনদেন নেই", "No transactions yet")}</div>
          ) : (
            <>
              {topups.length > 0 && (
                <ul className="divide-y divide-slate-100">
                  {topups.map((tp) => (
                    <li key={tp.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">৳{Number(tp.amount).toLocaleString()} · {tp.method.toUpperCase()}</div>
                        <div className="text-[11px] text-slate-500">{new Date(tp.created_at).toLocaleString()}{tp.admin_note ? ` · ${tp.admin_note}` : ""}</div>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                        tp.status === "approved" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : tp.status === "rejected" ? "text-rose-700 bg-rose-50 border-rose-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}>{tp.status === "approved" ? t("অনুমোদিত","Approved") : tp.status === "rejected" ? t("বাতিল","Rejected") : t("অপেক্ষমান","Pending")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {txns.length > 0 && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {txns.map((tt) => {
                    const m = typeMeta[tt.type];
                    const Icon = m.icon;
                    const sign = Number(tt.amount) > 0 ? "+" : "−";
                    return (
                      <li key={tt.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl grid place-items-center border ${m.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{tt.reason || t(m.bn, m.label)}</div>
                            <div className="text-[11px] text-slate-500">{new Date(tt.created_at).toLocaleString()} · {t(m.bn, m.label)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${Number(tt.amount) > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {sign}৳{Math.abs(Number(tt.amount)).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-500">{t("ব্যাল.","Bal:")} ৳{Number(tt.balance_after).toLocaleString()}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        {/* How to use */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="text-sm font-bold text-slate-800 mb-3">{t("ওয়ালেট কীভাবে ব্যবহার করবেন?", "How to use your wallet?")}</div>
          <ol className="space-y-2.5 text-sm">
            {[
              t("টপ-আপ: পরিমাণ বেছে নিন → বিকাশ/নগদে পে করুন → TrxID দিন", "Top up: Choose amount → Pay via bKash/Nagad → Enter TrxID"),
              t("অ্যাডমিন পেমেন্ট যাচাই করে আপনার ব্যালেন্স ক্রেডিট করবেন", "Admin verifies payment and credits your wallet balance"),
              t("চেকআউটে \"Wallet\" সিলেক্ট করে সাথে সাথে পেমেন্ট করুন", "At checkout, select \"Wallet\" as payment method to pay instantly"),
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-none w-6 h-6 rounded-full text-white text-[11px] font-bold grid place-items-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>{i + 1}</span>
                <span className="text-slate-700 leading-snug">{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Top-up wizard ---------------- */

function TopupWizard({ userId, methods, onDone }: { userId: string; methods: PaymentMethod[]; onDone: () => void }) {
  const { t } = useLang();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");
  const [sender, setSender] = useState("");
  const [trx, setTrx] = useState("");
  const [path, setPath] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (!methodId && methods[0]) setMethodId(methods[0].id); }, [methods, methodId]);

  const amt = Number(amount);
  const selected = useMemo(() => methods.find((m) => m.id === methodId) || methods[0], [methodId, methods]);

  const goNext = () => {
    setErr(null);
    if (step === 1) {
      if (!amt || amt < 10) { setErr(t("সর্বনিম্ন টপ-আপ ৳১০", "Minimum top-up ৳10")); return; }
      setStep(2);
    } else if (step === 2) {
      if (!selected) { setErr(t("পেমেন্ট পদ্ধতি বেছে নিন", "Choose a payment method")); return; }
      setStep(3);
    }
  };
  const goBack = () => { setErr(null); setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3))); };

  const upload = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) { setErr(t("সর্বোচ্চ ৫MB", "Max 5MB")); return; }
    setUploading(true); setErr(null);
    try {
      const ext = f.name.split(".").pop() || "jpg";
      const p = `${userId}/wallet-topups/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("payment-screenshots").upload(p, f, { upsert: false });
      if (error) throw error;
      setPath(p);
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const copyNumber = async () => {
    if (!selected?.number) return;
    try { await navigator.clipboard.writeText(selected.number); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const submit = async () => {
    setErr(null);
    if (!/^01[3-9]\d{8}$/.test(sender)) { setErr(t("যে নম্বর থেকে পাঠিয়েছেন সেটি লিখুন", "Enter the 11-digit number you sent from")); return; }
    if (trx.trim().length < 6) { setErr(t("TrxID খুব ছোট মনে হচ্ছে", "TrxID looks too short")); return; }
    if (!selected) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("wallet_topups").insert({
        user_id: userId, amount: amt, method: selected.id, sender_number: sender, txn_id: trx.trim().toUpperCase(),
        screenshot_path: path || null, status: "pending",
      } as any);
      if (error) throw error;
      setSuccess(true);
      onDone();
      setTimeout(() => {
        setAmount(""); setSender(""); setTrx(""); setPath(""); setStep(1); setSuccess(false);
      }, 2500);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const stepLabels = [t("পরিমাণ", "Select Amount"), t("পেমেন্ট", "Payment"), t("নিশ্চিত করুন", "Confirm")];

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* Steps tabs */}
      <div className="grid grid-cols-3 border-b border-slate-100 text-center text-[12px] font-semibold">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={i}
              onClick={() => { if (done) setStep(n); }}
              className={`py-3 transition-colors relative ${active ? "text-violet-700" : done ? "text-slate-700 hover:bg-slate-50" : "text-slate-400 cursor-default"}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${active ? "bg-violet-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {done ? <Check className="w-3 h-3" /> : n}
                </span>
                {label}
              </span>
              {active && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-violet-600" />}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5">
        {success ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="mt-3 text-base font-bold text-slate-900">{t("জমা দেওয়া হয়েছে!", "Submitted!")}</div>
            <div className="text-xs text-slate-500 mt-1">{t("অ্যাডমিন যাচাই করে শীঘ্রই অনুমোদন করবেন।", "Admin will verify and approve shortly.")}</div>
          </div>
        ) : step === 1 ? (
          <>
            <div className="text-sm font-semibold text-slate-800">{t("আপনি কত যোগ করতে চান?", "How much do you want to add?")}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`h-9 px-4 rounded-full border text-sm font-semibold transition ${amount === String(v) ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                >
                  ৳{v.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="mt-4 text-[11px] font-bold tracking-wider text-slate-500">{t("অথবা কাস্টম পরিমাণ লিখুন", "OR ENTER CUSTOM AMOUNT")}</div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("সর্বনিম্ন ৳১০", "Min ৳10")}
              className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none"
            />
          </>
        ) : step === 2 ? (
          <>
            <div className="text-sm font-semibold text-slate-800">{t("পেমেন্ট পদ্ধতি বেছে নিন", "Choose payment method")}</div>
            <div className="mt-3 grid gap-2">
              {methods.length === 0 && <div className="text-xs text-slate-500">{t("কোনো পদ্ধতি উপলব্ধ নেই।", "No methods available.")}</div>}
              {methods.map((m) => {
                const active = methodId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethodId(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${active ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    {m.logo_url ? (
                      <img src={m.logo_url} alt={m.name} className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-100" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg grid place-items-center text-white font-bold" style={{ background: m.color || "#7c3aed" }}>{m.name[0]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{m.instructions || t("সেন্ড মানি করুন", "Send Money")}</div>
                    </div>
                    {active && <Check className="w-4 h-4 text-violet-600" />}
                  </button>
                );
              })}
            </div>

            {selected && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-500">{t(`${selected.name} নম্বর`, `${selected.name} Number`)}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="font-mono text-lg font-bold text-slate-900">{selected.number}</div>
                  <button onClick={copyNumber} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-100">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> {t("কপি হয়েছে", "Copied")}</> : <><Copy className="w-3.5 h-3.5" /> {t("কপি", "Copy")}</>}
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-slate-600">
                  {t(`উপরের নম্বরে ৳${amt || 0} সেন্ড মানি করুন, তারপর পরবর্তী ধাপে TrxID দিন।`,
                     `Send ৳${amt || 0} to the number above, then enter the TrxID in the next step.`)}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm font-semibold text-slate-800">{t("পেমেন্ট তথ্য নিশ্চিত করুন", "Confirm payment details")}</div>
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">{t("পরিমাণ", "Amount")}</span>
              <span className="font-bold text-slate-900">৳{amt.toLocaleString()}</span>
            </div>
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">{t("পদ্ধতি", "Method")}</span>
              <span className="font-bold text-slate-900">{selected?.name} · {selected?.number}</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">{t("আপনার সেন্ডার নম্বর", "Your sender number")}</label>
                <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX"
                  className="w-full h-11 px-3 mt-1 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">{t("ট্রানজেকশন আইডি (TrxID)", "Transaction ID")}</label>
                <input value={trx} onChange={(e) => setTrx(e.target.value.toUpperCase())} placeholder="8F3K2P9X"
                  className="w-full h-11 px-3 mt-1 rounded-xl border border-slate-200 text-sm font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">{t("স্ক্রিনশট (ঐচ্ছিক)", "Screenshot (optional)")}</label>
                <label className="mt-1 block rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-4 text-center cursor-pointer hover:bg-slate-100 text-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" />{t("আপলোড হচ্ছে…","Uploading…")}</>
                    : path ? <span className="text-emerald-600 font-semibold"><Check className="w-4 h-4 inline mr-1" />{t("আপলোড হয়েছে","Uploaded")}</span>
                    : <><Upload className="w-4 h-4 inline mr-1" />{t("ছবি নির্বাচন করুন","Select image")}</>}
                </label>
              </div>
            </div>
          </>
        )}

        {err && <p className="mt-3 text-xs text-rose-600 text-center font-medium">{err}</p>}

        {/* Footer buttons */}
        {!success && (
          <div className="mt-5 flex gap-2">
            {step > 1 && (
              <button onClick={goBack} className="h-11 px-4 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" /> {t("পিছনে", "Back")}
              </button>
            )}
            {step < 3 ? (
              <button onClick={goNext}
                className="flex-1 h-11 rounded-full text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}>
                {t("পরবর্তী", "Continue")} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={submit} disabled={busy}
                className="flex-1 h-11 rounded-full text-white text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {t("অনুমোদনের জন্য জমা দিন", "Submit for approval")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
