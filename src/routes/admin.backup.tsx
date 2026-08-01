import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Download, Upload, RefreshCw, Database, Archive, AlertTriangle, ShieldCheck,
  Trash2, Loader2, CheckCircle2, History, FolderTree, RotateCcw, FileJson,
} from "lucide-react";
import {
  createBackup, restoreBackup, listBackupStorage, uploadBackupStorageFile,
  BACKUP_TABLES, type BackupPayload, type StorageObjectRef,
} from "@/lib/backup.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/backup")({
  component: BackupPage,
  head: () => ({
    meta: [
      { title: "Backup & Restore — Admin | AccessNow BD" },
      { name: "description", content: "সম্পূর্ণ ওয়েবসাইট ব্যাকআপ, JSON এক্সপোর্ট এবং ডুপ্লিকেট-সেফ রিস্টোর সিস্টেম।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const BN = (n: number) => n.toLocaleString("bn-BD");

const LABELS: Record<string, string> = {
  products: "Products", categories: "Categories", brands: "Brands", tags: "Tags",
  product_variants: "Product Variants", product_media: "Product Media",
  product_digital_files: "Digital Files", product_license_keys: "License Keys",
  profiles: "Customers", user_roles: "User Roles", team_members: "Team Members",
  admin_records: "Site Settings", coupons: "Coupons", promotions: "Promotions",
  orders: "Orders", product_reviews: "Reviews", support_tickets: "Support Tickets",
  ticket_messages: "Ticket Messages", live_chat_messages: "Live Chat",
  notifications: "Notifications", newsletter_subscribers: "Newsletter",
  suppressed_emails: "Suppressed Emails", abandoned_checkouts: "Abandoned Checkouts",
  wallets: "Wallets", wallet_topups: "Wallet Topups", wallet_transactions: "Wallet Transactions",
  tracking_pixels: "Tracking Pixels", telegram_settings: "Telegram Settings",
  telegram_subscribers: "Telegram Subscribers", telegram_broadcasts: "Telegram Broadcasts",
  telegram_referrals: "Telegram Referrals", telegram_wishlist: "Telegram Wishlist",
  renewal_reminders_sent: "Renewal Reminders", activity_logs: "Activity Logs",
  accessibility_reports: "A11y Reports", digital_downloads_log: "Download Logs",
  email_send_log: "Email Logs",
};

const TABLE_KEYS = Object.keys(BACKUP_TABLES);
const label = (k: string) => LABELS[k] ?? k;

type HistoryRow = {
  id: string;
  created_at: string;
  data: { created_at?: string; total_rows?: number; files?: number; kind_label?: string };
};

type ZipFileRef = { bucket: string; path: string; entry: import("jszip").JSZipObject };
type ZipPlan = {
  name: string;
  tables: Record<string, unknown[]>;
  files: ZipFileRef[];
  totalRows: number;
};

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const out: R[] = new Array(items.length) as R[];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]!, i);
    }
  });
  await Promise.all(workers);
  return out;
}

