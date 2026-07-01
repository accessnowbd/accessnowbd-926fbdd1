import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Save, Loader2, PartyPopper, Eye, RotateCcw, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WelcomeBanner, type WelcomeBannerData } from "@/components/WelcomeBanner";

export const Route = createFileRoute("/admin/welcome-banner")({
  component: WelcomeBannerAdminPage,
});

const PRESETS: { name: string; from: string; to: string }[] = [
  { name: "Violet Pink", from: "#8b5cf6", to: "#ec4899" },
  { name: "Indigo Sky", from: "#4f46e5", to: "#0ea5e9" },
  { name: "Emerald Teal", from: "#10b981", to: "#14b8a6" },
  { name: "Amber Rose", from: "#f59e0b", to: "#f43f5e" },
  { name: "Slate Dark", from: "#1e293b", to: "#475569" },
  { name: "Fuchsia Orange", from: "#d946ef", to: "#f97316" },
];

const EMOJIS = ["👋", "🎉", "🎁", "✨", "🚀", "🔥", "💎", "⚡", "🎊", "❤️", "🌟", "💌"];

const DEFAULTS: Required<WelcomeBannerData> = {
  enabled: true,
  title: "স্বাগতম AccessNow BD-তে!",
  message: "সেরা দামে প্রিমিয়াম সাবস্ক্রিপশন উপভোগ করুন।",
  emoji: "👋",
  bg_from: "#8b5cf6",
  bg_to: "#ec4899",
  text_color: "#ffffff",
  icon_bg: "rgba(255,255,255,0.2)",
  dismissible: true,
  version: 1,
};

function WelcomeBannerAdminPage() {
  const [data, setData] = useState<Required<WelcomeBannerData>>(DEFAULTS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("admin_records").select("*").eq("kind", "welcome_banner").limit(1);
    if (error) toast.error(error.message);
    const row = rows?.[0];
    if (row) {
      setRecordId(row.id);
      setData({ ...DEFAULTS, ...((row.data ?? {}) as WelcomeBannerData) });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof WelcomeBannerData>(k: K, v: Required<WelcomeBannerData>[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { kind: "welcome_banner", data: data as never, is_active: data.enabled };
    const op = recordId
      ? supabase.from("admin_records").update(payload).eq("id", recordId)
      : supabase.from("admin_records").insert(payload).select().single();
    const { error, data: saved } = await op as any;
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!recordId && saved?.id) setRecordId(saved.id);
    toast.success("Welcome banner সংরক্ষণ হয়েছে");
  };

  const resetDismissals = () => {
    set("version", (data.version || 1) + 1);
    toast.success("Version bumped — সব user আবার banner দেখবে");
  };

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
          <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center text-pink-600">
            <PartyPopper className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--admin-ink)" }}>Welcome Banner</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-muted)" }}>Dashboard-এর উপরে যে welcome banner দেখায় সেটা এখান থেকে কাস্টমাইজ করুন</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="a-save-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
          <Eye className="w-3.5 h-3.5" /> Live Preview
        </div>
        <PreviewInline data={data} />
      </div>

      {/* Enable + Dismissible */}
      <div className="grid md:grid-cols-2 gap-3">
        <ToggleCard
          label="Banner Enabled"
          desc="Off করলে dashboard-এ banner দেখাবে না"
          checked={data.enabled}
          onChange={(v) => set("enabled", v)}
        />
        <ToggleCard
          label="Dismissible"
          desc="User X বাটনে ক্লিক করে বন্ধ করতে পারবে"
          checked={data.dismissible}
          onChange={(v) => set("dismissible", v)}
        />
      </div>

      {/* Content */}
      <Section title="Content" icon={<Sparkles className="w-4 h-4" />}>
        <div className="grid md:grid-cols-[120px_1fr] gap-3">
          <Field label="Emoji / Icon">
            <input
              value={data.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-2xl text-center"
              maxLength={4}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set("emoji", em)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-lg grid place-items-center"
                >
                  {em}
                </button>
              ))}
            </div>
          </Field>
          <div className="space-y-3">
            <Field label="Title">
              <input
                value={data.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="স্বাগতম!"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={data.message}
                onChange={(e) => set("message", e.target.value)}
                rows={2}
                placeholder="Welcome message..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white resize-none"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Appearance" icon={<div className="w-4 h-4 rounded-full" style={{ background: `linear-gradient(135deg, ${data.bg_from}, ${data.bg_to})` }} />}>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Gradient Presets</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PRESETS.map((p) => {
                const active = data.bg_from === p.from && data.bg_to === p.to;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => { set("bg_from", p.from); set("bg_to", p.to); }}
                    className={`rounded-xl p-3 text-white text-xs font-bold text-left border-2 transition ${active ? "border-slate-800 shadow-md" : "border-transparent"}`}
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <ColorField label="Gradient From" value={data.bg_from} onChange={(v) => set("bg_from", v)} />
            <ColorField label="Gradient To" value={data.bg_to} onChange={(v) => set("bg_to", v)} />
            <ColorField label="Text Color" value={data.text_color} onChange={(v) => set("text_color", v)} />
          </div>
        </div>
      </Section>

      {/* Reset dismissals */}
      <Section title="Advanced" icon={<RotateCcw className="w-4 h-4" />}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-bold text-slate-800">Reset all user dismissals</div>
            <div className="text-xs text-slate-500 mt-0.5">Version bump করলে যারা আগে close করেছিল তারাও আবার banner দেখবে (Current version: v{data.version})</div>
          </div>
          <button
            type="button"
            onClick={resetDismissals}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Bump Version
          </button>
        </div>
      </Section>
    </div>
  );
}

function PreviewInline({ data }: { data: Required<WelcomeBannerData> }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-lg border border-white/20"
      style={{
        background: `linear-gradient(135deg, ${data.bg_from}, ${data.bg_to})`,
        color: data.text_color,
      }}
    >
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 bg-white" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="relative flex items-start gap-4 p-4 md:p-5">
        <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl grid place-items-center text-2xl md:text-3xl" style={{ background: data.icon_bg }}>
          {data.emoji || "👋"}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-extrabold text-base md:text-lg leading-tight">{data.title || "Title"}</h3>
          {data.message && <p className="mt-1 text-xs md:text-sm opacity-95">{data.message}</p>}
        </div>
        {data.dismissible && (
          <button className="absolute top-2 right-2 p-1.5 rounded-lg" style={{ color: data.text_color }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4 text-sm font-extrabold text-slate-800">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 border border-slate-200 rounded-lg bg-white px-2 py-1.5">
        <input type="color" value={value.startsWith("#") ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 outline-none text-sm font-mono" />
      </div>
    </Field>
  );
}

function ToggleCard({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-bold text-slate-800">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
