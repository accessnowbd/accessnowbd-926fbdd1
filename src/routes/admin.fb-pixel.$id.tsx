import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ShieldCheck,
  Send,
  Save,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Activity,
  Zap,
  TestTube,
  Database,
  KeyRound,
  Info,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";
import { useServerFn } from "@tanstack/react-start";
import { sendFbCapiTestEvent } from "@/lib/fb-capi-test.functions";
import { verifyFbCapiConnection } from "@/lib/fb-pixel.functions";

type EventKey = "PageView" | "ViewContent" | "AddToCart" | "Purchase" | "Lead";

type EventsConfig = {
  capi_enabled?: boolean;
  test_event_code?: string;
  api_version?: string;
  events?: Partial<Record<EventKey, boolean>>;
  connection_verified_at?: string | null;
  last_event_at?: string | null;
};

type PixelRow = {
  id: string;
  label: string | null;
  pixel_id: string | null;
  access_token: string | null;
  enabled: boolean;
  events_config: EventsConfig;
  sort_order: number;
};

const TABS = [
  { key: "overview", en: "Overview", bn: "ওভারভিউ" },
  { key: "settings", en: "Settings", bn: "সেটিংস" },
  { key: "installation", en: "Pixel Installation", bn: "Pixel Installation" },
  { key: "capi", en: "Conversions API", bn: "Conversions API" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const EVENT_META: { key: EventKey; en: string; bn: string }[] = [
  { key: "PageView", en: "PageView — every page view", bn: "PageView — প্রতিটি পেজ ভিজিট" },
  { key: "ViewContent", en: "ViewContent — product / details view", bn: "ViewContent — প্রোডাক্ট ডিটেইল দেখা" },
  { key: "AddToCart", en: "AddToCart — item added to cart", bn: "AddToCart — কার্টে যোগ" },
  { key: "Purchase", en: "Purchase — order completed", bn: "Purchase — অর্ডার সম্পন্ন" },
  { key: "Lead", en: "Lead — lead / registration", bn: "Lead — লিড / রেজিস্ট্রেশন" },
];

export const Route = createFileRoute("/admin/fb-pixel/$id")({
  component: FbPixelDetailPage,
  head: () => ({
    meta: [
      { title: "Meta Business — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function FbPixelDetailPage() {
  const { id } = useParams({ from: "/admin/fb-pixel/$id" });
  const { t } = useAdminLang();
  const navigate = useNavigate();
  const [row, setRow] = useState<PixelRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");
  const [showToken, setShowToken] = useState(false);

  const verifyFn = useServerFn(verifyFbCapiConnection);
  const testFn = useServerFn(sendFbCapiTestEvent);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tracking_pixels")
        .select("id, label, pixel_id, access_token, enabled, events_config, sort_order")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error) toast.error(error.message);
      if (data) {
        setRow({
          ...(data as unknown as PixelRow),
          events_config: ((data as unknown as PixelRow).events_config ?? {}) as EventsConfig,
        });
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const patch = (p: Partial<PixelRow>) => {
    setRow((r) => (r ? { ...r, ...p } : r));
    setDirty(true);
  };
  const patchCfg = (p: Partial<EventsConfig>) => {
    setRow((r) =>
      r ? { ...r, events_config: { ...(r.events_config ?? {}), ...p } } : r
    );
    setDirty(true);
  };
  const toggleEvent = (k: EventKey, v: boolean) => {
    setRow((r) => {
      if (!r) return r;
      const events = { ...(r.events_config?.events ?? {}), [k]: v };
      return { ...r, events_config: { ...(r.events_config ?? {}), events } };
    });
    setDirty(true);
  };

  const save = async () => {
    if (!row) return;
    setSaving(true);
    const { error } = await supabase
      .from("tracking_pixels")
      .update({
        label: row.label,
        pixel_id: row.pixel_id,
        access_token: row.access_token,
        enabled: row.enabled,
        events_config: row.events_config ?? {},
      } as never)
      .eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setDirty(false);
    toast.success(t("Saved", "সংরক্ষিত"));
  };

  const verify = async () => {
    if (!row) return;
    if (dirty) return toast.error(t("Save changes first", "আগে সংরক্ষণ করুন"));
    setVerifying(true);
    const res = await verifyFn({ data: { pixelRowId: row.id } });
    setVerifying(false);
    if (!res.ok) return toast.error(res.error || "Verification failed");
    toast.success(t("Connection verified", "কানেকশন যাচাই হয়েছে"));
    // reload
    const { data } = await supabase
      .from("tracking_pixels")
      .select("id, label, pixel_id, access_token, enabled, events_config, sort_order")
      .eq("id", row.id)
      .maybeSingle();
    if (data)
      setRow({
        ...(data as unknown as PixelRow),
        events_config: ((data as unknown as PixelRow).events_config ?? {}) as EventsConfig,
      });
  };

  const sendTest = async () => {
    if (!row) return;
    if (dirty) return toast.error(t("Save changes first", "আগে সংরক্ষণ করুন"));
    setTesting(true);
    const res = await testFn({ data: { pixelRowId: row.id } });
    setTesting(false);
    if (!res.ok) return toast.error(res.error || "Test failed");
    toast.success(
      `${t("Test event sent", "টেস্ট ইভেন্ট পাঠানো হয়েছে")}${res.events_received ? ` · ${res.events_received}` : ""}`
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-sm text-slate-500 shadow-sm">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        {t("Loading…", "লোড হচ্ছে…")}
      </div>
    );
  }
  if (!row) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
        <p className="text-sm text-slate-600 mb-4">
          {t("Pixel not found", "Pixel পাওয়া যায়নি")}
        </p>
        <Link
          to="/admin/fb-pixel"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> {t("Back", "ফিরে যান")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-sky-50 p-4 sm:p-5">
        <div className="relative flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate({ to: "/admin/fb-pixel" })}
            className="shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm ring-1 ring-violet-100 grid place-items-center text-violet-600 hover:text-violet-700"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm ring-1 ring-violet-100 grid place-items-center text-violet-600">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent leading-tight truncate">
              {t("Meta Business", "Meta Business")}
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-600 mt-1">
              {t("Integrations", "ইন্টিগ্রেশন")} •{" "}
              {row.label || t("Untitled Pixel", "নামহীন Pixel")}
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={verify}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {verifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {t("Verify Connection", "Verify Connection")}
        </button>
        <button
          onClick={sendTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {t("Send Test Event", "Send Test Event")}
        </button>
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("Save", "সংরক্ষণ")}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tk) => (
            <button
              key={tk.key}
              onClick={() => setTab(tk.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                tab === tk.key
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t(tk.en, tk.bn)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      {tab === "overview" && <OverviewTab row={row} />}
      {tab === "settings" && (
        <SettingsTab
          row={row}
          patch={patch}
          patchCfg={patchCfg}
          toggleEvent={toggleEvent}
        />
      )}
      {tab === "installation" && <InstallationTab row={row} />}
      {tab === "capi" && (
        <CapiTab
          row={row}
          patch={patch}
          patchCfg={patchCfg}
          showToken={showToken}
          onToggleToken={() => setShowToken((v) => !v)}
        />
      )}
    </div>
  );
}

/* ----------------------------- Overview ------------------------------ */

function StatusCard({
  icon,
  label,
  value,
  tone = "violet",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "violet" | "emerald" | "sky" | "slate" | "amber";
}) {
  const dot: Record<string, string> = {
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    slate: "bg-slate-300",
    amber: "bg-amber-500",
  };
  const iconTone: Record<string, string> = {
    violet: "text-violet-600",
    emerald: "text-emerald-600",
    sky: "text-sky-600",
    slate: "text-slate-500",
    amber: "text-amber-600",
  };
  return (
    <div className="relative rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
      <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${dot[tone]}`} />
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${iconTone[tone]}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-extrabold text-slate-900 mt-1.5 break-all">{value}</div>
    </div>
  );
}

function OverviewTab({ row }: { row: PixelRow }) {
  const { t } = useAdminLang();
  const cfg = row.events_config ?? {};
  const capi = !!cfg.capi_enabled;
  const token = row.access_token ?? "";
  const tokenMask = token
    ? `••••${token.slice(-4)}`
    : t("Not set", "সেট করা নেই");
  const verifiedAt = cfg.connection_verified_at
    ? new Date(cfg.connection_verified_at).toLocaleString()
    : null;
  const lastEvent = cfg.last_event_at
    ? new Date(cfg.last_event_at).toLocaleString()
    : t("Never", "কখনো না");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatusCard
        icon={<ShieldCheck className="w-3.5 h-3.5" />}
        label={t("Connection", "কানেকশন")}
        value={verifiedAt ? t("Verified", "যাচাই হয়েছে") : t("Not verified", "যাচাই হয়নি")}
        tone={verifiedAt ? "emerald" : "slate"}
      />
      <StatusCard
        icon={<Activity className="w-3.5 h-3.5" />}
        label={t("Pixel", "Pixel")}
        value={row.enabled && row.pixel_id ? t("Live", "লাইভ") : t("Off", "বন্ধ")}
        tone={row.enabled && row.pixel_id ? "violet" : "slate"}
      />
      <StatusCard
        icon={<Zap className="w-3.5 h-3.5" />}
        label={t("Conversions API", "Conversions API")}
        value={capi ? t("Enabled", "সক্রিয়") : t("Disabled", "নিষ্ক্রিয়")}
        tone={capi ? "violet" : "slate"}
      />
      <StatusCard
        icon={<TestTube className="w-3.5 h-3.5" />}
        label={t("Test Events", "Test Events")}
        value={cfg.test_event_code ? t("Code set", "কোড সেট আছে") : t("Not set", "সেট করা নেই")}
        tone={cfg.test_event_code ? "violet" : "slate"}
      />
      <StatusCard
        icon={<Database className="w-3.5 h-3.5" />}
        label={t("Dataset ID", "Dataset ID")}
        value={row.pixel_id || t("Not set", "সেট করা নেই")}
        tone={row.pixel_id ? "violet" : "slate"}
      />
      <StatusCard
        icon={<KeyRound className="w-3.5 h-3.5" />}
        label={t("Access Token", "Access Token")}
        value={tokenMask}
        tone={token ? "violet" : "slate"}
      />
      <StatusCard
        icon={<Info className="w-3.5 h-3.5" />}
        label={t("API Version", "API Version")}
        value={cfg.api_version || "v21.0"}
        tone="violet"
      />
      <StatusCard
        icon={<Activity className="w-3.5 h-3.5" />}
        label={t("Last Event", "Last Event")}
        value={lastEvent}
        tone={cfg.last_event_at ? "emerald" : "slate"}
      />
    </div>
  );
}

/* ----------------------------- Settings ------------------------------ */

function SettingsTab({
  row,
  patch,
  patchCfg,
  toggleEvent,
}: {
  row: PixelRow;
  patch: (p: Partial<PixelRow>) => void;
  patchCfg: (p: Partial<EventsConfig>) => void;
  toggleEvent: (k: EventKey, v: boolean) => void;
}) {
  const { t } = useAdminLang();
  const cfg = row.events_config ?? {};
  const events = cfg.events ?? {};

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">
          {t("Basic settings", "মৌলিক সেটিংস")}
        </h3>
        <Field label={t("Pixel name / label", "Pixel নাম / লেবেল")}>
          <input
            value={row.label ?? ""}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="e.g. Main Store Pixel"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </Field>
        <Field label={t("API Version", "API Version")}>
          <input
            value={cfg.api_version ?? "v21.0"}
            onChange={(e) => patchCfg({ api_version: e.target.value })}
            placeholder="v21.0"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </Field>
        <Field label={t("Test Event Code (optional)", "Test Event Code (ঐচ্ছিক)")}>
          <input
            value={cfg.test_event_code ?? ""}
            onChange={(e) => patchCfg({ test_event_code: e.target.value })}
            placeholder="TEST12345"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </Field>
        <label className="flex items-center gap-3 pt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="w-4 h-4 accent-violet-600"
          />
          <span className="text-sm font-semibold text-slate-800">
            {t("Enable this pixel (fire events on site)", "এই pixel চালু করুন (সাইটে events fire হবে)")}
          </span>
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">
          {t("Which events to fire", "কোন event fire করবে")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EVENT_META.map((ev) => {
            const on = events[ev.key] !== false;
            return (
              <label
                key={ev.key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  on ? "border-violet-200 bg-violet-50/50" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => toggleEvent(ev.key, e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm text-slate-800 font-medium">
                  {t(ev.en, ev.bn)}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Installation ---------------------------- */

function InstallationTab({ row }: { row: PixelRow }) {
  const { t } = useAdminLang();
  const [copied, setCopied] = useState(false);
  const snippet = useMemo(() => {
    const id = row.pixel_id || "YOUR_PIXEL_ID";
    return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel Code -->`;
  }, [row.pixel_id]);

  return (
    <div className="space-y-4">
      <Field
        label={t("Pixel / Dataset ID", "Pixel / Dataset ID")}
        hint={t(
          "Find this in Meta Events Manager → Data Sources → your pixel.",
          "Meta Events Manager → Data Sources → আপনার pixel-এ পাবেন।"
        )}
      >
        <div className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 select-all">
          {row.pixel_id || t("(not set — go to Settings)", "(সেট নেই — Settings-এ যান)")}
        </div>
      </Field>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-sm text-emerald-900 min-w-0">
          <div className="font-bold">{t("Auto-installed", "অটো ইনস্টলড")}</div>
          <p className="mt-0.5 leading-relaxed">
            {t(
              "You do not need to paste this snippet anywhere. Every enabled pixel is injected site-wide automatically and fires PageView on every route change.",
              "এই snippet কোথাও পেস্ট করতে হবে না। প্রতিটি enabled pixel সাইটে অটোমেটিক ইনজেক্ট হয় এবং প্রতি route change-এ PageView fire করে।"
            )}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            {t("Pixel snippet (reference)", "Pixel snippet (রেফারেন্স)")}
          </h3>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
              toast.success(t("Copied", "কপি হয়েছে"));
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-3.5 h-3.5" /> {copied ? t("Copied", "কপি হয়েছে") : t("Copy", "কপি")}
          </button>
        </div>
        <pre className="text-[11px] leading-relaxed font-mono bg-slate-950 text-slate-100 rounded-xl p-4 overflow-auto max-h-[380px]">
{snippet}
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------ CAPI --------------------------------- */

function CapiTab({
  row,
  patch,
  patchCfg,
  showToken,
  onToggleToken,
}: {
  row: PixelRow;
  patch: (p: Partial<PixelRow>) => void;
  patchCfg: (p: Partial<EventsConfig>) => void;
  showToken: boolean;
  onToggleToken: () => void;
}) {
  const { t } = useAdminLang();
  const cfg = row.events_config ?? {};
  const capi = !!cfg.capi_enabled;

  return (
    <div className="space-y-4">
      <label className="bg-white border border-slate-200 rounded-3xl p-5 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={capi}
          onChange={(e) => patchCfg({ capi_enabled: e.target.checked })}
          className="w-5 h-5 accent-violet-600 mt-0.5"
        />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-slate-900">
            {t("Enable Conversions API (server-side)", "Conversions API চালু করুন (server-side)")}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {t(
              "CAPI sends events server-to-server for accurate tracking when browsers block cookies or ad-blockers are used.",
              "CAPI browser-এর বাইরে server-to-server ইভেন্ট পাঠায় — ব্রাউজার cookies ব্লক হলেও সঠিক ট্র্যাকিং হয়।"
            )}
          </p>
        </div>
      </label>

      <Field
        label={t("Access Token", "Access Token")}
        hint={t(
          "System user access token from Meta Business — used for server-side events.",
          "Meta Business-এর system user access token — server-side ইভেন্টের জন্য ব্যবহার হয়।"
        )}
      >
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={row.access_token ?? ""}
            onChange={(e) => patch({ access_token: e.target.value })}
            placeholder="EAAG..."
            className="w-full h-11 pl-3 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
          <button
            type="button"
            onClick={onToggleToken}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-slate-500 hover:text-slate-700"
            aria-label="Toggle"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>

      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 flex items-start gap-3">
        <ChevronRight className="w-5 h-5 text-sky-600 shrink-0" />
        <div className="text-sm text-slate-700 min-w-0">
          <div className="font-bold text-slate-900">
            {t("Where to get the token", "টোকেন কোথায় পাবেন")}
          </div>
          <p className="mt-0.5 leading-relaxed">
            {t(
              "Meta Events Manager → your dataset → Settings → Conversions API → Generate access token.",
              "Meta Events Manager → আপনার dataset → Settings → Conversions API → Generate access token।"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- primitives ------------------------------ */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-slate-700 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-slate-500 mt-1.5">{hint}</div>}
    </label>
  );
}
