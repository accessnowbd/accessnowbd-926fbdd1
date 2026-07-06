import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard, Search, Filter, RefreshCw, Eye, Check, X, Loader2,
  CheckCircle2, XCircle, Clock, Settings, ShieldCheck, Plus, Pencil,
  Trash2, GripVertical, ArrowUp, ArrowDown, Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fileToWebp } from "@/lib/image-to-webp";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
});

/* ============================== Types ============================== */

type OrderRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  payment_method: string;
  transaction_id: string;
  payment_screenshot_url: string | null;
  payment_status: string;
  status: string;
  total: number;
  admin_note: string | null;
};

type PaymentMethod = {
  id: string;
  is_active: boolean;
  sort_order: number;
  data: {
    name?: string;
    number?: string;
    logo_url?: string;
    color?: string;
    send_money_label?: string;
    instructions?: string;
    enable_checkout?: boolean;
    enable_wallet?: boolean;
  };
};

type Tab = "proof" | "settings";

/* ============================== Utils ============================== */

const fmt = (n: number) => "৳" + Math.round(Number(n || 0)).toLocaleString("en-IN");
const shortId = (id: string) => "ORD-" + id.replace(/-/g, "").slice(0, 8).toUpperCase();

function timeAgoOrDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", icon: Clock },
  verified: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle2 },
  failed: { label: "Rejected", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", icon: XCircle },
};

