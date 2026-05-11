import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  Loader2,
  User2,
  Phone,
  Headphones,
  Zap,
  ShieldCheck,
  Clock,
  ChevronRight,
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const WHATSAPP_URL = "https://wa.me/8801580607614?text=" + encodeURIComponent(
  "হ্যালো AccessNow BD! আমি একটি বিষয়ে সাহায্য চাচ্ছি।",
);

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const QUICK_PROMPTS = [
  "ডেলিভারি কত সময়ে পাব?",
  "পেমেন্ট মেথড কী কী?",
  "ChatGPT Plus এর দাম?",
  "WELCOME20 কুপন কীভাবে কাজ করে?",
];

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"menu" | "ai">("menu");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function streamReply(history: Msg[]) {
    setLoading(true);
    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "দুঃখিত, এখন কানেক্ট হচ্ছে না। WhatsApp-এ যোগাযোগ করুন।";
        try {
          const j = JSON.parse(errText);
          if (j.error) msg = j.error;
        } catch { /* ignore */ }
        upsert(msg);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      upsert("নেটওয়ার্ক সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন বা WhatsApp করুন।");
    } finally {
      setLoading(false);
    }
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    void streamReply(next);
  }

  return (
    <>
      {/* Floating launcher — premium */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
          {/* Hover label pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#080a1f]/85 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] opacity-0 translate-x-2 group-hover/launcher:opacity-100 group-hover/launcher:translate-x-0 transition-all duration-300 pointer-events-none">
            <Sparkles className="h-3.5 w-3.5 text-aqua" />
            <span className="text-xs font-bold text-white">২৪/৭ সাপোর্ট</span>
          </div>

          <button
            onClick={() => setOpen(true)}
            aria-label="Open support"
            className="group/launcher relative"
          >
            {/* Outer pulsing aurora */}
            <span className="absolute -inset-3 rounded-full bg-aurora opacity-40 blur-2xl animate-pulse-glow" />
            {/* Rotating gradient ring */}
            <span
              className="absolute -inset-1 rounded-full opacity-80 animate-aurora-pan"
              style={{
                background:
                  "conic-gradient(from 0deg, var(--color-primary), var(--color-aqua), #a78bfa, var(--color-primary))",
                filter: "blur(2px)",
              }}
            />
            {/* Core button */}
            <span className="relative grid place-items-center h-16 w-16 rounded-full bg-[#080a1f] text-white shadow-[0_18px_45px_-10px_rgba(0,229,255,0.55)] group-hover/launcher:scale-110 transition-transform duration-300">
              <span className="absolute inset-[3px] rounded-full bg-aurora" />
              <Headphones className="relative h-7 w-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
              {/* Online dot */}
              <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#080a1f]">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
              </span>
              {/* Notification badge */}
              <span className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-[10px] font-extrabold text-white shadow-lg ring-2 ring-[#080a1f]">
                1
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(400px,calc(100vw-1.5rem))] h-[min(620px,calc(100vh-1.5rem))] animate-scale-in origin-bottom-right">
          <div className="relative h-full flex flex-col rounded-3xl overflow-hidden border border-white/15 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)] bg-[#070922]/95 backdrop-blur-2xl">
            {/* aurora bg blobs */}
            <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[var(--color-aqua)]/30 blur-3xl" />
            <div className="pointer-events-none absolute top-1/3 right-1/4 h-32 w-32 rounded-full bg-violet-500/25 blur-3xl" />

            {/* Hero Header */}
            <div className="relative px-5 pt-5 pb-4 border-b border-white/10 overflow-hidden">
              <div
                className="absolute -top-10 -left-6 h-32 w-32 rounded-full opacity-30 animate-aurora-pan"
                style={{
                  background:
                    "conic-gradient(from 0deg, var(--color-primary), var(--color-aqua), #a78bfa, var(--color-primary))",
                  filter: "blur(20px)",
                }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span
                      className="absolute -inset-1 rounded-2xl opacity-70 animate-aurora-pan"
                      style={{
                        background:
                          "conic-gradient(from 0deg, var(--color-primary), var(--color-aqua), #a78bfa, var(--color-primary))",
                        filter: "blur(6px)",
                      }}
                    />
                    <div className="relative grid place-items-center h-12 w-12 rounded-2xl bg-aurora text-white shadow-lg">
                      {tab === "ai" ? <Bot className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070922]">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                    </span>
                  </div>
                  <div className="leading-tight">
                    <div className="text-base font-extrabold text-white">AccessNow Support</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-300/95">
                        {loading ? "Typing…" : "Online · এখনই রেসপন্স"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid place-items-center h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {tab === "menu" && (
                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: Zap, label: "Instant", color: "text-aqua" },
                    { icon: ShieldCheck, label: "Verified", color: "text-emerald-300" },
                    { icon: Clock, label: "24/7", color: "text-violet-300" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
                    >
                      <Icon className={`h-3 w-3 ${color}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            {tab === "menu" ? (
              <div className="relative flex-1 overflow-y-auto px-4 py-4 space-y-3">
                <div className="rounded-2xl p-4 bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10">
                  <div className="text-sm text-white/90 leading-relaxed">
                    👋 হ্যালো! কীভাবে সাহায্য করতে পারি? দ্রুত উত্তরের জন্য AI অথবা সরাসরি WhatsApp বেছে নিন।
                  </div>
                </div>

                <button
                  onClick={() => setTab("ai")}
                  className="relative w-full text-left rounded-2xl p-4 bg-gradient-to-br from-primary/25 via-violet-500/15 to-[var(--color-aqua)]/15 border border-primary/30 hover:border-primary/70 hover:shadow-[0_15px_40px_-12px_var(--color-primary)] transition-all duration-300 group overflow-hidden"
                >
                  <span className="pointer-events-none absolute -top-1/2 -left-1/3 h-[200%] w-[40%] rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-1000" />
                  <div className="relative flex items-center gap-3">
                    <span className="relative grid place-items-center h-12 w-12 rounded-xl bg-aurora text-white shadow-lg">
                      <Bot className="h-5 w-5" />
                      <span className="absolute -inset-0.5 rounded-xl bg-aurora opacity-50 blur-md -z-10" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-extrabold text-white">AI Assistant</div>
                        <Sparkles className="h-3 w-3 text-aqua" />
                      </div>
                      <div className="text-[11px] text-white/70 mt-0.5">তাৎক্ষণিক উত্তর · বাংলায় কথা বলে</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block rounded-2xl p-4 bg-gradient-to-br from-emerald-500/25 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-400/70 hover:shadow-[0_15px_40px_-12px_rgba(16,185,129,0.7)] transition-all duration-300 group overflow-hidden"
                >
                  <span className="pointer-events-none absolute -top-1/2 -left-1/3 h-[200%] w-[40%] rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[400%] transition-transform duration-1000" />
                  <div className="relative flex items-center gap-3">
                    <span className="relative grid place-items-center h-12 w-12 rounded-xl bg-emerald-500 text-white shadow-lg">
                      <MessageCircle className="h-5 w-5" />
                      <span className="absolute -inset-0.5 rounded-xl bg-emerald-500 opacity-50 blur-md -z-10" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-extrabold text-white">WhatsApp</div>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-[11px] text-white/70 mt-0.5">+880 1580-607614 · ১৫ মিনিটে রেসপন্স</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </a>

                <a
                  href="tel:+8801580607614"
                  className="block rounded-2xl p-4 bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/[0.08] transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-12 w-12 rounded-xl bg-white/10 text-white">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-extrabold text-white">কল করুন</div>
                      <div className="text-[11px] text-white/70 mt-0.5">১১ AM – ১১ PM · প্রতিদিন</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </a>

                <div className="pt-2">
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 mb-2 px-1">
                    জনপ্রিয় প্রশ্ন
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setTab("ai");
                          send(q);
                        }}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-primary/15 hover:border-primary/40 hover:text-white transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-center text-[10px] text-white/40 uppercase tracking-[0.22em]">
                  Powered by AccessNow BD
                </div>
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="grid place-items-center h-8 w-8 shrink-0 rounded-full bg-aurora text-white">
                          <Bot className="h-4 w-4" />
                        </span>
                        <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/90 max-w-[85%]">
                          আসসালামু আলাইকুম! আমি AccessNow-এর AI সহকারী 🤖<br />
                          কী সাহায্য লাগবে?
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-10">
                        {QUICK_PROMPTS.map((q) => (
                          <button
                            key={q}
                            onClick={() => send(q)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 hover:border-primary/40 transition"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <span
                        className={`grid place-items-center h-8 w-8 shrink-0 rounded-full ${
                          m.role === "user"
                            ? "bg-white/10 text-white"
                            : "bg-aurora text-white"
                        }`}
                      >
                        {m.role === "user" ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </span>
                      <div
                        className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                          m.role === "user"
                            ? "rounded-2xl rounded-tr-sm bg-primary text-primary-foreground"
                            : "rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 text-white/90"
                        }`}
                      >
                        {m.content || (loading ? "…" : "")}
                      </div>
                    </div>
                  ))}

                  {loading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex items-start gap-2">
                      <span className="grid place-items-center h-8 w-8 rounded-full bg-aurora text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                      <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                      </div>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="relative border-t border-white/10 p-3 flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setTab("menu")}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition shrink-0"
                  >
                    ←
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="মেসেজ লিখুন…"
                    className="flex-1 h-10 px-3 rounded-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none text-sm text-white placeholder:text-white/40"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="grid place-items-center h-10 w-10 rounded-full bg-aurora text-white disabled:opacity-40 hover:scale-105 transition shrink-0"
                    aria-label="Send"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
