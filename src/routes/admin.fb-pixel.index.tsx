import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Facebook,
  Plus,
  Info,
  Power,
  PowerOff,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";

type PixelRow = {
  id: string;
  label: string | null;
  pixel_id: string | null;
  access_token: string | null;
  enabled: boolean;
  events_config: Record<string, unknown> | null;
};

export const Route = createFileRoute("/admin/fb-pixel/")({
  component: FbPixelListPage,
  head: () => ({
    meta: [
      { title: "Facebook Pixels — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function FbPixelListPage() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<PixelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tracking_pixels")
      .select("id, label, pixel_id, access_token, enabled, events_config")
      .eq("provider", "facebook_pixel")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as PixelRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (r: PixelRow) => {
    setBusyId(r.id);
    const { error } = await supabase
      .from("tracking_pixels")
      .update({ enabled: !r.enabled } as never)
      .eq("id", r.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(!r.enabled ? t("Enabled", "চালু হয়েছে") : t("Disabled", "বন্ধ হয়েছে"));
    void load();
  };

  const remove = async (r: PixelRow) => {
    if (!confirm(t("Delete this pixel?", "এই পিক্সেল ডিলিট করবেন?"))) return;
    setBusyId(r.id);
    const { error } = await supabase.from("tracking_pixels").delete().eq("id", r.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(t("Deleted", "ডিলিট করা হয়েছে"));
    void load();
  };

  const addNew = async () => {
    const { data, error } = await supabase
      .from("tracking_pixels")
      .insert({
        provider: "facebook_pixel",
        label: t("New Pixel", "নতুন পিক্সেল"),
        enabled: false,
        events_config: {
          capi_enabled: false,
          api_version: "v21.0",
          events: { PageView: true, ViewContent: true, AddToCart: true, Purchase: true, Lead: true },
        } as never,
        sort_order: rows.length,
      } as never)
      .select("id")
      .maybeSingle();
    if (error || !data) return toast.error(error?.message ?? "Failed");
    window.location.href = `/admin/fb-pixel/${(data as { id: string }).id}`;
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 p-6 shadow-lg shadow-blue-500/20">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-14 h-14 rounded-2xl bg-white/95 grid place-items-center text-blue-600 shrink-0 shadow-md">
              <Facebook className="w-7 h-7" />
            </span>
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {t("Facebook Pixels", "Facebook Pixels")}
              </h2>
              <p className="text-xs md:text-sm text-white/85 mt-0.5">
                {t(
                  "Add multiple Meta Pixels — every enabled pixel automatically fires PageView & events",
                  "একসাথে একাধিক Meta Pixel যোগ করুন — সব enabled pixel-এ automatically PageView ও events fire হবে।"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={addNew}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-2xl bg-white text-slate-800 font-semibold text-sm shadow-sm hover:bg-white/95"
          >
            <Plus className="w-4 h-4" /> {t("Add Pixel", "Pixel যোগ করুন")}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-white grid place-items-center text-sky-600 shrink-0 ring-1 ring-sky-100">
          <Info className="w-5 h-5" />
        </span>
        <div className="text-sm text-slate-700 min-w-0">
          <div className="font-bold text-slate-900">{t("How it works", "কীভাবে কাজ করে")}</div>
          <p className="mt-1 leading-relaxed">
            {t(
              "Each enabled pixel fires fbq('init', PIXEL_ID) on the front-end and PageView on every route change. Access Token is only needed for CAPI (server-side) — you can leave it empty.",
              "প্রতিটি enabled pixel-এ front-end থেকে fbq('init', PIXEL_ID) এবং প্রতি route change-এ PageView পাঠানো হয়। Access Token শুধু CAPI (server-side) কাজের জন্য — চাইলে খালি রাখতে পারেন।"
            )}
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-sm text-slate-500 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          {t("Loading…", "লোড হচ্ছে…")}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 grid place-items-center mx-auto mb-3 text-blue-600">
            <Facebook className="w-6 h-6" />
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
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-sm hover:opacity-95"
          >
            <Plus className="w-4 h-4" /> {t("Add Pixel", "Pixel যোগ করুন")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <PixelListRow
              key={r.id}
              row={r}
              busy={busyId === r.id}
              onToggle={() => toggle(r)}
              onDelete={() => remove(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PixelListRow({
  row,
  busy,
  onToggle,
  onDelete,
}: {
  row: PixelRow;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useAdminLang();
  const cfg = (row.events_config ?? {}) as { capi_enabled?: boolean };
  const capi = !!cfg.capi_enabled;

  return (
    <div className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4 md:p-5">
      <div className="flex items-center gap-3 md:gap-4 flex-wrap">
        <span className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-200 to-blue-300 grid place-items-center text-blue-700 shrink-0">
          <Facebook className="w-6 h-6" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 truncate">
              {row.label || t("Untitled Pixel", "নামহীন Pixel")}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                row.enabled
                  ? "bg-violet-100 text-violet-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {row.enabled ? t("ACTIVE", "সক্রিয়") : t("PAUSED", "বন্ধ")}
            </span>
            {capi && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-700">
                CAPI
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 font-mono mt-0.5 truncate">
            {row.pixel_id || t("no pixel id", "কোনো pixel id নেই")}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggle}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-semibold shadow-sm ${
              row.enabled
                ? "bg-amber-400 text-amber-900 hover:bg-amber-500"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {row.enabled ? (
              <>
                <PowerOff className="w-4 h-4" /> {t("Disable", "বন্ধ")}
              </>
            ) : (
              <>
                <Power className="w-4 h-4" /> {t("Enable", "চালু")}
              </>
            )}
          </button>
          <Link
            to="/admin/fb-pixel/$id"
            params={{ id: row.id }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="w-4 h-4" /> {t("Edit", "এডিট")}
          </Link>
          <button
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600"
          >
            <Trash2 className="w-4 h-4" /> {t("Delete", "ডিলিট")}
          </button>
        </div>
      </div>
    </div>
  );
}
