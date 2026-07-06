import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Plus,
  Save,
  Loader2,
  ChevronDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  TestTube,
  ShoppingCart,
  Eye as EyeIcon,
  UserPlus,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";
import { useServerFn } from "@tanstack/react-start";
import { sendFbCapiTestEvent } from "@/lib/fb-capi-test.functions";

type EventKey = "PageView" | "ViewContent" | "AddToCart" | "Purchase" | "Lead";

type EventsConfig = {
  capi_enabled?: boolean;
  test_event_code?: string;
  events?: Partial<Record<EventKey, boolean>>;
};

type PixelRow = {
  id: string;
  provider: string;
  label: string | null;
  pixel_id: string | null;
  access_token: string | null;
  enabled: boolean;
  events_config: EventsConfig;
  sort_order: number;
  _dirty?: boolean;
  _new?: boolean;
  _localId?: string;
};

const EVENT_META: {
  key: EventKey;
  en: string;
  bn: string;
  desc_en: string;
  desc_bn: string;
  icon: typeof BarChart3;
}[] = [
  {
    key: "PageView",
    en: "PageView",
    bn: "PageView",
    desc_en: "Fires on every page view",
    desc_bn: "প্রতি পেজ ভিজিটে ট্র্যাক করে",
    icon: EyeIcon,
  },
  {
    key: "ViewContent",
    en: "ViewContent",
    bn: "ViewContent",
    desc_en: "Product / details page view",
    desc_bn: "প্রোডাক্ট ডিটেইলস পেজ দেখা",
    icon: FileText,
  },
  {
    key: "AddToCart",
    en: "AddToCart",
    bn: "AddToCart",
    desc_en: "Item added to cart",
    desc_bn: "কার্টে যোগ করা হয়েছে",
    icon: ShoppingCart,
  },
  {
    key: "Purchase",
    en: "Purchase",
    bn: "Purchase",
    desc_en: "Order successfully placed",
    desc_bn: "অর্ডার সম্পন্ন (পাওয়ারফুল)",
    icon: CheckCircle2,
  },
  {
    key: "Lead",
    en: "Lead",
    bn: "Lead",
    desc_en: "Lead / registration event",
    desc_bn: "লিড / রেজিস্ট্রেশন",
    icon: UserPlus,
  },
];

const DEFAULT_EVENTS: Required<EventsConfig>["events"] = {
  PageView: true,
  ViewContent: true,
  AddToCart: true,
  Purchase: true,
  Lead: true,
};

