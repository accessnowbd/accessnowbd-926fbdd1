import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User2,
  Phone,
  Crown,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Fingerprint,
  KeyRound,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/auth")({
  component: () => <AuthPage initialMode="login" />,
  head: () => ({ meta: [{ title: "Login or Sign up — AccessNow BD" }] }),
});

export function AuthPageEntry({ initialMode, openForgot }: { initialMode: "login" | "signup"; openForgot?: boolean }) {
  return <AuthPage initialMode={initialMode} openForgot={openForgot} />;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(11, "Enter a valid phone number").max(20),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "Too weak", color: "from-rose-500 to-rose-400" },
    { label: "Weak", color: "from-rose-500 to-amber-400" },
    { label: "Fair", color: "from-amber-400 to-yellow-400" },
    { label: "Good", color: "from-yellow-400 to-emerald-400" },
    { label: "Strong", color: "from-emerald-400 to-aqua" },
    { label: "Excellent", color: "from-aqua to-violet-400" },
  ];
  return { score: s, ...map[s] };
}

function AuthPage({ initialMode = "login", openForgot = false }: { initialMode?: "login" | "signup"; openForgot?: boolean } = {}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(openForgot);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotErr, setForgotErr] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  const pw = useMemo(() => passwordScore(form.password), [form.password]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/orders" });
  }, [user, loading, navigate]);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const oauth = async (provider: "google" | "apple") => {
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/orders` },
      });
      if (error) throw error;
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Social sign-in failed");
    }
  };

  const sendReset = async () => {
    setForgotErr(null);
    setForgotMsg(null);
    setForgotBusy(true);
    try {
      const email = z.string().trim().email().max(255).parse(forgotEmail);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotMsg("Check your email for a password reset link.");
    } catch (e: unknown) {
      setForgotErr(e instanceof Error ? e.message : "Failed to send reset email");
    } finally {
      setForgotBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!agree) throw new Error("Please agree to the Terms & Privacy Policy");
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/orders`,
            data: { display_name: parsed.data.name, phone: parsed.data.phone },
          },
        });
        if (error) throw error;
      } else {
        const parsed = loginSchema.safeParse({ email: form.email, password: form.password });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06081c] text-white">
      {/* === Aurora background === */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[620px] w-[620px] rounded-full bg-primary/30 blur-[150px] animate-pulse-glow" />
        <div className="absolute top-10 -right-32 h-[560px] w-[560px] rounded-full bg-aqua/25 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[560px] w-[560px] rounded-full bg-violet-500/25 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
      </div>

      {/* === Main: centered card only === */}
      <main className="relative z-10 mx-auto max-w-[1240px] px-5 md:px-10 min-h-screen py-10 flex items-center justify-center">
        {/* Card */}
        <div className="relative w-full max-w-[480px] mx-auto lg:mx-0">
          {/* Rotating gradient ring */}
          <div className="pointer-events-none absolute -inset-[2px] rounded-[34px] opacity-80">
            <div
              className="absolute inset-0 rounded-[34px]"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(124,58,237,0.7), rgba(0,229,255,0.7), rgba(168,85,247,0.7), rgba(0,229,255,0.7), rgba(124,58,237,0.7))",
                animation: "aurora-pan 8s linear infinite",
                filter: "blur(14px)",
              }}
            />
          </div>

          <div className="relative rounded-[28px] border border-white/15 bg-[#0a0d28]/95 backdrop-blur-2xl shadow-[0_50px_120px_-25px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Premium ribbon */}
            <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur">
              <Crown className="w-2.5 h-2.5 text-amber-300" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200">
                Premium
              </span>
            </div>

            {/* Header */}
            <div className="relative px-7 sm:px-9 pt-9 pb-6 border-b border-white/10 overflow-hidden">
              <div className="absolute -top-24 -left-12 h-52 w-52 rounded-full bg-primary/35 blur-3xl" />
              <div className="absolute -top-24 -right-12 h-52 w-52 rounded-full bg-aqua/25 blur-3xl" />

              {/* Brand */}
              <div className="relative flex items-center gap-3">
                <span className="relative grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-[0_14px_36px_-8px_rgba(124,58,237,0.7)] ring-1 ring-white/20">
                  {mode === "login" ? <KeyRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0a0d28]">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                  </span>
                </span>
                <div className="leading-tight">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/55">
                    {mode === "login" ? "Welcome back" : "Join premium club"}
                  </div>
                  <div
                    className="text-[22px] font-extrabold mt-0.5 tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {mode === "login" ? "Sign in to your account" : "Create your account"}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="relative mt-6 grid grid-cols-2 rounded-full p-1 bg-white/[0.04] border border-white/10">
                <span
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua shadow-[0_10px_28px_-8px_rgba(124,58,237,0.7)] transition-all duration-500 ${
                    mode === "login" ? "translate-x-1" : "translate-x-[calc(100%+3px)]"
                  }`}
                />
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setErr(null);
                    }}
                    className={`relative z-10 h-9 rounded-full text-[12.5px] font-extrabold transition ${
                      mode === m ? "text-white" : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative px-7 sm:px-9 py-6 space-y-4">
              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => oauth("apple")}
                  className="h-11 rounded-full bg-white/[0.05] border border-white/15 hover:bg-white/[0.08] hover:border-white/30 transition inline-flex items-center justify-center gap-2 text-[12.5px] font-bold"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.01-.81.86-2.13 1.52-3.21 1.43-.14-1.09.42-2.24 1.13-2.97.79-.82 2.16-1.43 3.29-1.47zM20.5 17.06c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.04-3.33C.04 15.97-.26 11.4 1.41 8.97c1.19-1.74 3.07-2.76 4.83-2.76 1.79 0 2.92 1 4.4 1 1.43 0 2.3-1 4.37-1 1.57 0 3.23.86 4.42 2.34-3.88 2.13-3.25 7.68-.93 8.51z" />
                  </svg>
                  Apple
                </button>
                <button
                  type="button"
                  onClick={() => oauth("google")}
                  className="h-11 rounded-full bg-white/[0.05] border border-white/15 hover:bg-white/[0.08] hover:border-white/30 transition inline-flex items-center justify-center gap-2 text-[12.5px] font-bold"
                >
                  <svg viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C41 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z" />
                  </svg>
                  Google
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold tracking-[0.22em] text-white/40">OR</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={submit} className="space-y-3.5">
                {mode === "signup" && (
                  <>
                    <Field
                      icon={User2}
                      label="Full name"
                      value={form.name}
                      onChange={(v) => update("name", v)}
                      placeholder="আপনার পুরো নাম"
                      required
                    />
                    <Field
                      icon={Phone}
                      label="WhatsApp number"
                      value={form.phone}
                      onChange={(v) => update("phone", v)}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </>
                )}
                <Field
                  icon={Mail}
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="you@example.com"
                  required
                />
                <Field
                  icon={Lock}
                  label="Password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  placeholder="••••••••"
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="grid place-items-center h-7 w-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                />

                {mode === "signup" && form.password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            i < pw.score ? `bg-gradient-to-r ${pw.color}` : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-white/50">Password strength</span>
                      <span className={`font-extrabold bg-gradient-to-r ${pw.color} bg-clip-text text-transparent`}>
                        {pw.label}
                      </span>
                    </div>
                  </div>
                )}

                {mode === "login" ? (
                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-white/65 cursor-pointer select-none">
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          setRemember((v) => !v);
                        }}
                        className={`grid place-items-center h-4 w-4 rounded border transition ${
                          remember ? "bg-aqua border-aqua text-[#0a0d28]" : "bg-white/5 border-white/25"
                        }`}
                      >
                        {remember && (
                          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2.5 6.5 5 9 9.5 3.5" />
                          </svg>
                        )}
                      </span>
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only" />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOpen((v) => !v);
                        setForgotErr(null);
                        setForgotMsg(null);
                        setForgotEmail(form.email);
                      }}
                      className="text-[11.5px] font-extrabold text-aqua hover:text-white transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-[11.5px] text-white/65 cursor-pointer select-none">
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setAgree((v) => !v);
                      }}
                      className={`grid place-items-center h-4 w-4 rounded border transition ${
                        agree ? "bg-aqua border-aqua text-[#0a0d28]" : "bg-white/5 border-white/25"
                      }`}
                    >
                      {agree && (
                        <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2.5 6.5 5 9 9.5 3.5" />
                        </svg>
                      )}
                    </span>
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="sr-only" />
                    I agree to the <span className="font-bold text-white">Terms</span> &{" "}
                    <span className="font-bold text-white">Privacy Policy</span>
                  </label>
                )}

                {err && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-300 animate-fade-in">
                    {err}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="group relative mt-1 w-full h-12 rounded-full text-[13.5px] font-extrabold text-white overflow-hidden ring-1 ring-white/20 hover:ring-white/40 shadow-[0_18px_40px_-12px_rgba(124,58,237,0.75)] hover:shadow-[0_22px_50px_-12px_rgba(124,58,237,0.9)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-primary via-violet-500 to-aqua" />
                  <span className="absolute inset-0 bg-gradient-to-r from-aqua via-primary to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute -inset-y-2 -left-10 w-10 rotate-12 bg-white/30 blur-sm group-hover:translate-x-[500px] transition-transform duration-700 ease-out" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {mode === "login" ? "Sign in securely" : "Create premium account"}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                </button>

                {mode === "login" && forgotOpen && (
                  <div className="mt-3 p-4 rounded-2xl border border-aqua/25 bg-gradient-to-br from-aqua/[0.06] to-primary/[0.04] backdrop-blur-md space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="grid place-items-center h-7 w-7 rounded-lg bg-aqua/15 border border-aqua/30">
                        <KeyRound className="w-3.5 h-3.5 text-aqua" />
                      </span>
                      <p className="text-[12.5px] font-extrabold">Reset your password</p>
                    </div>
                    <Field
                      icon={Mail}
                      label="Email"
                      type="email"
                      value={forgotEmail}
                      onChange={setForgotEmail}
                      placeholder="you@example.com"
                      required
                    />
                    {forgotErr && <p className="text-[11px] font-semibold text-rose-300">{forgotErr}</p>}
                    {forgotMsg && (
                      <p className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {forgotMsg}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={sendReset}
                      disabled={forgotBusy}
                      className="w-full h-10 rounded-full bg-white/[0.05] border border-white/15 text-[12px] font-extrabold hover:bg-white/10 hover:border-aqua/40 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {forgotBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      Send reset link
                    </button>
                  </div>
                )}

                <p className="text-center text-[11.5px] text-white/50 pt-2">
                  {mode === "login" ? (
                    <>
                      এখনও account নেই?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setErr(null);
                        }}
                        className="font-extrabold text-aqua hover:text-white transition"
                      >
                        ফ্রি রেজিস্টার করুন →
                      </button>
                    </>
                  ) : (
                    <>
                      আগে থেকে account আছে?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setErr(null);
                        }}
                        className="font-extrabold text-aqua hover:text-white transition"
                      >
                        Sign in →
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>

            {/* Footer */}
            <div className="relative px-7 sm:px-9 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/55">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-bit encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/55">
                <Sparkles className="w-3 h-3 text-violet-300" /> Powered by AccessNow BD
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  icon: Icon,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-white/55">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      <div className="mt-1.5 relative group">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aqua group-focus-within:scale-110 transition-all">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full h-11 ${Icon ? "pl-10" : "pl-4"} ${
            trailing ? "pr-12" : "pr-4"
          } rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-aqua/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-aqua/15 transition-all`}
        />
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    </label>
  );
}
