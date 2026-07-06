import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard, ShieldCheck, Copy, Check, Loader2, RefreshCw, Save,
  ExternalLink, AlertTriangle, Key, Globe, Link2, PlugZap,
  CheckCircle2, XCircle, Eye, EyeOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSslczStatus, testSslczConnection, type SslczStatus } from "@/lib/sslcz.functions";

export const Route = createFileRoute("/admin/sslcz-pgw")({
  component: SslczGatewayPage,
});

type Settings = {
  store_id: string;
  store_password: string;
  api_url: string;
  enabled: boolean;
  mode: "sandbox" | "live";
  currency: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  auto_verify: boolean;
  notes: string;
  display_name: string;
  brand_color: string;
  logo_url: string;
};

const DEFAULT_SETTINGS: Settings = {
  store_id: "",
  store_password: "",
  api_url: "",
  enabled: false,
  mode: "sandbox",
  currency: "BDT",
  success_url: "",
  fail_url: "",
  cancel_url: "",
  ipn_url: "",
  auto_verify: false,
  notes: "",
  display_name: "SSLCommerz",
  brand_color: "#1e40af",
  logo_url: "",
};

function SslczGatewayPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState<SslczStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const fetchStatus = useServerFn(getSslczStatus);
  const testConn = useServerFn(testSslczConnection);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_records")
      .select("id, data")
      .eq("kind", "sslcz_pgw_settings")
      .maybeSingle();

    if (data) {
      setRecordId(data.id);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.data as Partial<Settings>) });
    }

    if (typeof window !== "undefined") {
      setSettings((prev) => {
        const origin = window.location.origin;
        return {
          ...prev,
          success_url: prev.success_url || `${origin}/api/public/sslcz/success`,
          fail_url:    prev.fail_url    || `${origin}/api/public/sslcz/fail`,
          cancel_url:  prev.cancel_url  || `${origin}/api/public/sslcz/cancel`,
          ipn_url:     prev.ipn_url     || `${origin}/api/public/sslcz/ipn`,
        };
      });
    }

    try {
      const s = await fetchStatus();
      setStatus(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read status");
    }
    setLoading(false);
  }, [fetchStatus]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const payload = { kind: "sslcz_pgw_settings", data: settings, is_active: false, sort_order: 0 };
    if (recordId) {
      const { error } = await supabase.from("admin_records").update({ data: settings, is_active: false }).eq("id", recordId);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("admin_records").insert(payload).select("id").single();
      if (error) { setSaving(false); return toast.error(error.message); }
      setRecordId(data.id);
    }
    setSaving(false);
    toast.success("সেটিংস সেভ হয়েছে");
    try { const s = await fetchStatus(); setStatus(s); } catch { /* ignore */ }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await testConn();
      setTestResult({ ok: r.ok, message: r.message ?? "" });
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Test failed" });
    }
    setTesting(false);
  };

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch { toast.error("Copy failed"); }
  };

  const toggleShow = (k: string) => setShowSecrets((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        status?.configured ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      }`}>
        <div className={`grid place-items-center h-10 w-10 rounded-full shrink-0 ${status?.configured ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
          {status?.configured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-slate-900">
            {loading ? "স্ট্যাটাস লোড হচ্ছে…" : status?.configured
              ? "SSLCommerz gateway configured — live!"
              : "SSLCommerz gateway ready — credentials বসান"}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            {status?.configured
              ? "Store ID + Password সেভ আছে। ‘Test Connection’ দিয়ে verify করে ‘Enable’ করে দিন।"
              : "SSLCommerz merchant panel থেকে পাওয়া Store ID ও Store Password বসিয়ে Save করুন।"}
          </p>
          {!!status?.missing_fields?.length && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {status.missing_fields.map((s: string) => (
                <span key={s} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white ring-1 ring-amber-300 text-amber-700">{s}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => load()}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          <Card icon={Key} title="SSLCommerz Credentials" subtitle="SSLCommerz merchant panel থেকে পাওয়া তথ্য বসান — Save দিলেই সরাসরি কাজ করবে">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Store ID"
                required
                value={settings.store_id}
                onChange={(v) => setSettings((s) => ({ ...s, store_id: v }))}
                placeholder="e.g. yourstore0live"
              />
              <SecretField
                label="Store Password"
                required
                shown={!!showSecrets.store_password}
                onToggle={() => toggleShow("store_password")}
                value={settings.store_password}
                onChange={(v) => setSettings((s) => ({ ...s, store_password: v }))}
                placeholder="SSLCommerz store password"
              />
              <div className="sm:col-span-2">
                <TextField
                  label="API Base URL (optional)"
                  value={settings.api_url}
                  onChange={(v) => setSettings((s) => ({ ...s, api_url: v }))}
                  placeholder={settings.mode === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com"}
                />
                <p className="text-[11px] text-slate-500 mt-1">খালি রাখলে {settings.mode === "live" ? "live" : "sandbox"} ডিফল্ট URL ব্যবহার হবে।</p>
              </div>
            </div>
          </Card>

          <Card icon={CreditCard} title="Gateway Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToggleField
                label="Enable SSLCommerz Gateway"
                sublabel="বন্ধ থাকলে checkout-এ SSLCommerz দেখাবে না"
                checked={settings.enabled}
                onChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
              />
              <Field label="Mode">
                <div className="inline-flex p-1 rounded-xl bg-slate-100">
                  {(["sandbox", "live"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSettings((s) => ({ ...s, mode: m }))}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize ${
                        settings.mode === m
                          ? m === "live" ? "bg-emerald-500 text-white shadow" : "bg-amber-500 text-white shadow"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Currency">
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              <ToggleField
                label="Auto-verify successful IPN"
                sublabel="SSLCommerz VALID signal এলে order auto-approved হবে"
                checked={settings.auto_verify}
                onChange={(v) => setSettings((s) => ({ ...s, auto_verify: v }))}
              />
            </div>
          </Card>

          <Card icon={Globe} title="Checkout Display" subtitle="Checkout-এ এই gateway কীভাবে দেখাবে">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Display Name"
                value={settings.display_name}
                onChange={(v) => setSettings((s) => ({ ...s, display_name: v }))}
                placeholder="e.g. Card / Mobile Banking"
              />
              <Field label="Brand Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_color || "#1e40af"}
                    onChange={(e) => setSettings((s) => ({ ...s, brand_color: e.target.value }))}
                    className="h-10 w-14 rounded-lg border border-slate-200 bg-white cursor-pointer"
                  />
                  <input
                    value={settings.brand_color}
                    onChange={(e) => setSettings((s) => ({ ...s, brand_color: e.target.value }))}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </Field>
              <div className="sm:col-span-2">
                <TextField
                  label="Logo URL (optional)"
                  value={settings.logo_url}
                  onChange={(v) => setSettings((s) => ({ ...s, logo_url: v }))}
                  placeholder="https://…/logo.png"
                />
              </div>
            </div>
          </Card>

          <Card icon={Link2} title="Callback URLs" subtitle="এই URL গুলো SSLCommerz merchant panel-এ দিন">
            <div className="space-y-3">
              {[
                { label: "Success URL", key: "success_url", val: settings.success_url },
                { label: "Fail URL",    key: "fail_url",    val: settings.fail_url },
                { label: "Cancel URL",  key: "cancel_url",  val: settings.cancel_url },
                { label: "IPN URL",     key: "ipn_url",     val: settings.ipn_url },
              ].map(({ label, key, val }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
                    <button
                      onClick={() => copy(label, val)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700"
                    >
                      {copied === label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === label ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <input
                    value={val}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value } as Settings))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card icon={Globe} title="Merchant Notes" subtitle="Internal note (checkout-এ দেখাবে না)">
            <textarea
              value={settings.notes}
              onChange={(e) => setSettings((s) => ({ ...s, notes: e.target.value }))}
              rows={3}
              placeholder="SSLCommerz support contact, agreement number, ইত্যাদি…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-md shadow-violet-500/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
            </button>
            <button
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} Test Connection
            </button>
            <a
              href="https://sslcommerz.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-sm font-semibold"
            >
              SSLCommerz website <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {testResult && (
            <div className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
              testResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            }`}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-1 rounded bg-gradient-to-b from-violet-500 to-fuchsia-600" />
              <ShieldCheck className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-extrabold text-slate-900">Setup Checklist</h3>
            </div>
            <ol className="space-y-3 text-sm">
              <StepItem done={!!status?.has_store_id} n={1} title="Store ID বসান" />
              <StepItem done={!!status?.has_store_password} n={2} title="Store Password বসান" />
              <StepItem done={settings.mode === "live"} n={3} title="Live mode-এ switch করুন (test শেষে)" />
              <StepItem done={settings.enabled} n={4} title="Gateway Enable করুন" />
            </ol>

            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Security
              </div>
              Credentials admin-only database record-এ store হয়। শুধু admin role-এর user access পাবে; RLS enable আছে।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Small pieces ============================== */

function Card({ icon: Icon, title, subtitle, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-1 rounded bg-gradient-to-b from-violet-500 to-fuchsia-600" />
        <Icon className="h-5 w-5 text-violet-600" />
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
    </label>
  );
}

function SecretField({ label, value, onChange, placeholder, required, shown, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
  shown: boolean; onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <div className="relative">
        <input
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100"
          aria-label={shown ? "Hide" : "Show"}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function ToggleField({ label, sublabel, checked, onChange }: {
  label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        {sublabel && <div className="text-[11px] text-slate-500">{sublabel}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function StepItem({ done, n, title }: { done: boolean; n: number; title: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`grid place-items-center h-6 w-6 rounded-full text-[11px] font-bold shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <span className={`text-sm ${done ? "text-slate-500 line-through" : "text-slate-800 font-medium"}`}>{title}</span>
    </li>
  );
}
