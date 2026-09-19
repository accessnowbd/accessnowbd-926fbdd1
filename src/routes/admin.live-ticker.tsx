import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, Zap, Megaphone, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { AdminGlassCard } from "@/components/admin/AdminStatCard";
import { ProductPicker } from "@/components/admin/ProductPicker";
import { useProducts } from "@/hooks/useProducts";
import {
  DEFAULT_LIVE_TICKER,
  fetchLiveTickerConfig,
  saveLiveTickerConfig,
  type LiveTickerConfig,
} from "@/lib/live-ticker";

export const Route = createFileRoute("/admin/live-ticker")({
  component: AdminLiveTicker,
});

function AdminLiveTicker() {
  const [cfg, setCfg] = useState<LiveTickerConfig>(DEFAULT_LIVE_TICKER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { products } = useProducts();

  useEffect(() => {
    fetchLiveTickerConfig()
      .then(setCfg)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await saveLiveTickerConfig(cfg);
      toast.success("Saved — সাইটে লাইভ হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setPromo = (patch: Partial<LiveTickerConfig["promo"]>) =>
    setCfg((c) => ({ ...c, promo: { ...c.promo, ...patch } }));
  const setLive = (patch: Partial<LiveTickerConfig["live"]>) =>
    setCfg((c) => ({ ...c, live: { ...c.live, ...patch } }));

  if (loading) {
    return (
      <div className="p-10 grid place-items-center text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const nameOf = (slug: string) => products.find((p) => p.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Live Ticker &amp; Promo Bar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            উপরের প্রোমো মেসেজ আর হোমপেজের LIVE প্রাইস স্ট্রিপ — সব এখান থেকে কন্ট্রোল হবে।
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 h-10 rounded-xl bg-slate-900 ring-1 ring-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {/* PROMO BAR */}
      <AdminGlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-slate-900 inline-flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-slate-500" /> Top Promo Messages
          </h2>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cfg.promo.enabled}
              onChange={(e) => setPromo({ enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>

        <label className="block max-w-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
            Scroll speed (সেকেন্ড, বেশি = ধীর)
          </span>
          <input
            type="number"
            min={10}
            max={200}
            value={cfg.promo.speed}
            onChange={(e) => setPromo({ speed: Number(e.target.value) })}
            className="lt-input mt-1"
          />
        </label>

        <div className="space-y-2">
          {cfg.promo.messages.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <input
                value={m.text}
                onChange={(e) => {
                  const next = [...cfg.promo.messages];
                  next[i] = { ...m, text: e.target.value };
                  setPromo({ messages: next });
                }}
                className="lt-input"
                placeholder="যেমন: সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি"
              />
              <label className="inline-flex items-center gap-1 text-xs text-slate-600 shrink-0">
                <input
                  type="checkbox"
                  checked={m.enabled}
                  onChange={(e) => {
                    const next = [...cfg.promo.messages];
                    next[i] = { ...m, enabled: e.target.checked };
                    setPromo({ messages: next });
                  }}
                />
                On
              </label>
              <button
                onClick={() => setPromo({ messages: cfg.promo.messages.filter((_, j) => j !== i) })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0"
                aria-label="Remove message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setPromo({ messages: [...cfg.promo.messages, { text: "", enabled: true }] })}
            className="px-3 h-9 rounded-full ring-1 ring-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add message
          </button>
        </div>
      </AdminGlassCard>

      {/* LIVE PRODUCT TICKER */}
      <AdminGlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-slate-900 inline-flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-500" /> LIVE Product Price Strip
          </h2>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={cfg.live.enabled}
              onChange={(e) => setLive({ enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Badge label</span>
            <input
              value={cfg.live.label}
              onChange={(e) => setLive({ label: e.target.value })}
              className="lt-input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Speed (sec)</span>
            <input
              type="number"
              min={10}
              max={300}
              value={cfg.live.speed}
              onChange={(e) => setLive({ speed: Number(e.target.value) })}
              className="lt-input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Max items</span>
            <input
              type="number"
              min={1}
              max={80}
              value={cfg.live.maxItems}
              onChange={(e) => setLive({ maxItems: Number(e.target.value) })}
              className="lt-input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Products</span>
            <select
              value={cfg.live.mode}
              onChange={(e) => setLive({ mode: e.target.value as "auto" | "manual" })}
              className="lt-input mt-1"
            >
              <option value="auto">Auto — সব active প্রোডাক্ট</option>
              <option value="manual">Manual — আমি বেছে দিব</option>
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={cfg.live.showDiscount}
            onChange={(e) => setLive({ showDiscount: e.target.checked })}
          />
          ডিসকাউন্ট (%) দেখাও
        </label>

        {cfg.live.mode === "manual" && (
          <div className="space-y-3">
            <ProductPicker
              value=""
              onChange={(slug) => {
                if (!slug || cfg.live.pickedSlugs.includes(slug)) return;
                setLive({ pickedSlugs: [...cfg.live.pickedSlugs, slug] });
              }}
              placeholder="— প্রোডাক্ট যোগ করো —"
            />
            <div className="flex flex-wrap gap-2">
              {cfg.live.pickedSlugs.map((slug) => (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 rounded-full ring-1 ring-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {nameOf(slug)}
                  <button
                    onClick={() => setLive({ pickedSlugs: cfg.live.pickedSlugs.filter((s) => s !== slug) })}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label={`Remove ${nameOf(slug)}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {cfg.live.pickedSlugs.length === 0 && (
                <span className="text-xs text-slate-500">কোনো প্রোডাক্ট বেছে নেওয়া হয়নি — Auto মতো সব দেখাবে।</span>
              )}
            </div>
          </div>
        )}
      </AdminGlassCard>

      <style>{`
        .lt-input { width: 100%; background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:8px 12px; color:#0f172a; font-size:13px; outline:none; }
        .lt-input:focus { border-color:#94a3b8; box-shadow:0 0 0 3px rgba(100,116,139,0.12); }
      `}</style>
    </div>
  );
}
