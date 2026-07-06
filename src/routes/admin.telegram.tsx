import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot, Save, Loader2, RefreshCw, ExternalLink, Layers, Bell, ShoppingBag,
  Users, ListChecks, Eye, Plus, Trash2, Send, Wand2, Sparkles, CheckCircle2, XCircle, Link as LinkIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { sendTelegramTest, registerTelegramWebhook, getTelegramWebhookInfo } from "@/lib/telegram/notify.functions";

export const Route = createFileRoute("/admin/telegram")({
  component: TelegramAdminPage,
  head: () => ({
    meta: [
      { title: "Telegram Bot — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type EventKey =
  | "order_created" | "order_paid" | "order_shipped" | "order_completed"
  | "order_cancelled" | "order_refunded" | "abandoned_checkout"
  | "low_stock" | "new_review";

const EVENT_LABELS: Record<EventKey, string> = {
  order_created: "🆕 নতুন অর্ডার",
  order_paid: "✅ পেমেন্ট পাওয়া গেছে",
  order_shipped: "🚚 শিপ করা হয়েছে",
  order_completed: "🎉 কমপ্লিট",
  order_cancelled: "❌ ক্যানসেল",
  order_refunded: "↩️ রিফান্ড",
  abandoned_checkout: "🛒 কার্ট ছেড়ে গেছে",
  low_stock: "⚠️ কম স্টক",
  new_review: "⭐ নতুন রিভিউ",
};

const ALL_EVENTS: EventKey[] = Object.keys(EVENT_LABELS) as EventKey[];

type OrderBotCfg = {
  admin_chat_ids: (string | number)[];
  events: Record<EventKey, boolean>;
  templates: Record<EventKey, string>;
};
type StoreBotCfg = {
  welcome_message: string;
  browse_mode: "all" | "featured";
  per_page: number;
  checkout_mode: "inline" | "link_only";
  buy_link_fallback: string;
  closed_message: string;
};

const DEFAULT_ORDER: OrderBotCfg = {
  admin_chat_ids: [],
  events: Object.fromEntries(ALL_EVENTS.map((e) => [e, true])) as Record<EventKey, boolean>,
  templates: Object.fromEntries(ALL_EVENTS.map((e) => [e, ""])) as Record<EventKey, string>,
};
const DEFAULT_STORE: StoreBotCfg = {
  welcome_message: "👋 স্বাগতম!",
  browse_mode: "featured",
  per_page: 5,
  checkout_mode: "inline",
  buy_link_fallback: "https://accessnowbd.com/product/{{slug}}",
  closed_message: "Store এখন বন্ধ আছে।",
};

type TabKey = "overview" | "order" | "store" | "subscribers" | "log" | "preview";

function TelegramAdminPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [orderEnabled, setOrderEnabled] = useState(false);
  const [orderCfg, setOrderCfg] = useState<OrderBotCfg>(DEFAULT_ORDER);
  const [orderInitial, setOrderInitial] = useState({ enabled: false, cfg: DEFAULT_ORDER });

  const [storeEnabled, setStoreEnabled] = useState(false);
  const [storeCfg, setStoreCfg] = useState<StoreBotCfg>(DEFAULT_STORE);
  const [storeInitial, setStoreInitial] = useState({ enabled: false, cfg: DEFAULT_STORE });

  const [subs, setSubs] = useState<any[]>([]);
  const [log, setLog] = useState<any[]>([]);
  const [botInfo, setBotInfo] = useState<{ me?: any; info?: any; error?: string } | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  const testFn = useServerFn(sendTelegramTest);
  const registerFn = useServerFn(registerTelegramWebhook);
  const infoFn = useServerFn(getTelegramWebhookInfo);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: settings }, { data: subsData }, { data: logData }] = await Promise.all([
      supabase.from("telegram_settings").select("*"),
      supabase.from("telegram_subscribers").select("*").order("last_seen_at", { ascending: false }).limit(200),
      supabase.from("telegram_notifications_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const order = (settings as any[])?.find((r) => r.kind === "order_bot");
    const store = (settings as any[])?.find((r) => r.kind === "store_bot");
    if (order) {
      const merged = { ...DEFAULT_ORDER, ...(order.config || {}) };
      // ensure all events present
      merged.events = { ...DEFAULT_ORDER.events, ...(merged.events || {}) };
      merged.templates = { ...DEFAULT_ORDER.templates, ...(merged.templates || {}) };
      setOrderCfg(merged);
      setOrderEnabled(!!order.enabled);
      setOrderInitial({ enabled: !!order.enabled, cfg: merged });
    }
    if (store) {
      const merged = { ...DEFAULT_STORE, ...(store.config || {}) };
      setStoreCfg(merged);
      setStoreEnabled(!!store.enabled);
      setStoreInitial({ enabled: !!store.enabled, cfg: merged });
    }
    setSubs((subsData as any[]) || []);
    setLog((logData as any[]) || []);
    setLoading(false);

    // Bot info (non-blocking)
    infoFn({}).then((r: any) => {
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
      else setBotInfo({ error: r?.error || "not connected" });
    }).catch((e) => setBotInfo({ error: String(e?.message || e) }));
  }, [infoFn]);

  useEffect(() => { void load(); }, [load]);

  const dirty = useMemo(() =>
    JSON.stringify({ orderEnabled, orderCfg, storeEnabled, storeCfg })
    !== JSON.stringify({
      orderEnabled: orderInitial.enabled, orderCfg: orderInitial.cfg,
      storeEnabled: storeInitial.enabled, storeCfg: storeInitial.cfg,
    }), [orderEnabled, orderCfg, storeEnabled, storeCfg, orderInitial, storeInitial]);

  const save = async () => {
    setSaving(true);
    const { error: e1 } = await supabase.from("telegram_settings")
      .update({ enabled: orderEnabled, config: orderCfg as never })
      .eq("kind", "order_bot");
    const { error: e2 } = await supabase.from("telegram_settings")
      .update({ enabled: storeEnabled, config: storeCfg as never })
      .eq("kind", "store_bot");
    setSaving(false);
    if (e1 || e2) return toast.error(e1?.message || e2?.message || "Save failed");
    setOrderInitial({ enabled: orderEnabled, cfg: orderCfg });
    setStoreInitial({ enabled: storeEnabled, cfg: storeCfg });
    toast.success("Telegram settings saved");
  };

  const runAi = async (kind: string, system: string, input: string, apply: (t: string) => void) => {
    setAiBusy(kind);
    try {
      const res = await fetch("/api/ai-command", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, input, temperature: 0.8, maxTokens: 500 }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "AI failed");
      apply((j.text || "").trim());
      toast.success("AI দিয়ে জেনারেট হয়েছে");
    } catch (e: any) { toast.error(e.message); }
    finally { setAiBusy(null); }
  };

  const registerWebhook = async () => {
    const url = `${window.location.origin}/api/public/telegram/webhook`;
    try {
      await registerFn({ data: { url } });
      toast.success("Webhook registered");
      const r: any = await infoFn({});
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
    } catch (e: any) { toast.error(e.message); }
  };

  const sendTest = async () => {
    const chatId = orderCfg.admin_chat_ids[0];
    if (!chatId) return toast.error("প্রথমে একটা admin chat_id add করুন");
    try {
      await testFn({ data: { chat_id: chatId, text: "✅ Test message from admin panel" } });
      toast.success(`Sent to ${chatId}`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-600" />
            Telegram Bot
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Website-এর সব order + storefront Telegram-এ live। Order Bot admin-দের notification পাঠাবে (WooCommerce-এর মত), Store Bot customer-দের product দেখাবে + কেনার সুযোগ দিবে।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm">
            <ExternalLink className="w-4 h-4" /> BotFather
          </a>
          <button onClick={load} disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Reload
          </button>
          <button onClick={save} disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["overview", "Overview", Layers],
              ["order", "Order Bot", Bell],
              ["store", "Store Bot", ShoppingBag],
              ["subscribers", `Subscribers (${subs.length})`, Users],
              ["log", "Notification Log", ListChecks],
              ["preview", "Preview", Eye],
            ] as const
          ).map(([k, label, Icon]) => {
            const active = tab === k;
            return (
              <button key={k} onClick={() => setTab(k as TabKey)}
                className={`inline-flex items-center gap-2 px-4 h-10 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition ${
                  active ? "border-sky-500 text-sky-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      ) : tab === "overview" ? (
        <OverviewTab
          botInfo={botInfo}
          orderEnabled={orderEnabled} setOrderEnabled={setOrderEnabled}
          storeEnabled={storeEnabled} setStoreEnabled={setStoreEnabled}
          subsCount={subs.length}
          logCount={log.length}
          onRegister={registerWebhook}
          onTest={sendTest}
        />
      ) : tab === "order" ? (
        <OrderBotTab cfg={orderCfg} setCfg={setOrderCfg} aiBusy={aiBusy} runAi={runAi} />
      ) : tab === "store" ? (
        <StoreBotTab cfg={storeCfg} setCfg={setStoreCfg} aiBusy={aiBusy} runAi={runAi} />
      ) : tab === "subscribers" ? (
        <SubscribersTab subs={subs} reload={load} />
      ) : tab === "log" ? (
        <LogTab log={log} />
      ) : (
        <PreviewTab orderCfg={orderCfg} storeCfg={storeCfg} />
      )}
    </div>
  );
}

/* ================== TABS ================== */

function OverviewTab({
  botInfo, orderEnabled, setOrderEnabled, storeEnabled, setStoreEnabled,
  subsCount, logCount, onRegister, onTest,
}: any) {
  const connected = botInfo?.me && !botInfo?.error;
  const hasWebhook = botInfo?.info?.url;
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" /> Connection status
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Bot connected থাকলে এখানে name দেখাবে। Webhook register করলে Telegram থেকে message আসতে শুরু করবে।
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          {connected ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-500 mt-0.5" />}
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">
              {connected ? `Connected: @${botInfo.me.username}` : "Bot not connected"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {connected
                ? (hasWebhook ? `Webhook: ${botInfo.info.url}` : "Webhook not registered yet")
                : (botInfo?.error || "TELEGRAM_BOT_TOKEN secret নেই। @BotFather থেকে bot বানিয়ে token add করুন।")}
            </div>
          </div>
          <button onClick={onRegister}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800">
            <LinkIcon className="w-3.5 h-3.5" /> Register webhook
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <BotToggleCard
          title="Order Management Bot" desc="নতুন order/payment/status change হলে admin chat-এ notification"
          icon={<Bell className="w-5 h-5" />} tint="from-orange-500 to-amber-500"
          enabled={orderEnabled} setEnabled={setOrderEnabled}
        />
        <BotToggleCard
          title="Storefront Bot" desc="Customer Telegram-এ product browse ও কিনতে পারবে"
          icon={<ShoppingBag className="w-5 h-5" />} tint="from-emerald-500 to-teal-600"
          enabled={storeEnabled} setEnabled={setStoreEnabled}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="Subscribers" value={String(subsCount)} />
        <StatCard label="Notifications sent" value={String(logCount)} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Quick action</div>
            <div className="text-sm font-bold text-slate-900 mt-1">Test message</div>
          </div>
          <button onClick={onTest}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700">
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

function BotToggleCard({ title, desc, icon, tint, enabled, setEnabled }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tint} grid place-items-center text-white`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900">{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-sky-600" />
          <span className={`text-xs font-semibold ${enabled ? "text-emerald-700" : "text-slate-500"}`}>{enabled ? "Active" : "Off"}</span>
        </label>
      </div>
    </div>
  );
}

function OrderBotTab({ cfg, setCfg, aiBusy, runAi }: {
  cfg: OrderBotCfg; setCfg: (c: OrderBotCfg) => void;
  aiBusy: string | null; runAi: (kind: string, sys: string, input: string, apply: (t: string) => void) => void;
}) {
  const [newChat, setNewChat] = useState("");
  const addChat = () => {
    const v = newChat.trim();
    if (!v) return;
    if (cfg.admin_chat_ids.some((c) => String(c) === v)) return toast.error("Already added");
    setCfg({ ...cfg, admin_chat_ids: [...cfg.admin_chat_ids, /^\d+$/.test(v) ? Number(v) : v] });
    setNewChat("");
  };

  return (
    <div className="space-y-5">
      <Panel title="Admin Chat IDs" icon={<Users className="w-4 h-4 text-orange-600" />}>
        <p className="text-xs text-slate-500 mb-3">
          Telegram-এ bot-কে <code className="px-1 bg-slate-100 rounded">/id</code> command পাঠিয়ে chat_id নিন, তারপর এখানে add করুন। একাধিক admin add করতে পারেন।
        </p>
        <div className="flex gap-2 mb-3">
          <input value={newChat} onChange={(e) => setNewChat(e.target.value)} placeholder="123456789"
            onKeyDown={(e) => e.key === "Enter" && addChat()}
            className="flex-1 h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          <button onClick={addChat}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cfg.admin_chat_ids.map((id, i) => (
            <span key={i} className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-slate-100 text-sm font-mono text-slate-800">
              {id}
              <button onClick={() => setCfg({ ...cfg, admin_chat_ids: cfg.admin_chat_ids.filter((_, j) => j !== i) })}
                className="text-rose-600 hover:text-rose-700">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {cfg.admin_chat_ids.length === 0 && <span className="text-xs text-slate-400">কোনো admin chat নেই।</span>}
        </div>
      </Panel>

      <Panel title="Events" icon={<Bell className="w-4 h-4 text-orange-600" />}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ALL_EVENTS.map((e) => (
            <label key={e} className="flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={!!cfg.events[e]}
                onChange={(ev) => setCfg({ ...cfg, events: { ...cfg.events, [e]: ev.target.checked } })}
                className="h-4 w-4 accent-orange-500" />
              <span className="text-sm text-slate-800">{EVENT_LABELS[e]}</span>
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Message Templates" icon={<Wand2 className="w-4 h-4 text-orange-600" />}>
        <p className="text-[11px] text-slate-500 mb-3">
          HTML supported: <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;code&gt;</code>. Placeholders:{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{order_id}}"}</code>{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{customer}}"}</code>{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{total}}"}</code>{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{items}}"}</code>
        </p>
        <div className="grid gap-3">
          {ALL_EVENTS.map((e) => (
            <div key={e} className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">{EVENT_LABELS[e]}</span>
                <button
                  disabled={aiBusy === `tpl:${e}`}
                  onClick={() => runAi(
                    `tpl:${e}`,
                    "You write short, punchy Telegram admin-notification templates. Use Bangla + light emoji, HTML tags (<b>, <i>). Return ONE line, under 200 chars, no quotes, no preamble. Use placeholders like {{order_id}} {{customer}} {{total}} {{items}} where appropriate.",
                    `Event: ${EVENT_LABELS[e]}`,
                    (t) => setCfg({ ...cfg, templates: { ...cfg.templates, [e]: t } }),
                  )}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-semibold disabled:opacity-60">
                  {aiBusy === `tpl:${e}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI
                </button>
              </div>
              <textarea rows={2} value={cfg.templates[e] || ""}
                onChange={(ev) => setCfg({ ...cfg, templates: { ...cfg.templates, [e]: ev.target.value } })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StoreBotTab({ cfg, setCfg, aiBusy, runAi }: {
  cfg: StoreBotCfg; setCfg: (c: StoreBotCfg) => void;
  aiBusy: string | null; runAi: (kind: string, sys: string, input: string, apply: (t: string) => void) => void;
}) {
  return (
    <div className="space-y-5">
      <Panel
        title="Welcome Message"
        icon={<Wand2 className="w-4 h-4 text-emerald-600" />}
        action={
          <button disabled={aiBusy === "welcome"}
            onClick={() => runAi("welcome",
              "You write a warm Telegram bot welcome message in Bangla for an e-commerce store. Use HTML (<b>). Under 400 chars. Mention /browse /cart /orders /help commands. No quotes.",
              "AccessNow BD — digital subscriptions store in Bangladesh",
              (t) => setCfg({ ...cfg, welcome_message: t }))}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold disabled:opacity-60">
            {aiBusy === "welcome" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI দিয়ে লিখুন
          </button>
        }>
        <textarea rows={5} value={cfg.welcome_message}
          onChange={(e) => setCfg({ ...cfg, welcome_message: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300" />
      </Panel>

      <Panel title="Catalog & Checkout" icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Browse mode</span>
            <select value={cfg.browse_mode} onChange={(e) => setCfg({ ...cfg, browse_mode: e.target.value as any })}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="featured">Featured only (badge আছে যেগুলোর)</option>
              <option value="all">All active products</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Per page</span>
            <input type="number" min={1} max={10} value={cfg.per_page}
              onChange={(e) => setCfg({ ...cfg, per_page: Number(e.target.value) || 5 })}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">Checkout mode</span>
            <select value={cfg.checkout_mode} onChange={(e) => setCfg({ ...cfg, checkout_mode: e.target.value as any })}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="inline">Inline (Telegram-এ full checkout — COD)</option>
              <option value="link_only">Link only (button-এ click করলে website-এ যাবে)</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700">Fallback buy link (uses {"{{slug}}"})</span>
            <input value={cfg.buy_link_fallback}
              onChange={(e) => setCfg({ ...cfg, buy_link_fallback: e.target.value })}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm font-mono" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-slate-700">Closed message (bot off থাকলে)</span>
            <input value={cfg.closed_message}
              onChange={(e) => setCfg({ ...cfg, closed_message: e.target.value })}
              className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm" />
          </label>
        </div>
      </Panel>
    </div>
  );
}

function SubscribersTab({ subs, reload }: { subs: any[]; reload: () => void }) {
  const toggleBlock = async (id: string, is_blocked: boolean) => {
    const { error } = await supabase.from("telegram_subscribers").update({ is_blocked: !is_blocked }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(is_blocked ? "Unblocked" : "Blocked");
    reload();
  };
  const setRole = async (id: string, role: string) => {
    const { error } = await supabase.from("telegram_subscribers").update({ role }).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };
  return (
    <Panel title={`Subscribers (${subs.length})`} icon={<Users className="w-4 h-4 text-sky-600" />}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Chat ID</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Username</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Last seen</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-mono text-xs">{s.chat_id}</td>
                <td className="py-2 pr-3">{[s.first_name, s.last_name].filter(Boolean).join(" ") || "—"}</td>
                <td className="py-2 pr-3 text-slate-500">{s.username ? `@${s.username}` : "—"}</td>
                <td className="py-2 pr-3">
                  <select value={s.role} onChange={(e) => setRole(s.id, e.target.value)}
                    className="h-7 rounded-md border border-slate-200 px-2 text-xs">
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-2 pr-3 text-xs text-slate-500">{new Date(s.last_seen_at).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right">
                  <button onClick={() => toggleBlock(s.id, s.is_blocked)}
                    className={`h-7 px-2 rounded-md text-xs font-semibold ${s.is_blocked ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                    {s.is_blocked ? "Blocked" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">এখনো কোনো subscriber নেই।</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LogTab({ log }: { log: any[] }) {
  return (
    <Panel title="Notification Log (last 100)" icon={<ListChecks className="w-4 h-4 text-sky-600" />}>
      <div className="grid gap-2">
        {log.map((l) => (
          <div key={l.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            {l.status === "sent" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{l.event}</div>
              <div className="text-[11px] text-slate-500 truncate">{l.error || JSON.stringify(l.payload)}</div>
            </div>
            <div className="text-[11px] text-slate-400 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</div>
          </div>
        ))}
        {log.length === 0 && <div className="text-sm text-slate-400 text-center py-8">কোনো log নেই।</div>}
      </div>
    </Panel>
  );
}

function PreviewTab({ orderCfg, storeCfg }: { orderCfg: OrderBotCfg; storeCfg: StoreBotCfg }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Panel title="Order notification preview" icon={<Bell className="w-4 h-4 text-orange-600" />}>
        <TelegramMock text={fillDemo(orderCfg.templates.order_created || "🆕 New Order #{{order_id}}")} />
      </Panel>
      <Panel title="Store welcome preview" icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}>
        <TelegramMock text={storeCfg.welcome_message.replace(/%0A/g, "\n")} />
      </Panel>
    </div>
  );
}

function fillDemo(t: string) {
  return t.replace(/%0A/g, "\n")
    .replace(/\{\{\s*order_id\s*\}\}/g, "ANB-A1B2C3D4")
    .replace(/\{\{\s*customer\s*\}\}/g, "রিয়াদ আহমেদ")
    .replace(/\{\{\s*total\s*\}\}/g, "1250")
    .replace(/\{\{\s*items\s*\}\}/g, "Netflix×1, Spotify×2");
}

function TelegramMock({ text }: { text: string }) {
  return (
    <div className="bg-[#e5ddd5] p-4 rounded-2xl">
      <div className="max-w-sm rounded-2xl rounded-tl-sm bg-white shadow p-3">
        <div className="text-[10px] font-bold text-sky-600 mb-1">AccessNow BD Bot</div>
        <div className="text-sm text-slate-800 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: text.replace(/</g, "&lt;").replace(/&lt;(\/?[bi])&gt;/g, "<$1>") }} />
        <div className="text-[10px] text-slate-400 text-right mt-1">now ✓✓</div>
      </div>
    </div>
  );
}

/* ---------- Primitives ---------- */

function Panel({ title, icon, action, children }: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">{icon}{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
