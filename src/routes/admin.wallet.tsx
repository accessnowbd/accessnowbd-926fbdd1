import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, Plus, Minus, Check, X, Eye, Wallet, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getWalletScreenshotUrl } from "@/lib/wallet.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/wallet")({
  component: AdminWalletPage,
});

type Topup = {
  id: string; user_id: string; amount: number; method: string; sender_number: string | null;
  txn_id: string | null; screenshot_path: string | null; status: "pending" | "approved" | "rejected";
  admin_note: string | null; created_at: string;
};
type WalletRow = { user_id: string; balance: number };
type Profile = { id: string; display_name: string | null; phone: string | null };
type Txn = {
  id: string; user_id: string; amount: number; type: string; reason: string | null;
  balance_after: number; created_at: string;
};

type Tab = "pending" | "balances" | "transactions";

function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>("pending");
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="w-6 h-6 text-violet-600" /> Wallet Management</h1>
          <p className="text-sm text-slate-500">Approve top-ups, view balances, credit/debit any user.</p>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200">
        {([
          ["pending", "Pending top-ups"],
          ["balances", "User balances"],
          ["transactions", "All transactions"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 h-10 text-sm font-semibold border-b-2 -mb-px ${tab === id ? "border-violet-600 text-violet-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "pending" && <PendingTopups />}
      {tab === "balances" && <Balances />}
      {tab === "transactions" && <AllTransactions />}
    </div>
  );
}

function PendingTopups() {
  const [rows, setRows] = useState<Topup[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const getSigned = useServerFn(getWalletScreenshotUrl);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("wallet_topups").select("*").order("created_at", { ascending: false }).limit(200);
    const list = (data as any as Topup[]) || [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, display_name, phone").in("id", ids);
      const map: Record<string, Profile> = {};
      (ps as any as Profile[] | null)?.forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("approve_wallet_topup" as any, { _topup_id: id, _admin_note: null });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success("Approved & wallet credited"); load(); }
  };
  const reject = async (id: string) => {
    const note = window.prompt("Reason for rejection?") || "Rejected";
    setBusy(id);
    const { error } = await supabase.rpc("reject_wallet_topup" as any, { _topup_id: id, _admin_note: note });
    setBusy(null);
    if (error) toast.error(error.message); else { toast.success("Rejected"); load(); }
  };
  const view = async (path: string) => {
    try {
      const r = await getSigned({ data: { path } });
      setPreviewUrl(r.url);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status !== "pending").slice(0, 50);

  return (
    <div className="space-y-6">
      <button onClick={load} className="text-xs inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-slate-100 hover:bg-slate-200"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>

      <Section title={`Pending (${pending.length})`}>
        {loading ? <Skel /> : pending.length === 0 ? <Empty>No pending top-ups.</Empty> : (
          <Table>
            <thead><tr className="text-left text-xs text-slate-500"><th className="p-3">User</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">TrxID / Sender</th><th className="p-3">When</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3"><div className="font-semibold text-slate-900">{profiles[r.user_id]?.display_name || r.user_id.slice(0, 8)}</div><div className="text-[11px] text-slate-500">{profiles[r.user_id]?.phone || "—"}</div></td>
                  <td className="p-3 font-bold text-emerald-600">৳{Number(r.amount).toLocaleString()}</td>
                  <td className="p-3 text-sm">{r.method}</td>
                  <td className="p-3 text-xs"><div className="font-mono">{r.txn_id || "—"}</div><div className="text-slate-500">{r.sender_number || "—"}</div></td>
                  <td className="p-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.screenshot_path && (
                        <button onClick={() => view(r.screenshot_path!)} className="px-2 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button>
                      )}
                      <button disabled={busy === r.id} onClick={() => approve(r.id)} className="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"><Check className="w-3.5 h-3.5" />Approve</button>
                      <button disabled={busy === r.id} onClick={() => reject(r.id)} className="px-3 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"><X className="w-3.5 h-3.5" />Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      <Section title="Recently reviewed">
        {reviewed.length === 0 ? <Empty>None.</Empty> : (
          <Table>
            <thead><tr className="text-left text-xs text-slate-500"><th className="p-3">User</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Note</th><th className="p-3">When</th></tr></thead>
            <tbody>
              {reviewed.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 text-sm">{profiles[r.user_id]?.display_name || r.user_id.slice(0, 8)}</td>
                  <td className="p-3 font-semibold">৳{Number(r.amount).toLocaleString()}</td>
                  <td className="p-3"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{r.status}</span></td>
                  <td className="p-3 text-xs text-slate-600">{r.admin_note || "—"}</td>
                  <td className="p-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Section>

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="screenshot" className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function Balances() {
  const [rows, setRows] = useState<(WalletRow & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ user_id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: wallets } = await supabase.from("wallets").select("user_id, balance").order("balance", { ascending: false }).limit(500);
    const list = (wallets as any as WalletRow[]) || [];
    const ids = list.map((w) => w.user_id);
    const map: Record<string, Profile> = {};
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, display_name, phone").in("id", ids);
      (ps as any as Profile[] | null)?.forEach((p) => { map[p.id] = p; });
    }
    setRows(list.map((w) => ({ ...w, profile: map[w.user_id] })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.user_id.includes(s)
      || (r.profile?.display_name || "").toLowerCase().includes(s)
      || (r.profile?.phone || "").includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / phone / id" className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm" />
        </div>
        <button onClick={load} className="text-xs inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>

      {loading ? <Skel /> : (
        <Table>
          <thead><tr className="text-left text-xs text-slate-500"><th className="p-3">User</th><th className="p-3">Phone</th><th className="p-3 text-right">Balance</th><th className="p-3 text-right">Adjust</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id} className="border-t border-slate-100">
                <td className="p-3"><div className="font-semibold text-slate-900">{r.profile?.display_name || "—"}</div><div className="text-[11px] text-slate-500 font-mono">{r.user_id.slice(0, 8)}…</div></td>
                <td className="p-3 text-sm">{r.profile?.phone || "—"}</td>
                <td className="p-3 text-right font-bold text-violet-700">৳{Number(r.balance).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing({ user_id: r.user_id, name: r.profile?.display_name || r.user_id.slice(0, 8) })} className="px-3 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold">Credit / Debit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-sm">No users.</td></tr>}
          </tbody>
        </Table>
      )}

      {editing && <AdjustModal target={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AdjustModal({ target, onClose, onDone }: { target: { user_id: string; name: string }; onClose: () => void; onDone: () => void }) {
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErr("Enter a positive amount"); return; }
    if (reason.trim().length < 3) { setErr("Reason required"); return; }
    const signed = direction === "credit" ? amt : -amt;
    setBusy(true);
    const { error } = await supabase.rpc("admin_adjust_wallet" as any, { _user_id: target.user_id, _amount: signed, _reason: reason.trim() });
    setBusy(false);
    if (error) setErr(error.message); else { toast.success(`${direction === "credit" ? "Credited" : "Debited"} ৳${amt}`); onDone(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl">
        <h2 className="text-lg font-bold">Adjust wallet — {target.name}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setDirection("credit")} className={`h-10 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${direction === "credit" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200"}`}><Plus className="w-4 h-4" />Credit (+)</button>
          <button onClick={() => setDirection("debit")} className={`h-10 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${direction === "debit" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200"}`}><Minus className="w-4 h-4" />Debit (−)</button>
        </div>
        <label className="block text-xs font-semibold text-slate-700 mt-4">Amount (৳)</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm mt-1" placeholder="0" />
        <label className="block text-xs font-semibold text-slate-700 mt-3">Reason (required, will appear in user's history)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm mt-1" placeholder="e.g. Refund for order ANB-XXX" />
        {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-sm font-semibold">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex-1 h-11 rounded-full text-white text-sm font-bold disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef)" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function AllTransactions() {
  const [rows, setRows] = useState<Txn[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(300);
    if (typeFilter) q = q.eq("type", typeFilter as any);
    const { data } = await q;
    const list = (data as any as Txn[]) || [];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, display_name, phone").in("id", ids);
      const map: Record<string, Profile> = {};
      (ps as any as Profile[] | null)?.forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, [typeFilter]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm">
          <option value="">All types</option>
          {["topup", "refund", "cashback", "referral", "spend", "adjustment"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={load} className="text-xs inline-flex items-center gap-1.5 px-3 h-10 rounded-xl bg-slate-100 hover:bg-slate-200"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>
      {loading ? <Skel /> : (
        <Table>
          <thead><tr className="text-left text-xs text-slate-500"><th className="p-3">When</th><th className="p-3">User</th><th className="p-3">Type</th><th className="p-3">Reason</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Balance after</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="p-3 text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</td>
                <td className="p-3 text-sm">{profiles[t.user_id]?.display_name || t.user_id.slice(0, 8)}</td>
                <td className="p-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{t.type}</span></td>
                <td className="p-3 text-xs text-slate-600 max-w-[300px] truncate">{t.reason || "—"}</td>
                <td className={`p-3 text-right font-bold ${Number(t.amount) > 0 ? "text-emerald-600" : "text-rose-600"}`}>{Number(t.amount) > 0 ? "+" : ""}৳{Number(t.amount).toLocaleString()}</td>
                <td className="p-3 text-right text-sm">৳{Number(t.balance_after).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">No transactions.</td></tr>}
          </tbody>
        </Table>
      )}
    </div>
  );
}

// ---- shared ----
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="text-sm font-bold text-slate-700 mb-2">{title}</h2>{children}</div>;
}
function Table({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto"><table className="w-full text-sm">{children}</table></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">{children}</div>;
}
function Skel() { return <div className="p-8 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin inline" /></div>; }