export function FbPixelManager() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<PixelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const testFn = useServerFn(sendFbCapiTestEvent);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tracking_pixels")
      .select(
        "id, provider, label, pixel_id, access_token, enabled, events_config, sort_order"
      )
      .eq("provider", "facebook_pixel")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    const list = (data ?? []).map((r) => ({
      ...(r as unknown as PixelRow),
      events_config: (r as unknown as PixelRow).events_config ?? {},
    }));
    setRows(list);
    if (list.length && !expanded) setExpanded(list[0].id);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.enabled).length;
    const capi = rows.filter((r) => r.events_config?.capi_enabled).length;
    return { total, active, capi };
  }, [rows]);

  const addNew = () => {
    const localId = `new-${Math.random().toString(36).slice(2, 9)}`;
    const draft: PixelRow = {
      id: localId,
      provider: "facebook_pixel",
      label: `Pixel ${rows.length + 1}`,
      pixel_id: "",
      access_token: null,
      enabled: true,
      events_config: {
        capi_enabled: false,
        test_event_code: "",
        events: { ...DEFAULT_EVENTS },
      },
      sort_order: rows.length,
      _new: true,
      _dirty: true,
      _localId: localId,
    };
    setRows((p) => [...p, draft]);
    setExpanded(localId);
  };

  const update = (id: string, patch: Partial<PixelRow>) =>
    setRows((p) =>
      p.map((r) => (r.id === id ? { ...r, ...patch, _dirty: true } : r))
    );

  const updateEvents = (id: string, patch: Partial<EventsConfig>) =>
    setRows((p) =>
      p.map((r) =>
        r.id === id
          ? {
              ...r,
              events_config: { ...(r.events_config ?? {}), ...patch },
              _dirty: true,
            }
          : r
      )
    );

  const toggleEvent = (id: string, key: EventKey, v: boolean) => {
    setRows((p) =>
      p.map((r) => {
        if (r.id !== id) return r;
        const events = { ...(r.events_config?.events ?? DEFAULT_EVENTS), [key]: v };
        return {
          ...r,
          events_config: { ...(r.events_config ?? {}), events },
          _dirty: true,
        };
      })
    );
  };

  const saveOne = async (row: PixelRow) => {
    setSavingId(row.id);
    const payload = {
      provider: "facebook_pixel",
      label: row.label,
      pixel_id: row.pixel_id,
      access_token: row.access_token,
      enabled: row.enabled,
      events_config: row.events_config ?? {},
      sort_order: row.sort_order,
    } as never;
    const { error } = row._new
      ? await supabase.from("tracking_pixels").insert(payload)
      : await supabase.from("tracking_pixels").update(payload).eq("id", row.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(t("Saved", "সংরক্ষিত"));
    await load();
  };

  const remove = async (row: PixelRow) => {
    if (row._new) {
      setRows((p) => p.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(t("Delete this pixel?", "এই পিক্সেল ডিলিট করবেন?"))) return;
    const { error } = await supabase.from("tracking_pixels").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(t("Deleted", "ডিলিট করা হয়েছে"));
    await load();
  };

  const runTest = async (row: PixelRow) => {
    if (row._new || row._dirty) {
      toast.error(t("Save first", "আগে সংরক্ষণ করুন"));
      return;
    }
    setTestingId(row.id);
    const res = await testFn({ data: { pixelRowId: row.id } });
    setTestingId(null);
    if (!res.ok) toast.error(res.error || "Test failed");
    else
      toast.success(
        `Test event sent ${res.events_received ? `· received ${res.events_received}` : ""}`
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

  return (
    <div className="space-y-4">
      {/* Hero header */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 grid place-items-center text-white shadow-md shadow-violet-200">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent">
                {t("Facebook Multi-Pixel & CAPI", "Facebook Multi-Pixel & CAPI")}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                {t(
                  "Configure multiple Facebook Pixels & Conversions API",
                  "একাধিক Facebook Pixel এবং Conversions API সেটআপ করুন"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addNew}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4" />
              {t("New Pixel", "নতুন Pixel")}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-violet-500" />
          <h4 className="text-sm font-extrabold text-slate-900">
            {t("Summary", "সারাংশ")}
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            icon={<BarChart3 className="w-4 h-4" />}
            value={totals.total}
            label={t("Total Pixel", "মোট Pixel")}
            tone="violet"
          />
          <SummaryCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            value={totals.active}
            label={t("Active Pixel", "সক্রিয় Pixel")}
            tone="emerald"
          />
          <SummaryCard
            icon={<Zap className="w-4 h-4" />}
            value={totals.capi}
            label={t("CAPI Active", "CAPI সক্রিয়")}
            tone="fuchsia"
          />
        </div>
      </div>

      {/* Pixel list */}
      {rows.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 grid place-items-center mx-auto mb-3 text-violet-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {t("No pixels yet", "কোনো পিক্সেল নেই")}
          </div>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {t(
              "Add your first Facebook Pixel to start tracking",
              "ট্র্যাকিং শুরু করতে প্রথম পিক্সেল যোগ করুন"
            )}
          </p>
          <button
            onClick={addNew}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-sm hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            {t("Add Pixel", "Pixel যোগ করুন")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <PixelCard
              key={r.id}
              row={r}
              expanded={expanded === r.id}
              onToggleExpand={() => setExpanded((cur) => (cur === r.id ? null : r.id))}
              onUpdate={(p) => update(r.id, p)}
              onUpdateEvents={(p) => updateEvents(r.id, p)}
              onToggleEvent={(k, v) => toggleEvent(r.id, k, v)}
              onSave={() => saveOne(r)}
              onDelete={() => remove(r)}
              onTest={() => runTest(r)}
              saving={savingId === r.id}
              testing={testingId === r.id}
              showToken={!!showToken[r.id]}
              onToggleToken={() =>
                setShowToken((p) => ({ ...p, [r.id]: !p[r.id] }))
              }
            />
          ))}
        </div>
      )}

      {/* Benefits */}
      <div className="rounded-3xl bg-violet-50/60 border border-violet-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-violet-600" />
          <h4 className="text-sm font-extrabold text-violet-900">
            {t("Multi-Pixel Benefits", "একাধিক Pixel ব্যবহারের সুবিধা")}
          </h4>
        </div>
        <ul className="text-xs md:text-sm text-violet-900/80 space-y-1.5 list-disc pl-5">
          <li>
            {t(
              "Different Ad Accounts can use different Pixels",
              "বিভিন্ন Ad Account-এর জন্য আলাদা Pixel ব্যবহার করতে পারবেন"
            )}
          </li>
          <li>
            {t(
              "Agencies / clients can each own a Pixel",
              "Agency বা Client আলাদা Pixel বসাতে পারবেন"
            )}
          </li>
          <li>
            {t(
              "Combine multiple ad campaigns' data in one place",
              "প্রতিটি Pixel-এ আলাদা ইভেন্ট ট্রিগার সেট করা যাবে"
            )}
          </li>
          <li>
            {t(
              "CAPI + Browser tracking together for maximum accuracy",
              "CAPI-এর মাধ্যমে প্রতিটি Pixel-এর জন্য কনভার্সন ট্র্যাক করা যাবে"
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "violet" | "emerald" | "fuchsia";
}) {
  const tones: Record<string, string> = {
    violet: "from-violet-500 to-violet-600 text-violet-600 bg-violet-50",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50",
    fuchsia: "from-fuchsia-500 to-fuchsia-600 text-fuchsia-600 bg-fuchsia-50",
  };
  const [gradient, textCol, bg] = tones[tone].split(" ");
  return (
    <div className="rounded-2xl bg-slate-50/60 border border-slate-100 p-3">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg grid place-items-center ${bg} ${textCol}`}>
          {icon}
        </span>
        <div>
          <div
            className={`text-xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent leading-none`}
          >
            {value}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  );
}

function PixelCard({
  row,
  expanded,
  onToggleExpand,
  onUpdate,
  onUpdateEvents,
  onToggleEvent,
  onSave,
  onDelete,
  onTest,
  saving,
  testing,
  showToken,
  onToggleToken,
}: {
  row: PixelRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (p: Partial<PixelRow>) => void;
  onUpdateEvents: (p: Partial<EventsConfig>) => void;
  onToggleEvent: (k: EventKey, v: boolean) => void;
  onSave: () => void;
  onDelete: () => void;
  onTest: () => void;
  saving: boolean;
  testing: boolean;
  showToken: boolean;
  onToggleToken: () => void;
}) {
  const { t } = useAdminLang();
  const capi = !!row.events_config?.capi_enabled;
  const events = { ...DEFAULT_EVENTS, ...(row.events_config?.events ?? {}) };

  const copyId = () => {
    if (!row.pixel_id) return;
    void navigator.clipboard.writeText(row.pixel_id);
    toast.success(t("Copied", "কপি হয়েছে"));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      {/* Head */}
      <div className="flex items-center gap-3 p-4 md:p-5">
        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white shrink-0">
          <BarChart3 className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 truncate">
              {row.label || t("Untitled Pixel", "নামহীন Pixel")}
            </span>
            {row.enabled && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                {t("LIVE", "লাইভ")}
              </span>
            )}
            {capi && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-fuchsia-100 text-fuchsia-700">
                CAPI
              </span>
            )}
            {row._dirty && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                {t("UNSAVED", "সেভ হয়নি")}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
            {row.pixel_id || t("No Pixel ID set", "Pixel ID সেট করা নেই")}
          </div>
        </div>
        <ToggleSwitch value={row.enabled} onChange={(v) => onUpdate({ enabled: v })} />
        <button
          onClick={onToggleExpand}
          className="w-9 h-9 rounded-lg grid place-items-center hover:bg-slate-50 text-slate-500"
          aria-label="Expand"
        >
          <ChevronDown
            className={`w-4 h-4 transition ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
          {/* Pixel name */}
          <Field label={t("Pixel Name", "PIXEL এর নাম")}>
            <input
              value={row.label ?? ""}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </Field>

          {/* Pixel ID with copy + delete */}
          <Field
            label={`${t("Pixel ID", "PIXEL ID")} *`}
            hint={t(
              "Find it in Events Manager → Settings",
              "Events Manager → আপনার Pixel → Settings থেকে Pixel ID পাবেন"
            )}
          >
            <div className="flex gap-2">
              <input
                value={row.pixel_id ?? ""}
                onChange={(e) => onUpdate({ pixel_id: e.target.value })}
                placeholder="1234567890123456"
                className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={copyId}
                className="w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500 hover:bg-slate-50"
                title={t("Copy", "কপি")}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="w-11 h-11 shrink-0 rounded-xl bg-white border border-slate-200 grid place-items-center text-rose-500 hover:bg-rose-50"
                title={t("Delete", "ডিলিট")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Field>

          {/* CAPI block */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-fuchsia-100 grid place-items-center text-fuchsia-600">
                  <Zap className="w-4 h-4" />
                </span>
                <div className="text-sm font-extrabold text-slate-800">
                  {t("Conversions API (Server-Side)", "Conversions API (Server-Side)")}
                </div>
              </div>
              <ToggleSwitch
                value={capi}
                onChange={(v) => onUpdateEvents({ capi_enabled: v })}
              />
            </div>
            {capi && (
              <div className="p-4 space-y-3">
                <Field label={t("ACCESS TOKEN", "ACCESS TOKEN")}>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={row.access_token ?? ""}
                      onChange={(e) => onUpdate({ access_token: e.target.value })}
                      placeholder="EAAxxxxxxxx..."
                      className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-white border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                    <button
                      onClick={onToggleToken}
                      className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg grid place-items-center text-slate-500 hover:bg-slate-100"
                      aria-label="toggle"
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </Field>
                <Field
                  label={t("Test Event Code (optional)", "TEST EVENT CODE (ঐচ্ছিক)")}
                >
                  <input
                    value={row.events_config?.test_event_code ?? ""}
                    onChange={(e) =>
                      onUpdateEvents({ test_event_code: e.target.value })
                    }
                    placeholder="TEST12345"
                    className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </Field>
                <button
                  onClick={onTest}
                  disabled={testing}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-fuchsia-200 text-sm font-semibold text-fuchsia-700 hover:bg-fuchsia-50 disabled:opacity-60"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  {t("Send Test Event", "Test Event পাঠান")}
                </button>
              </div>
            )}
          </div>

          {/* Event tracking */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full bg-violet-500" />
              <h5 className="text-sm font-extrabold text-slate-900">
                {t("Event Tracking", "ইভেন্ট ট্র্যাকিং")}
              </h5>
            </div>
            <div className="space-y-2">
              {EVENT_META.map((ev) => {
                const Icon = ev.icon;
                const on = !!events[ev.key];
                return (
                  <div
                    key={ev.key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <span className="w-9 h-9 rounded-lg bg-white border border-slate-200 grid place-items-center text-violet-600 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800">{ev.en}</div>
                      <div className="text-[11px] text-slate-500">
                        {t(ev.desc_en, ev.desc_bn)}
                      </div>
                    </div>
                    <ToggleSwitch
                      value={on}
                      onChange={(v) => onToggleEvent(ev.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save row */}
          <div className="flex justify-end">
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Save Pixel", "সংরক্ষণ")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="text-[11px] font-bold text-slate-600 tracking-wide mb-1.5 uppercase">
        {label}
      </div>
      {children}
      {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}

function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition ${
        value
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
          : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