function BackupPage() {
  const runBackup = useServerFn(createBackup);
  const runRestore = useServerFn(restoreBackup);
  const runListStorage = useServerFn(listBackupStorage);
  const runUploadFile = useServerFn(uploadBackupStorageFile);

  const [tab, setTab] = useState<"export" | "import">("export");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [lastSnapshot, setLastSnapshot] = useState<BackupPayload | null>(null);
  const [busy, setBusy] = useState<null | "full" | "zip" | "restore" | "table">(null);
  const [busyTable, setBusyTable] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ pct: number; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [mode, setMode] = useState<"safe" | "merge" | "replace">("safe");
  const [zipPlan, setZipPlan] = useState<ZipPlan | null>(null);
  const [confirmZip, setConfirmZip] = useState(false);


  const tablesRef = useRef<HTMLInputElement>(null);
  const fullRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const refreshSnapshot = async (silent = false) => {
    if (!silent) setLoadingCounts(true);
    try {
      const r = await runBackup();
      setLastSnapshot(JSON.parse(r.json) as BackupPayload);
      setCounts(r.meta.counts || {});
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally { setLoadingCounts(false); }
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("admin_records").select("id, created_at, data")
      .eq("kind", "backup_history").order("created_at", { ascending: false }).limit(20);
    setHistory((data ?? []) as unknown as HistoryRow[]);
  };

  useEffect(() => { refreshSnapshot(); loadHistory(); }, []);

  const totalRecords = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const tableCount = TABLE_KEYS.length;
  const lastBackupAt = history[0]?.data?.created_at ?? history[0]?.created_at ?? null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const recordHistory = async (kind_label: string, total: number, files?: number) => {
    await supabase.from("admin_records").insert({
      kind: "backup_history",
      data: { created_at: new Date().toISOString(), total_rows: total, files, kind_label } as never,
      is_active: true,
    });
    loadHistory();
  };

  const fullDbBackup = async () => {
    setBusy("full");
    try {
      const r = await runBackup();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadBlob(new Blob([r.json], { type: "application/json" }), `full-db-backup-${stamp}.json`);
      await recordHistory("Full DB Backup (JSON)", r.meta.total_rows);
      setLastSnapshot(JSON.parse(r.json)); setCounts(r.meta.counts);
      toast.success(`Full DB ব্যাকআপ সম্পন্ন (${BN(r.meta.total_rows)} সারি)`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Backup failed"); }
    finally { setBusy(null); }
  };

  /** One-click: all tables + every storage file, downloaded in parallel into one ZIP. */
  const completeWebsiteBackup = async () => {
    setBusy("zip"); setProgress({ pct: 2, text: "ডেটাবেস পড়া হচ্ছে…" });
    try {
      const [r, storage] = await Promise.all([runBackup(), runListStorage()]);
      const parsed = JSON.parse(r.json) as BackupPayload;
      const files: StorageObjectRef[] = storage.files ?? [];
      setProgress({ pct: 12, text: `${BN(files.length)}টি ফাইল ডাউনলোড হচ্ছে…` });

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file("database.json", r.json);
      const tf = zip.folder("tables");
      for (const k of TABLE_KEYS) tf?.file(`${k}.json`, JSON.stringify(parsed.tables[k] ?? [], null, 2));

      let done = 0; let failed = 0;
      await mapLimit(files, 8, async (f) => {
        try {
          const res = await fetch(f.url);
          if (!res.ok) throw new Error(String(res.status));
          const buf = await res.arrayBuffer();
          zip.folder("storage")?.folder(f.bucket)?.file(f.path, buf);
        } catch { failed++; }
        done++;
        setProgress({ pct: 12 + Math.round((done / Math.max(files.length, 1)) * 78), text: `ফাইল ${BN(done)}/${BN(files.length)}` });
      });

      zip.file("manifest.json", JSON.stringify({
        version: 2, type: "complete-website-backup", created_at: new Date().toISOString(),
        tables: r.meta.counts, total_rows: r.meta.total_rows,
        storage: { total: files.length, failed, buckets: [...new Set(files.map((f) => f.bucket))] },
      }, null, 2));

      setProgress({ pct: 94, text: "ZIP তৈরি হচ্ছে…" });
      const blob = await zip.generateAsync({ type: "blob" });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadBlob(blob, `complete-website-backup-${stamp}.zip`);
      await recordHistory("Complete Website Backup (ZIP)", r.meta.total_rows, files.length - failed);
      setProgress({ pct: 100, text: "সম্পন্ন" });
      toast.success(`সম্পূর্ণ ব্যাকআপ: ${BN(r.meta.total_rows)} সারি + ${BN(files.length - failed)} ফাইল${failed ? ` (${BN(failed)} ফাইল ব্যর্থ)` : ""}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Backup failed"); }
    finally { setBusy(null); setTimeout(() => setProgress(null), 1500); }
  };

  const downloadTable = async (key: string) => {
    setBusy("table"); setBusyTable(key);
    try {
      let snap = lastSnapshot;
      if (!snap) {
        const r = await runBackup();
        snap = JSON.parse(r.json) as BackupPayload;
        setLastSnapshot(snap); setCounts(r.meta.counts);
      }
      const rows = snap.tables[key] ?? [];
      downloadBlob(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), `${key}.json`);
      toast.success(`${label(key)}: ${BN(rows.length)} সারি ডাউনলোড`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); setBusyTable(null); }
  };

  const applyRestore = async (payload: { tables: Record<string, unknown[]> }, note: string) => {
    const res = await runRestore({ data: { payloadJson: JSON.stringify(payload), mode } });
    const added = Object.values(res.results).reduce((a, b) => a + (b.restored || 0), 0);
    const skipped = Object.values(res.results).reduce((a, b) => a + (b.skipped || 0), 0);
    const errs = Object.entries(res.results).filter(([, v]) => v.error);
    if (errs.length) toast.warning(`${note}: ${BN(added)} নতুন সারি, ${BN(skipped)} স্কিপ। ত্রুটি: ${errs.map(([k]) => k).join(", ")}`);
    else toast.success(`${note}: ${BN(added)} নতুন সারি যোগ হয়েছে (${BN(skipped)} আগে থেকেই ছিল)`);
    refreshSnapshot(true); loadHistory();
    return added;
  };

  /** Multiple per-table JSON files at once (products.json, orders.json, …). */
  const onTableFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []); e.target.value = "";
    if (!list.length) return;
    setBusy("restore"); setProgress({ pct: 5, text: "ফাইল পড়া হচ্ছে…" });
    try {
      const tables: Record<string, unknown[]> = {};
      const unknown: string[] = [];
      for (const f of list) {
        const base = f.name.replace(/\.json$/i, "");
        const key = TABLE_KEYS.find((k) => base === k) ?? TABLE_KEYS.find((k) => base.includes(k));
        const json = JSON.parse(await f.text());
        if (Array.isArray(json)) {
          if (!key) { unknown.push(f.name); continue; }
          tables[key] = [...(tables[key] ?? []), ...json];
        } else if (json?.tables) {
          for (const [k, rows] of Object.entries(json.tables as Record<string, unknown[]>)) {
            tables[k] = [...(tables[k] ?? []), ...(rows ?? [])];
          }
        } else unknown.push(f.name);
      }
      if (unknown.length) toast.warning(`চেনা যায়নি: ${unknown.join(", ")}`);
      if (!Object.keys(tables).length) throw new Error("কোনো বৈধ টেবিল ডেটা পাওয়া যায়নি");
      setProgress({ pct: 45, text: "রিস্টোর চলছে…" });
      await applyRestore({ tables }, `${Object.keys(tables).length}টি টেবিল রিস্টোর`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Restore failed"); }
    finally { setBusy(null); setTimeout(() => setProgress(null), 1200); }
  };

  const onFullFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusy("restore"); setProgress({ pct: 10, text: "ফাইল পড়া হচ্ছে…" });
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed?.tables) throw new Error("Invalid full backup file (missing tables)");
      setProgress({ pct: 45, text: "রিস্টোর চলছে…" });
      await applyRestore(parsed, "Full backup রিস্টোর");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Restore failed"); }
    finally { setBusy(null); setTimeout(() => setProgress(null), 1200); }
  };

  /** Step 1 — detect: read the ZIP, build a summary, wait for confirmation. */
  const onZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusy("restore"); setProgress({ pct: 10, text: "ZIP স্ক্যান হচ্ছে…" });
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);

      const dbEntry = zip.file("database.json");
      const tables: Record<string, unknown[]> = {};
      if (dbEntry) {
        const parsed = JSON.parse(await dbEntry.async("string"));
        for (const [k, rows] of Object.entries((parsed.tables ?? {}) as Record<string, unknown[]>)) {
          if (Array.isArray(rows)) tables[k] = rows;
        }
      }
      for (const k of TABLE_KEYS) {
        if (tables[k]) continue;
        const f = zip.file(`tables/${k}.json`);
        if (f) {
          const rows = JSON.parse(await f.async("string"));
          if (Array.isArray(rows)) tables[k] = rows;
        }
      }

      const files: { bucket: string; path: string; entry: import("jszip").JSZipObject }[] = [];
      zip.folder("storage")?.forEach((relPath, entry) => {
        if (entry.dir) return;
        const [bucket, ...rest] = relPath.split("/");
        if (!bucket || !rest.length) return;
        files.push({ bucket, path: rest.join("/"), entry });
      });

      if (!Object.keys(tables).length && !files.length)
        throw new Error("ZIP-এ কোনো database.json / tables / storage ফাইল পাওয়া যায়নি");

      const totalRows = Object.values(tables).reduce((a, b) => a + b.length, 0);
      setZipPlan({ name: file.name, tables, files, totalRows });
      setConfirmZip(false);
      setProgress({ pct: 100, text: "ZIP ডিটেক্ট সম্পন্ন" });
      toast.success(`ZIP ডিটেক্ট হয়েছে — ${BN(totalRows)} সারি, ${BN(files.length)} ফাইল`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "ZIP পড়া যায়নি"); }
    finally { setBusy(null); setTimeout(() => setProgress(null), 1200); }
  };

  /** Step 2 — restore everything detected in the ZIP (database + all storage files). */
  const runZipRestore = async () => {
    if (!zipPlan || !confirmZip) return;
    const { tables, files } = zipPlan;
    setBusy("restore"); setProgress({ pct: 6, text: "ডেটাবেস রিস্টোর হচ্ছে…" });
    try {
      const added = Object.keys(tables).length ? await applyRestore({ tables }, "ZIP ডেটাবেস রিস্টোর") : 0;

      let done = 0; let failed = 0;
      await mapLimit(files, 4, async (it) => {
        try {
          const b64 = await it.entry.async("base64");
          const res = await runUploadFile({ data: { bucket: it.bucket, path: it.path, base64: b64 } });
          if (!res.ok) failed++;
        } catch { failed++; }
        done++;
        setProgress({ pct: 25 + Math.round((done / Math.max(files.length, 1)) * 73), text: `ফাইল আপলোড ${BN(done)}/${BN(files.length)}` });
      });
      setProgress({ pct: 100, text: "সম্পন্ন" });
      await recordHistory("Complete ZIP Restore", added, files.length - failed);
      toast.success(`ZIP রিস্টোর সম্পন্ন — ${BN(added)} সারি, ${BN(files.length - failed)} ফাইল${failed ? ` (${BN(failed)} ব্যর্থ)` : ""}`);
      setZipPlan(null); setConfirmZip(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "ZIP restore failed"); }
    finally { setBusy(null); setTimeout(() => setProgress(null), 1500); }
  };


  const deleteHistory = async (id: string) => {
    if (!confirm("ইতিহাস থেকে এই এন্ট্রি মুছবেন?")) return;
    const { error } = await supabase.from("admin_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadHistory();
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Backup &amp; Restore</h2>
          <p className="text-sm text-slate-600 mt-0.5">ডেটা ব্যাকআপ, JSON এক্সপোর্ট এবং রিস্টোর সিস্টেম</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => refreshSnapshot()} disabled={loadingCounts}
            className="h-10 px-4 rounded-full bg-white border border-slate-200 hover:border-violet-300 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition">
            {loadingCounts ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} রিফ্রেশ
          </button>
          <button onClick={fullDbBackup} disabled={busy !== null}
            className="h-10 px-4 rounded-full bg-white border border-slate-200 hover:border-violet-300 text-slate-800 text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition disabled:opacity-60">
            {busy === "full" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Full DB Backup
          </button>
          <button onClick={completeWebsiteBackup} disabled={busy !== null}
            className="h-10 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2 shadow disabled:opacity-60">
            {busy === "zip" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Complete Website Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard tone="violet" icon={<Database className="w-4 h-4" />} label="মোট রেকর্ড" value={BN(totalRecords)} />
        <StatCard tone="blue" icon={<FolderTree className="w-4 h-4" />} label="টেবিল" value={BN(tableCount)} />
        <StatCard tone="amber" icon={<History className="w-4 h-4" />} label="ব্যাকআপ হিস্ট্রি" value={BN(history.length)} />
        <StatCard tone="emerald" icon={<CheckCircle2 className="w-4 h-4" />} label="সর্বশেষ ব্যাকআপ"
          value={lastBackupAt ? new Date(lastBackupAt).toLocaleDateString("bn-BD") : "—"} />
      </div>

      {/* Tabs */}
      <div className="grid md:grid-cols-2 gap-3">
        <button onClick={() => setTab("export")}
          className={`h-14 px-5 rounded-2xl border text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${tab === "export" ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm" : "bg-white border-slate-200 text-slate-800 hover:border-violet-300"}`}>
          <Download className="w-5 h-5" /> ব্যাকআপ / Export
        </button>
        <button onClick={() => setTab("import")}
          className={`h-14 px-5 rounded-2xl border text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${tab === "import" ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm" : "bg-white border-slate-200 text-slate-800 hover:border-amber-300"}`}>
          <RotateCcw className="w-5 h-5" /> রিস্টোর / Import
        </button>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="rounded-2xl border border-violet-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>{progress.text}</span><span>{progress.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      )}

      {tab === "export" ? (
        <>
          {/* One-click hero */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-100 via-fuchsia-100 to-indigo-100 p-5 sm:p-6">
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 w-56 h-56 rounded-full bg-fuchsia-300/30 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <span className="shrink-0 w-12 h-12 rounded-xl bg-white shadow-sm ring-1 ring-violet-200 grid place-items-center text-violet-700">
                  <Archive className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">এক ক্লিকে সম্পূর্ণ ব্যাকআপ</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-violet-600 text-white">PARALLEL</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 leading-snug">
                    সকল <b>{BN(tableCount)}টি টেবিল</b> + <b>সকল ছবি/ফাইল</b> parallel-এ ডাউনলোড হয়। কিছুই বাদ যাবে না। উপরে percentage দেখুন।
                  </p>
                </div>
              </div>
              <button onClick={completeWebsiteBackup} disabled={busy !== null}
                className="shrink-0 h-12 px-6 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-violet-300/40 disabled:opacity-60">
                {busy === "zip" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} এখনই ব্যাকআপ নিন
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p>নিচের প্রতিটি কার্ড থেকে আলাদা টেবিলের JSON ডাউনলোড করুন, অথবা উপরে থাকা <b>"এখনই ব্যাকআপ নিন"</b> বাটন চাপলে সম্পূর্ণ ডেটাবেস + সকল ছবি/ফাইল ZIP আকারে এক ক্লিকে download হবে।</p>
          </div>

          {/* Table cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {TABLE_KEYS.map((k) => {
              const isBusy = busy === "table" && busyTable === k;
              return (
                <div key={k} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 grid place-items-center shrink-0">
                      <FileJson className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{label(k)}</p>
                      <p className="text-[11px] text-slate-500">{BN(counts[k] ?? 0)} রেকর্ড</p>
                    </div>
                  </div>
                  <button onClick={() => downloadTable(k)} disabled={busy !== null}
                    className="h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} JSON
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Smart restore notice + mode */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-white text-amber-600 ring-1 ring-amber-200 grid place-items-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900 text-sm">🛡️ Smart Restore — Duplicate-Safe</p>
              <p>
                রিস্টোর করলে <b>শুধু নতুন রেকর্ড</b> যোগ হবে। যেসব product/coupon/category/blog আগে থেকেই আছে (একই slug, code, key বা id মিললে) সেগুলো <b>অপরিবর্তিত থাকবে</b> — overwrite হবে না। তাই double-import করলেও কিছু duplicate বা reset হবে না। parent টেবিল আগে restore হবে যাতে foreign key ভাঙে না।
              </p>
              <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-[11px] font-bold">
                {([["safe", "Safe (শুধু নতুন)"], ["merge", "Merge (overwrite)"], ["replace", "Replace (সব মুছে)"]] as const).map(([m, l]) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-3 h-7 rounded-full transition ${mode === m ? "bg-slate-900 text-white" : "text-slate-600"}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <DropCard
              title="একটি টেবিল রিস্টোর" subtitle="এক বা একাধিক JSON ব্যাকআপ ফাইল আপলোড করুন"
              hint="products.json, orders.json … একসাথে সব সিলেক্ট করুন"
              cta="JSON ফাইল আপলোড করুন (একাধিক নির্বাচন করা যাবে)"
              disabled={busy !== null} onClick={() => tablesRef.current?.click()}
            />
            <DropCard
              title="Full Backup রিস্টোর" subtitle="সব টেবিল একসাথে (parent → child order)"
              hint="full-db-backup-XXXX.json" cta="Full Backup JSON আপলোড"
              disabled={busy !== null} onClick={() => fullRef.current?.click()}
            />
          </div>

          <DropCard
            title="Complete ZIP রিস্টোর" subtitle="Database + Storage (সব ছবি/ফাইল) — এক ক্লিকে"
            hint="complete-website-backup-XXXX.zip" cta="Complete Backup ZIP আপলোড"
            wide disabled={busy !== null} onClick={() => zipRef.current?.click()}
          />

          {/* Detected ZIP summary → confirm → full restore */}
          {zipPlan && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Archive className="w-4 h-4 text-violet-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm truncate">ZIP সারসংক্ষেপ</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-600">{BN(zipPlan.totalRows)} rows</span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                    {BN(zipPlan.files.length)} files
                  </span>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {Object.entries(zipPlan.tables)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([k, rows]) => (
                    <div key={k} className="px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <span className="text-sm text-slate-700 font-mono truncate">{label(k)}</span>
                      <span className="text-sm font-bold text-slate-900 shrink-0">{BN(rows.length)} rows</span>
                    </div>
                  ))}
              </div>

              <label className="mx-4 my-3 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox" checked={confirmZip}
                  onChange={(e) => setConfirmZip(e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm font-semibold text-slate-800">
                  সব database + storage restore করব — আমি নিশ্চিত
                </span>
              </label>

              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={runZipRestore}
                  disabled={!confirmZip || busy !== null}
                  className="h-10 px-5 rounded-full inline-flex items-center gap-2 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                  {busy === "restore" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  ZIP Full Restore
                </button>
                <button
                  onClick={() => { setZipPlan(null); setConfirmZip(false); }}
                  disabled={busy !== null}
                  className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-200 grid place-items-center transition"
                  aria-label="ZIP বাতিল করুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}


          <input ref={tablesRef} type="file" multiple accept="application/json,.json" className="hidden" onChange={onTableFiles} />
          <input ref={fullRef} type="file" accept="application/json,.json" className="hidden" onChange={onFullFile} />
          <input ref={zipRef} type="file" accept=".zip,application/zip" className="hidden" onChange={onZipFile} />
        </>
      )}

      {/* History */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="font-bold text-slate-900 text-sm">ব্যাকআপ হিস্ট্রি</h3>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">এখনো কোনো ব্যাকআপ হিস্ট্রি নেই।</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h) => {
              const when = new Date(h.data?.created_at ?? h.created_at);
              return (
                <li key={h.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center ring-1 ring-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{h.data?.kind_label ?? "Backup"}</p>
                      <p className="text-[11px] text-slate-500">
                        {when.toLocaleString("bn-BD")} · {BN(h.data?.total_rows ?? 0)} রেকর্ড
                        {h.data?.files != null ? ` · ${BN(h.data.files)} ফাইল` : ""}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteHistory(h.id)} className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> মুছুন
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

function DropCard({ title, subtitle, hint, cta, onClick, disabled, wide }: {
  title: string; subtitle: string; hint: string; cta: string;
  onClick: () => void; disabled?: boolean; wide?: boolean;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${wide ? "" : ""}`}>
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 ring-1 ring-violet-200 grid place-items-center shrink-0">
          <RotateCcw className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm truncate">{title}</p>
          <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
        </div>
      </div>
      <button type="button" onClick={onClick} disabled={disabled}
        className="w-full m-0 p-6 text-center disabled:opacity-60 hover:bg-violet-50/40 transition">
        <span className="mx-auto mb-3 w-10 h-10 rounded-full bg-slate-100 text-slate-600 grid place-items-center">
          <Upload className="w-4 h-4" />
        </span>
        <span className="block text-sm font-semibold text-slate-800">{cta}</span>
        <span className="block text-[11px] text-slate-400 mt-2">{hint}</span>
      </button>
    </div>
  );
}

type Tone = "violet" | "blue" | "amber" | "emerald";
const TONE: Record<Tone, string> = {
  violet: "bg-violet-100 text-violet-700 ring-violet-200",
  blue: "bg-blue-100 text-blue-700 ring-blue-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

function StatCard({ tone, icon, label: l, value }: { tone: Tone; icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span className={`w-6 h-6 rounded-lg grid place-items-center ring-1 ${TONE[tone]}`}>{icon}</span>
        {l}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</p>
    </div>
  );
}
