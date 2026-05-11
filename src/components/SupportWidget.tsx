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
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support"
          className="fixed bottom-5 right-5 z-50 group"
        >
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl animate-pulse-glow" />
          <span className="relative grid place-items-center h-14 w-14 rounded-full bg-aurora text-white shadow-[0_10px_30px_-6px_var(--color-primary)] hover:scale-105 transition">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-1.5rem))] h-[min(580px,calc(100vh-1.5rem))]">
          <div className="relative h-full flex flex-col rounded-3xl overflow-hidden border border-white/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] bg-[#080a1f]/95 backdrop-blur-xl">
            {/* aurora bg */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[var(--color-aqua)]/30 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative grid place-items-center h-10 w-10 rounded-2xl bg-aurora text-white">
                  {tab === "ai" ? <Bot className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080a1f]" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold text-white">AccessNow Support</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/90">
                    {loading ? "Typing…" : "Online · 24/7"}
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

            {/* Body */}
            {tab === "menu" ? (
              <div className="relative flex-1 overflow-y-auto px-4 py-5 space-y-3">
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                  <div className="text-sm text-white/85">
                    👋 হ্যালো! কীভাবে সাহায্য করতে পারি? দ্রুত উত্তরের জন্য AI অথবা সরাসরি WhatsApp বেছে নিন।
                  </div>
                </div>

                <button
                  onClick={() => setTab("ai")}
                  className="w-full text-left rounded-2xl p-4 bg-gradient-to-br from-primary/20 to-[var(--color-aqua)]/10 border border-primary/30 hover:border-primary/60 hover:shadow-[0_10px_30px_-10px_var(--color-primary)] transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-aurora text-white">
                      <Bot className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">AI Assistant</div>
                      <div className="text-[11px] text-white/65">তাৎক্ষণিক উত্তর · বাংলায়</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      Fast
                    </span>
                  </div>
                </button>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-400/60 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-emerald-500 text-white">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">WhatsApp Support</div>
                      <div className="text-[11px] text-white/65">+880 1580-607614 · ১৫ মিনিটে রেসপন্স</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                      Live
                    </span>
                  </div>
                </a>

                <a
                  href="tel:+8801580607614"
                  className="block rounded-2xl p-4 bg-white/5 border border-white/10 hover:border-white/25 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-11 w-11 rounded-xl bg-white/10 text-white">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">কল করুন</div>
                      <div className="text-[11px] text-white/65">১১ AM – ১১ PM · প্রতিদিন</div>
                    </div>
                  </div>
                </a>

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
