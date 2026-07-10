import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot, Loader2, RefreshCw, CheckCircle2, XCircle, Save, Send,
  Link as LinkIcon, ShoppingBag, MessageSquare, CreditCard, Settings, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  registerTelegramWebhook, getTelegramWebhookInfo, sendTelegramTest,
} from "@/lib/telegram/notify.functions";

export const Route = createFileRoute("/admin/telegram-store")({
  component: StoreBotAdminPage,
  head: () => ({
    meta: [
      { title: "Store Bot — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const DEFAULT_WELCOME =
  `👋 স্বাগতম <b>AccessNow BD</b>-তে!

আমাদের সকল প্রোডাক্ট এখন Telegram থেকেই অর্ডার করতে পারবেন।

🛍️ /browse — প্রোডাক্ট ব্রাউজ করুন
🔍 যেকোনো নাম লিখলে সার্চ করবে
🛒 /cart — কার্ট দেখুন
📦 /orders — আপনার অর্ডার
❓ /help — সাহায্য`;

const DEFAULT_CONFIRM =
  `✅ <b>অর্ডার নিশ্চিত হয়েছে!</b>

Order ID: <code>{{order_id}}</code>
Total: {{currency}}{{total}}
Payment: {{payment_method}}

আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।`;

type Cfg = {
  welcome_message: string;
  closed_message: string;
  order_confirmed_template: string;
  browse_mode: "featured" | "all";
  per_page: number;
  currency: string;
  show_price: boolean;
  show_stock: boolean;
  buy_link_fallback: string;
  contact_link: string;
  categories_filter: string[];
  payment_methods: string[]; // cod, bkash, nagad, wallet
  menu_labels: { browse: string; cart: string; orders: string; help: string };
  notify_admin_on_order: boolean;
};

const DEFAULTS: Cfg = {
  welcome_message: DEFAULT_WELCOME,
  closed_message: "🚫 দুঃখিত, দোকান বর্তমানে বন্ধ। পরে চেষ্টা করুন।",
  order_confirmed_template: DEFAULT_CONFIRM,
  browse_mode: "featured",
  per_page: 5,
  currency: "৳",
  show_price: true,
  show_stock: true,
  buy_link_fallback: "https://accessnowbd.com/product/{{slug}}",
  contact_link: "https://t.me/accessnowbd",
  categories_filter: [],
  payment_methods: ["cod", "bkash", "nagad"],
  menu_labels: { browse: "🛍️ Browse", cart: "🛒 Cart", orders: "📦 My Orders", help: "❓ Help" },
  notify_admin_on_order: true,
};

function StoreBotAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [cfg, setCfg] = useState<Cfg>(DEFAULTS);
  const [initial, setInitial] = useState<{ enabled: boolean; cfg: Cfg }>({ enabled: false, cfg: DEFAULTS });
  const [botInfo, setBotInfo] = useState<{ me?: any; info?: any; error?: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [tab, setTab] = useState<"welcome" | "catalog" | "payment" | "menu" | "advanced">("welcome");
  const [testChatId, setTestChatId] = useState("");
  const [testing, setTesting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const registerFn = useServerFn(registerTelegramWebhook);
  const infoFn = useServerFn(getTelegramWebhookInfo);
  const testFn = useServerFn(sendTelegramTest);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: settings }, { data: cats }] = await Promise.all([
      supabase.from("telegram_settings").select("*").eq("kind", "store_bot").maybeSingle(),
      supabase.from("products").select("category").eq("is_active", true),
    ]);
    const row = settings as any;
    if (row) {
      const merged: Cfg = { ...DEFAULTS, ...(row.config || {}), menu_labels: { ...DEFAULTS.menu_labels, ...((row.config || {}).menu_labels || {}) } };
      setEnabled(!!row.enabled);
      setCfg(merged);
      setInitial({ enabled: !!row.enabled, cfg: merged });
    }
    const uniq = Array.from(new Set(((cats as any[]) || []).map((r) => r.category).filter(Boolean)));
    setCategoryOptions(uniq);
    setLoading(false);
    infoFn({ data: { kind: "store_bot" } }).then((r: any) => {
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
      else setBotInfo({ error: r?.error || "not connected" });
    }).catch((e) => setBotInfo({ error: String(e?.message || e) }));
  }, [infoFn]);

  useEffect(() => { void load(); }, [load]);

  const dirty = useMemo(
    () => enabled !== initial.enabled || JSON.stringify(cfg) !== JSON.stringify(initial.cfg),
    [enabled, cfg, initial],
  );

  const tokenConnected = botInfo?.me && !botInfo?.error;
  const webhookOk = tokenConnected && botInfo?.info?.url;

  const save = async () => {
    setSaving(true);
    const { data: row } = await supabase.from("telegram_settings")
      .select("id").eq("kind", "store_bot").maybeSingle();
    if (row) {
      const { error } = await supabase.from("telegram_settings")
        .update({ enabled, config: cfg as never }).eq("kind", "store_bot");
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { error } = await supabase.from("telegram_settings")
        .insert({ kind: "store_bot", enabled, config: cfg as never } as never);
      if (error) { setSaving(false); return toast.error(error.message); }
    }
    setInitial({ enabled, cfg });
    setSaving(false);
    toast.success("Store bot সেটিংস সেভ হয়েছে");
  };

  const registerWebhook = async () => {
    setRegistering(true);
    try {
      const url = `${getPublicOrigin()}/api/public/telegram/webhook`;
      await registerFn({ data: { url, kind: "store_bot" } });
      toast.success("Store bot webhook registered");
      const r: any = await infoFn({ data: { kind: "store_bot" } });
      if (r?.ok) setBotInfo({ me: JSON.parse(r.me), info: JSON.parse(r.info) });
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setRegistering(false); }
  };

  const sendTestPing = async () => {
    if (!testChatId.trim()) return toast.error("Chat ID দিন");
    setTesting(true);
    try {
      const cid = /^-?\d+$/.test(testChatId) ? Number(testChatId) : testChatId;
      await testFn({ data: { chat_id: cid, text: "✅ Store bot test message ✨", kind: "store_bot" } as any });
      toast.success("Test পাঠানো হয়েছে");
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setTesting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
    </div>
  );

  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((c) => ({ ...c, [k]: v }));

  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: "welcome", label: "Welcome", icon: MessageSquare },
    { id: "catalog", label: "Catalog", icon: ShoppingBag },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "menu", label: "Menu", icon: Users },
    { id: "advanced", label: "Advanced", icon: Settings },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header status card */}
      <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-br from-white to-sky-50/40 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-sky-100 bg-white/60">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-sky-100 grid place-items-center text-sky-600">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Store Bot — Customer Facing</h2>
              <p className="text-xs text-slate-500">
                {tokenConnected ? <>Connected: <b>@{botInfo!.me.username}</b></> : "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 accent-sky-600" />
              <span className={`text-xs font-bold ${enabled ? "text-emerald-700" : "text-slate-500"}`}>
                {enabled ? "Active" : "Off"}
              </span>
            </label>
            <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Reload">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 grid md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase font-bold text-slate-500">Bot Token</div>
            {tokenConnected ? (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Secret configured</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-600 font-semibold">TELEGRAM_STORE_BOT_TOKEN missing</span>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase font-bold text-slate-500">Webhook</div>
            {webhookOk ? (
              <div className="mt-1 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Registered</span>
              </div>
            ) : (
              <button onClick={registerWebhook} disabled={registering || !tokenConnected}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-sky-700 font-bold hover:underline disabled:opacity-50">
                {registering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                Register webhook
              </button>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[11px] uppercase font-bold text-slate-500">Test Message</div>
            <div className="mt-1 flex gap-1">
              <input value={testChatId} onChange={(e) => setTestChatId(e.target.value)}
                placeholder="Chat ID" className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-xs" />
              <button onClick={sendTestPing} disabled={testing || !tokenConnected}
                className="h-8 px-3 rounded-lg bg-sky-600 text-white text-xs font-bold disabled:opacity-50">
                {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition ${
                active ? "bg-sky-600 text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:border-sky-300"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab bodies */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {tab === "welcome" && (
          <div className="space-y-4">
            <Field label="Welcome message (/start)">
              <textarea rows={10} value={cfg.welcome_message}
                onChange={(e) => set("welcome_message", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200" />
              <Hint>HTML tags allowed: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a href&gt;</Hint>
            </Field>
            <Field label="Closed message (when bot disabled)">
              <textarea rows={3} value={cfg.closed_message}
                onChange={(e) => set("closed_message", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200" />
            </Field>
            <Field label="Order confirmation template">
              <textarea rows={8} value={cfg.order_confirmed_template}
                onChange={(e) => set("order_confirmed_template", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-200" />
              <Hint>Variables: {"{{order_id}}"}, {"{{total}}"}, {"{{currency}}"}, {"{{payment_method}}"}, {"{{customer}}"}</Hint>
            </Field>
          </div>
        )}

        {tab === "catalog" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Browse mode">
                <select value={cfg.browse_mode} onChange={(e) => set("browse_mode", e.target.value as any)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white">
                  <option value="featured">Featured only (badge)</option>
                  <option value="all">All active products</option>
                </select>
              </Field>
              <Field label="Products per page">
                <input type="number" min={1} max={10} value={cfg.per_page}
                  onChange={(e) => set("per_page", Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
              <Field label="Currency symbol">
                <input value={cfg.currency} onChange={(e) => set("currency", e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
              <Field label="Website product link fallback">
                <input value={cfg.buy_link_fallback} onChange={(e) => set("buy_link_fallback", e.target.value)}
                  placeholder="https://accessnowbd.com/product/{{slug}}"
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-mono" />
              </Field>
            </div>
            <div className="flex gap-4">
              <Check label="Show price on cards" checked={cfg.show_price} onChange={(v) => set("show_price", v)} />
              <Check label="Show stock status" checked={cfg.show_stock} onChange={(v) => set("show_stock", v)} />
            </div>
            <Field label="Category filter (leave empty for all)">
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((c) => {
                  const active = cfg.categories_filter.includes(c);
                  return (
                    <button key={c} type="button"
                      onClick={() => set("categories_filter",
                        active ? cfg.categories_filter.filter((x) => x !== c) : [...cfg.categories_filter, c])}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${
                        active ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-700 border-slate-200 hover:border-sky-300"
                      }`}>
                      {c}
                    </button>
                  );
                })}
                {categoryOptions.length === 0 && <span className="text-xs text-slate-400">কোনো category নেই</span>}
              </div>
            </Field>
          </div>
        )}

        {tab === "payment" && (
          <div className="space-y-4">
            <Field label="Accepted payment methods">
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { id: "cod", label: "💵 Cash on Delivery" },
                  { id: "bkash", label: "📱 bKash" },
                  { id: "nagad", label: "📱 Nagad" },
                  { id: "wallet", label: "💰 Wallet balance" },
                ].map((m) => {
                  const active = cfg.payment_methods.includes(m.id);
                  return (
                    <button key={m.id} type="button"
                      onClick={() => set("payment_methods",
                        active ? cfg.payment_methods.filter((x) => x !== m.id) : [...cfg.payment_methods, m.id])}
                      className={`text-sm px-4 py-2.5 rounded-xl font-semibold border text-left ${
                        active ? "bg-sky-50 border-sky-500 text-sky-800" : "bg-white text-slate-700 border-slate-200 hover:border-sky-300"
                      }`}>
                      {active ? "✓ " : ""}{m.label}
                    </button>
                  );
                })}
              </div>
              <Hint>Customer bot-এ checkout করলে এই methods থেকে বেছে নিতে পারবে</Hint>
            </Field>
            <Check label="প্রতি অর্ডারে Order Bot admin-দের notify করো"
              checked={cfg.notify_admin_on_order} onChange={(v) => set("notify_admin_on_order", v)} />
          </div>
        )}

        {tab === "menu" && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Browse button label">
                <input value={cfg.menu_labels.browse}
                  onChange={(e) => set("menu_labels", { ...cfg.menu_labels, browse: e.target.value })}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
              <Field label="Cart button label">
                <input value={cfg.menu_labels.cart}
                  onChange={(e) => set("menu_labels", { ...cfg.menu_labels, cart: e.target.value })}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
              <Field label="Orders button label">
                <input value={cfg.menu_labels.orders}
                  onChange={(e) => set("menu_labels", { ...cfg.menu_labels, orders: e.target.value })}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
              <Field label="Help button label">
                <input value={cfg.menu_labels.help}
                  onChange={(e) => set("menu_labels", { ...cfg.menu_labels, help: e.target.value })}
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm" />
              </Field>
            </div>
          </div>
        )}

        {tab === "advanced" && (
          <div className="space-y-4">
            <Field label="Support contact link (shown in /help)">
              <input value={cfg.contact_link} onChange={(e) => set("contact_link", e.target.value)}
                placeholder="https://t.me/yourusername"
                className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm font-mono" />
            </Field>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold">টিপস:</div>
              <div>• Customer bot-এ যেকোনো text লিখলে auto search হবে</div>
              <div>• অর্ডার এলে সরাসরি <b>/admin/orders</b>-এ দেখা যাবে (Telegram source tag সহ)</div>
              <div>• Bot username পরিবর্তন করলে TELEGRAM_STORE_BOT_TOKEN আবার update করতে হবে</div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-3 flex justify-end">
        <button onClick={save} disabled={!dirty || saving}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {dirty ? "Save changes" : "Saved"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-slate-700 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 text-[11px] text-slate-500">{children}</div>;
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-sky-600" />
      {label}
    </label>
  );
}
