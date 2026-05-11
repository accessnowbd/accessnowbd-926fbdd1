import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Eye, EyeOff, X, ScanFace, Crown } from "lucide-react";
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

function passwordScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score: s, label: labels[s] };
}

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
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
    <div className="relative min-h-screen bg-[#f5f6f8] flex flex-col">
      {/* subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      <main className="relative flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">
          <div className="relative rounded-3xl bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25),0_8px_24px_-8px_rgba(15,23,42,0.08)] border border-slate-200/70 px-7 sm:px-9 py-8">
            {/* Close */}
            <Link
              to="/"
              aria-label="Close"
              className="absolute top-4 right-4 grid place-items-center h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </Link>

            {/* Logo / Brand */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-md">
                <Crown className="w-4.5 h-4.5" />
              </span>
              <div className="leading-tight">
                <div className="text-[15px] font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                  AccessNow <span className="text-primary">BD</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                    Premium
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-slate-500 tracking-wide">
                  Your Trusted Online Store
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-center text-[26px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-center text-[13px] text-slate-500 mt-1.5">
              {mode === "login" ? "Please enter your details to sign in." : "Just a few details to get started."}
            </p>

            {/* Social buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => oauth("apple")}
                className="h-11 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition grid place-items-center"
                aria-label="Continue with Apple"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900" fill="currentColor">
                  <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.01-.81.86-2.13 1.52-3.21 1.43-.14-1.09.42-2.24 1.13-2.97.79-.82 2.16-1.43 3.29-1.47zM20.5 17.06c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.04-3.33C.04 15.97-.26 11.4 1.41 8.97c1.19-1.74 3.07-2.76 4.83-2.76 1.79 0 2.92 1 4.4 1 1.43 0 2.3-1 4.37-1 1.57 0 3.23.86 4.42 2.34-3.88 2.13-3.25 7.68-.93 8.51z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => oauth("google")}
                className="h-11 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition grid place-items-center"
                aria-label="Continue with Google"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C41 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
              </button>
            </div>

            {/* OR divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold tracking-[0.22em] text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <FieldLight
                    label="Full name"
                    value={form.name}
                    onChange={(v) => update("name", v)}
                    placeholder="Your full name"
                    required
                  />
                  <FieldLight
                    label="WhatsApp number"
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </>
              )}

              <FieldLight
                label="E-Mail Address"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="Enter your email..."
                required
                trailing={<ScanFace className="w-4 h-4 text-slate-400" />}
              />

              <FieldLight
                label="Password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(v) => update("password", v)}
                placeholder="Password@123"
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {mode === "signup" && form.password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`flex-1 h-1 rounded-full ${i < pw.score ? "bg-primary" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10.5px] font-bold text-slate-500">{pw.label}</span>
                </div>
              )}

              {mode === "login" ? (
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-700 cursor-pointer select-none">
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setRemember((v) => !v);
                      }}
                      className={`grid place-items-center h-4 w-4 rounded border transition ${
                        remember
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-300"
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
                    className="text-[12.5px] font-bold text-slate-900 hover:text-primary transition"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer select-none">
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      setAgree((v) => !v);
                    }}
                    className={`grid place-items-center h-4 w-4 rounded border transition ${
                      agree ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-300"
                    }`}
                  >
                    {agree && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2.5 6.5 5 9 9.5 3.5" />
                      </svg>
                    )}
                  </span>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="sr-only" />
                  I agree to the <span className="font-bold text-slate-900">Terms</span> &{" "}
                  <span className="font-bold text-slate-900">Privacy Policy</span>.
                </label>
              )}

              {err && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-600">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full h-12 rounded-full bg-slate-900 text-white text-[14px] font-extrabold hover:bg-slate-800 active:scale-[0.99] transition shadow-[0_10px_30px_-10px_rgba(15,23,42,0.6)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "Sign in" : "Sign up"}
              </button>

              {mode === "login" && forgotOpen && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-[12.5px] font-bold text-slate-900">Reset your password</p>
                  <FieldLight
                    label="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    placeholder="you@example.com"
                    required
                  />
                  {forgotErr && <p className="text-[11px] font-semibold text-rose-600">{forgotErr}</p>}
                  {forgotMsg && <p className="text-[11px] font-semibold text-emerald-600">{forgotMsg}</p>}
                  <button
                    type="button"
                    onClick={sendReset}
                    disabled={forgotBusy}
                    className="w-full h-10 rounded-full bg-slate-900 text-white text-[12.5px] font-bold hover:bg-slate-800 transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {forgotBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send reset link
                  </button>
                </div>
              )}

              <p className="text-center text-[13px] text-slate-500 pt-2">
                {mode === "login" ? (
                  <>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErr(null);
                      }}
                      className="font-extrabold text-slate-900 hover:text-primary transition"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setErr(null);
                      }}
                      className="font-extrabold text-slate-900 hover:text-primary transition border border-slate-900 px-2 py-0.5 rounded"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          </div>

          <p className="text-center text-[12px] text-slate-400 mt-6">
            © {new Date().getFullYear()} AccessNow BD · Premium Store
          </p>
        </div>
      </main>
    </div>
  );
}

function FieldLight({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-bold text-slate-900">{label}</span>
      <div className="mt-1.5 relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full h-11 pl-5 ${trailing ? "pr-11" : "pr-5"} rounded-full bg-white border border-slate-200 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition`}
        />
        {trailing && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
    </label>
  );
}
