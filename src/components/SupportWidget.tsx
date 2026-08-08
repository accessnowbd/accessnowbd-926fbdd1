import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  MessageCircleMore,
  X,
  Send,
  Bot,
  Loader2,
  User2,
  Headphones,
  ChevronRight,
  Phone,
  ShieldCheck,
  Sparkles,
  Clock,
  Star,
  Zap,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import supportAgent from "@/assets/support-agent.jpg";

const ADMIN_PHONE = "+8801580607614";
const ADMIN_TEL = "tel:+8801580607614";
const AGENT_NAME = "রাফিদ হাসান";
const AGENT_ROLE = "সাপোর্ট স্পেশালিস্ট";

/* Premium palette — ink navy surfaces + single indigo/violet accent + champagne gold */
const INK = "bg-[#080D1C]";
const CARD = "bg-[#101833] hover:bg-[#16204233]";
const CARD_SOLID = "bg-[#101833]";
const GOLD = "text-[#E3C48B]";




type Msg = { role: "user" | "assistant"; content: string };
type Tab = "home" | "ai" | "faq";

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

const FAQS: { q: string; a: string }[] = [
  {
    q: "ডেলিভারি কত সময়ে পাবো?",
    a: "অর্ডার কনফার্ম হওয়ার 5-30 মিনিটের মধ্যে আপনি অ্যাকাউন্ট ইমেইলে / WhatsApp-এ পেয়ে যাবেন।",
  },
  {
    q: "পেমেন্ট মেথড কী কী আছে?",
    a: "BKash, Nagad, Rocket, Upay এবং ব্যাংক ট্রান্সফার — সবগুলোই সাপোর্টেড।",
  },
  {
    q: "ওয়ারেন্টি কেমন থাকে?",
    a: "সব সাবস্ক্রিপশনে ফুল ওয়ারেন্টি — সমস্যা হলে রিপ্লেস বা রিফান্ড নিশ্চিত।",
  },
  {
    q: "কুপন কীভাবে ব্যবহার করব?",
    a: "চেকআউট পেইজে কুপন কোড বসিয়ে Apply চাপুন — ডিসকাউন্ট সাথে সাথেই দেখাবে।",
  },
  {
    q: "অর্ডার ক্যান্সেল করা যায়?",
    a: "ডেলিভারির আগে ক্যান্সেল সম্ভব। ডেলিভারির পরে সমস্যা হলে ওয়ারেন্টির আওতায় সাহায্য করা হবে।",
  },
];

import { useSupportWidgetConfig } from "@/hooks/useSupportWidgetConfig";
import { supabase } from "@/integrations/supabase/client";

