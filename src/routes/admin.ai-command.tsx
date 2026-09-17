import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles, Plus, Play, Trash2, Pencil, Loader2, X, Save, Copy, Check,
  Wand2, Search, Zap, Terminal, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const Route = createFileRoute("/admin/ai-command")({
  component: AdminAICommandCenter,
});

type CommandData = {
  name: string;
  trigger?: string;
  prompt: string;
  model?: string;
  category?: string;
  temperature?: number;
  max_tokens?: number;
  description?: string;
};

type CommandRow = {
  id: string;
  kind: string;
  data: CommandData;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

const KIND = "ai_command";

const MODEL_OPTIONS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash — Fast (default)" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite — Cheapest" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro — Smartest Gemini" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano — Fast & cheap" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini — Balanced" },
  { value: "openai/gpt-5", label: "GPT-5 — Most capable" },
];

const CATEGORIES = [
  { value: "content", label: "Content" },
  { value: "seo", label: "SEO" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" },
];

const STARTER_TEMPLATES: CommandData[] = [
  {
    name: "Product Description Writer",
    trigger: "product-desc",
    category: "product",
    model: "google/gemini-2.5-flash",
    description: "Bangla product description তৈরি করে",
    prompt:
      "You write high-converting product descriptions in Bangla for a Bangladeshi ecommerce store. Given the product name/details from the user, output: 1) 2-line hook, 2) 4-6 bullet features, 3) short CTA. Keep tone warm and trustworthy. Use natural Bangla, avoid over-the-top claims.",
    temperature: 0.8,
    max_tokens: 800,
  },
  {
    name: "SEO Meta Generator",
    trigger: "seo-meta",
    category: "seo",
    model: "google/gemini-2.5-flash-lite",
    description: "Title + meta description generate করে",
    prompt:
      "Given a page topic from the user, output ONLY:\nTitle: <under 60 chars, primary keyword>\nDescription: <under 155 chars, compelling>\nKeywords: <5-8 comma separated>\nNo extra commentary.",
    temperature: 0.5,
    max_tokens: 300,
  },
  {
    name: "Customer Reply (Bangla)",
    trigger: "reply-bn",
    category: "support",
    model: "google/gemini-2.5-flash",
    description: "কাস্টমার মেসেজের polite reply",
    prompt:
      "You are a polite Bangladeshi customer support agent. Read the customer message and write a warm, helpful reply in Bangla. Be concise (3-6 sentences), acknowledge their concern, give a clear next step, end with a friendly close.",
    temperature: 0.7,
    max_tokens: 400,
  },
  {
    name: "Ad Copy (Facebook)",
    trigger: "fb-ad",
    category: "marketing",
    model: "google/gemini-2.5-flash",
    description: "Facebook ad copy generate করে",
    prompt:
      "Write 3 Facebook ad copy variations in Bangla for the given product/offer. Each variation:\n- 1 hook line\n- 2-3 line body\n- 1 CTA\nSeparate with '---'. No hashtags.",
    temperature: 0.9,
    max_tokens: 600,
  },
];

const emptyData: CommandData = {
  name: "",
  trigger: "",
  prompt: "",
  model: "google/gemini-2.5-flash",
  category: "content",
  temperature: 0.7,
  max_tokens: 800,
  description: "",
};

function AdminAICommandCenter() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<CommandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ text: string; latency?: number; model?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [editing, setEditing] = useState<CommandRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CommandData>(emptyData);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_records")
      .select("*")
      .eq("kind", KIND)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as any[]) as CommandRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const d = r.data || ({} as CommandData);
      return (
        (d.name || "").toLowerCase().includes(q) ||
        (d.trigger || "").toLowerCase().includes(q) ||
        (d.category || "").toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
      );
    });
  }, [rows, search]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const openNew = () => { setEditing(null); setForm(emptyData); setShowForm(true); };
  const openEdit = (r: CommandRow) => {
    setEditing(r);
    setForm({ ...emptyData, ...r.data });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.prompt.trim()) {
      toast.error(t("Name and prompt are required", "নাম ও প্রম্পট দিতে হবে"));
      return;
    }
    setSaving(true);
    const payload = {
      kind: KIND,
      data: form as any,
      is_active: true,
      sort_order: editing?.sort_order ?? rows.length,
    };
    const q = editing
      ? supabase.from("admin_records").update(payload).eq("id", editing.id)
      : supabase.from("admin_records").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? t("Updated", "আপডেট হয়েছে") : t("Created", "তৈরি হয়েছে"));
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("Delete this command?", "এই কমান্ড মুছবেন?"))) return;
    const { error } = await supabase.from("admin_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (selectedId === id) setSelectedId(null);
    load();
  };

  const toggleActive = async (r: CommandRow) => {
    const { error } = await supabase
      .from("admin_records")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const seedStarters = async () => {
    if (!confirm(t("Add 4 starter commands?", "৪টি স্টার্টার কমান্ড যোগ করবেন?"))) return;
    const rows = STARTER_TEMPLATES.map((d, i) => ({
      kind: KIND,
      data: d as any,
      is_active: true,
      sort_order: i,
    }));
    const { error } = await supabase.from("admin_records").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(t("Starter commands added", "স্টার্টার কমান্ড যোগ হয়েছে"));
    load();
  };

  const run = async () => {
    if (!selected) return toast.error(t("Select a command first", "প্রথমে একটি কমান্ড সিলেক্ট করুন"));
    if (!input.trim()) return toast.error(t("Enter some input", "ইনপুট দিন"));
    setRunning(true);
    setError(null);
    setOutput(null);
    try {
      const res = await adminFetch("/api/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: selected.data.prompt,
          input,
          model: selected.data.model || "google/gemini-2.5-flash",
          temperature: selected.data.temperature ?? 0.7,
          maxTokens: selected.data.max_tokens ?? 800,
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "Failed");
      } else {
        setOutput({ text: j.text, latency: j.latency, model: j.model });
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
    }
    setRunning(false);
  };

  const copyOutput = async () => {
    if (!output?.text) return;
    await navigator.clipboard.writeText(output.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* ============ LEFT: Command list ============ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 grid place-items-center">
                  <Terminal className="w-4 h-4" />
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {t("Commands", "কমান্ড")} <span className="text-slate-400 font-normal">({rows.length})</span>
                </div>
              </div>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> {t("New", "নতুন")}
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search commands…", "কমান্ড খুঁজুন…")}
                className="w-full pl-8 pr-3 h-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-10 grid place-items-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Sparkles className="w-8 h-8 mx-auto text-violet-300 mb-2" />
                <p className="text-sm text-slate-500 mb-3">
                  {rows.length === 0
                    ? t("No commands yet.", "কোনো কমান্ড নেই।")
                    : t("No matches.", "কিছু পাওয়া যায়নি।")}
                </p>
                {rows.length === 0 && (
                  <button
                    onClick={seedStarters}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold border border-violet-200"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> {t("Add starter commands", "স্টার্টার যোগ করুন")}
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const d = r.data || ({} as CommandData);
                  const isSel = r.id === selectedId;
                  return (
                    <li
                      key={r.id}
                      className={`p-3 cursor-pointer transition ${isSel ? "bg-violet-50/70" : "hover:bg-slate-50"}`}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {d.name || t("Untitled", "শিরোনামহীন")}
                            </span>
                            {!r.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                                OFF
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            {d.trigger && (
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">/{d.trigger}</span>
                            )}
                            {d.category && <span>{d.category}</span>}
                          </div>
                          {d.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{d.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleActive(r); }}
                            title={r.is_active ? "Disable" : "Enable"}
                            className="p-1.5 rounded-md hover:bg-white text-slate-500"
                          >
                            <Zap className={`w-3.5 h-3.5 ${r.is_active ? "text-emerald-600" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                            className="p-1.5 rounded-md hover:bg-white text-slate-500"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                            className="p-1.5 rounded-md hover:bg-white text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ============ RIGHT: Runner ============ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col">
          {!selected ? (
            <div className="flex-1 grid place-items-center text-center text-slate-500 py-16">
              <div>
                <Sparkles className="w-10 h-10 mx-auto text-violet-300 mb-3" />
                <p className="text-sm">{t("Select a command from the left to run it.", "বাঁ পাশ থেকে একটি কমান্ড সিলেক্ট করুন।")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">{selected.data.name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {selected.data.model || "google/gemini-2.5-flash"}
                    </span>
                    {selected.data.category && <span>• {selected.data.category}</span>}
                    <span>• temp {selected.data.temperature ?? 0.7}</span>
                  </div>
                  {selected.data.description && (
                    <p className="text-xs text-slate-500 mt-1">{selected.data.description}</p>
                  )}
                </div>
                <button
                  onClick={() => openEdit(selected)}
                  className="shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs text-slate-700"
                >
                  <Pencil className="w-3.5 h-3.5" /> {t("Edit", "এডিট")}
                </button>
              </div>

              <div className="pt-4 space-y-3 flex-1 flex flex-col">
                <label className="text-xs font-semibold text-slate-600">
                  {t("Your input", "আপনার ইনপুট")}
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("Type or paste your input here…", "এখানে ইনপুট লিখুন বা পেস্ট করুন…")}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={run}
                    disabled={running || !input.trim()}
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-sm font-semibold shadow disabled:opacity-50"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running ? t("Running…", "চলছে…") : t("Run command", "রান করুন")}
                  </button>
                  {output && (
                    <button
                      onClick={() => { setOutput(null); setError(null); }}
                      className="inline-flex items-center gap-1 h-10 px-3 rounded-full border border-slate-200 hover:bg-slate-50 text-xs text-slate-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> {t("Clear", "মুছুন")}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {output && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-500">
                        {output.model} • {output.latency}ms
                      </div>
                      <button
                        onClick={copyOutput}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md hover:bg-slate-100 text-xs text-slate-600"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? t("Copied", "কপি হয়েছে") : t("Copy", "কপি")}
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-[400px] overflow-y-auto">
                      {output.text}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ Editor modal ============ */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? t("Edit command", "কমান্ড এডিট") : t("New command", "নতুন কমান্ড")}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">{t("Name", "নাম")} *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">{t("Trigger (short slug)", "ট্রিগার")}</label>
                  <input
                    value={form.trigger || ""}
                    onChange={(e) => setForm({ ...form, trigger: e.target.value.replace(/\s+/g, "-").toLowerCase() })}
                    placeholder="e.g. product-desc"
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">{t("Description", "বর্ণনা")}</label>
                <input
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("Short one-liner", "সংক্ষিপ্ত এক-লাইন")}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  {t("System prompt", "সিস্টেম প্রম্পট")} *
                </label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  rows={7}
                  placeholder={t("Instructions to the AI. Optionally use {{input}} to inject user input.", "AI-কে দেওয়া নির্দেশনা। প্রয়োজনে {{input}} ব্যবহার করে ইনপুট বসান।")}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {t("Tip: include {{input}} in the prompt to embed user input directly. Otherwise, input is sent as a user message.", "টিপ: প্রম্পটে {{input}} লিখলে ইনপুট সরাসরি সেখানে বসবে।")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">{t("Model", "মডেল")}</label>
                  <select
                    value={form.model || "google/gemini-2.5-flash"}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    {MODEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">{t("Category", "ক্যাটাগরি")}</label>
                  <select
                    value={form.category || "content"}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    {CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    {t("Temperature", "টেম্পারেচার")} ({form.temperature ?? 0.7})
                  </label>
                  <input
                    type="range" min={0} max={1.5} step={0.1}
                    value={form.temperature ?? 0.7}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="mt-3 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    {t("Max tokens", "সর্বোচ্চ টোকেন")}
                  </label>
                  <input
                    type="number" min={32} max={4000} step={32}
                    value={form.max_tokens ?? 800}
                    onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value || "800", 10) })}
                    className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="h-10 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
              >
                {t("Cancel", "বাতিল")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("Save", "সেভ করুন")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
