import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Save, Loader2, Eye, EyeOff, Plus, Send, Mail, MessageCircle,
  Sparkles, Info, ShieldCheck, Database, ExternalLink, RefreshCcw,
  Settings, Check, X, Zap, Bot, Star, Wand2, MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: GeneralSettingsPage,
});

type AiFeatureKey = "support_chat" | "product_ai" | "review_generator" | "renewal_emails";

type SettingsData = {
  site_name?: string;
  support_email?: string;
  whatsapp_number?: string;
  address?: string;
  currency_code?: string;
  currency_symbol?: string;
  minimum_order_amount?: number;
  order_number_prefix?: string;
  gemini_keys?: string[];
  openai_key?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  admin_email?: string;
  whatsapp_notify_number?: string;
  // AI system config (read by edge functions)
  ai_default_model?: string;
  ai_features?: Partial<Record<AiFeatureKey, boolean>>;
};

const AI_MODELS: { id: string; label: string; note: string }[] = [
  { id: "google/gemini-2.5-flash",       label: "Gemini 2.5 Flash",        note: "Balanced • fast • cheap (default)" },
  { id: "google/gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash Lite",   note: "Fastest & cheapest" },
  { id: "google/gemini-2.5-pro",         label: "Gemini 2.5 Pro",          note: "Most capable Gemini" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (preview)", note: "Next-gen fast" },
  { id: "openai/gpt-5-nano",             label: "GPT-5 Nano",              note: "Fast & cheap OpenAI" },
  { id: "openai/gpt-5-mini",             label: "GPT-5 Mini",              note: "Balanced OpenAI" },
  { id: "openai/gpt-5",                  label: "GPT-5",                   note: "Most capable OpenAI (expensive)" },
];

const AI_FEATURES: { key: AiFeatureKey; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "support_chat",     label: "সাপোর্ট চ্যাটবট",       desc: "সাইটের live support chat উত্তর দিবে",              icon: <MessageSquare className="w-4 h-4" /> },
  { key: "product_ai",       label: "Product AI",              desc: "প্রোডাক্ট ডিসক্রিপশন/ইমেজ জেনারেটর",           icon: <Wand2 className="w-4 h-4" /> },
  { key: "review_generator", label: "Review Generator",        desc: "অ্যাডমিন থেকে fake/seed review তৈরি",              icon: <Star className="w-4 h-4" /> },
  { key: "renewal_emails",   label: "Renewal Email AI",        desc: "রিনিউয়াল রিমাইন্ডার ইমেইলে AI ব্যক্তিগতকরণ",       icon: <Mail className="w-4 h-4" /> },
];

/* ── Tone system: stronger tints + darker text for readability ── */
const TONE = {
  violet:  { bg: "bg-violet-100",    text: "text-violet-700",    border: "border-violet-200",    soft: "bg-violet-50",    ink: "text-violet-900",   inkHex: "#3b0764", softHex: "#f5f3ff", borderHex: "#ddd6fe" },
  sky:     { bg: "bg-sky-100",       text: "text-sky-700",       border: "border-sky-200",       soft: "bg-sky-50",       ink: "text-sky-900",      inkHex: "#082f49", softHex: "#f0f9ff", borderHex: "#bae6fd" },
  amber:   { bg: "bg-amber-100",     text: "text-amber-700",     border: "border-amber-200",     soft: "bg-amber-50",     ink: "text-amber-900",    inkHex: "#451a03", softHex: "#fffbeb", borderHex: "#fde68a" },
  emerald: { bg: "bg-emerald-100",   text: "text-emerald-700",   border: "border-emerald-200",   soft: "bg-emerald-50",   ink: "text-emerald-900",  inkHex: "#022c22", softHex: "#ecfdf5", borderHex: "#a7f3d0" },
  fuchsia: { bg: "bg-fuchsia-100",  text: "text-fuchsia-700",  border: "border-fuchsia-200",  soft: "bg-fuchsia-50",  ink: "text-fuchsia-900",  inkHex: "#4a044e", softHex: "#fdf4ff", borderHex: "#f5d0fe" },
  slate:   { bg: "bg-slate-200",      text: "text-slate-700",      border: "border-slate-300",      soft: "bg-slate-100",    ink: "text-slate-800",    inkHex: "#0f172a", softHex: "#f1f5f9", borderHex: "#cbd5e1" },
} as const;

type ToneKey = keyof typeof TONE;