const CHAT_SESSION_KEY = "anbd_chat_session_id";
function getChatSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(CHAT_SESSION_KEY);
  if (!id) {
    id =
      (globalThis.crypto?.randomUUID?.() as string | undefined) ??
      `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(CHAT_SESSION_KEY, id);
  }
  return id;
}
async function logChatMessage(role: "user" | "assistant", content: string) {
  try {
    const session_id = getChatSessionId();
    if (!session_id) return;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    const visitor_label =
      user?.email ??
      (user?.user_metadata as { name?: string } | null)?.name ??
      null;
    await supabase.from("live_chat_messages" as any).insert({
      session_id,
      role,
      content: content.slice(0, 4000),
      user_id: user?.id ?? null,
      visitor_label,
    });
  } catch {
    /* non-blocking */
  }
}

export function SupportWidget() {
  const { data: cfg } = useSupportWidgetConfig();
  const [open, setOpen] = useState(false);
  const [chooser, setChooser] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!open && !chooser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setChooser(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, chooser]);

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
      if (acc.trim()) void logChatMessage("assistant", acc);
    }
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    void logChatMessage("user", t);
    void streamReply(next);
  }

  const PANEL =
    "fixed bottom-24 right-5 z-50 w-[min(400px,calc(100vw-1.5rem))] origin-bottom-right";
  const SHELL =
    "relative rounded-[28px] overflow-hidden border border-white/[0.10] bg-[#080D1C] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.95)] ring-1 ring-[#E3C48B]/10";



  return (
    <>
      {/* === Floating launcher === */}
      {true && (
        <div className="support-widget-launcher fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
          {/* Chooser popup */}
          {chooser && (
            <div className="flex flex-col items-stretch gap-2.5 w-[248px] animate-fade-in">
              <button
                onClick={() => { setChooser(false); setOpen(true); setTab("ai"); }}
                className="group relative flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-3.5 py-3 text-left shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] hover:border-violet-300 transition"
              >
                <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_10px_24px_-8px_rgba(139,92,246,0.6)] shrink-0">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="leading-tight">
                  <div className="text-[13px] font-extrabold text-gray-900">AI Support</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">তাৎক্ষণিক উত্তর পান</div>
                </div>
              </button>


              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setChooser(false)}
                className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B1224] px-3.5 py-3 text-left shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] hover:border-[#E3C48B]/45 transition"
              >
                <span className="relative shrink-0">
                  <img
                    src={supportAgent}
                    alt={`${AGENT_NAME} — ${AGENT_ROLE}`}
                    width={816}
                    height={816}
                    loading="lazy"
                    className="h-10 w-10 rounded-xl object-cover ring-1 ring-[#E3C48B]/40"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B1224]" />
                </span>
                <div className="leading-tight">
                  <div className="text-[13px] font-extrabold text-white">মানুষের সাপোর্ট</div>
                  <div className="text-[11px] text-white/60 mt-0.5">{AGENT_NAME} · এখন অনলাইন</div>
                </div>
              </a>

              <div className="text-center text-[11px] text-white/50 mt-1">কোনটি পছন্দ করবেন?</div>
            </div>

          )}

          <button
            onClick={() => {
              if (open) { setOpen(false); setChooser(false); return; }
              setChooser((v) => !v);
            }}
            aria-label={open || chooser ? "Close support" : "Open support"}
            className="support-widget-button relative group hover:scale-110 active:scale-95 transition-transform duration-300"
          >
            {/* Ripple ping waves (only when idle) */}
            {!open && !chooser && (
              <>
                <span className="absolute inset-0 rounded-full bg-white/60 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-white/40 animate-ping [animation-delay:0.6s]" />
              </>
            )}

            {/* Soft ambient glow */}
            <span className="support-widget-glow absolute -inset-4 rounded-full bg-white/30 opacity-60 blur-2xl group-hover:opacity-90 transition-opacity duration-500" />

            {/* Main orb */}
            <span className="support-widget-orb relative grid place-items-center h-16 w-16 rounded-full bg-white text-violet-600 shadow-[0_22px_50px_-14px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-hidden">
              <span className="absolute inset-x-2 top-1.5 h-4 rounded-full bg-white/50 blur-[3px]" />

              {(chooser || open) ? (
                <X className="h-7 w-7 relative" strokeWidth={2.6} />
              ) : (
                <MessageCircleMore className="h-8 w-8 relative" strokeWidth={2.4} />
              )}
            </span>

          </button>



        </div>
      )}

      {/* === HOME TAB === */}
      {open && tab === "home" && (
        <div className={PANEL}>
          <div className={SHELL}>
            {/* Premium hero header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#0F1633_0%,#241A56_55%,#3B2470_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(227,196,139,0.18),transparent_60%)]" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#E3C48B]/50 to-transparent" />

              <div className="relative px-5 pt-5 pb-6">
                <div className="flex items-start justify-between">
                  {/* Human agent + team */}
                  <div className="flex items-center gap-3">
                    <span className="relative shrink-0">
                      <img
                        src={supportAgent}
                        alt={`${AGENT_NAME} — ${AGENT_ROLE}`}
                        width={816}
                        height={816}
                        loading="lazy"
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-[#E3C48B]/60 shadow-[0_10px_26px_-10px_rgba(0,0,0,0.9)]"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#161B3A]" />
                    </span>
                    <div className="leading-tight">
                      <div className="text-[13px] font-extrabold text-white">{AGENT_NAME}</div>
                      <div className={`text-[10.5px] font-semibold ${GOLD}`}>{AGENT_ROLE}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="grid place-items-center h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-4 text-[22px] font-extrabold text-white leading-tight tracking-tight">
                  হ্যালো 👋
                  <br />
                  কীভাবে সাহায্য করব?
                </h2>
                <div className="mt-2.5 flex items-center gap-2 text-[11.5px] font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>24/7 অনলাইন</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/60">
                    <Clock className="h-3 w-3" />
                    ~2 মিনিটে রিপ্লাই
                  </span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative p-3 space-y-3">
              {/* Start a conversation card */}
              <button
                onClick={() => setTab("ai")}
                className="group relative w-full text-left rounded-2xl border border-white/10 bg-[#101833] hover:border-[#E3C48B]/40 hover:bg-[#141D3D] transition-all duration-300 p-3.5 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-center gap-3">
                  <span className="relative grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white shadow-[0_12px_28px_-10px_rgba(99,102,241,0.9)] shrink-0">
                    <MessageCircleMore className="h-5 w-5" />
                  </span>
                  <div className="flex-1 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-extrabold text-white">নতুন কথোপকথন শুরু করুন</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E3C48B]/15 text-[#E3C48B] border border-[#E3C48B]/30">
                        AI
                      </span>
                    </div>
                    <span className="block text-[11.5px] text-white/60 mt-0.5">
                      তাৎক্ষণিক উত্তর — বাংলায়, 24/7
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/45 group-hover:text-[#E3C48B] group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Talk to a human */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101833] hover:bg-[#141D3D] hover:border-[#E3C48B]/40 p-3.5 transition-all text-left"
              >
                <span className="relative shrink-0">
                  <img
                    src={supportAgent}
                    alt={`${AGENT_NAME} — ${AGENT_ROLE}`}
                    width={816}
                    height={816}
                    loading="lazy"
                    className="h-12 w-12 rounded-2xl object-cover ring-1 ring-[#E3C48B]/40"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#101833]" />
                </span>
                <div className="flex-1 leading-tight">
                  <div className="text-[13.5px] font-extrabold text-white">মানুষের সাথে কথা বলুন</div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    {AGENT_NAME} · WhatsApp-এ সরাসরি
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/45 group-hover:text-[#E3C48B] group-hover:translate-x-0.5 transition" />
              </a>

              {/* Call + Help center */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={ADMIN_TEL}
                  className="group rounded-2xl border border-white/10 bg-[#0E1530] hover:bg-[#141D3D] hover:border-[#E3C48B]/35 p-3 transition-all"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/[0.06] border border-white/10 text-[#E3C48B]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div className="mt-2 text-[12.5px] font-extrabold text-white">কল করুন</div>
                  <div className="text-[10.5px] text-white/55 mt-0.5 font-mono">
                    {ADMIN_PHONE}
                  </div>
                </a>

                <button
                  onClick={() => setTab("faq")}
                  className="group text-left rounded-2xl border border-white/10 bg-[#0E1530] hover:bg-[#141D3D] hover:border-[#E3C48B]/35 p-3 transition-all"
                >
                  <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/[0.06] border border-white/10 text-[#E3C48B]">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <div className="mt-2 text-[12.5px] font-extrabold text-white">হেল্প সেন্টার</div>
                  <div className="text-[10.5px] text-white/55 mt-0.5">জনপ্রিয় প্রশ্ন</div>
                </button>
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded-xl border border-white/[0.07] bg-[#0C1226] px-2 py-2 text-center">
                  <Zap className="h-3.5 w-3.5 text-[#E3C48B] mx-auto" />
                  <div className="text-[10px] text-white/55 mt-1">দ্রুত রেসপন্স</div>
                  <div className="text-[11px] font-extrabold text-white">~2 মিনিট</div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#0C1226] px-2 py-2 text-center">
                  <Star className="h-3.5 w-3.5 text-[#E3C48B] mx-auto fill-[#E3C48B]" />
                  <div className="text-[10px] text-white/55 mt-1">রেটিং</div>
                  <div className="text-[11px] font-extrabold text-white">4.9 / 5</div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#0C1226] px-2 py-2 text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 mx-auto" />
                  <div className="text-[10px] text-white/55 mt-1">ভেরিফাইড</div>
                  <div className="text-[11px] font-extrabold text-white">5000+</div>
                </div>

              </div>
            </div>

            {/* Bottom tab bar */}
            <BottomTabs tab={tab} setTab={setTab} />
          </div>
        </div>
      )}

      {/* === FAQ TAB === */}
      {open && tab === "faq" && (
        <div className={PANEL + " h-[min(620px,calc(100vh-1.5rem))]"}>
          <div className={SHELL + " h-full flex flex-col"}>
            <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-[#E3C48B]/10 blur-3xl" />

            <PanelHeader
              title="হেল্প সেন্টার"
              subtitle="জনপ্রিয় প্রশ্নের উত্তর"
              icon={<HelpCircle className="h-5 w-5" />}
              gradient="from-[#3B2470] to-[#241A56]"

              onBack={() => setTab("home")}
              onClose={() => setOpen(false)}
            />

            <div className="relative flex-1 overflow-y-auto p-3 space-y-2">
              {FAQS.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/[0.08] bg-[#101833] overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-[#141D3D] transition"
                    >
                      <span className="grid place-items-center h-7 w-7 rounded-lg bg-[#E3C48B]/12 border border-[#E3C48B]/25 text-[#E3C48B] text-[11px] font-extrabold shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[12.5px] font-bold text-white">{f.q}</span>
                      <ChevronRight
                        className={`h-4 w-4 text-white/45 transition-transform ${
                          isOpen ? "rotate-90 text-[#E3C48B]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pl-[3.25rem] text-[12px] text-white/70 leading-relaxed animate-fade-in">
                        {f.a}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setTab("ai")}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl border border-[#E3C48B]/30 bg-[#E3C48B]/10 hover:bg-[#E3C48B]/16 px-3 py-3 text-[12.5px] font-extrabold text-[#E3C48B] transition"
              >
                আপনার প্রশ্ন খুঁজে পাননি? AI-কে জিজ্ঞাসা করুন
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

            <BottomTabs tab={tab} setTab={setTab} />
          </div>
        </div>
      )}

      {/* === AI CHAT TAB === */}
      {open && tab === "ai" && (
        <div className={PANEL + " h-[min(640px,calc(100vh-1.5rem))]"}>
          <div className={SHELL + " h-full flex flex-col bg-white"}>
            <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-violet-300/15 blur-3xl" />

            <PanelHeader
              title="AI Assistant"
              subtitle={loading ? "লিখছে…" : "অনলাইন · তাৎক্ষণিক রেসপন্স"}
              icon={<Bot className="h-5 w-5" />}
              gradient="from-violet-500 to-violet-700"
              onBack={() => setTab("home")}
              onClose={() => setOpen(false)}
              showOnlineDot
              light
            />




            {/* Messages */}
            <div
              ref={scrollRef}
              className="relative flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-gray-50/80"
            >
              {messages.length === 0 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">
                        AI সহকারী
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed text-gray-900 pl-9">
                      আসসালামু আলাইকুম! 👋
                      <br />
                      <span className="text-gray-500">
                        আমি AccessNow-এর AI সহকারী। প্রোডাক্ট, পেমেন্ট, ডেলিভারি — যেকোনো বিষয়ে জিজ্ঞাসা করুন।
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      জনপ্রিয় প্রশ্ন
                    </div>
                    <div className="grid gap-2">
                      {QUICK_PROMPTS.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="group flex items-center justify-between gap-2 text-left text-[12.5px] px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-violet-300 hover:text-gray-900 transition"
                        >
                          <span>{q}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition" />
                        </button>
                      ))}
                    </div>
                  </div>




                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[11px] text-emerald-700">
                      100% সিকিউর — আপনার মেসেজ এনক্রিপ্টেড
                    </span>
                  </div>
                </div>
              )}



              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white border border-gray-200 px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-900 whitespace-pre-wrap shadow-[0_12px_28px_-14px_rgba(0,0,0,0.08)]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white">
                        <Bot className="h-3 w-3" />
                      </span>
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-violet-600/80">
                        AI
                      </span>
                    </div>
                    <div className="pl-8 text-[13.5px] leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {m.content || (loading ? "…" : "")}
                    </div>
                  </div>
                ),
              )}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-2 pl-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce" />
                  <span className="text-[11px] text-gray-400 ml-1">ভাবছি…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="relative border-t border-gray-200 bg-white p-3"
            >
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition pl-4 pr-1.5 py-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="আপনার মেসেজ লিখুন…"
                  className="flex-1 h-9 bg-transparent outline-none text-[13px] text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="grid place-items-center h-9 w-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 transition shrink-0 shadow-[0_8px_20px_-6px_rgba(139,92,246,0.5)]"
                  aria-label="Send"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  Powered by AI · বাংলায় সাপোর্টেড
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

