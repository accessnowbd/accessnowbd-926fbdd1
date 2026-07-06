import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CreditCard, ShieldCheck, Copy, Check, Loader2, RefreshCw, Save,
  Circle, ExternalLink, AlertTriangle, Key, Globe, Link2, PlugZap,
  CheckCircle2, XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEpsStatus, testEpsConnection, type EpsStatus } from "@/lib/eps.functions";

export const Route = createFileRoute("/admin/eps-pgw")({
  component: EpsGatewayPage,
});

type Settings = {
  enabled: boolean;
  mode: "sandbox" | "live";
  currency: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  auto_verify: boolean;
  notes: string;
};

const DEFAULT_SETTINGS: Settings = {
  enabled: false,
  mode: "sandbox",
  currency: "BDT",
  success_url: "",
  fail_url: "",
  cancel_url: "",
  ipn_url: "",
  auto_verify: false,
  notes: "",
};

const SECRET_INFO: { key: keyof EpsStatus; env: string; label: string; desc: string }[] = [
  { key: "has_merchant_id",    env: "EPS_MERCHANT_ID",    label: "Merchant / Store ID", desc: "EPS থেকে দেওয়া merchant id / store id" },
  { key: "has_store_password", env: "EPS_STORE_PASSWORD", label: "Store Password",      desc: "EPS store password (গোপন)" },
  { key: "has_api_key",        env: "EPS_API_KEY",        label: "API Key",             desc: "EPS API key (X-API-Key হেডারে ব্যবহার হবে)" },
  { key: "has_api_secret",     env: "EPS_API_SECRET",     label: "API Secret",          desc: "EPS API secret / signing key" },
  { key: "has_api_url",        env: "EPS_API_URL",        label: "API Base URL (optional)", desc: "খালি রাখলে ডিফল্ট sandbox URL ব্যবহার হবে" },
];

function EpsGatewayPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [status, setStatus] = useState<EpsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStatus = useServerFn(getEpsStatus);
  const testConn = useServerFn(testEpsConnection);

  const load = useCallback(async () => {
    setLoading(true);
    // Non-secret settings row
    const { data } = await supabase
      .from("admin_records")
      .select("id, data")
      .eq("kind", "eps_pgw_settings")
      .maybeSingle();

    if (data) {
      setRecordId(data.id);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.data as Partial<Settings>) });
    }

    // Auto-populate default callback URLs from current origin
    if (typeof window !== "undefined") {
      setSettings((prev) => {
        const origin = window.location.origin;
        return {
          ...prev,
          success_url: prev.success_url || `${origin}/eps/success`,
          fail_url:    prev.fail_url    || `${origin}/eps/fail`,
          cancel_url:  prev.cancel_url  || `${origin}/eps/cancel`,
          ipn_url:     prev.ipn_url     || `${origin}/api/public/eps/ipn`,
        };
      });
    }

    // Secret presence
    try {
      const s = await fetchStatus();
      setStatus(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read secret status");
    }
    setLoading(false);
  }, [fetchStatus]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const payload = { kind: "eps_pgw_settings", data: settings, is_active: true, sort_order: 0 };
    if (recordId) {
      const { error } = await supabase.from("admin_records").update({ data: settings, is_active: true }).eq("id", recordId);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("admin_records").insert(payload).select("id").single();
      if (error) { setSaving(false); return toast.error(error.message); }
      setRecordId(data.id);
    }
    setSaving(false);
    toast.success("সেটিংস সেভ হয়েছে");
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
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
        status?.configured
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}>
        <div className={`grid place-items-center h-10 w-10 rounded-full shrink-0 ${status?.configured ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
          {status?.configured ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-slate-900">
            {loading ? "স্ট্যাটাস লোড হচ্ছে…" : status?.configured
              ? "EPS gateway credentials configured"
              : "EPS gateway ready — credentials বাকি আছে"}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            {status?.configured
              ? "আপনার API key + secrets সব সেভ আছে। নিচের ‘Test Connection’ দিয়ে verify করুন।"
              : "সব endpoint, IPN URL এবং settings আগেই বানানো। API key + secrets দিলে সরাসরি কাজ করবে।"}
          </p>
          {!!status?.missing_secrets?.length && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {status.missing_secrets.map((s) => (
                <span key={s} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white ring-1 ring-amber-300 text-amber-700">{s}</span>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          {/* Settings card */}
          <Card icon={CreditCard} title="Gateway Settings" subtitle="Non-secret configuration — যেকোনো সময় বদলাতে পারবেন">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ToggleField
                label="Enable EPS Gateway"
                sublabel="বন্ধ থাকলে checkout-এ EPS দেখাবে না"
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
                          ? m === "live"
                            ? "bg-emerald-500 text-white shadow"
                            : "bg-amber-500 text-white shadow"
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
                sublabel="EPS validate signal এলে order auto-approved হবে"
                checked={settings.auto_verify}
                onChange={(v) => setSettings((s) => ({ ...s, auto_verify: v }))}
              />
            </div>
          </Card>

          {/* Callback URLs */}
          <Card icon={Link2} title="Callback URLs" subtitle="এই URL গুলো EPS merchant dashboard-এ দিন">
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

          {/* Notes */}
          <Card icon={Globe} title="Merchant Notes" subtitle="Internal note (checkout-এ দেখাবে না)">
            <textarea
              value={settings.notes}
              onChange={(e) => setSettings((s) => ({ ...s, notes: e.target.value }))}
              rows={3}
              placeholder="EPS support contact, agreement number, ইত্যাদি…"
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
              href="https://www.eps.com.bd/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-sm font-semibold"
            >
              EPS website <ExternalLink className="h-3.5 w-3.5" />
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

        {/* Right column — credentials */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-1 rounded bg-gradient-to-b from-violet-500 to-fuchsia-600" />
              <Key className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-extrabold text-slate-900">Credentials</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              সব API key + password secure vault-এ store হবে, database-এ না। প্রতিটা row-তে দেখাচ্ছে কোনটা সেট আছে।
            </p>

            <div className="space-y-2.5">
              {SECRET_INFO.map((s) => {
                const ok = status ? Boolean(status[s.key]) : false;
                return (
                  <div key={s.env} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <span className={`mt-0.5 grid place-items-center h-6 w-6 rounded-full ${ok ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {ok ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{s.label}</span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{s.env}</code>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> কিভাবে সেট করবেন
              </div>
              চ্যাটে বলুন <em>“EPS credentials সেট করে দাও”</em> — আমি secure form খুলে দিব যেখানে API key + secrets দিলে সাথে সাথে backend-এ সেভ হয়ে যাবে।
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
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
