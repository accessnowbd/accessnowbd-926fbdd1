import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Loader2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Star,
  Rows3,
  Search as SearchIcon,
  GripVertical,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLang } from "@/context/AdminLangContext";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  SECTION_LABELS,
  fetchHomepageConfig,
  saveHomepageConfig,
  type HomepageConfig,
  type HomepageSectionId,
} from "@/lib/homepage-config";

export const Route = createFileRoute("/admin/homepage-editor")({
  component: HomepageEditorPage,
  head: () => ({
    meta: [
      { title: "Homepage Editor — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type TabKey = "overview" | "featured" | "rails" | "seo" | "shortcuts";

type ProductLite = { slug: string; name: string; category: string; image?: string | null };

function HomepageEditorPage() {
  const { t } = useAdminLang();
  const [tab, setTab] = useState<TabKey>("overview");
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [initial, setInitial] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [cfg, prodRes] = await Promise.all([
      fetchHomepageConfig(),
      supabase.from("products").select("slug,name,category,image").order("name"),
    ]);
    setConfig(cfg);
    setInitial(cfg);
    setProducts(((prodRes.data as ProductLite[] | null) ?? []).filter((p) => p.slug));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(initial), [config, initial]);

  const save = async () => {
    setSaving(true);
    try {
      await saveHomepageConfig(config);
      setInitial(config);
      toast.success(t("Homepage saved", "হোমপেজ সংরক্ষিত"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    if (!confirm(t("Reset homepage to defaults?", "ডিফল্টে ফিরিয়ে আনবেন?"))) return;
    setConfig(DEFAULT_HOMEPAGE_CONFIG);
  };

  const productBySlug = useMemo(() => {
    const m = new Map<string, ProductLite>();
    for (const p of products) m.set(p.slug, p);
    return m;
  }, [products]);

  const productCategories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.category) s.add(p.category);
    return Array.from(s).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-600" />
            {t("Homepage Editor", "হোমপেজ এডিটর")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            {t(
              "Control every section that appears on the public homepage — enable/disable, reorder, pick featured products, and edit SEO.",
              "পাবলিক হোমপেজের প্রতিটি সেকশন এখান থেকে নিয়ন্ত্রণ করুন — enable/disable, পুনর্বিন্যাস, ফিচার্ড প্রোডাক্ট, এবং SEO।",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            {t("Preview site", "সাইট প্রিভিউ")}
          </a>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("Reload", "রিলোড")}
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t(dirty ? "Save changes" : "Saved", dirty ? "সংরক্ষণ" : "সংরক্ষিত")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["overview", t("Overview", "ওভারভিউ"), Layers],
              ["featured", t("Featured Products", "ফিচার্ড"), Star],
              ["rails", t("Product Rails", "প্রোডাক্ট রেইল"), Rows3],
              ["seo", t("SEO", "SEO"), Sparkles],
              ["shortcuts", t("Shortcuts", "শর্টকাট"), ExternalLink],
            ] as const
          ).map(([k, label, Icon]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k as TabKey)}
                className={`inline-flex items-center gap-2 px-4 h-10 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition ${
                  active
                    ? "border-amber-500 text-amber-700 bg-white"
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
          {t("Loading…", "লোড হচ্ছে…")}
        </div>
      ) : tab === "overview" ? (
        <OverviewTab config={config} setConfig={setConfig} onReset={resetAll} />
      ) : tab === "featured" ? (
        <FeaturedTab
          config={config}
          setConfig={setConfig}
          products={filteredProducts}
          productBySlug={productBySlug}
          search={productSearch}
          setSearch={setProductSearch}
        />
      ) : tab === "rails" ? (
        <RailsTab config={config} setConfig={setConfig} categories={productCategories} />
      ) : tab === "seo" ? (
        <SeoTab config={config} setConfig={setConfig} />
      ) : (
        <ShortcutsTab />
      )}
    </div>
  );
}

/* ================== OVERVIEW ================== */
function OverviewTab({
  config,
  setConfig,
  onReset,
}: {
  config: HomepageConfig;
  setConfig: (c: HomepageConfig) => void;
  onReset: () => void;
}) {
  const { t } = useAdminLang();
  const sorted = [...config.sections].sort((a, b) => a.order - b.order);

  const move = (id: HomepageSectionId, dir: -1 | 1) => {
    const idx = sorted.findIndex((s) => s.id === id);
    const nb = idx + dir;
    if (nb < 0 || nb >= sorted.length) return;
    const next = [...sorted];
    [next[idx], next[nb]] = [next[nb], next[idx]];
    setConfig({
      ...config,
      sections: next.map((s, i) => ({ ...s, order: i + 1 })),
    });
  };

  const toggle = (id: HomepageSectionId) => {
    setConfig({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          {t("Sections", "সেকশন")}
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          {t(
            "Toggle visibility and drag to reorder how sections appear on the homepage.",
            "কোন সেকশন কোন ক্রমে দেখাবে সেটা এখান থেকে ঠিক করুন।",
          )}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {sorted.map((s, idx) => {
            const meta = SECTION_LABELS[s.id];
            return (
              <li key={s.id} className={`flex items-center gap-3 p-4 ${s.enabled ? "" : "bg-slate-50/60"}`}>
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                <div className="w-8 h-8 rounded-lg grid place-items-center bg-amber-50 text-amber-700 font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {t(meta.en, meta.bn)}
                  </div>
                  <div className="text-xs text-slate-500">{meta.hint}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(s.id, -1)}
                    disabled={idx === 0}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(s.id, 1)}
                    disabled={idx === sorted.length - 1}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggle(s.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border ${
                      s.enabled
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  >
                    {s.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {s.enabled ? t("Visible", "দৃশ্যমান") : t("Hidden", "লুকানো")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="text-xs text-rose-600 font-semibold hover:underline"
        >
          {t("Reset all to defaults", "সব ডিফল্টে ফিরিয়ে আনুন")}
        </button>
      </div>
    </div>
  );
}

/* ================== FEATURED ================== */
function FeaturedTab({
  config,
  setConfig,
  products,
  productBySlug,
  search,
  setSearch,
}: {
  config: HomepageConfig;
  setConfig: (c: HomepageConfig) => void;
  products: ProductLite[];
  productBySlug: Map<string, ProductLite>;
  search: string;
  setSearch: (s: string) => void;
}) {
  const { t } = useAdminLang();
  const selected = config.featuredSlugs;

  const add = (slug: string) => {
    if (selected.includes(slug)) return;
    if (selected.length >= 12) {
      toast.warning(t("Max 12 featured products", "সর্বাধিক ১২টি"));
      return;
    }
    setConfig({ ...config, featuredSlugs: [...selected, slug] });
  };
  const remove = (slug: string) => {
    setConfig({ ...config, featuredSlugs: selected.filter((s) => s !== slug) });
  };
  const move = (slug: string, dir: -1 | 1) => {
    const idx = selected.indexOf(slug);
    const nb = idx + dir;
    if (nb < 0 || nb >= selected.length) return;
    const next = [...selected];
    [next[idx], next[nb]] = [next[nb], next[idx]];
    setConfig({ ...config, featuredSlugs: next });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Copy fields */}
      <div className="lg:col-span-2 grid md:grid-cols-3 gap-3">
        <TextField
          label={t("Eyebrow", "আইব্রো")}
          value={config.featured.eyebrow}
          onChange={(v) => setConfig({ ...config, featured: { ...config.featured, eyebrow: v } })}
        />
        <TextField
          label={t("Title", "টাইটেল")}
          value={config.featured.title}
          onChange={(v) => setConfig({ ...config, featured: { ...config.featured, title: v } })}
        />
        <TextField
          label={t("Subtitle", "সাবটাইটেল")}
          value={config.featured.subtitle}
          onChange={(v) => setConfig({ ...config, featured: { ...config.featured, subtitle: v } })}
        />
      </div>

      {/* Left: current selection */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600" />
            {t("Selected", "নির্বাচিত")} ({selected.length})
          </h3>
          {selected.length > 0 && (
            <button
              onClick={() => setConfig({ ...config, featuredSlugs: [] })}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              {t("Clear all (auto pick)", "মুছে ফেলুন (অটো)")}
            </button>
          )}
        </div>
        {selected.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t(
              "No products selected — auto-picking one per category.",
              "কিছু নির্বাচিত নেই — প্রতি ক্যাটাগরি থেকে একটি করে অটো দেখাবে।",
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {selected.map((slug, idx) => {
              const p = productBySlug.get(slug);
              return (
                <li key={slug} className="flex items-center gap-3 p-3">
                  <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 grid place-items-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  {p?.image ? (
                    <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p?.name ?? slug}</div>
                    <div className="text-xs text-slate-500 truncate">{p?.category ?? slug}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => move(slug, -1)}
                      disabled={idx === 0}
                      className="h-7 w-7 grid place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => move(slug, 1)}
                      disabled={idx === selected.length - 1}
                      className="h-7 w-7 grid place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(slug)}
                      className="h-7 w-7 grid place-items-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Right: product picker */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <h3 className="text-base font-extrabold text-slate-900">
            {t("Add products", "প্রোডাক্ট যোগ করুন")}
          </h3>
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search…", "খুঁজুন…")}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">
          {products.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {t("No products", "কোনো প্রোডাক্ট নেই")}
            </div>
          ) : (
            products.map((p) => {
              const already = selected.includes(p.slug);
              return (
                <div key={p.slug} className="flex items-center gap-3 p-3">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800 truncate">{p.name}</div>
                    <div className="text-xs text-slate-500 truncate">{p.category}</div>
                  </div>
                  <button
                    onClick={() => add(p.slug)}
                    disabled={already}
                    className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1 border ${
                      already
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-amber-500 text-white border-amber-500 hover:bg-amber-600"
                    }`}
                  >
                    {already ? t("Added", "যোগ") : (<><Plus className="w-3.5 h-3.5" />{t("Add", "যোগ")}</>)}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ================== RAILS ================== */
function RailsTab({
  config,
  setConfig,
  categories,
}: {
  config: HomepageConfig;
  setConfig: (c: HomepageConfig) => void;
  categories: string[];
}) {
  const { t } = useAdminLang();
  const selected = config.railCategories;
  const available = categories.filter((c) => !selected.includes(c));

  const add = (cat: string) => setConfig({ ...config, railCategories: [...selected, cat] });
  const remove = (cat: string) => setConfig({ ...config, railCategories: selected.filter((c) => c !== cat) });
  const move = (cat: string, dir: -1 | 1) => {
    const idx = selected.indexOf(cat);
    const nb = idx + dir;
    if (nb < 0 || nb >= selected.length) return;
    const next = [...selected];
    [next[idx], next[nb]] = [next[nb], next[idx]];
    setConfig({ ...config, railCategories: next });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Rows3 className="w-4 h-4 text-amber-600" />
            {t("Rail order", "রেইল ক্রম")}
          </h3>
          {selected.length > 0 && (
            <button
              onClick={() => setConfig({ ...config, railCategories: [] })}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              {t("Clear (show all)", "মুছে ফেলুন (সব)")}
            </button>
          )}
        </div>
        {selected.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t(
              "Empty — every category with products becomes a rail automatically.",
              "খালি রাখলে প্রতিটি ক্যাটাগরি অটো রেইল হবে।",
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {selected.map((cat, idx) => (
              <li key={cat} className="flex items-center gap-3 p-3">
                <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 grid place-items-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1 text-sm font-semibold text-slate-800 truncate">{cat}</div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => move(cat, -1)}
                    disabled={idx === 0}
                    className="h-7 w-7 grid place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(cat, 1)}
                    disabled={idx === selected.length - 1}
                    className="h-7 w-7 grid place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(cat)}
                    className="h-7 w-7 grid place-items-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">
            {t("Available categories", "উপলব্ধ ক্যাটাগরি")}
          </h3>
        </div>
        {available.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t("All categories already added.", "সব ক্যাটাগরি ইতিমধ্যেই যোগ করা।")}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {available.map((cat) => (
              <li key={cat} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1 text-sm font-semibold text-slate-800 truncate">{cat}</div>
                <button
                  onClick={() => add(cat)}
                  className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-500 text-white border border-amber-500 hover:bg-amber-600 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> {t("Add", "যোগ")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================== SEO ================== */
function SeoTab({ config, setConfig }: { config: HomepageConfig; setConfig: (c: HomepageConfig) => void }) {
  const { t } = useAdminLang();
  const s = config.seo;
  const setS = (patch: Partial<typeof s>) => setConfig({ ...config, seo: { ...s, ...patch } });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <TextField
        label={t("Page Title (<60 chars)", "পেজ টাইটেল (<৬০)")}
        value={s.title}
        maxLength={80}
        onChange={(v) => setS({ title: v })}
      />
      <TextField
        label="OG Title"
        value={s.ogTitle}
        maxLength={80}
        onChange={(v) => setS({ ogTitle: v })}
      />
      <TextArea
        label={t("Meta Description (<160)", "মেটা বিবরণ (<১৬০)")}
        value={s.description}
        maxLength={200}
        onChange={(v) => setS({ description: v })}
      />
      <TextArea
        label="OG Description"
        value={s.ogDescription}
        maxLength={200}
        onChange={(v) => setS({ ogDescription: v })}
      />
    </div>
  );
}

/* ================== SHORTCUTS ================== */
function ShortcutsTab() {
  const { t } = useAdminLang();
  const items = [
    { to: "/admin/hero-banners", label: t("Hero Banners", "হিরো ব্যানার"), hint: t("Edit rotating hero slides", "স্লাইডিং ব্যানার এডিট করুন") },
    { to: "/admin/categories", label: t("Categories", "ক্যাটাগরি"), hint: t("Manage product categories", "ক্যাটাগরি ব্যবস্থাপনা") },
    { to: "/admin/products", label: t("Products", "প্রোডাক্ট"), hint: t("Create & edit products shown on rails", "প্রোডাক্ট এডিট") },
    { to: "/admin/welcome-popup", label: t("Welcome Popup", "ওয়েলকাম পপআপ"), hint: t("Homepage first-visit modal", "প্রথম ভিজিটের পপআপ") },
    { to: "/admin/site-settings", label: t("Site Settings", "সাইট সেটিংস"), hint: t("Branding, contact, footer", "ব্র্যান্ডিং, কন্টাক্ট") },
  ] as const;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-slate-900">{it.label}</div>
              <div className="text-xs text-slate-500 mt-1">{it.hint}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ================== small fields ================== */
function TextField({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">{label}</div>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 flex items-center justify-between">
        <span>{label}</span>
        {maxLength ? <span className="text-slate-400">{value.length}/{maxLength}</span> : null}
      </div>
      <textarea
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
      />
    </label>
  );
}
