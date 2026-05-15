import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Save, Loader2, KeyRound, Mail, Clock, AlertTriangle, RefreshCw, LockOpen } from "lucide-react";
import { toast } from "sonner";
import {
  loadSecuritySettings,
  saveSecuritySettings,
  DEFAULT_SECURITY_SETTINGS,
  type AdminSecuritySettings,
} from "@/lib/admin-security";
import { revokeAdminMfaGrants, checkAdminMfaGrant } from "@/lib/admin-mfa.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/security")({
  component: AdminSecurityPage,
});

function AdminSecurityPage() {
  const [settings, setSettings] = useState<AdminSecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grant, setGrant] = useState<{ granted: boolean; expiresAt: string | null; method: string | null } | null>(null);
  const [factorCount, setFactorCount] = useState<{ verified: number; pending: number }>({ verified: 0, pending: 0 });

  const checkGrant = useServerFn(checkAdminMfaGrant);
  const revokeGrants = useServerFn(revokeAdminMfaGrants);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { settings, id } = await loadSecuritySettings();
      setSettings(settings);
      setRecordId(id);
      try {
        const g = await checkGrant();
        setGrant(g);
      } catch { setGrant(null); }
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const totp = (data?.totp ?? []) as Array<{ status: string }>;
        setFactorCount({
          verified: totp.filter((f) => f.status === "verified").length,
          pending: totp.filter((f) => f.status === "unverified").length,
        });
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [checkGrant]);

  useEffect(() => { load(); }, [load]);

  const update = (patch: Partial<AdminSecuritySettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const save = async () => {
    if (!settings.allow_totp && !settings.allow_email_otp && settings.mfa_enforced) {
      toast.error("MFA চালু রাখলে অন্তত একটি method allow করতে হবে");
      return;
    }
    setSaving(true);
    try {
      const { id } = await saveSecuritySettings(settings, recordId);
      setRecordId(id);
      toast.success("Security settings saved");
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("আপনার সব active MFA grant revoke করবেন? পরের navigation-এ আবার verify করতে হবে।")) return;
    try {
      await revokeGrants();
      toast.success("Grants revoked");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Revoke failed");
    }
  };

  const handleResetTotp = async () => {
    if (!confirm("Authenticator factor reset করবেন? পরের login-এ নতুন QR scan করতে হবে।")) return;
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = (data?.totp ?? []) as Array<{ id: string }>;
      for (const f of totp) {
        try { await supabase.auth.mfa.unenroll({ factorId: f.id }); } catch { /* ignore */ }
      }
      try { await revokeGrants(); } catch { /* ignore */ }
      toast.success("Authenticator reset");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Reset failed");
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 grid place-items-center text-white shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System</div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Security &amp; MFA</h1>
            <p className="text-sm text-slate-500 mt-1">
              Authenticator (TOTP) ও Email OTP enforcement এখান থেকে control করুন। Default-এ বন্ধ।
            </p>
          </div>
        </div>
      </div>

      {/* Master toggle */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> MFA Enforcement
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-lg">
              চালু থাকলে প্রতিবার admin panel-এ ঢোকার সময় Authenticator/Email code লাগবে।
              বন্ধ থাকলে কোনো extra step ছাড়াই admin panel খুলবে।
            </p>
          </div>
          <Toggle
            checked={settings.mfa_enforced}
            onChange={(v) => update({ mfa_enforced: v })}
            label={settings.mfa_enforced ? "ON" : "OFF"}
          />
        </div>

        {settings.mfa_enforced && (
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <MethodCard
              icon={<KeyRound className="w-4 h-4" />}
              title="Authenticator (TOTP)"
              desc="Google Authenticator / Authy / 1Password"
              checked={settings.allow_totp}
              onChange={(v) => update({ allow_totp: v })}
            />
            <MethodCard
              icon={<Mail className="w-4 h-4" />}
              title="Email OTP"
              desc="6-digit code সব admin email-এ পাঠানো হয়"
              checked={settings.allow_email_otp}
              onChange={(v) => update({ allow_email_otp: v })}
            />
          </div>
        )}

        {settings.mfa_enforced && (
          <div className="mt-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Grant duration (hours)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={settings.grant_ttl_hours}
              onChange={(e) => update({ grant_ttl_hours: Math.max(1, Math.min(720, Number(e.target.value) || 1)) })}
              className="w-40 h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Verification-এর পর কতক্ষণ admin panel খোলা থাকবে (default 12h, max 720h).
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            পরিবর্তন save করার পর পরের page load থেকে কার্যকর হবে।
          </p>
          <button
            onClick={save}
            disabled={saving}
            className="h-10 px-5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save settings
          </button>
        </div>
      </section>

      {/* Status / actions */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Current status</h2>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <StatusTile
            label="Active grant"
            value={grant?.granted ? `Yes · ${grant?.method ?? "—"}` : "No"}
            sub={grant?.expiresAt ? `Until ${new Date(grant.expiresAt).toLocaleString()}` : "Will require verification"}
            tone={grant?.granted ? "ok" : "muted"}
          />
          <StatusTile
            label="TOTP factors"
            value={`${factorCount.verified} verified`}
            sub={factorCount.pending ? `${factorCount.pending} pending` : "Clean"}
            tone={factorCount.verified > 0 ? "ok" : "muted"}
          />
          <StatusTile
            label="Enforcement"
            value={settings.mfa_enforced ? "Enforced" : "Disabled"}
            sub={settings.mfa_enforced ? "Verification required" : "Open access"}
            tone={settings.mfa_enforced ? "warn" : "muted"}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => load()}
            className="h-9 px-3 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleRevoke}
            className="h-9 px-3 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <LockOpen className="w-3.5 h-3.5" /> Revoke my grants
          </button>
          <button
            onClick={handleResetTotp}
            className="h-9 px-3 rounded-full border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Reset Authenticator
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 inline-flex items-center gap-2 transition`}
    >
      <span
        className={`w-12 h-7 rounded-full transition relative ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      {label && (
        <span className={`text-[11px] font-bold ${checked ? "text-emerald-700" : "text-slate-500"}`}>
          {label}
        </span>
      )}
    </button>
  );
}

function MethodCard({
  icon, title, desc, checked, onChange,
}: { icon: React.ReactNode; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${checked ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50/40"}`}>
      <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${checked ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function StatusTile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "ok" | "warn" | "muted" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50/40"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50/40"
      : "border-slate-200 bg-slate-50/40";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