function PanelHeader({
  title,
  subtitle,
  icon,
  gradient,
  onBack,
  onClose,
  showOnlineDot,
  light,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onBack: () => void;
  onClose: () => void;
  showOnlineDot?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`relative px-4 pt-4 pb-3.5 border-b flex items-center gap-2.5 ${light ? "border-gray-200 bg-white" : "border-white/10 bg-[linear-gradient(135deg,#0F1633,#1C1848)]"}`}>
      <button
        onClick={onBack}
        className={`grid place-items-center h-8 w-8 rounded-full transition shrink-0 ${light ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100" : "text-white/70 hover:text-white hover:bg-white/10"}`}
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="relative shrink-0">
        <div
          className={`grid place-items-center h-10 w-10 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg ring-1 ${light ? "ring-violet-200" : "ring-[#E3C48B]/25"}`}
        >
          {icon}
        </div>
        {showOnlineDot && (
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ${light ? "ring-white" : "ring-[#0F1633]"}`}>
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
          </span>
        )}
      </div>

      <div className="flex-1 leading-tight min-w-0">
        <div className={`text-[14.5px] font-extrabold truncate ${light ? "text-gray-900" : "text-white"}`}>{title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {showOnlineDot && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className={`text-[11px] font-semibold truncate ${light ? "text-gray-500" : "text-white/70"}`}>{subtitle}</span>
        </div>
      </div>
      <button
        onClick={onClose}
        className={`grid place-items-center h-8 w-8 rounded-full transition shrink-0 ${light ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100" : "text-white/70 hover:text-white hover:bg-white/10"}`}
        aria-label="Close"
      >

        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function BottomTabs({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "হোম", icon: <Headphones className="h-4 w-4" /> },
    { id: "ai", label: "চ্যাট", icon: <MessageCircleMore className="h-4 w-4" /> },
    { id: "faq", label: "হেল্প", icon: <HelpCircle className="h-4 w-4" /> },
  ];
  return (
    <div className="relative border-t border-white/10 bg-[#0B1122] grid grid-cols-3">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-bold transition ${
              active ? "text-[#E3C48B]" : "text-white/55 hover:text-white/80"
            }`}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#E3C48B]" />
            )}

            {it.icon}
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
