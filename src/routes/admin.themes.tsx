import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, type ThemeId } from "@/context/ThemeContext";
import { useAdminLang } from "@/context/AdminLangContext";

export const Route = createFileRoute("/admin/themes")({
  component: AdminThemesPage,
  head: () => ({ meta: [{ title: "Themes — Admin" }] }),
});

type Row = { id: string; data: { id: ThemeId; name?: string; description?: string }; is_active: boolean };

function AdminThemesPage() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("admin_records")
        .select("id,data,is_active")
        .eq("kind", "theme_config")
        .order("sort_order");
      if (!alive) return;
      if (error) {
        toast.error(error.message);
      } else {
        setRows((data ?? []) as Row[]);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const toggle = async (row: Row) => {
    // Always keep at least the White theme on as a safe fallback.
    if (row.data.id === "white" && row.is_active) {
      toast.error(t("White theme cannot be disabled — it is the default fallback.", "White theme বন্ধ করা যাবে না — এটি default fallback।"));
      return;
    }
    setSaving(row.id);
    const next = !row.is_active;
    const { error } = await supabase
      .from("admin_records")
      .update({ is_active: next })
      .eq("id", row.id);
    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_active: next } : r)));
    toast.success(next
      ? t(`${row.data.name ?? row.data.id} enabled`, `${row.data.name ?? row.data.id} চালু করা হয়েছে`)
      : t(`${row.data.name ?? row.data.id} disabled`, `${row.data.name ?? row.data.id} বন্ধ করা হয়েছে`));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white shadow-md">
            <Palette className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("System", "সিস্টেম")}</div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{t("Themes", "থিম")}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {t(
                "Turn website themes on or off. When a theme is OFF, the theme switcher in the header hides it. If only one theme is enabled, the switcher is hidden entirely.",
                "ওয়েবসাইটের theme গুলো on/off করুন। কোনো theme off থাকলে header-এর theme switcher-এ সেটি দেখানো হবে না। মাত্র একটি theme enabled থাকলে switcher-টি পুরোপুরি hide হয়ে যাবে।"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("No themes configured.", "কোনো theme configure করা নেই।")}</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const meta = THEMES.find((th) => th.id === row.data.id);
              const isWhite = row.data.id === "white";
              const isBusy = saving === row.id;
              return (
                <li key={row.id} className="flex items-center gap-4 p-5">
                  <span
                    aria-hidden
                    className="shrink-0 w-12 h-12 rounded-xl ring-1 ring-slate-200 shadow-inner"
                    style={{ backgroundImage: meta?.swatch ?? "linear-gradient(135deg,#888,#444)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{row.data.name ?? row.data.id}</span>
                      {row.is_active && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <Check className="w-3 h-3" /> {t("Active", "চালু")}
                        </span>
                      )}
                      {isWhite && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                          {t("Default", "ডিফল্ট")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{row.data.description ?? meta?.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy || (isWhite && row.is_active)}
                    onClick={() => toggle(row)}
                    aria-pressed={row.is_active}
                    title={isWhite && row.is_active ? t("White theme cannot be disabled", "White theme বন্ধ করা যাবে না") : undefined}
                    className={[
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      row.is_active ? "bg-emerald-500" : "bg-slate-300",
                      isBusy || (isWhite && row.is_active) ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition",
                        row.is_active ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
