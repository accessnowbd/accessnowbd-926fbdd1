import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Users,
  Eye,
  Globe2,
  Link2,
  Save,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Info,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";

export const Route = createFileRoute("/admin/ga4-realtime")({
  component: Ga4RealtimeAdmin,
});

type Config = { measurement_id?: string };

async function loadConfig(): Promise<{ id: string | null; config: Config }> {
  const { data } = await supabase
    .from("admin_records")
    .select("id, data")
    .eq("kind", "ga4_realtime")
    .maybeSingle();
  return { id: (data?.id as string) ?? null, config: (data?.data as Config) ?? {} };
}

async function saveConfig(id: string | null, cfg: Config) {
  if (id) {
    const { error } = await supabase
      .from("admin_records")
      .update({ data: cfg as never, is_active: true })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("admin_records")
      .insert({ kind: "ga4_realtime", data: cfg as never, is_active: true, sort_order: 0 } as never);
    if (error) throw error;
  }
}

type Row = {
  id: string;
  session_id: string;
  path: string;
  referrer: string | null;
  created_at: string;
};

async function loadRealtime(): Promise<Row[]> {
  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("pageview_events")
    .select("id, session_id, path, referrer, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as Row[];
}

function Ga4RealtimeAdmin() {
  const { t } = useAdminLang();
  const [cfgId, setCfgId] = useState<string | null>(null);
  const [measurementId, setMeasurementId] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadConfig().then(({ id, config }) => {
      setCfgId(id);
      setMeasurementId(config.measurement_id ?? "");
      setLoaded(true);
    });
  }, []);

  const idValid = /^G-[A-Z0-9]{4,20}$/i.test(measurementId.trim());

  const onSave = async () => {
    if (!idValid) {
      toast.error(t("Enter a valid GA4 Measurement ID (e.g. G-XXXXXXXXXX)", "সঠিক GA4 Measurement ID দিন (যেমন G-XXXXXXXXXX)"));
      return;
    }
    setSaving(true);
    try {
      await saveConfig(cfgId, { measurement_id: measurementId.trim() });
      toast.success(t("Saved — tracking is live", "সংরক্ষিত — ট্র্যাকিং সক্রিয়"));
      const fresh = await loadConfig();
      setCfgId(fresh.id);
    } catch (e) {
      toast.error(String((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  const {
    data: rows = [],
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ga4-realtime"],
    queryFn: loadRealtime,
    refetchInterval: 10_000,
  });

  const stats = useMemo(() => computeStats(rows), [rows]);

  const copyId = useCallback(() => {
    if (!measurementId) return;
    navigator.clipboard?.writeText(measurementId).then(
      () => toast.success(t("Copied", "কপি হয়েছে")),
      () => {},
    );
  }, [measurementId, t]);

  return (
    <div className="space-y-6">
      {/* Config card */}
      <div className="admin-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white shadow">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{t("GA4 Setup", "GA4 সেটআপ")}</h2>
            <p className="text-xs text-slate-500">
              {t(
                "শুধু Measurement ID দিন — বাকি সব আমরা automatic set করে নেব।",
                "শুধু Measurement ID দিন — বাকি সব automatic set হয়ে যাবে।",
              )}
            </p>
          </div>
        </div>

        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
          {t("GA4 Measurement ID", "GA4 মেজারমেন্ট আইডি")}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <input
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value.toUpperCase())}
              placeholder="G-XXXXXXXXXX"
              className="w-full h-11 pl-4 pr-24 rounded-full border border-slate-200 bg-white text-sm font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            {measurementId && (
              <button
                onClick={copyId}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-full text-[11px] font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> {t("Copy", "কপি")}
              </button>
            )}
          </div>
          <button
            onClick={onSave}
            disabled={saving || !idValid || !loaded}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold shadow"
          >
            <Save className="w-4 h-4" /> {saving ? t("Saving…", "সংরক্ষণ হচ্ছে…") : t("Save & Activate", "সংরক্ষণ ও চালু")}
          </button>
        </div>

        {cfgId && idValid && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("Live — gtag installed site-wide", "চালু — সাইট জুড়ে gtag ইনস্টল হয়েছে")}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <a
            href="https://analytics.google.com/analytics/web/#/realtime/rt-overview/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5" /> {t("Open in Google Analytics", "Google Analytics-এ দেখুন")}
          </a>
          <a
            href="https://support.google.com/analytics/answer/9539598"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700"
          >
            <Info className="w-3.5 h-3.5" /> {t("Where do I find my ID?", "আমার ID কোথায় পাব?")}
          </a>
        </div>
      </div>

      {/* Realtime dashboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">{t("Realtime — last 30 minutes", "রিয়েলটাইম — শেষ 30 মিনিট")}</h2>
            <p className="text-xs text-slate-500">
              {t("Auto refresh every 10 sec", "প্রতি 10 সেকেন্ডে auto refresh")}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> {t("Refresh", "রিফ্রেশ")}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <StatCard label={t("Active users (5m)", "সক্রিয় ইউজার (৫মি)")} value={stats.active5m} icon={<Users className="w-4 h-4" />} tone="emerald" />
          <StatCard label={t("Views (30m)", "ভিউ (30মি)")} value={stats.views30m} icon={<Eye className="w-4 h-4" />} tone="violet" />
          <StatCard label={t("Sessions (30m)", "সেশন (30মি)")} value={stats.sessions30m} icon={<Activity className="w-4 h-4" />} tone="amber" />
          <StatCard label={t("Top page views", "সবচেয়ে বেশি ভিউ")} value={stats.topPageViews} icon={<Globe2 className="w-4 h-4" />} tone="rose" hint={stats.topPagePath ?? undefined} />
        </div>

        {/* Per-minute mini chart */}
        <div className="admin-card rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            {t("Views per minute", "প্রতি মিনিটে ভিউ")}
          </div>
          <MinuteChart buckets={stats.perMinute} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 mt-4">
          <ListCard title={t("Top pages", "টপ পেজ")} icon={<Globe2 className="w-4 h-4" />} items={stats.topPages} />
          <ListCard title={t("Top referrers", "টপ রেফারার")} icon={<Link2 className="w-4 h-4" />} items={stats.topReferrers} />
        </div>
      </div>
    </div>
  );
}

