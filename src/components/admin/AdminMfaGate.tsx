import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, KeyRound, LogOut, RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Factor = {
  id: string;
  status: "verified" | "unverified";
  factor_type: string;
  friendly_name?: string | null;
};

type Mode = "loading" | "enroll" | "challenge" | "ok" | "error";

interface Props {
  children: React.ReactNode;
  onSignOut: () => void | Promise<void>;
  userEmail?: string | null;
}

/**
 * Mandatory TOTP (Google Authenticator) gate for admin panel.
 * - If user has no verified TOTP factor → show enrollment (QR + secret).
 * - If user has a factor but session is aal1 → show challenge (6-digit code).
 * - If aal2 → render children (admin shell).
 */
export function AdminMfaGate({ children, onSignOut, userEmail }: Props) {
  const [mode, setMode] = useState<Mode>("loading");
  const [error, setError] = useState<string | null>(null);

  // Enrollment state
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Challenge state
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const initRan = useRef(false);

  const refresh = useCallback(async () => {
    setError(null);
    setMode("loading");
    try {
      const { data: aalData, error: aalErr } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalErr) throw aalErr;

      if (aalData?.currentLevel === "aal2") {
        setMode("ok");
        return;
      }

      const { data: factorsData, error: factorsErr } =
        await supabase.auth.mfa.listFactors();
      if (factorsErr) throw factorsErr;

      const totp: Factor[] = (factorsData?.totp ?? []) as any;
      const verified = totp.find((f) => f.status === "verified");

      if (verified) {
        setActiveFactorId(verified.id);
        setMode("challenge");
        return;
      }

      // Clean up any unverified leftovers, then start fresh enrollment
      for (const f of totp) {
        if (f.status === "unverified") {
          try { await supabase.auth.mfa.unenroll({ factorId: f.id }); } catch { /* ignore */ }
        }
      }

      const { data: enrollData, error: enrollErr } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `AccessNow BD Admin (${new Date().toISOString().slice(0, 10)})`,
        });
      if (enrollErr) throw enrollErr;

      setEnrollFactorId(enrollData.id);
      setQr(enrollData.totp.qr_code);
      setSecret(enrollData.totp.secret);
      setMode("enroll");
    } catch (e: any) {
      setError(e?.message || "MFA initialization failed");
      setMode("error");
    }
  }, []);

  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;
    refresh();
  }, [refresh]);

  const handleVerify = async () => {
    const trimmed = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(trimmed)) {
      setError("কোডটি ৬ ডিজিটের সংখ্যা হতে হবে");
      return;
    }
    const factorId = mode === "enroll" ? enrollFactorId : activeFactorId;
    if (!factorId) {
      setError("Factor ID missing — please refresh");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data: chal, error: chalErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (chalErr) throw chalErr;

      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: chal.id,
        code: trimmed,
      });
      if (verErr) throw verErr;

      setCode("");
      await refresh();
    } catch (e: any) {
      setError(e?.message || "কোড ভুল — আবার চেষ্টা করুন");
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  if (mode === "ok") return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-[#f6f7fb] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 grid place-items-center ring-1 ring-slate-200">
            {mode === "challenge" ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">
              {mode === "enroll" && "Two-Factor Setup (Required)"}
              {mode === "challenge" && "Two-Factor Verification"}
              {mode === "loading" && "Checking security..."}
              {mode === "error" && "Security check failed"}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {userEmail ?? "Admin account"}
            </p>
          </div>
        </div>

        {mode === "loading" && (
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        )}

        {mode === "error" && (
          <div className="mt-5">
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 break-words">
              {error}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={refresh}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button
                onClick={() => onSignOut()}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}

        {mode === "enroll" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Admin panel-এ access নিতে হলে অবশ্যই <b>Google Authenticator</b> (অথবা Authy / 1Password) app দিয়ে এই QR code scan করুন। তারপর app-এ দেখানো ৬-ডিজিটের কোডটি নিচে লিখুন।
            </p>
            {qr && (
              <div className="bg-white border border-slate-200 rounded-xl p-3 grid place-items-center">
                {/* Supabase returns an SVG data URL */}
                <img src={qr} alt="TOTP QR code" className="w-48 h-48" />
              </div>
            )}
            {secret && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  Manual setup key
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <code className="text-[12px] font-mono text-slate-800 break-all flex-1">{secret}</code>
                  <button
                    onClick={copySecret}
                    className="shrink-0 h-8 w-8 grid place-items-center rounded-md border border-slate-200 hover:bg-white text-slate-600"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <CodeInput
              code={code}
              setCode={setCode}
              onSubmit={handleVerify}
              submitting={submitting}
              error={error}
              label="Verify & Enable"
            />
          </div>
        )}

        {mode === "challenge" && (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              আপনার Authenticator app খুলে <b>AccessNow BD Admin</b>-এর জন্য দেখানো ৬-ডিজিটের কোডটি লিখুন।
            </p>
            <CodeInput
              code={code}
              setCode={setCode}
              onSubmit={handleVerify}
              submitting={submitting}
              error={error}
              label="Verify"
              autoFocus
            />
          </div>
        )}

        {(mode === "enroll" || mode === "challenge") && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => onSignOut()}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
            <button
              onClick={refresh}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeInput({
  code, setCode, onSubmit, submitting, error, label, autoFocus,
}: {
  code: string;
  setCode: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  label: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <input
        autoFocus={autoFocus}
        inputMode="numeric"
        pattern="\d*"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        placeholder="000000"
        className="w-full h-14 text-center text-2xl tracking-[0.6em] font-mono font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 text-slate-900"
      />
      {error && (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      )}
      <button
        onClick={onSubmit}
        disabled={submitting || code.length !== 6}
        className="mt-3 w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {label}
      </button>
    </div>
  );
}
