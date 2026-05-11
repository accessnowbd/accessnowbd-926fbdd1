import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  User2,
  Headphones,
  ChevronRight,
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const WHATSAPP_URL =
  "https://wa.me/8801580607614?text=" +
  encodeURIComponent("হ্যালো AccessNow BD! আমি একটি বিষয়ে সাহায্য চাচ্ছি।");

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
        } catch {
          /* ignore */
        }
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
      {/* === Floating launcher === */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support"
          className="fixed bottom-5 right-5 z-50 group"
        >
          {/* Outer pulsing aurora */}
          <span className="absolute -inset-3 rounded-full bg-gradient-to-br from-violet-500 via-primary to-aqua opacity-40 blur-2xl animate-pulse-glow" />
          {/* Core button */}
          <span className="relative grid place-items-center h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 via-primary to-aqua text-white shadow-[0_18px_45px_-10px_rgba(124,58,237,0.7)] group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/15">
            <Headphones className="h-7 w-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0a1f]">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
            </span>
          </span>
        </button>
      )}

      {/* === Compact Pill Menu (matches screenshot) === */}
      {open && tab === "menu" && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 animate-scale-in origin-bottom-right">
          {/* AI Support pill */}
          <button
            onClick={() => setTab("ai")}
            className="group relative flex items-center gap-3 pl-2.5 pr-5 py-2.5 rounded-2xl bg-[#0d0a1f]/95 backdrop-blur-xl border border-white/10 shadow-[0_18px_50px_-15px_rgba(124,58,237,0.55)] hover:border-violet-400/60 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-15px_rgba(124,58,237,0.75)] transition-all duration-300 min-w-[230px]"
          >
            <span className="relative grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 text-white shadow-[0_10px_24px_-8px_rgba(168,85,247,0.7)]">
              <Bot className="h-5 w-5" />
              <span className="absolute -inset-0.5 rounded-xl bg-violet-500/40 blur-md -z-10" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-extrabold text-white">AI Support</span>
              <span className="block text-[11px] text-white/65 mt-0.5">তাৎক্ষণিক উত্তর পান</span>
            </span>
          </button>

          {/* WhatsApp pill */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-3 pl-2.5 pr-5 py-2.5 rounded-2xl bg-[#0d0a1f]/95 backdrop-blur-xl border border-white/10 shadow-[0_18px_50px_-15px_rgba(16,185,129,0.55)] hover:border-emerald-400/60 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-15px_rgba(16,185,129,0.75)] transition-all duration-300 min-w-[230px]"
          >
            <span className="relative grid place-items-center h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white shadow-[0_10px_24px_-8px_rgba(16,185,129,0.7)]">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -inset-0.5 rounded-xl bg-emerald-500/40 blur-md -z-10" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 ring-2 ring-[#0d0a1f] animate-pulse" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-extrabold text-white">WhatsApp</span>
              <span className="block text-[11px] text-white/65 mt-0.5">সরাসরি কথা বলুন</span>
            </span>
          </a>

          {/* Hint */}
          <span className="text-[11px] font-medium text-white/55 mt-1">
            কোনটি পছন্দ করবেন?
          </span>

          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close support"
            className="grid place-items-center h-12 w-12 rounded-full bg-[#0d0a1f]/95 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/5 shadow-[0_15px_40px_-12px_rgba(0,0,0,0.7)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* === Full AI Chat Panel === */}
      {open && tab === "ai" && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(400px,calc(100vw-1.5rem))] h-[min(620px,calc(100vh-1.5rem))] animate-scale-in origin-bottom-right">
          <div className="relative h-full flex flex-col rounded-3xl overflow-hidden border border-white/15 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)] bg-[#070922]/95 backdrop-blur-2xl">
            <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[var(--color-aqua)]/30 blur-3xl" />

            {/* Header */}
            <div className="relative px-5 pt-5 pb-4 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="relative grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 text-white shadow-lg">
                      <Bot className="h-6 w-6" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#070922]">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                    </span>
                  </div>
                  <div className="leading-tight">
                    <div className="text-base font-extrabold text-white">AI Assistant</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-300/95">
                        {loading ? "Typing…" : "Online · এখনই রেসপন্স"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTab("menu")}
                    className="grid place-items-center h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
                    aria-label="Back"
                    title="Back"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid place-items-center h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="grid place-items-center h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/90 max-w-[85%]">
                      আসসালামু আলাইকুম! আমি AccessNow-এর AI সহকারী 🤖
                      <br />
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
                        : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
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
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-3 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="relative border-t border-white/10 p-3 flex items-center gap-2"
            >
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
                className="grid place-items-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 via-primary to-aqua text-white disabled:opacity-40 hover:scale-105 transition shrink-0"
                aria-label="Send"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