/* ============================== helpers ============================== */

type Bucket = { minute: number; views: number };
function computeStats(rows: Row[]) {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;

  const active5m = new Set<string>();
  const sessions30m = new Set<string>();
  const pageCount = new Map<string, number>();
  const refCount = new Map<string, number>();
  const buckets: Bucket[] = [];
  for (let i = 29; i >= 0; i--) buckets.push({ minute: i, views: 0 });

  for (const r of rows) {
    const ts = new Date(r.created_at).getTime();
    sessions30m.add(r.session_id);
    if (ts >= fiveMinAgo) active5m.add(r.session_id);
    pageCount.set(r.path, (pageCount.get(r.path) ?? 0) + 1);
    const ref = normalizeReferrer(r.referrer);
    if (ref) refCount.set(ref, (refCount.get(ref) ?? 0) + 1);
    const ageMin = Math.floor((now - ts) / 60_000);
    if (ageMin >= 0 && ageMin < 30) buckets[29 - ageMin].views += 1;
  }

  const topPages = [...pageCount.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const topReferrers = [...refCount.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    active5m: active5m.size,
    views30m: rows.length,
    sessions30m: sessions30m.size,
    topPages,
    topReferrers,
    topPageViews: topPages[0]?.count ?? 0,
    topPagePath: topPages[0]?.label ?? null,
    perMinute: buckets,
  };
}

function normalizeReferrer(raw: string | null): string | null {
  if (!raw) return "(direct)";
  try {
    const u = new URL(raw);
    if (typeof window !== "undefined" && u.hostname === window.location.hostname) return null;
    return u.hostname;
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  icon,
  tone,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "emerald" | "violet" | "amber" | "rose";
  hint?: string;
}) {
  const grad: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-600",
    violet: "from-violet-500 to-fuchsia-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-600",
  };
  return (
    <div className="admin-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad[tone]} grid place-items-center text-white shadow`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
          <div className="text-2xl font-black text-slate-900 leading-tight">{value.toLocaleString()}</div>
          {hint && <div className="text-[11px] text-slate-500 truncate">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

function MinuteChart({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.views));
  return (
    <div className="flex items-end gap-1 h-24">
      {buckets.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end" title={`${b.views} view${b.views === 1 ? "" : "s"}`}>
          <div
            className="w-full rounded-t bg-gradient-to-t from-violet-500 to-fuchsia-400 transition-all"
            style={{ height: `${(b.views / max) * 100}%`, minHeight: b.views ? 2 : 0 }}
          />
        </div>
      ))}
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; count: number }[];
}) {
  return (
    <div className="admin-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-400 py-4 text-center">—</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-slate-700 font-medium">{it.label}</span>
              <span className="shrink-0 inline-flex items-center h-6 px-2 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                {it.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