function statusPill(s: string) {
  const m = STATUS_META[s] ?? STATUS_META.pending;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

/* ============================== Page ============================== */

function AdminPaymentsPage() {
  const [tab, setTab] = useState<Tab>("proof");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            <CreditCard className="h-5 w-5 text-violet-600" /> Payments
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Payment proof verification & settings management</p>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="inline-flex p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {([
          ["proof", "পেমেন্ট প্রুফ", ShieldCheck],
          ["settings", "পেমেন্ট সেটিংস", Settings],
        ] as [Tab, string, React.ComponentType<{ className?: string }>][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition ${
              tab === id
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/30"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "proof" ? <PaymentProofTab /> : <PaymentSettingsTab />}
    </div>
  );
}

/* ============================== TAB 1: Payment Proof ============================== */

function PaymentProofTab() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "failed">("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<OrderRow | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, full_name, email, phone, payment_method, transaction_id, payment_screenshot_url, payment_status, status, total, admin_note")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as OrderRow[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const methods = useMemo(() => Array.from(new Set(rows.map(r => r.payment_method).filter(Boolean))), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => {
      if (statusFilter !== "all" && r.payment_status !== statusFilter) return false;
      if (methodFilter !== "all" && r.payment_method !== methodFilter) return false;
      if (!s) return true;
      return (
        r.transaction_id?.toLowerCase().includes(s) ||
        r.full_name?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        shortId(r.id).toLowerCase().includes(s)
      );
    });
  }, [rows, q, statusFilter, methodFilter]);

  const stats = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0;
    rows.forEach(r => {
      if (r.payment_status === "pending") pending++;
      else if (r.payment_status === "verified") approved++;
      else if (r.payment_status === "failed") rejected++;
    });
    return { all: rows.length, pending, approved, rejected };
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <CreditCard className="h-4 w-4 text-violet-600" /> Payments
          </h3>
          <p className="text-xs text-slate-500">Payment proof verification & settings management</p>
        </div>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="All Payments" icon={CreditCard} iconCls="bg-violet-100 text-violet-600" value={String(stats.all)} />
        <StatCard label="Pending" icon={Clock} iconCls="bg-amber-100 text-amber-600" value={String(stats.pending)} />
        <StatCard label="Approved" icon={CheckCircle2} iconCls="bg-emerald-100 text-emerald-600" value={String(stats.approved)} />
        <StatCard label="Rejected" icon={XCircle} iconCls="bg-rose-100 text-rose-600" value={String(stats.rejected)} />
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by transaction ID, order, customer…"
            className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full appearance-none rounded-xl bg-white border border-slate-200 pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Approved</option>
            <option value="failed">Rejected</option>
          </select>
        </div>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full appearance-none rounded-xl bg-white border border-slate-200 pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="all">All Methods</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_0.8fr] items-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70 border-b border-slate-100">
          <div>Transaction ID</div>
          <div>Order</div>
          <div>Customer</div>
          <div>Method</div>
          <div>Amount</div>
          <div>Submitted</div>
          <div>Status</div>
          <div className="text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-16 grid place-items-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No payments found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-[1.2fr_1fr_1.4fr_0.8fr_0.7fr_1fr_0.9fr_0.8fr] items-center px-5 py-3 hover:bg-slate-50/60 transition">
                <div className="text-sm font-mono text-slate-800 truncate">{r.transaction_id || "—"}</div>
                <div className="text-sm text-slate-700 font-medium">{shortId(r.id)}</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{r.full_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{r.email}</div>
                </div>
                <div className="text-sm text-slate-700 capitalize">{r.payment_method}</div>
                <div className="text-sm font-bold text-slate-900">{fmt(Number(r.total))}</div>
                <div className="text-xs text-slate-500">{timeAgoOrDate(r.created_at)}</div>
                <div>{statusPill(r.payment_status)}</div>
                <div className="text-right">
                  <button
                    onClick={() => setViewing(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <ReviewModal
          row={viewing}
          onClose={() => setViewing(null)}
          onDone={() => { setViewing(null); load(true); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, icon: Icon, iconCls, value }: {
  label: string; icon: React.ComponentType<{ className?: string }>; iconCls: string; value: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-4">
      <div className={`inline-grid place-items-center h-8 w-8 rounded-full ${iconCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function ReviewModal({ row, onClose, onDone }: { row: OrderRow; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState(row.admin_note ?? "");
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);

  const setStatus = async (payment_status: "verified" | "failed") => {
    setBusy(payment_status === "verified" ? "approve" : "reject");
    const patch: Record<string, unknown> = { payment_status, admin_note: note.trim() || null };
    if (payment_status === "verified") patch.status = "processing";
    const { error } = await supabase.from("orders").update(patch).eq("id", row.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(payment_status === "verified" ? "Payment approved" : "Payment rejected");
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto grid place-items-start sm:place-items-center" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Review payment</h3>
            <p className="text-xs text-slate-500">{shortId(row.id)} · {row.full_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-5 border-r border-slate-100 space-y-3">
            <Row label="Transaction ID" value={<span className="font-mono text-slate-800">{row.transaction_id || "—"}</span>} />
            <Row label="Method" value={<span className="capitalize">{row.payment_method}</span>} />
            <Row label="Amount" value={<span className="font-bold text-slate-900">{fmt(Number(row.total))}</span>} />
            <Row label="Customer" value={<span>{row.full_name}</span>} />
            <Row label="Email" value={<span className="break-all">{row.email}</span>} />
            <Row label="Phone" value={<span>{row.phone}</span>} />
            <Row label="Submitted" value={<span>{new Date(row.created_at).toLocaleString()}</span>} />
            <Row label="Status" value={statusPill(row.payment_status)} />
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Admin note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Optional note visible to team…"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50/60">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Payment screenshot</div>
            {row.payment_screenshot_url ? (
              <a href={row.payment_screenshot_url} target="_blank" rel="noreferrer" className="block">
                <img src={row.payment_screenshot_url} alt="screenshot" className="w-full rounded-xl border border-slate-200 bg-white" />
              </a>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No screenshot uploaded
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={() => setStatus("failed")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
          >
            {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
          </button>
          <button
            onClick={() => setStatus("verified")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-sm">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

/* ============================== TAB 2: Payment Settings ============================== */

function PaymentSettingsTab() {
  const [rows, setRows] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_records")
      .select("id, is_active, sort_order, data")
      .eq("kind", "payment_method")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows(((data ?? []) as unknown) as PaymentMethod[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (r: PaymentMethod) => {
    const { error } = await supabase.from("admin_records").update({ is_active: !r.is_active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (r: PaymentMethod) => {
    if (!confirm(`Delete ${r.data.name}?`)) return;
    const { error } = await supabase.from("admin_records").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const move = async (r: PaymentMethod, dir: -1 | 1) => {
    const idx = rows.findIndex(x => x.id === r.id);
    const j = idx + dir;
    if (j < 0 || j >= rows.length) return;
    const other = rows[j];
    await Promise.all([
      supabase.from("admin_records").update({ sort_order: other.sort_order }).eq("id", r.id),
      supabase.from("admin_records").update({ sort_order: r.sort_order }).eq("id", other.id),
    ]);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-500" />
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">পেমেন্ট নম্বর ম্যানেজমেন্ট</h3>
            <p className="text-xs text-slate-500">পেমেন্ট মেথডের নম্বর, লোগো ও তথ্য পরিবর্তন করুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 shadow-sm">
            <RefreshCw className="h-3.5 w-3.5" /> রিসেট
          </button>
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-md shadow-violet-500/30 hover:opacity-95">
            <Plus className="h-4 w-4" /> নতুন মেথড
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-16 grid place-items-center text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-sm text-slate-500">
          কোনো পেমেন্ট মেথড নেই। নতুন যোগ করুন।
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 text-slate-300">
                <button onClick={() => move(r, -1)} className="p-1 rounded hover:bg-slate-100 hover:text-slate-600"><ArrowUp className="h-3.5 w-3.5" /></button>
                <GripVertical className="h-4 w-4" />
                <button onClick={() => move(r, 1)} className="p-1 rounded hover:bg-slate-100 hover:text-slate-600"><ArrowDown className="h-3.5 w-3.5" /></button>
              </div>

              <div className="h-14 w-14 rounded-full grid place-items-center overflow-hidden shrink-0" style={{ background: (r.data.color ?? "#f1f5f9") + "20" }}>
                {r.data.logo_url ? (
                  <img src={r.data.logo_url} alt={r.data.name} className="h-14 w-14 object-cover" />
                ) : (
                  <CreditCard className="h-6 w-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-bold text-slate-900">{r.data.name || "Untitled"}</span>
                  {r.data.send_money_label && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {r.data.send_money_label}
                    </span>
                  )}
                  {!r.data.send_money_label && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Send Money
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  <span className="text-slate-400">📞</span>
                  <span className="font-semibold" style={{ color: r.data.color ?? "#0f172a" }}>{r.data.number || "—"}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {(r.data.instructions ?? "").split("\n").filter(Boolean).length || 0} টি ধাপ
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full" style={{ background: r.data.color ?? "#e2e8f0" }} title={r.data.color} />
                <button
                  onClick={() => toggle(r)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${r.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                  title={r.is_active ? "Active" : "Disabled"}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition ${r.is_active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <button onClick={() => setEditing(r)} className="p-2 rounded-lg text-violet-600 hover:bg-violet-50" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(r)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MethodEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {showNew && (
        <MethodEditor
          initial={null}
          nextSort={rows.length}
          onClose={() => setShowNew(false)}
          onSaved={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}

function MethodEditor({ initial, nextSort, onClose, onSaved }: {
  initial: PaymentMethod | null;
  nextSort?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.data.name ?? "");
  const [number, setNumber] = useState(initial?.data.number ?? "");
  const [color, setColor] = useState(initial?.data.color ?? "#8b5cf6");
  const [logoUrl, setLogoUrl] = useState(initial?.data.logo_url ?? "");
  const [sendMoneyLabel, setSendMoneyLabel] = useState(initial?.data.send_money_label ?? "Send Money");
  const [instructions, setInstructions] = useState(initial?.data.instructions ?? "");
  const [enableCheckout, setEnableCheckout] = useState(initial?.data.enable_checkout ?? true);
  const [enableWallet, setEnableWallet] = useState(initial?.data.enable_wallet ?? true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const webp = await fileToWebp(file);
      const path = `logo_url/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error } = await supabase.storage.from("admin-uploads").upload(path, webp, { contentType: "image/webp" });
      if (error) throw error;
      const { data } = supabase.storage.from("admin-uploads").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setBusy(true);
    const data = {
      name: name.trim(),
      number: number.trim(),
      color,
      logo_url: logoUrl,
      send_money_label: sendMoneyLabel.trim() || "Send Money",
      instructions,
      enable_checkout: enableCheckout,
      enable_wallet: enableWallet,
    };
    if (initial) {
      const { error } = await supabase.from("admin_records").update({ data }).eq("id", initial.id);
      if (error) { setBusy(false); toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("admin_records").insert({
        kind: "payment_method",
        data,
        is_active: true,
        sort_order: nextSort ?? 0,
      });
      if (error) { setBusy(false); toast.error(error.message); return; }
    }
    setBusy(false);
    toast.success("Saved");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto grid place-items-start sm:place-items-center" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">{initial ? "মেথড এডিট" : "নতুন পেমেন্ট মেথড"}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Method name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. bKash" className="input" />
            </Field>
            <Field label="Number">
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="01xxxxxxxxx" className="input" />
            </Field>
            <Field label="Action label">
              <input value={sendMoneyLabel} onChange={(e) => setSendMoneyLabel(e.target.value)} placeholder="Send Money" className="input" />
            </Field>
            <Field label="Brand colour">
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer" />
                <input value={color} onChange={(e) => setColor(e.target.value)} className="input flex-1" />
              </div>
            </Field>
          </div>

          <Field label="Logo">
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} alt="logo" className="h-14 w-14 rounded-full object-cover border border-slate-200" /> : <div className="h-14 w-14 rounded-full bg-slate-100 grid place-items-center text-slate-400"><CreditCard className="h-5 w-5" /></div>}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm cursor-pointer hover:bg-slate-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {logoUrl ? "Change" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
              </label>
              {logoUrl && <button onClick={() => setLogoUrl("")} className="text-xs text-rose-600 hover:underline">Remove</button>}
            </div>
          </Field>

          <Field label="Instructions (one step per line)">
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Open app → Send Money → …" className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enableCheckout} onChange={(e) => setEnableCheckout(e.target.checked)} />
              Available at checkout
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enableWallet} onChange={(e) => setEnableWallet(e.target.checked)} />
              Available for wallet
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-md disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid rgb(226 232 240);border-radius:0.75rem;padding:0.55rem 0.75rem;font-size:0.875rem;background:white}.input:focus{outline:none;box-shadow:0 0 0 2px rgb(167 139 250)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}
