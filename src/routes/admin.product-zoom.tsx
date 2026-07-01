import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, ZoomIn, Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_ZOOM_CONFIG, type ProductZoomConfig } from "@/hooks/useProductZoomConfig";

export const Route = createFileRoute("/admin/product-zoom")({
  component: ProductZoomAdminPage,
});

const EASINGS = [
  { label: "Smooth (default)", value: "cubic-bezier(0.22, 1, 0.36, 1)" },
  { label: "Ease Out", value: "ease-out" },
  { label: "Ease In-Out", value: "ease-in-out" },
  { label: "Linear", value: "linear" },
  { label: "Spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
];

const DEMO_IMG = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80";

function ProductZoomAdminPage() {
  const [data, setData] = useState<ProductZoomConfig>(DEFAULT_ZOOM_CONFIG);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("admin_records").select("*").eq("kind", "product_zoom").limit(1);
    if (error) toast.error(error.message);
    const row = rows?.[0];
    if (row) {
      setRecordId(row.id);
      setData({ ...DEFAULT_ZOOM_CONFIG, ...((row.data ?? {}) as Partial<ProductZoomConfig>) });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof ProductZoomConfig>(k: K, v: ProductZoomConfig[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { kind: "product_zoom", data: data as never, is_active: data.enabled };
    const op = recordId
      ? supabase.from("admin_records").update(payload).eq("id", recordId)
      : supabase.from("admin_records").insert(payload).select().single();
    const { error, data: saved } = await op as any;
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!recordId && saved?.id) setRecordId(saved.id);
    toast.success("Zoom সেটিংস সংরক্ষণ হয়েছে");
  };

  const reset = () => setData(DEFAULT_ZOOM_CONFIG);

  if (loading) {
    return (
      <div className="grid place-items-center h-64" style={{ color: "var(--admin-muted)" }}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-100 grid place-items-center text-violet-600">
            <ZoomIn className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--admin-ink)" }}>Product Image Zoom</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-muted)" }}>Product page-এ image-এর উপর zoom effect customize করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={save} disabled={saving} className="a-save-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
          <Eye className="w-3.5 h-3.5" /> Live Preview — {data.trigger === "hover" ? "Hover" : "Click"} the image
        </div>
        <ZoomPreview cfg={data} />
      </div>

      {/* Enable */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">Enable Image Zoom</div>
          <div className="text-xs text-slate-500 mt-0.5">Off করলে product image-এ কোনো zoom effect হবে না</div>
        </div>
        <button
          type="button"
          onClick={() => set("enabled", !data.enabled)}
          className={`relative w-11 h-6 rounded-full transition ${data.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
          aria-pressed={data.enabled}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${data.enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* Trigger */}
      <Section title="Trigger" desc="কীভাবে zoom activate হবে">
        <div className="grid grid-cols-2 gap-2">
          {(["hover", "click"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("trigger", t)}
              className={`p-3 rounded-xl border-2 text-sm font-bold text-left transition ${
                data.trigger === t
                  ? "border-violet-500 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="capitalize">{t}</div>
              <div className="text-[11px] font-normal opacity-70 mt-0.5">
                {t === "hover" ? "Desktop-এ mouse রাখলে zoom হবে" : "Click/tap করলে zoom on-off হবে (mobile-friendly)"}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* Scale */}
      <Section title="Zoom Level" desc={`Image কতটুকু বড় হবে (Current: ${data.scale.toFixed(2)}×)`}>
        <input
          type="range"
          min={1.1}
          max={3}
          step={0.05}
          value={data.scale}
          onChange={(e) => set("scale", Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>1.1× (subtle)</span>
          <span>2× (medium)</span>
          <span>3× (extreme)</span>
        </div>
      </Section>

      {/* Speed */}
      <Section title="Transition Speed" desc={`Zoom animation-এর duration (Current: ${data.duration_ms}ms)`}>
        <input
          type="range"
          min={100}
          max={1500}
          step={50}
          value={data.duration_ms}
          onChange={(e) => set("duration_ms", Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>100ms (fast)</span>
          <span>500ms (smooth)</span>
          <span>1500ms (slow)</span>
        </div>
      </Section>

      {/* Easing */}
      <Section title="Easing / Motion Curve" desc="Animation কেমন feel হবে">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EASINGS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => set("easing", e.value)}
              className={`p-2.5 rounded-lg border text-sm font-semibold text-left transition ${
                data.easing === e.value
                  ? "border-violet-500 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div>{e.label}</div>
              <div className="text-[10px] font-mono opacity-60 mt-0.5 truncate">{e.value}</div>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-3">
        <div className="text-sm font-extrabold text-slate-800">{title}</div>
        {desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function ZoomPreview({ cfg }: { cfg: ProductZoomConfig }) {
  const [clicked, setClicked] = useState(false);
  const active = cfg.enabled && (cfg.trigger === "click" ? clicked : undefined);
  return (
    <div className="max-w-sm mx-auto">
      <div
        className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm group cursor-zoom-in"
        onMouseMove={(e) => {
          if (cfg.trigger !== "hover") return;
          const el = e.currentTarget;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
          el.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        onClick={() => cfg.trigger === "click" && setClicked((v) => !v)}
      >
        <img
          src={DEMO_IMG}
          alt="Zoom preview"
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${cfg.enabled && cfg.trigger === "hover" ? "group-hover:scale-[var(--zs)]" : ""} ${active ? "scale-[var(--zs)]" : ""}`}
          style={{
            transformOrigin: "var(--zx, 50%) var(--zy, 50%)",
            transitionProperty: "transform",
            transitionDuration: `${cfg.duration_ms}ms`,
            transitionTimingFunction: cfg.easing,
            ["--zs" as never]: cfg.scale,
          }}
        />
      </div>
      <p className="text-center text-[11px] text-slate-500 mt-2">
        {cfg.trigger === "hover" ? "Mouse রাখুন image-এর উপর" : "Image-এ click করুন zoom toggle করতে"}
      </p>
    </div>
  );
}
