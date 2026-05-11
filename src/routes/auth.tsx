import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  User2,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Crown,
  Zap,
  CheckCircle2,
  KeyRound,
  Star,
  ArrowRight,
  Fingerprint,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Login or Sign up — AccessNow BD" }] }),
});

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

function passwordScore(pw: string): { score: number; label: string; color: string } {
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

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotErr, setForgotErr] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  const pwScore = useMemo(() => passwordScore(form.password), [form.password]);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
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

  useEffect(() => {
    if (!loading && user) navigate({ to: "/orders" });
  }, [user, loading, navigate]);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
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
    <div className="relative min-h-screen overflow-hidden">
      {/* === Aurora background === */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[560px] w-[560px] rounded-full bg-primary/30 blur-[150px] animate-pulse-glow" />
        <div className="absolute top-20 -right-24 h-[500px] w-[500px] rounded-full bg-aqua/25 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-violet-500/25 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          }}
        />
      </div>

      {/* === Top nav === */}
      <header className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-10 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-[0_10px_28px_-8px_rgba(124,58,237,0.7)] ring-1 ring-white/15">
            <Crown className="w-5 h-5" />
          </span>
          <span className="text-lg font-extrabold text-aurora">AccessNow BD</span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full glass-soft border border-white/10 text-xs font-bold text-white/80 hover:text-white hover:border-white/30 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
      </header>

      {/* === Main grid === */}
      <main className="relative z-10 mx-auto max-w-[1240px] px-4 md:px-10 py-6 md:py-10 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
        {/* ============== LEFT: PREMIUM SHOWCASE ============== */}
        <div className="hidden lg:block relative">
          {/* Premium ribbon */}
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/30 backdrop-blur-md mb-7">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-amber-200">
              Premium · Members Only
            </span>
            <span className="ml-1 inline-flex items-center gap-0.5 text-amber-200">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              ))}
            </span>
          </div>

          <h1
            className="text-[44px] xl:text-[56px] font-extrabold leading-[1.02] text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            একটি account.
            <br />
            <span className="relative inline-block">
              <span className="text-aurora animate-aurora-pan">পুরো প্রিমিয়াম দুনিয়া।</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/0 via-aqua to-primary/0 rounded-full" />
            </span>
          </h1>

          <p className="mt-6 text-[15.5px] text-white/65 leading-relaxed max-w-md">
            ChatGPT Plus, Netflix, Canva Pro, Office 365 — সব premium subscription{" "}
            <span className="text-white font-semibold">verified, instant এবং warranty সহ</span>{" "}
            এক ছাদের নিচে।
          </p>

          {/* Feature stack — overlapping premium cards */}
          <div className="mt-9 grid gap-3 max-w-[460px]">
            {[
              {
                icon: Zap,
                title: "Instant Delivery",
                text: "১০ মিনিটের মধ্যে আপনার ইনবক্সে অ্যাক্সেস",
                tint: "from-amber-400 to-orange-500",
                glow: "rgba(251,146,60,0.45)",
              },
              {
                icon: ShieldCheck,
                title: "Verified & Warranty",
                text: "অরিজিনাল লাইসেন্স · ফুল রিপ্লেসমেন্ট সাপোর্ট",
                tint: "from-emerald-400 to-teal-500",
                glow: "rgba(16,185,129,0.45)",
              },
              {
                icon: Fingerprint,
                title: "Private & Secure",
                text: "256-bit এনক্রিপশন · আপনার ডেটা ১০০% নিরাপদ",
                tint: "from-violet-500 to-fuchsia-500",
                glow: "rgba(168,85,247,0.45)",
              },
            ].map(({ icon: Icon, title, text, tint, glow }, i) => (
              <div
                key={title}
                className="group relative flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-3.5 hover:border-white/25 hover:bg-white/[0.06] hover:-translate-y-0.5 transition-all duration-300"
                style={{ marginLeft: i * 14 }}
              >
                <span
                  className={`relative grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br ${tint} text-white shadow-lg ring-1 ring-white/20 shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                  <span
                    className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition -z-10"
                    style={{ background: glow }}
                  />
                </span>
                <div className="leading-tight pt-0.5">
                  <div className="text-[14px] font-extrabold text-white flex items-center gap-1.5">
                    {title}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[12px] text-white/55 mt-1">{text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-9 flex items-center gap-4 max-w-[460px] rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-3">
            <div className="flex -space-x-2.5">
              {[
                "from-violet-400 to-fuchsia-500",
                "from-aqua to-cyan-600",
                "from-emerald-400 to-teal-600",
                "from-amber-400 to-orange-500",
              ].map((g, i) => (
                <span
                  key={i}
                  className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#070922] grid place-items-center text-white text-[10px] font-extrabold`}
                >
                  {["A", "S", "M", "R"][i]}
                </span>
              ))}
              <span className="h-9 w-9 rounded-full bg-white/10 border border-white/15 ring-2 ring-[#070922] grid place-items-center text-[10px] font-extrabold text-white">
                +10K
              </span>
            </div>
            <div className="text-[12.5px] leading-tight">
              <div className="text-white font-extrabold">10,000+ happy members</div>
              <div className="text-white/55 flex items-center gap-1 mt-0.5">
                <span className="inline-flex items-center gap-0.5 text-amber-300">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-300" />
                  ))}
                </span>
                <span className="ml-1">4.9 · Bangladesh's #1</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============== RIGHT: AUTH CARD ============== */}
        <div className="relative w-full max-w-[460px] mx-auto lg:mx-0">
          {/* Outer rotating gradient ring */}
          <div className="pointer-events-none absolute -inset-[2px] rounded-[34px] opacity-80">
            <div
              className="absolute inset-0 rounded-[34px] opacity-90"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(124,58,237,0.7), rgba(0,229,255,0.7), rgba(168,85,247,0.7), rgba(0,229,255,0.7), rgba(124,58,237,0.7))",
                animation: "aurora-pan 8s linear infinite",
                filter: "blur(14px)",
              }}
            />
          </div>

          <div className="relative rounded-3xl border border-white/15 bg-[#070922]/90 backdrop-blur-2xl shadow-[0_50px_120px_-25px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Decorative corner badges */}
            <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md">
              <Crown className="w-2.5 h-2.5 text-amber-300" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200">
                Premium
              </span>
            </div>

            {/* === Header strip === */}
            <div className="relative px-7 pt-7 pb-5 border-b border-white/10 overflow-hidden">
              <div className="absolute -top-20 -left-12 h-44 w-44 rounded-full bg-primary/40 blur-3xl pointer-events-none" />
              <div className="absolute -top-20 -right-12 h-44 w-44 rounded-full bg-aqua/30 blur-3xl pointer-events-none" />

              <div className="relative flex items-center gap-3">
                <span className="relative grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-[0_14px_36px_-8px_rgba(124,58,237,0.7)] ring-1 ring-white/20">
                  {mode === "login" ? <KeyRound className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070922]">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                  </span>
                </span>
                <div className="leading-tight">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/55">
                    {mode === "login" ? "Welcome back" : "Join the premium club"}
                  </div>
                  <div
                    className="text-[20px] font-extrabold text-white mt-0.5 tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {mode === "login" ? "Sign in to your account" : "Create your account"}
                  </div>
                </div>
              </div>

              {/* Mode tabs — animated pill */}
              <div className="relative mt-6 grid grid-cols-2 rounded-full p-1 bg-white/[0.04] border border-white/10 shadow-inner">
                <span
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua shadow-[0_10px_28px_-8px_rgba(124,58,237,0.7)] transition-all duration-500 ease-out ${
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
                    className={`relative z-10 h-9 rounded-full text-[12.5px] font-extrabold tracking-tight transition ${
                      mode === m ? "text-white" : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>
            </div>

            {/* === Form === */}
            <form onSubmit={submit} className="relative px-7 py-6 space-y-3.5">
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

              {/* Password strength meter (signup only) */}
              {mode === "signup" && form.password.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                          i < pwScore.score
                            ? `bg-gradient-to-r ${pwScore.color}`
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-white/50">Password strength</span>
                    <span
                      className={`font-extrabold bg-gradient-to-r ${pwScore.color} bg-clip-text text-transparent`}
                    >
                      {pwScore.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Remember + forgot row (login only) */}
              {mode === "login" && (
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-[11.5px] font-semibold text-white/65 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-aqua"
                      defaultChecked
                    />
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
              )}

              {err && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-300 animate-fade-in">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="group relative mt-2 w-full h-12 rounded-full text-[13.5px] font-extrabold text-white overflow-hidden ring-1 ring-white/20 hover:ring-white/40 shadow-[0_18px_40px_-12px_rgba(124,58,237,0.75)] hover:shadow-[0_22px_50px_-12px_rgba(124,58,237,0.9)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-violet-500 to-aqua" />
                <span className="absolute inset-0 bg-gradient-to-r from-aqua via-primary to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="absolute -inset-y-2 -left-10 w-10 rotate-12 bg-white/30 blur-sm group-hover:translate-x-[480px] transition-transform duration-700 ease-out" />
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

              {/* Forgot password drawer */}
              {mode === "login" && forgotOpen && (
                <div className="mt-3 p-4 rounded-2xl border border-aqua/25 bg-gradient-to-br from-aqua/[0.06] to-primary/[0.04] backdrop-blur-md space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-7 w-7 rounded-lg bg-aqua/15 border border-aqua/30">
                      <KeyRound className="w-3.5 h-3.5 text-aqua" />
                    </span>
                    <p className="text-[12.5px] font-extrabold text-white">Reset your password</p>
                  </div>
                  <p className="text-[11px] text-white/55 leading-relaxed">
                    Email দিন, আমরা সাথে সাথে reset link পাঠিয়ে দেব।
                  </p>
                  <Field
                    icon={Mail}
                    label="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    placeholder="you@example.com"
                    required
                  />
                  {forgotErr && (
                    <p className="text-[11px] font-semibold text-rose-300">{forgotErr}</p>
                  )}
                  {forgotMsg && (
                    <p className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {forgotMsg}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => sendReset(e as unknown as React.FormEvent)}
                    disabled={forgotBusy}
                    className="w-full h-10 rounded-full bg-white/[0.05] border border-white/15 text-[12px] font-extrabold text-white hover:bg-white/10 hover:border-aqua/40 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {forgotBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send reset link
                  </button>
                </div>
              )}

              {/* Switch mode */}
              <p className="text-center text-[11.5px] text-white/50 mt-4">
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

              {/* Terms */}
              {mode === "signup" && (
                <p className="text-center text-[10.5px] text-white/40 leading-relaxed mt-2">
                  Register করলে আপনি আমাদের{" "}
                  <span className="text-white/70 hover:text-white underline underline-offset-2 cursor-pointer">
                    Terms
                  </span>{" "}
                  ও{" "}
                  <span className="text-white/70 hover:text-white underline underline-offset-2 cursor-pointer">
                    Privacy Policy
                  </span>{" "}
                  সম্মত হচ্ছেন।
                </p>
              )}
            </form>

            {/* === Footer trust strip === */}
            <div className="relative px-7 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
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
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </label>
  );
}