function GeneralSettingsPage() {
  const [data, setData] = useState<SettingsData>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("admin_records").select("*").eq("kind", "site_settings").limit(1);
    if (error) toast.error(error.message);
    const row = rows?.[0];
    if (row) {
      setRecordId(row.id);
      setData((row.data ?? {}) as SettingsData);
    } else {
      setData({
        currency_code: "BDT",
        currency_symbol: "৳",
        minimum_order_amount: 0,
        order_number_prefix: "AN",
        gemini_keys: [""],
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof SettingsData>(k: K, v: SettingsData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { kind: "site_settings", data: data as never, is_active: true };
    const op = recordId
      ? supabase.from("admin_records").update(payload).eq("id", recordId)
      : supabase.from("admin_records").insert(payload).select().single();
    const { error, data: saved } = await op as any;
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!recordId && saved?.id) setRecordId(saved.id);
    toast.success("সংরক্ষণ সম্পন্ন");
  };

  if (loading) {
    return (
      <div className="grid place-items-center h-64" style={{ color: "var(--admin-muted)" }}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-100 grid place-items-center text-violet-700">
            <Settings className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--admin-ink)" }}>Site Settings</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-muted)" }}>Configure your store settings</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="a-save-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* General Information */}
      <Card icon={<Info className="w-4 h-4" />} title="General Information" tone="violet">
        <Grid2>
          <Field label="Site name">
            <Input value={data.site_name ?? ""} onChange={(v) => set("site_name", v)} placeholder="AccessNow BD" />
          </Field>
          <Field label="Support email">
            <Input type="email" value={data.support_email ?? ""} onChange={(v) => set("support_email", v)} placeholder="info@accessnowbd.com.bd" />
          </Field>
          <Field label="WhatsApp number">
            <Input value={data.whatsapp_number ?? ""} onChange={(v) => set("whatsapp_number", v)} placeholder="01580607614" />
          </Field>
          <Field label="Address">
            <Input value={data.address ?? ""} onChange={(v) => set("address", v)} placeholder="Bangladesh" />
          </Field>
        </Grid2>
      </Card>

      {/* Currency & Payment */}
      <Card icon={<span className="text-base font-bold">৳</span>} title="Currency & Payment" tone="amber">
        <Grid2>
          <Field label="Currency code">
            <Input value={data.currency_code ?? ""} onChange={(v) => set("currency_code", v)} placeholder="BDT" />
          </Field>
          <Field label="Currency symbol">
            <Input value={data.currency_symbol ?? ""} onChange={(v) => set("currency_symbol", v)} placeholder="৳" />
          </Field>
          <Field label="Minimum order amount">
            <Input
              type="number"
              value={String(data.minimum_order_amount ?? 0)}
              onChange={(v) => set("minimum_order_amount", Number(v) || 0)}
              placeholder="0"
            />
          </Field>
        </Grid2>
      </Card>

      {/* Order Settings */}
      <Card icon={<Database className="w-4 h-4" />} title="Order Settings" tone="sky">
        <Field label="Order number prefix">
          <Input value={data.order_number_prefix ?? ""} onChange={(v) => set("order_number_prefix", v)} placeholder="AN" />
        </Field>
      </Card>

      {/* AI System — powered by Lovable AI Gateway */}
      <Card icon={<Sparkles className="w-4 h-4" />} title="AI System" tone="fuchsia">
        <AiSystemPanel
          model={data.ai_default_model ?? "google/gemini-2.5-flash"}
          features={data.ai_features ?? { support_chat: true, product_ai: true, review_generator: true, renewal_emails: true }}
          onModel={(v) => set("ai_default_model", v)}
          onFeatures={(v) => set("ai_features", v)}
        />
      </Card>

      {/* Telegram */}
      <Card icon={<Send className="w-4 h-4" />} title="Telegram অর্ডার নোটিফিকেশন" tone="sky">
        <p className="text-xs mb-3" style={{ color: "var(--admin-muted)" }}>নতুন অর্ডার এলে Telegram-এ ইনস্ট্যান্ট নোটিফিকেশন</p>
        <Grid2>
          <Field label="Telegram Bot Token">
            <SecretInput value={data.telegram_bot_token ?? ""} onChange={(v) => set("telegram_bot_token", v)} placeholder="123456:ABC-..." />
          </Field>
          <Field label="Chat ID">
            <div className="flex gap-2">
              <Input value={data.telegram_chat_id ?? ""} onChange={(v) => set("telegram_chat_id", v)} placeholder="-1001234567890" />
              <button
                type="button"
                onClick={() => testTelegram(data.telegram_bot_token, data.telegram_chat_id)}
                className="a-save-btn shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> টেস্ট
              </button>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--admin-muted)" }}>@userinfobot থেকে Chat ID নিন</p>
          </Field>
        </Grid2>

        <InfoBox tone="sky">
          <p className="font-semibold mb-1">📌 কিভাবে সেট আপ করবেন:</p>
          <ol className="list-decimal pl-5 space-y-0.5">
            <li>Telegram-এ <b>@BotFather</b>-এর সাথে চ্যাট করে নতুন বট তৈরি করুন → Bot Token পাবেন</li>
            <li>আপনার বটকে যে গ্রুপ/চ্যানেলে অ্যাড করেছেন সেটার Chat ID নিন (@userinfobot)</li>
            <li>উপরে দুটো বসিয়ে <b>"টেস্ট"</b> ক্লিক করুন</li>
          </ol>
        </InfoBox>
      </Card>

      {/* Admin Email */}
      <Card icon={<Mail className="w-4 h-4" />} title="Admin Email নোটিফিকেশন" tone="violet">
        <p className="text-xs mb-3" style={{ color: "var(--admin-muted)" }}>নতুন অর্ডার ও কাস্টমার মেসেজ এই ইমেইলে যাবে</p>
        <Field label="Admin notification email">
          <Input type="email" value={data.admin_email ?? ""} onChange={(v) => set("admin_email", v)} placeholder="admin@example.com" />
        </Field>
        <p className="text-[11px] mt-1" style={{ color: "var(--admin-muted)" }}>একাধিক ইমেইল কমা দিয়ে লিখুন</p>
      </Card>

      {/* WhatsApp Notification */}
      <Card icon={<MessageCircle className="w-4 h-4" />} title="WhatsApp অর্ডার নোটিফিকেশন" tone="emerald">
        <p className="text-xs mb-3" style={{ color: "var(--admin-muted)" }}>নতুন অর্ডার এলে WhatsApp-এ নোটিফিকেশন আসবে</p>
        <Field label="WhatsApp নম্বর (দেশ কোড সহ)">
          <div className="flex gap-2">
            <Input value={data.whatsapp_notify_number ?? ""} onChange={(v) => set("whatsapp_notify_number", v)} placeholder="8801580607614" />
            <button
              type="button"
              onClick={() => testWhatsApp(data.whatsapp_notify_number)}
              className="a-save-btn shrink-0"
            >
              <Send className="w-3.5 h-3.5" /> টেস্ট
            </button>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--admin-muted)" }}>উদাহরণ: 8801XXXXXXXXX (+ ছাড়া)</p>
        </Field>

        <InfoBox tone="emerald">
          <p className="font-semibold mb-1">✅ যেভাবে কাজ করবে:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>নতুন অর্ডার এলেই এই নম্বরে WhatsApp মেসেজ যাবে (অর্ডার সামারি সহ)</li>
            <li>কাস্টমার চেকআউটে যা যা লিখেছে সব তথ্য থাকবে</li>
            <li>মোবাইল থেকে কাস্টমারকে সরাসরি WhatsApp করতে পারবেন</li>
            <li>Currency সহ অর্ডারের total amount দেখাবে</li>
          </ul>
        </InfoBox>
      </Card>

      {/* Admin Account */}
      <Card icon={<ShieldCheck className="w-4 h-4" />} title="Admin Account" tone="slate">
        <p className="text-xs" style={{ color: "var(--admin-muted)" }}>Manage admin user access from Lovable Cloud dashboard</p>
        <InfoBox tone="violet">
          নতুন অ্যাডমিন যোগ করতে: Lovable Cloud → Database → <b>user_roles</b> → user_id সহ role = <b>admin</b> insert করুন
        </InfoBox>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="a-save-btn h-11 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ============================== Helpers ============================== */

