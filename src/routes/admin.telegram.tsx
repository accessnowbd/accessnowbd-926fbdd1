import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Send, Loader2, RefreshCw, Eye, EyeOff, CheckCircle2, XCircle,
  Link as LinkIcon, Pin, ChevronDown, ChevronUp, ListChecks, MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPublicOrigin } from "@/lib/public-origin";
import { useServerFn } from "@tanstack/react-start";
import {
  sendTelegramTest, registerTelegramWebhook, getTelegramWebhookInfo,
} from "@/lib/telegram/notify.functions";

export const Route = createFileRoute("/admin/telegram")({
  component: TelegramAdminPage,
  head: () => ({
    meta: [
      { title: "Telegram Bot — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const DEFAULT_ORDER_TEMPLATE =
  `🆕 <b>নতুন অর্ডার!</b>
📋 Order: <code>{{order_id}}</code>
🕒 {{time}}

👤 <b>Customer</b>
Name: {{customer}}
Phone: {{phone}}
Email: {{email}}

📦 <b>Items ({{items_count}})</b>
{{items}}

💵 <b>Payment</b>
Subtotal: ৳{{subtotal}}
Discount: ৳{{discount}} ({{coupon}})
Wallet: ৳{{wallet}}
<b>Total: ৳{{total}}</b>
Method: {{payment_method}}
Sender: {{sender_number}}
TxID: <code>{{transaction_id}}</code>

🔗 <a href="{{admin_url}}">Admin panel-এ দেখুন</a>`;

function TelegramAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [chatId, setChatId] = useState("");
  const [orderTemplate, setOrderTemplate] = useState(DEFAULT_ORDER_TEMPLATE);
  const [showToken, setShowToken] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [initial, setInitial] = useState({ enabled: false, chatId: "", template: DEFAULT_ORDER_TEMPLATE });
  const [botInfo, setBotInfo] = useState<{ me?: any; info?: any; error?: string } | null>(null);
  const [log, setLog] = useState<any[]>([]);

  const testFn = useServerFn(sendTelegramTest);
  const registerFn = useServerFn(registerTelegramWebhook);
  const infoFn = useServerFn(getTelegramWebhookInfo);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: settings }, { data: logData }] = await Promise.all([
      supabase.from("telegram_settings").select("*").eq("kind", "order_bot").maybeSingle(),
      supabase.from("telegram_notifications_log").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    const row = settings as any;
    if (row) {
      const cfg = row.config || {};
      const firstChat = Array.isArray(cfg.admin_chat_ids) && cfg.admin_chat_ids.length
        ? String(cfg.admin_chat_ids[0]) : "";
      const tpl = cfg.templates?.order_created || DEFAULT_ORDER_TEMPLATE;
      setEnabled(!!row.enabled);
      setChatId(firstChat);
      setOrderTemplate(tpl);
      setInitial({ enabled: !!row.enabled, chatId: firstChat, template: tpl });
    }
    setLog((logData as any[]) || []);
    setLoading(false);
    infoFn({ data: {} }).then((r: any) => {
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
      else setBotInfo({ error: r?.error || "not connected" });
    }).catch((e) => setBotInfo({ error: String(e?.message || e) }));
  }, [infoFn]);

  useEffect(() => { void load(); }, [load]);

  const dirty = useMemo(() =>
    enabled !== initial.enabled
    || chatId.trim() !== initial.chatId
    || orderTemplate !== initial.template
  , [enabled, chatId, orderTemplate, initial]);

  const tokenConfigured = botInfo?.me && !botInfo?.error;
  const webhookOk = tokenConfigured && botInfo?.info?.url;

  const save = async () => {
    setSaving(true);
    const trimmed = chatId.trim();
    const arr = trimmed
      ? [/^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed]
      : [];
    // Read current config to preserve other event templates
    const { data: row } = await supabase.from("telegram_settings")
      .select("config").eq("kind", "order_bot").maybeSingle();
    const cfg: any = (row as any)?.config || {};
    const nextCfg = {
      ...cfg,
      admin_chat_ids: arr,
      templates: { ...(cfg.templates || {}), order_created: orderTemplate },
      events: { ...(cfg.events || {}), order_created: true },
    };
    const { error } = await supabase.from("telegram_settings")
      .update({ enabled, config: nextCfg as never })
      .eq("kind", "order_bot");
    setSaving(false);
    if (error) return toast.error(error.message);
    setInitial({ enabled, chatId: trimmed, template: orderTemplate });
    toast.success("সেভ হয়েছে");
  };

  const sendTest = async () => {
    const trimmed = chatId.trim();
    if (!trimmed) return toast.error("Chat ID দিন");
    if (!tokenConfigured) return toast.error("Bot Token setup করুন");
    setTesting(true);
    try {
      const cid = /^-?\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
      await testFn({ data: { chat_id: cid, text: "✅ AccessNow BD — Test message. Order notification setup ঠিক আছে।" } });
      toast.success(`Test পাঠানো হয়েছে → ${trimmed}`);
    } catch (e: any) { toast.error(e.message || "Test failed"); }
    finally { setTesting(false); }
  };

  const registerWebhook = async () => {
    setRegistering(true);
    try {
      const url = `${getPublicOrigin()}/api/public/telegram/webhook`;
      // Register BOTH bots on the same webhook URL — endpoint dispatches by secret token
      await registerFn({ data: { url, kind: "order_bot" } }).catch(() => null);
      await registerFn({ data: { url, kind: "store_bot" } }).catch(() => null);
      toast.success("Webhook registered (order + store bot)");
      const r: any = await infoFn({ data: {} });
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setRegistering(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Main setup card */}
      <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-white to-violet-50/40 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-violet-100 bg-white/60">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-violet-100 grid place-items-center text-violet-600">
              <Send className="w-5 h-5 -rotate-12" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Telegram অর্ডার নোটিফিকেশন</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 accent-violet-600" />
              <span className={`text-xs font-bold ${enabled ? "text-emerald-700" : "text-slate-500"}`}>
                {enabled ? "Active" : "Off"}
              </span>
            </label>
            <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Reload">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <p className="text-xs text-slate-500 mb-5">নতুন অর্ডার এলে Telegram-এ ইনস্ট্যান্ট নোটিফিকেশন</p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Bot Token */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Telegram Bot Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  readOnly
                  value={tokenConfigured
                    ? (showToken ? `@${botInfo.me.username} — configured securely` : "•".repeat(38))
                    : ""}
                  placeholder="123456:ABC-..."
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <button type="button" onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                {tokenConfigured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Connected: @{botInfo.me.username}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-rose-600 font-semibold">Bot token setup করুন (secret হিসেবে save)</span>
                  </>
                )}
              </div>
            </div>

            {/* Chat ID + Test */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Chat ID</label>
              <div className="flex gap-2">
                <input
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="-1001234567890 অথবা 123456789"
                  className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
                <button
                  onClick={sendTest}
                  disabled={testing || !chatId.trim() || !tokenConfigured}
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -rotate-12" />}
                  টেস্ট
                </button>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer"
                  className="text-violet-600 font-semibold hover:underline">@userinfobot</a> থেকে Chat ID নিন
              </div>
            </div>
          </div>

          {/* Save row */}
          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {webhookOk
                ? <span className="text-emerald-700">✓ Webhook registered</span>
                : tokenConfigured
                  ? <button onClick={registerWebhook} disabled={registering}
                      className="inline-flex items-center gap-1.5 text-violet-700 font-semibold hover:underline disabled:opacity-50">
                      {registering ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                      Webhook register করুন
                    </button>
                  : null}
            </div>
            <button onClick={save} disabled={!dirty || saving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {dirty ? "Save" : "Saved"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mx-5 mb-5 rounded-xl border border-cyan-200 bg-cyan-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <Pin className="w-4 h-4 text-rose-500" /> কিভাবে সেট আপ করবেন:
          </div>
          <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
            <li>Telegram-এ <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-bold text-violet-700 hover:underline">@BotFather</a>-এর সাথে চ্যাট করে নতুন বট তৈরি করুন → Bot Token পাবেন</li>
            <li>আপনার বটকে যে গ্রুপ/চ্যানেলে অ্যাড করেছেন সেটার Chat ID নিন (<a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="font-bold text-violet-700 hover:underline">@userinfobot</a>)</li>
            <li>উপরে দুটো বসিয়ে <b>"টেস্ট"</b> ক্লিক করুন</li>
          </ol>
        </div>
      </div>

      {/* Advanced (collapsible) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50"
        >
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" /> Advanced — Template & Log
          </span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="px-5 py-4 border-t border-slate-100 space-y-5">
            {/* Template editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Order Created Template</label>
                <button
                  onClick={() => setOrderTemplate(DEFAULT_ORDER_TEMPLATE)}
                  className="text-[11px] text-violet-600 font-semibold hover:underline"
                >
                  Reset to default
                </button>
              </div>
              <textarea
                value={orderTemplate}
                onChange={(e) => setOrderTemplate(e.target.value)}
                rows={16}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
              <div className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                Variables: <code>{"{{order_id}}"}</code>, <code>{"{{customer}}"}</code>, <code>{"{{phone}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{items}}"}</code>, <code>{"{{items_count}}"}</code>, <code>{"{{subtotal}}"}</code>, <code>{"{{discount}}"}</code>, <code>{"{{coupon}}"}</code>, <code>{"{{wallet}}"}</code>, <code>{"{{total}}"}</code>, <code>{"{{payment_method}}"}</code>, <code>{"{{sender_number}}"}</code>, <code>{"{{transaction_id}}"}</code>, <code>{"{{admin_url}}"}</code>, <code>{"{{time}}"}</code>. HTML tags allowed: <code>&lt;b&gt;</code>, <code>&lt;code&gt;</code>, <code>&lt;a href&gt;</code>.
              </div>
            </div>

            {/* Log */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-4 h-4 text-slate-500" />
                <label className="text-xs font-bold text-slate-700">Recent notifications ({log.length})</label>
              </div>
              {log.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  এখনো কোনো notification পাঠানো হয়নি
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="text-left px-3 py-2">Event</th>
                        <th className="text-left px-3 py-2">Chat</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono">{r.event}</td>
                          <td className="px-3 py-2 font-mono">{r.chat_id}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}>{r.status}</span>
                          </td>
                          <td className="px-3 py-2 text-slate-500">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
