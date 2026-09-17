import { createFileRoute } from "@tanstack/react-router";
import { adminFetch } from "@/lib/admin-fetch";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Gift, Save, Loader2, Sparkles, Wand2, Plus, Trash2,
  RefreshCw, ExternalLink, Layers, Coins, MessageSquare, FileText, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/referral")({
  component: ReferralAdminPage,
  head: () => ({
    meta: [
      { title: "Referral Program — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Highlight = { value: string; label: string };
type ReferralConfig = {
  enabled: boolean;
  referrer_reward: number;
  referee_reward: number;
  commission_percent: number;
  min_purchase: number;
  max_uses: number;
  hero_title: string;
  hero_subtitle: string;
  share_message: string;
  terms: string;
  highlights: Highlight[];
};

const DEFAULTS: ReferralConfig = {
  enabled: true,
  referrer_reward: 50,
  referee_reward: 50,
  commission_percent: 5,
  min_purchase: 0,
  max_uses: 0,
  hero_title: "বন্ধুকে রেফার করুন, ক্যাশব্যাক পান",
  hero_subtitle: "আপনার লিংক শেয়ার করুন — বন্ধু কিনলে দুজনেই রিওয়ার্ড পাবেন",
  share_message: "AccessNow BD-তে সেরা দামে premium subscription পাবেন! আমার রেফারেল লিংক দিয়ে সাইন আপ করে ৳{{referee_reward}} বোনাস নিন 👇",
  terms: "",
  highlights: [
    { value: "৳50", label: "বন্ধু সাইন আপ করলে" },
    { value: "5%", label: "প্রথম অর্ডারে কমিশন" },
    { value: "∞", label: "আনলিমিটেড রেফার" },
  ],
};

type TabKey = "overview" | "rewards" | "copy" | "highlights" | "terms" | "preview";

function ReferralAdminPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [cfg, setCfg] = useState<ReferralConfig>(DEFAULTS);
  const [initial, setInitial] = useState<ReferralConfig>(DEFAULTS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | "terms" | "share" | "hero">(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("admin_records")
      .select("*")
      .eq("kind", "referral_settings")
      .limit(1);
    if (error) toast.error(error.message);
    const row = rows?.[0];
    if (row) {
      setRecordId(row.id);
      const merged = { ...DEFAULTS, ...(row.data as Partial<ReferralConfig>), enabled: row.is_active !== false };
      setCfg(merged);
      setInitial(merged);
    } else {
      setCfg(DEFAULTS);
      setInitial(DEFAULTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(initial), [cfg, initial]);

  const set = <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { kind: "referral_settings", data: cfg as never, is_active: cfg.enabled };
    const op = recordId
      ? supabase.from("admin_records").update(payload).eq("id", recordId)
      : supabase.from("admin_records").insert(payload).select().single();
    const { error, data: saved } = (await op) as any;
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!recordId && saved?.id) setRecordId(saved.id);
    setInitial(cfg);
    toast.success("Referral program updated");
  };

  const resetAll = () => {
    if (!confirm("ডিফল্টে ফিরিয়ে আনবেন?")) return;
    setCfg(DEFAULTS);
  };

  const runAi = async (
    kind: "terms" | "share" | "hero",
    system: string,
    input: string,
  ) => {
    setAiBusy(kind);
    try {
      const res = await adminFetch("/api/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, input, temperature: 0.8, maxTokens: 900 }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "AI failed");
      const text = (j.text || "").trim();
      if (!text) throw new Error("Empty response");
      if (kind === "terms") set("terms", text);
      if (kind === "share") set("share_message", text);
      if (kind === "hero") {
        const [line1, ...rest] = text.split(/\n+/).filter(Boolean);
        set("hero_title", (line1 || "").replace(/^["'*#\s]+|["'*\s]+$/g, ""));
        if (rest.length) set("hero_subtitle", rest.join(" ").replace(/^["'*#\s]+|["'*\s]+$/g, ""));
      }
      toast.success("AI দিয়ে জেনারেট হয়েছে");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiBusy(null);
    }
  };

  const context = `Program config:\n- Referrer reward: ৳${cfg.referrer_reward}\n- New-user signup bonus: ৳${cfg.referee_reward}\n- Commission on first order: ${cfg.commission_percent}%\n- Minimum first purchase: ৳${cfg.min_purchase}\n- Max uses per user: ${cfg.max_uses || "unlimited"}`;

  const aiTerms = () => runAi("terms",
    "You write clear, friendly Terms & Conditions for an e-commerce referral program in Bangladesh. Use Bengali (Bangla) with occasional English words. Return 6-10 short numbered points. No preamble.",
    `${context}\n\nWrite the T&C now.`);
  const aiShare = () => runAi("share",
    "You write a short, punchy share message for a referral program. Use Bangla with light emoji. Return ONE line only, under 200 characters. Include the placeholder {{referee_reward}} where the bonus amount belongs. No quotes, no preamble.",
    context);
  const aiHero = () => runAi("hero",
    "You write hero copy for a referral program landing card. Return exactly TWO lines: line 1 is a catchy Bangla title (max 6 words), line 2 is a supportive Bangla subtitle (max 14 words). No labels, no quotes, no markdown.",
    context);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-fuchsia-600" />
            Referral Program
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            পুরো রেফারেল সিস্টেম এখান থেকে নিয়ন্ত্রণ করুন — enable/disable, rewards, hero copy, share message, highlights, T&C। সবকিছু customer dashboard-এ live দেখাবে।
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Preview site
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
          >
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
              ["rewards", "Rewards & Rules", Coins],
              ["copy", "Hero & Share", MessageSquare],
              ["highlights", "Highlights", Sparkles],
              ["terms", "Terms", FileText],
              ["preview", "Preview", Eye],
            ] as const
          ).map(([k, label, Icon]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`inline-flex items-center gap-2 px-4 h-10 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition ${
                  active
                    ? "border-fuchsia-500 text-fuchsia-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading…
        </div>
      ) : tab === "overview" ? (
        <OverviewTab cfg={cfg} set={set} onReset={resetAll} />
      ) : tab === "rewards" ? (
        <RewardsTab cfg={cfg} set={set} />
      ) : tab === "copy" ? (
        <CopyTab cfg={cfg} set={set} aiBusy={aiBusy} onAiHero={aiHero} onAiShare={aiShare} />
      ) : tab === "highlights" ? (
        <HighlightsTab cfg={cfg} set={set} />
      ) : tab === "terms" ? (
        <TermsTab cfg={cfg} set={set} aiBusy={aiBusy} onAi={aiTerms} />
      ) : (
        <PreviewTab cfg={cfg} />
      )}
    </div>
  );
}

/* ================== TABS ================== */

function OverviewTab({
  cfg, set, onReset,
}: { cfg: ReferralConfig; set: <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => void; onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-fuchsia-50 to-violet-50 border border-fuchsia-200 rounded-2xl p-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-fuchsia-600" />
          Program Status
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Referral program চালু বা বন্ধ করুন। বন্ধ থাকলে customer dashboard-এ "বন্ধ রয়েছে" বার্তা দেখাবে।
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-bold text-slate-900">Referral Program</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {cfg.enabled ? "চালু আছে — কাস্টমাররা লিংক শেয়ার করতে পারবে" : "বন্ধ আছে — dashboard-এ hidden"}
          </div>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={cfg.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="h-5 w-5 accent-fuchsia-600"
          />
          <span className={`text-sm font-semibold ${cfg.enabled ? "text-emerald-700" : "text-slate-500"}`}>
            {cfg.enabled ? "Active" : "Disabled"}
          </span>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Referrer reward" value={`৳${cfg.referrer_reward}`} />
        <StatCard label="Signup bonus" value={`৳${cfg.referee_reward}`} />
        <StatCard label="Commission" value={`${cfg.commission_percent}%`} />
        <StatCard label="Min purchase" value={cfg.min_purchase ? `৳${cfg.min_purchase}` : "—"} />
      </div>

      <div className="pt-2">
        <button
          onClick={onReset}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Reset all to defaults
        </button>
      </div>
    </div>
  );
}

function RewardsTab({
  cfg, set,
}: { cfg: ReferralConfig; set: <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => void }) {
  return (
    <Panel title="Rewards & Rules" icon={<Coins className="w-4 h-4 text-fuchsia-600" />}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NumField label="Referrer পাবে (৳)" hint="বন্ধু প্রথম অর্ডার শেষ করলে যত টাকা credit হবে"
          value={cfg.referrer_reward} onChange={(v) => set("referrer_reward", v)} />
        <NumField label="Signup bonus নতুন user (৳)" hint="রেফারেল লিংকে সাইন আপ করলেই wallet-এ credit"
          value={cfg.referee_reward} onChange={(v) => set("referee_reward", v)} />
        <NumField label="Commission %" hint="বন্ধুর প্রথম অর্ডারের % হিসাবে অতিরিক্ত reward"
          value={cfg.commission_percent} onChange={(v) => set("commission_percent", v)} />
        <NumField label="Min purchase (৳)" hint="এর কম হলে reward মিলবে না; 0 মানে কোনো limit নেই"
          value={cfg.min_purchase} onChange={(v) => set("min_purchase", v)} />
        <NumField label="Max uses / user" hint="0 = আনলিমিটেড"
          value={cfg.max_uses} onChange={(v) => set("max_uses", v)} />
      </div>
    </Panel>
  );
}

function CopyTab({
  cfg, set, aiBusy, onAiHero, onAiShare,
}: {
  cfg: ReferralConfig;
  set: <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => void;
  aiBusy: null | "terms" | "share" | "hero";
  onAiHero: () => void;
  onAiShare: () => void;
}) {
  return (
    <div className="space-y-5">
      <Panel
        title="Hero Copy"
        icon={<Wand2 className="w-4 h-4 text-violet-600" />}
        action={<AiBtn busy={aiBusy === "hero"} onClick={onAiHero} label="AI দিয়ে লিখুন" />}
      >
        <div className="grid gap-3">
          <TextField label="Title" value={cfg.hero_title} onChange={(v) => set("hero_title", v)} />
          <TextField label="Subtitle" value={cfg.hero_subtitle} onChange={(v) => set("hero_subtitle", v)} />
        </div>
      </Panel>

      <Panel
        title="Share Message"
        icon={<Wand2 className="w-4 h-4 text-sky-600" />}
        action={<AiBtn busy={aiBusy === "share"} onClick={onAiShare} label="AI দিয়ে লিখুন" />}
      >
        <p className="text-[11px] text-slate-500 mb-2">
          Placeholders: <code className="px-1 bg-slate-100 rounded">{"{{referee_reward}}"}</code>{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{referrer_reward}}"}</code>{" "}
          <code className="px-1 bg-slate-100 rounded">{"{{code}}"}</code>
        </p>
        <textarea
          value={cfg.share_message}
          onChange={(e) => set("share_message", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
        />
      </Panel>
    </div>
  );
}

function HighlightsTab({
  cfg, set,
}: { cfg: ReferralConfig; set: <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => void }) {
  return (
    <Panel
      title="Highlight Cards"
      icon={<Sparkles className="w-4 h-4 text-emerald-600" />}
      action={
        <button
          onClick={() => set("highlights", [...cfg.highlights, { value: "", label: "" }])}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
        >
          <Plus className="w-3.5 h-3.5" /> Add card
        </button>
      }
    >
      <div className="grid gap-3">
        {cfg.highlights.map((h, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
            <input
              value={h.value}
              onChange={(e) => {
                const next = [...cfg.highlights];
                next[i] = { ...next[i], value: e.target.value };
                set("highlights", next);
              }}
              placeholder="৳50 / 5% / ∞"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-900"
            />
            <input
              value={h.label}
              onChange={(e) => {
                const next = [...cfg.highlights];
                next[i] = { ...next[i], label: e.target.value };
                set("highlights", next);
              }}
              placeholder="Description (Bangla/English)"
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700"
            />
            <button
              onClick={() => set("highlights", cfg.highlights.filter((_, j) => j !== i))}
              className="h-10 w-10 grid place-items-center rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50"
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {cfg.highlights.length === 0 && (
          <p className="text-xs text-slate-400">কোনো highlight card নেই।</p>
        )}
      </div>
    </Panel>
  );
}

function TermsTab({
  cfg, set, aiBusy, onAi,
}: {
  cfg: ReferralConfig;
  set: <K extends keyof ReferralConfig>(k: K, v: ReferralConfig[K]) => void;
  aiBusy: null | "terms" | "share" | "hero";
  onAi: () => void;
}) {
  return (
    <Panel
      title="Terms & Conditions"
      icon={<FileText className="w-4 h-4 text-amber-600" />}
      action={<AiBtn busy={aiBusy === "terms"} onClick={onAi} label="AI দিয়ে লিখুন" />}
    >
      <textarea
        value={cfg.terms}
        onChange={(e) => set("terms", e.target.value)}
        rows={14}
        placeholder="Terms & conditions লিখুন অথবা AI দিয়ে জেনারেট করুন…"
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono"
      />
    </Panel>
  );
}

function PreviewTab({ cfg }: { cfg: ReferralConfig }) {
  return (
    <Panel title="Live Preview" icon={<Eye className="w-4 h-4 text-fuchsia-600" />}>
      {!cfg.enabled ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Program বন্ধ — dashboard-এ "বন্ধ রয়েছে" বার্তা দেখাবে।
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-fuchsia-50 to-violet-50 p-5">
          <div className="text-lg font-extrabold text-slate-900">{cfg.hero_title}</div>
          <div className="text-sm text-slate-600 mt-1">{cfg.hero_subtitle}</div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {cfg.highlights.map((h, i) => (
              <div key={i} className="rounded-xl bg-white border border-slate-200 p-3 text-center">
                <div className="text-xl font-bold text-slate-900">{h.value || "—"}</div>
                <div className="text-[11px] text-slate-500">{h.label || "—"}</div>
              </div>
            ))}
          </div>
          {cfg.share_message && (
            <div className="mt-4 rounded-xl bg-white/70 border border-slate-200 p-3 text-sm text-slate-700 italic">
              "{renderShare(cfg)}"
            </div>
          )}
          {cfg.terms && (
            <div className="mt-4 rounded-xl bg-white/70 border border-slate-200 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Terms & Conditions</div>
              <pre className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">{cfg.terms}</pre>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function renderShare(c: ReferralConfig) {
  return c.share_message
    .replace(/\{\{\s*referee_reward\s*\}\}/g, String(c.referee_reward))
    .replace(/\{\{\s*referrer_reward\s*\}\}/g, String(c.referrer_reward))
    .replace(/\{\{\s*code\s*\}\}/g, "ABCD1234");
}

/* ---------- Primitives ---------- */

function Panel({
  title, icon, action, children,
}: { title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-2">
          {icon}
          {title}
        </h3>
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

function NumField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        value={value}
        min={0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
      />
      {hint && <span className="text-[11px] text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function TextField({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
      />
    </label>
  );
}

function AiBtn({ busy, onClick, label }: { busy: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