async function testTelegram(token?: string, chatId?: string) {
  if (!token || !chatId) return toast.error("Bot Token ও Chat ID দুটোই দিন");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "✅ AccessNow BD — Telegram নোটিফিকেশন সফলভাবে কনফিগার হয়েছে!",
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || "Failed");
    toast.success("Telegram-এ টেস্ট মেসেজ গেছে ✅");
  } catch (e: any) {
    toast.error("ব্যর্থ: " + e.message);
  }
}

function testWhatsApp(num?: string) {
  if (!num) return toast.error("WhatsApp নম্বর দিন");
  const msg = encodeURIComponent("✅ AccessNow BD — WhatsApp নোটিফিকেশন কনফিগার সফল!");
  window.open(`https://wa.me/${num.replace(/\D/g, "")}?text=${msg}`, "_blank");
}

/* ============================== UI Primitives ============================== */

function Card({ icon, title, tone = "violet", children }: { icon: React.ReactNode; title: string; tone?: ToneKey; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <section className="a-card overflow-hidden" style={{ borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: "var(--admin-primary)" }}>
      <header className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--admin-border)" }}>
        <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${t.bg} ${t.text}`}>
          {icon}
        </span>
        <h3 className="text-sm font-bold" style={{ color: "var(--admin-ink)" }}>{title}</h3>
      </header>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

function InfoBox({ tone = "violet", children }: { tone?: ToneKey; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div
      className="mt-4 rounded-xl border p-3.5 text-xs space-y-1 font-medium"
      style={{
        color: t.inkHex,
        backgroundColor: t.softHex,
        borderColor: t.borderHex,
      }}
    >
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--admin-text)" }}>{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 rounded-xl border px-3.5 text-sm transition focus:outline-none focus:ring-2"
      style={{
        background: "#ffffff",
        color: "var(--admin-ink)",
        borderColor: "var(--admin-border)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#c4b5fd"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.35)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--admin-border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border pl-3.5 pr-10 text-sm font-mono transition focus:outline-none focus:ring-2"
        style={{
          background: "#ffffff",
          color: "var(--admin-ink)",
          borderColor: "var(--admin-border)",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#c4b5fd"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.35)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--admin-border)"; e.currentTarget.style.boxShadow = "none"; }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-lg transition"
        style={{ color: "var(--admin-muted)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--admin-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function KeyList({ keys, onChange, placeholder, hint, link }: {
  keys: string[];
  onChange: (arr: string[]) => void;
  placeholder?: string;
  hint?: string;
  link?: { label: string; href: string };
}) {
  const list = keys.length ? keys : [""];
  const set = (i: number, v: string) => {
    const next = list.slice();
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...list, ""]);
  const del = (i: number) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next.length ? next : [""]);
  };
  return (
    <div className="space-y-2">
      {list.map((k, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold w-14" style={{ color: "var(--admin-muted)" }}>API Key {i + 1}</span>
          <div className="flex-1">
            <SecretInput value={k} onChange={(v) => set(i, v)} placeholder={placeholder} />
          </div>
          <button
            type="button"
            onClick={() => del(i)}
            className="shrink-0 w-9 h-9 grid place-items-center rounded-lg border transition"
            style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ffe4e6"; e.currentTarget.style.color = "#e11d48"; e.currentTarget.style.borderColor = "#fecdd3"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--admin-muted)"; e.currentTarget.style.borderColor = "var(--admin-border)"; }}
            title="রিসেট"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 pt-1">
        {hint && <p className="text-[11px]" style={{ color: "var(--admin-muted)" }}>{hint}</p>}
        <button
          type="button"
          onClick={add}
          className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold transition"
          style={{ background: "var(--admin-hover)", color: "var(--admin-text)" }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.97)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
        >
          <Plus className="w-3 h-3" /> আরেকটি কী
        </button>
      </div>
      {link && (
        <a href={link.href} target="_blank" rel="noreferrer"
           className="text-xs inline-flex items-center gap-1 hover:underline"
           style={{ color: "var(--admin-primary)" }}>
          {link.label} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

/* =====================================================
   AI System Panel — live status, model, feature toggles, test call
   ===================================================== */
function AiSystemPanel({
  model,
  features,
  onModel,
  onFeatures,
}: {
  model: string;
  features: Partial<Record<AiFeatureKey, boolean>>;
  onModel: (m: string) => void;
  onFeatures: (f: Partial<Record<AiFeatureKey, boolean>>) => void;
}) {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [testing, setTesting] = useState(false);
  const [testReply, setTestReply] = useState<string>("");
  const [testError, setTestError] = useState<string>("");
  const [ping, setPing] = useState<number | null>(null);

  const checkStatus = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await adminFetch("/api/ai-test", { method: "GET" });
      const j = await res.json();
      setStatus(j.ok ? "ok" : "fail");
    } catch {
      setStatus("fail");
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const runTest = async () => {
    setTesting(true);
    setTestReply("");
    setTestError("");
    setPing(null);
    const started = performance.now();
    try {
      const res = await adminFetch("/api/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: "In one short sentence, say hello from AccessNow BD." }),
      });
      const j = await res.json();
      setPing(Math.round(performance.now() - started));
      if (!res.ok || !j.ok) {
        setTestError(j.error || `HTTP ${res.status}`);
      } else {
        setTestReply(j.text ?? "");
      }
    } catch (e: any) {
      setTestError(e?.message || "Network error");
    } finally {
      setTesting(false);
    }
  };

  const toggle = (k: AiFeatureKey) => onFeatures({ ...features, [k]: !(features[k] ?? true) });

  return (
    <div className="space-y-5">
      {/* Status row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="inline-flex items-center gap-2 px-3 h-8 rounded-full text-[12px] font-bold ring-1"
          style={
            status === "ok"
              ? { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" as any }
              : status === "fail"
                ? { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" as any }
                : { background: "#f1f5f9", color: "#334155", borderColor: "#e2e8f0" as any }
          }
        >
          {status === "checking" ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…</>
          ) : status === "ok" ? (
            <><Check className="w-3.5 h-3.5" /> Lovable AI Active</>
          ) : (
            <><X className="w-3.5 h-3.5" /> Not reachable</>
          )}
        </span>
        <span className="text-[11px]" style={{ color: "var(--admin-muted)" }}>
          Provider: <b>Lovable AI Gateway</b> — no user key needed. Managed by Cloud.
        </span>
        <button
          type="button"
          onClick={checkStatus}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold ring-1 transition hover:bg-slate-50"
          style={{ borderColor: "var(--admin-border)", color: "var(--admin-text)" }}
        >
          <RefreshCcw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Model selector */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--admin-ink)" }}>
          <Bot className="w-4 h-4" /> Default Model
        </h4>
        <select
          value={model}
          onChange={(e) => onModel(e.target.value)}
          className="w-full h-10 rounded-xl border px-3 text-sm bg-white"
          style={{ borderColor: "var(--admin-border)", color: "var(--admin-ink)" }}
        >
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
          ))}
        </select>
        <p className="text-[11px]" style={{ color: "var(--admin-muted)" }}>
          Selected model is used by every AI feature below. Change → Save → effect immediately.
        </p>
      </div>

      {/* Test call */}
      <div
        className="rounded-2xl p-4 border"
        style={{ borderColor: "var(--admin-border)", background: "#fdf4ff" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4" style={{ color: "#a21caf" }} />
          <h4 className="text-sm font-bold" style={{ color: "#701a75" }}>Live Test</h4>
          {ping !== null && (
            <span className="ml-auto text-[10px] font-mono" style={{ color: "var(--admin-muted)" }}>
              {ping} ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={runTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#a21caf,#7c3aed)" }}
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {testing ? "Calling AI…" : "Run test"}
          </button>
          <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white/60 ring-1 ring-fuchsia-200 text-fuchsia-800">
            {model}
          </span>
        </div>
        {testReply && (
          <div className="mt-3 text-sm p-3 rounded-lg bg-white ring-1 ring-emerald-200 text-slate-800">
            <div className="text-[10px] font-bold text-emerald-700 mb-1">✓ AI REPLY</div>
            {testReply}
          </div>
        )}
        {testError && (
          <div className="mt-3 text-[12px] p-3 rounded-lg bg-white ring-1 ring-rose-200 text-rose-700">
            <div className="text-[10px] font-bold mb-1">✗ ERROR</div>
            {testError}
          </div>
        )}
      </div>

      {/* Feature toggles */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--admin-ink)" }}>
          <ShieldCheck className="w-4 h-4" /> Enabled Features
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {AI_FEATURES.map((f) => {
            const on = features[f.key] ?? true;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => toggle(f.key)}
                className="flex items-start gap-3 p-3 rounded-xl border text-left transition hover:bg-slate-50"
                style={{ borderColor: on ? "#c7d2fe" : "var(--admin-border)", background: on ? "#eef2ff" : "#ffffff" }}
              >
                <span
                  className="mt-0.5 w-8 h-8 rounded-lg grid place-items-center shrink-0"
                  style={{ background: on ? "#4f46e5" : "#e2e8f0", color: on ? "#ffffff" : "#64748b" }}
                >
                  {f.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--admin-ink)" }}>{f.label}</span>
                    <span
                      className={`ml-auto inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-bold ${
                        on ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {on ? <><Check className="w-3 h-3" /> ON</> : <><X className="w-3 h-3" /> OFF</>}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-muted)" }}>{f.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[11px]" style={{ color: "var(--admin-muted)" }}>
          Feature OFF হলে সেই AI endpoint 503 error দিবে — কোনো credit consume হবে না।
        </p>
      </div>
    </div>
  );
}
