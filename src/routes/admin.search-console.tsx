import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Copy,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Globe,
  RefreshCw,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminLang } from "@/context/AdminLangContext";
import {
  DEFAULT_GSC_CONFIG,
  fetchGscConfig,
  saveGscConfig,
  type GscConfig,
} from "@/lib/gsc-config";

export const Route = createFileRoute("/admin/search-console")({
  component: SearchConsolePage,
  head: () => ({
    meta: [
      { title: "Search Console & SEO — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const SITE_ORIGIN = "https://accessnowbd.com";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap.xml`;
const ROBOTS_URL = `${SITE_ORIGIN}/robots.txt`;

function extractContent(input: string): string {
  const trimmed = input.trim();
  // Full meta tag pasted — pull out content="..."
  const match = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  if (match) return match[1].trim();
  return trimmed;
}

function SearchConsolePage() {
  const { t } = useAdminLang();
  const [cfg, setCfg] = useState<GscConfig>(DEFAULT_GSC_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGscConfig();
      setCfg(data);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await saveGscConfig(cfg);
      toast.success(t("Saved. Meta tag is live on the site.", "সেভ হয়েছে। মেটা ট্যাগ সাইটে চালু হয়েছে।"));
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  }, [cfg, t]);

  const copy = useCallback(async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* noop */
    }
  }, []);

  const metaPreview = cfg.verification_code
    ? `<meta name="google-site-verification" content="${cfg.verification_code}" />`
    : `<meta name="google-site-verification" content="YOUR_CODE_HERE" />`;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <AdminPageHeader />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {t("Loading…", "লোড হচ্ছে…")}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Step 1 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <header className="flex items-start gap-3 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">1</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {t("Open Google Search Console", "Google Search Console ওপেন করুন")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    "Add your site as a URL-prefix property and choose the HTML meta tag verification method.",
                    "সাইটটি URL-prefix property হিসেবে যোগ করুন এবং HTML meta tag verification মেথড সিলেক্ট করুন।"
                  )}
                </p>
              </div>
            </header>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://search.google.com/search-console/welcome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                <Search className="w-4 h-4" /> {t("Open Search Console", "Search Console খুলুন")} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(SITE_ORIGIN + "/")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
              >
                <Globe className="w-4 h-4" /> {t("Property dashboard", "প্রপার্টি ড্যাশবোর্ড")}
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("Property URL:", "প্রপার্টি URL:")}
              </span>
              <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">{SITE_ORIGIN}/</code>
              <button
                type="button"
                onClick={() => copy("property", SITE_ORIGIN + "/")}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                {copied === "property" ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {t("Copy", "কপি")}
              </button>
            </div>
          </section>

          {/* Step 2 — verification code */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <header className="flex items-start gap-3 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">2</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {t("Paste the verification meta tag", "Verification meta tag পেস্ট করুন")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    "Paste the entire <meta …/> tag from Google — we extract the content value automatically.",
                    "Google থেকে দেওয়া পুরো <meta …/> ট্যাগটি পেস্ট করুন — আমরা content ভ্যালু অটোমেটিক বের করে নিব।"
                  )}
                </p>
              </div>
            </header>

            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("Google verification tag", "Google verification tag")}
            </label>
            <textarea
              rows={2}
              value={cfg.verification_code}
              onChange={(e) => setCfg((c) => ({ ...c, verification_code: extractContent(e.target.value) }))}
              placeholder='<meta name="google-site-verification" content="abcd1234..." />'
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("Bing Webmaster (optional)", "Bing Webmaster (ঐচ্ছিক)")}
                </label>
                <input
                  type="text"
                  value={cfg.bing_code ?? ""}
                  onChange={(e) => setCfg((c) => ({ ...c, bing_code: extractContent(e.target.value) }))}
                  placeholder="msvalidate.01 content"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("Yandex (optional)", "Yandex (ঐচ্ছিক)")}
                </label>
                <input
                  type="text"
                  value={cfg.yandex_code ?? ""}
                  onChange={(e) => setCfg((c) => ({ ...c, yandex_code: extractContent(e.target.value) }))}
                  placeholder="yandex-verification content"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-[11px] sm:text-xs overflow-x-auto">
              {metaPreview}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("Save & activate", "সেভ ও চালু করুন")}
              </button>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className="w-4 h-4" /> {t("Reload", "রিলোড")}
              </button>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              {t(
                "After saving, deploy or refresh once so Google can fetch the tag, then click ‘Verify’ in Search Console.",
                "সেভ করার পর একবার ডিপ্লয় / রিফ্রেশ দিন যাতে Google ট্যাগটি ধরতে পারে, তারপর Search Console-এ ‘Verify’ চাপুন।"
              )}
            </p>
          </section>

          {/* Step 3 — sitemap */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <header className="flex items-start gap-3 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-fuchsia-100 text-fuchsia-700 font-bold text-sm">3</span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {t("Submit your sitemap", "আপনার sitemap সাবমিট করুন")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    "In Search Console → Sitemaps, submit the URL below.",
                    "Search Console → Sitemaps-এ গিয়ে নিচের URL সাবমিট করুন।"
                  )}
                </p>
              </div>
            </header>

            <div className="space-y-2">
              {[
                { label: "sitemap", url: SITEMAP_URL, name: t("Sitemap URL", "Sitemap URL") },
                { label: "robots", url: ROBOTS_URL, name: t("Robots.txt", "Robots.txt") },
              ].map((r) => (
                <div key={r.label} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700 min-w-[80px]">{r.name}</span>
                  <code className="flex-1 min-w-0 text-xs font-mono text-slate-800 truncate">{r.url}</code>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" /> {t("Open", "খুলুন")}
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(r.label, r.url)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    {copied === r.label ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {t("Copy", "কপি")}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Status */}
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="text-sm text-emerald-900 leading-relaxed">
                <div className="font-bold">
                  {cfg.verification_code
                    ? t("Verification tag is active", "ভেরিফিকেশন ট্যাগ চালু আছে")
                    : t("No verification tag yet", "এখনো কোন ভেরিফিকেশন ট্যাগ নেই")}
                </div>
                <p className="mt-1 text-emerald-800/90">
                  {cfg.verification_code
                    ? t(
                        "Google, Bing and Yandex can now verify ownership of this site.",
                        "Google, Bing এবং Yandex এখন এই সাইটের মালিকানা যাচাই করতে পারবে।"
                      )
                    : t(
                        "Paste the tag above and press Save to activate site verification.",
                        "উপরের ট্যাগটি পেস্ট করে Save চাপুন — ভেরিফিকেশন চালু হবে।"
                      )}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
