import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/30 blur-[140px]" />
        <div className="absolute top-20 -right-24 h-[460px] w-[460px] rounded-full bg-aqua/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[480px] w-[480px] rounded-full bg-violet-500/25 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 75%)",
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
      <main className="relative z-10 mx-auto max-w-[1180px] px-4 md:px-10 py-8 md:py-12 grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center">
        {/* Left: Brand pitch */}
        <div className="hidden lg:flex flex-col gap-7 pr-4">
          <span className="self-start inline-flex items-center gap-1.5 rounded-full glass-soft border border-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-aqua">
            <Sparkles className="w-3 h-3" /> Premium Membership
          </span>
          <h1
            className="text-4xl xl:text-5xl font-extrabold leading-[1.08] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            একটি account, <br />
            <span className="text-aurora">পুরো ডিজিটাল দুনিয়া</span>
          </h1>
          <p className="text-[15px] text-white/65 leading-relaxed max-w-md">
            ChatGPT Plus, Netflix, Canva Pro, Microsoft 365 — সব premium service এর
            verified subscription, instant delivery এবং warranty সহ একই জায়গায়।
          </p>

          <div className="grid gap-3 max-w-md">
            {[
              { icon: Zap, title: "Instant Delivery", text: "১০ মিনিটের মধ্যে অ্যাক্সেস" },
              { icon: ShieldCheck, title: "Verified & Warranty", text: "অরিজিনাল লাইসেন্স, রিপ্লেসমেন্ট সাপোর্ট" },
              { icon: CheckCircle2, title: "Order Tracking", text: "Account থেকে সব subscription manage করুন" },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl glass-soft border border-white/10 px-4 py-3 hover:border-white/20 transition"
              >
                <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.6)] shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-white">{title}</div>
                  <div className="text-[12px] text-white/55 mt-0.5">{text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {["from-violet-400 to-fuchsia-500", "from-aqua to-cyan-600", "from-emerald-400 to-teal-600", "from-amber-400 to-orange-500"].map((g, i) => (
                <span key={i} className={`h-8 w-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#070922]`} />
              ))}
            </div>
            <div className="text-[12px] leading-tight">
              <div className="text-white font-extrabold">10,000+ happy customers</div>
              <div className="text-white/50">Bangladesh-এর #1 premium digital store</div>
            </div>
          </div>
        </div>

        {/* Right: Auth card */}
        <div className="relative w-full max-w-[440px] mx-auto lg:mx-0">
          {/* Card glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-[36px] bg-gradient-to-br from-primary/30 via-violet-500/20 to-aqua/30 blur-2xl opacity-70" />

          <div className="relative rounded-3xl border border-white/12 bg-[#070922]/85 backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Header strip */}
            <div className="relative px-7 pt-7 pb-5 border-b border-white/10">
              <div className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-primary/40 blur-3xl pointer-events-none" />
              <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-aqua/30 blur-3xl pointer-events-none" />
              <div className="relative flex items-center gap-2.5">
                <span className="grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-lg ring-1 ring-white/15">
                  {mode === "login" ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </span>
                <div className="leading-tight">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">
                    {mode === "login" ? "Welcome back" : "Get started"}
                  </div>
                  <div
                    className="text-[18px] font-extrabold text-white mt-0.5"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {mode === "login" ? "Login to your account" : "Create an account"}
                  </div>
                </div>
              </div>

              {/* Mode tabs */}
              <div className="relative mt-5 grid grid-cols-2 rounded-full p-1 bg-white/5 border border-white/10">
                <span
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-primary via-violet-500 to-aqua shadow-[0_8px_22px_-8px_rgba(124,58,237,0.7)] transition-transform duration-300 ${
                    mode === "login" ? "translate-x-1" : "translate-x-[calc(100%+3px)]"
                  }`}
                />
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); setErr(null); }}
                    className={`relative z-10 h-9 rounded-full text-[12px] font-extrabold tracking-tight transition ${
                      mode === m ? "text-white" : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    {m === "login" ? "Login" : "Register"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
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

              {err && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-300">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="group relative mt-2 w-full h-12 rounded-full text-[13px] font-extrabold text-white overflow-hidden ring-1 ring-white/15 hover:ring-white/30 shadow-[0_14px_36px_-10px_rgba(124,58,237,0.7)] hover:shadow-[0_18px_44px_-10px_rgba(124,58,237,0.85)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-violet-500 to-aqua" />
                <span className="absolute -inset-y-2 -left-10 w-8 rotate-12 bg-white/30 blur-sm group-hover:translate-x-[460px] transition-transform duration-700 ease-out" />
                <span className="relative inline-flex items-center justify-center gap-2">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "login" ? "Login to Dashboard" : "Create Premium Account"}
                </span>
              </button>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen((v) => !v);
                    setForgotErr(null);
                    setForgotMsg(null);
                    setForgotEmail(form.email);
                  }}
                  className="w-full text-[11px] font-bold text-aqua hover:text-white transition mt-1"
                >
                  Forgot password?
                </button>
              )}

              {mode === "login" && forgotOpen && (
                <div
                  onSubmit={sendReset}
                  className="mt-3 p-4 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3"
                >
                  <p className="text-[12px] font-extrabold text-white">Reset your password</p>
                  <p className="text-[11px] text-white/55">
                    Email দিন, আমরা reset link পাঠিয়ে দেব।
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
                    <p className="text-[11px] font-semibold text-emerald-300">{forgotMsg}</p>
                  )}
                  <button
                    type="button"
                    onClick={(e) => sendReset(e as unknown as React.FormEvent)}
                    disabled={forgotBusy}
                    className="w-full h-10 rounded-full glass-soft border border-white/15 text-[12px] font-extrabold text-white hover:border-aqua/40 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {forgotBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send reset link
                  </button>
                </div>
              )}

              <p className="text-center text-[11px] text-white/45 mt-3">
                {mode === "login" ? (
                  <>
                    Account নেই?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setErr(null); }}
                      className="font-extrabold text-aqua hover:text-white transition"
                    >
                      Register করুন
                    </button>
                  </>
                ) : (
                  <>
                    আগে থেকে account আছে?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setErr(null); }}
                      className="font-extrabold text-aqua hover:text-white transition"
                    >
                      Login করুন
                    </button>
                  </>
                )}
              </p>
            </form>

            {/* Footer trust strip */}
            <div className="relative px-7 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/55">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-bit secured
              </span>
              <span className="text-[10px] font-bold text-white/55">
                © AccessNow BD
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
      <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/55">
        {label}
        {required && <span className="text-rose-400"> *</span>}
      </span>
      <div className="mt-1.5 relative group">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-aqua transition">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full h-11 ${Icon ? "pl-10" : "pl-4"} ${trailing ? "pr-12" : "pr-4"} rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-aqua/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-aqua/15 transition`}
        />
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </label>
  );
}
