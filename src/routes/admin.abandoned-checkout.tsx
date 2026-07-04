import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Loader2, Eye, Trash2, MessageCircle, RefreshCw, Search as SearchIcon,
  Mail, Phone, ArrowRight, FileText, Clock, Package, X, ShoppingBag,
  UserRound, Tag, MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminLang } from "@/context/AdminLangContext";

export const Route = createFileRoute("/admin/abandoned-checkout")({
  component: AbandonedCheckoutPage,
});

type Item = { slug?: string; name: string; planPeriod?: string; qty?: number; price: number; emoji?: string };
type Row = {
  id: string;
  user_id: string | null;
  session_key?: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  items: Item[];
  subtotal: number;
  total: number;
  coupon_code: string | null;
  status: "pending" | "contacted" | "recovered" | "lost";
  stage?: string | null;
  source?: string | null;
  page_url?: string | null;
  last_seen_at?: string | null;
  metadata?: Record<string, unknown> | null;
  contacted_at: string | null;
  recovered_at: string | null;
  recovered_order_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

const fmtMoney = (n: number) => "৳" + Math.round(n).toLocaleString("en-IN");

function formatWhen(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildRecoveryMessage(r: Row): string {
  const name = r.full_name || "Customer";
  const items = (r.items ?? [])
    .map((it, i) => `${i + 1}. ${it.name}${it.planPeriod ? ` (${it.planPeriod})` : ""} ×${it.qty ?? 1} — ${fmtMoney(Number(it.price) * (it.qty ?? 1))}`)
    .join("\n");
  return [
    `আসসালামু আলাইকুম ${name},`,
    `আপনি Access Now BD-তে একটি checkout শুরু করেছিলেন।`,
    ``,
    `🛒 আপনার কার্ট:`,
    items || "Selected product",
    ``,
    `💰 মোট: ${fmtMoney(Number(r.total || 0))}`,
    r.coupon_code ? `🎟️ কুপন: ${r.coupon_code}` : null,
    ``,
    `অর্ডার সম্পন্ন করতে বা সাহায্য লাগলে এই WhatsApp-এ রিপ্লাই করুন।`,
    `— Access Now BD`,
  ].filter(Boolean).join("\n");
}

function AbandonedCheckoutPage() {
  const { t } = useAdminLang();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"pending" | "all" | "recovered" | "contacted">("pending");
  const [selected, setSelected] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from("abandoned_checkouts" as never) as unknown as {
        select: (s: string) => { order: (c: string, o: { ascending: boolean }) => Promise<{ data: Row[] | null; error: { message: string } | null }> };
      })
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-abandoned-checkouts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "abandoned_checkouts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as Row;
            setRows((current) => [next, ...current.filter((r) => r.id !== next.id)]);
            return;
          }
          if (payload.eventType === "UPDATE") {
            const next = payload.new as Row;
            setRows((current) => current.map((r) => (r.id === next.id ? next : r)));
            setSelected((current) => (current?.id === next.id ? next : current));
            return;
          }
          if (payload.eventType === "DELETE") {
            const old = payload.old as Pick<Row, "id">;
            setRows((current) => current.filter((r) => r.id !== old.id));
            setSelected((current) => (current?.id === old.id ? null : current));
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateRow = async (id: string, patch: Partial<Row>) => {
    const prev = rows;
    setRows((r) => r.map((x) => x.id === id ? { ...x, ...patch } as Row : x));
    setSelected((s) => s && s.id === id ? { ...s, ...patch } as Row : s);
    const { error } = await (supabase
      .from("abandoned_checkouts" as never) as unknown as {
        update: (p: Partial<Row>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
      })
      .update(patch)
      .eq("id", id);
    if (error) { setRows(prev); toast.error(error.message); return; }
  };

  const deleteRow = async (id: string) => {
    if (!confirm(t("Delete this abandoned checkout?", "এই অ্যাবান্ডনড চেকআউট ডিলিট করবেন?"))) return;
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await (supabase
      .from("abandoned_checkouts" as never) as unknown as {
        delete: () => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
      })
      .delete()
      .eq("id", id);
    if (error) { setRows(prev); toast.error(error.message); return; }
    toast.success(t("Deleted", "ডিলিট হয়েছে"));
    if (selected?.id === id) setSelected(null);
  };

  const createOrderFromAbandoned = async (r: Row) => {
    if (!r.items?.length) { toast.error(t("No items in this cart", "এই কার্টে কোনো আইটেম নেই")); return; }
    if (!confirm(t(
      `Create an order for ${r.full_name || r.email}? Total: ৳${Math.round(Number(r.total))}`,
      `${r.full_name || r.email}-এর জন্য অর্ডার তৈরি করবেন? মোট: ৳${Math.round(Number(r.total))}`,
    ))) return;
    setCreatingId(r.id);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("Not authenticated");
      const orderItems = (r.items ?? []).map((it) => ({
        slug: it.slug,
        name: it.name,
        emoji: it.emoji || "📦",
        planPeriod: it.planPeriod || "",
        qty: it.qty ?? 1,
        price: Number(it.price) || 0,
      }));
      const { data: ord, error } = await supabase
        .from("orders")
        .insert({
          user_id: r.user_id ?? adminUser.id,
          full_name: r.full_name || "—",
          email: r.email || "",
          phone: r.phone || "",
          payment_method: "manual",
          transaction_id: `AC-${Date.now()}`,
          items: orderItems,
          total: Number(r.total) || 0,
          status: "pending",
          payment_status: "pending",
          admin_note: `Created from abandoned checkout${r.coupon_code ? ` (coupon: ${r.coupon_code})` : ""}`,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      await updateRow(r.id, {
        status: "recovered",
        recovered_at: new Date().toISOString(),
        recovered_order_id: (ord as { id: string }).id,
      });
      toast.success(t("Order created", "অর্ডার তৈরি হয়েছে"));
      setSelected(null);
      navigate({ to: "/admin/orders" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setCreatingId(null);
    }
  };



  const counts = useMemo(() => ({
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    recovered: rows.filter((r) => r.status === "recovered").length,
    contacted: rows.filter((r) => r.status === "contacted").length,
    lost: rows.filter((r) => r.status === "lost").length,
  }), [rows]);

  const lostValue = useMemo(
    () => rows.filter((r) => r.status === "pending" || r.status === "lost").reduce((a, r) => a + Number(r.total || 0), 0),
    [rows],
  );

  const filtered = useMemo(() => rows.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.phone?.toLowerCase().includes(s) ||
      r.coupon_code?.toLowerCase().includes(s) ||
      r.source?.toLowerCase().includes(s) ||
      r.stage?.toLowerCase().includes(s) ||
      (r.items ?? []).some((it) => it.name?.toLowerCase().includes(s))
    );
  }), [rows, tab, q]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("Total", "মোট")} value={counts.all} tone="slate" icon={<FileText className="w-4 h-4" />} loading={loading} />
        <StatCard label={t("Pending Recovery", "পেন্ডিং রিকভারি")} value={counts.pending} tone="amber" icon={<Clock className="w-4 h-4" />} loading={loading} />
        <StatCard label={t("Recovered", "রিকভারড")} value={counts.recovered} tone="emerald" icon={<RefreshCw className="w-4 h-4" />} loading={loading} />
        <StatCard label={t("Lost Value", "লস্ট ভ্যালু")} value={fmtMoney(lostValue)} tone="rose" icon={<Package className="w-4 h-4" />} loading={loading} />
      </div>

      <div className="a-card p-3 sm:p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto] xl:items-center">
          <div className="relative min-w-0">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search by name, email, phone, coupon or product…", "নাম, ইমেইল, ফোন, কুপন বা প্রোডাক্ট...")}
              className="a-search"
          />
        </div>
          <div className="a-pills flex min-w-0 flex-wrap items-center gap-2">
            <Tab active={tab === "pending"} onClick={() => setTab("pending")}>{t("Pending", "পেন্ডিং")} <span className="a-pill-count">{counts.pending}</span></Tab>
            <Tab active={tab === "all"} onClick={() => setTab("all")}>{t("All", "সব")} <span className="a-pill-count">{counts.all}</span></Tab>
            <Tab active={tab === "recovered"} onClick={() => setTab("recovered")}>{t("Recovered", "রিকভারড")} <span className="a-pill-count">{counts.recovered}</span></Tab>
            <Tab active={tab === "contacted"} onClick={() => setTab("contacted")}>{t("Contacted", "কন্টাক্টেড")} <span className="a-pill-count">{counts.contacted}</span></Tab>
            <button onClick={load} className="a-pill shrink-0">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> {t("Refresh", "রিফ্রেশ")}
            </button>
          </div>
        </div>
      </div>

      <div className="a-card overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3">{t("Customer", "কাস্টমার")}</th>
                  <th className="text-left px-3 py-3">{t("Contact", "কন্টাক্ট")}</th>
                  <th className="text-center px-3 py-3">{t("Items", "আইটেম")}</th>
                  <th className="text-left px-3 py-3">{t("Total", "মোট")}</th>
                  <th className="text-left px-3 py-3">{t("When", "কখন")}</th>
                  <th className="text-left px-3 py-3">{t("Status", "স্ট্যাটাস")}</th>
                  <th className="text-right px-5 py-3">{t("Actions", "অ্যাকশন")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <RowItem
                    key={r.id}
                    row={r}
                    creating={creatingId === r.id}
                    onView={() => setSelected(r)}
                    onContact={() => updateRow(r.id, { status: "contacted", contacted_at: new Date().toISOString() })}
                    onCreateOrder={() => createOrderFromAbandoned(r)}
                    onDelete={() => deleteRow(r.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">{t("No abandoned checkouts.", "কোনো অ্যাবান্ডনড চেকআউট নেই।")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          row={selected}
          creating={creatingId === selected.id}
          onClose={() => setSelected(null)}
          onUpdate={(p) => updateRow(selected.id, p)}
          onCreateOrder={() => createOrderFromAbandoned(selected)}
          onDelete={() => deleteRow(selected.id)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, tone, icon, loading }: { label: string; value: string | number; tone: "slate"|"amber"|"emerald"|"rose"; icon: React.ReactNode; loading?: boolean }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
  };
  return (
    <div className="a-stat">
      <div className="flex items-start justify-between gap-3">
        <div className="a-stat-label">{label}</div>
        <span className={`a-stat-icon ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="a-stat-value">{loading ? "…" : value}</div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`a-pill shrink-0 ${active ? "a-pill-active" : ""}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const { t } = useAdminLang();
  const m: Record<Row["status"], { cls: string; en: string; bn: string }> = {
    pending: { cls: "a-status-pending", en: "Pending", bn: "পেন্ডিং" },
    contacted: { cls: "a-status-processing", en: "Contacted", bn: "কন্টাক্টেড" },
    recovered: { cls: "a-status-completed", en: "Recovered", bn: "রিকভারড" },
    lost: { cls: "a-status-failed", en: "Lost", bn: "লস্ট" },
  };
  const v = m[status];
  return <span className={`a-status ${v.cls}`}>{t(v.en, v.bn)}</span>;
}

function RowItem({ row: r, creating, onView, onContact, onCreateOrder, onDelete }: { row: Row; creating?: boolean; onView: () => void; onContact: () => void; onCreateOrder: () => void; onDelete: () => void }) {
  const { t } = useAdminLang();
  const waLink = r.phone ? `https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(buildRecoveryMessage(r))}` : "";
  const firstItem = (r.items ?? [])[0];
  const itemCount = (r.items ?? []).reduce((a, it) => a + (it.qty ?? 1), 0);
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/60">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
            <UserRound className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-extrabold text-slate-900">{r.full_name || t("Guest visitor", "গেস্ট ভিজিটর")}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-slate-500">{r.user_id ? t("Logged in", "লগড ইন") : t("Guest", "গেস্ট")} • {stageText(r.stage, t)}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="max-w-[190px] truncate">{r.email || t("Not given yet", "এখনো দেয়নি")}</span></div>
        {r.phone && <div className="mt-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{r.phone}</div>}
      </td>
      <td className="px-3 py-3 text-slate-700">
        <div className="max-w-[260px] truncate font-bold text-slate-900" title={firstItem?.name}>{firstItem?.name || t("Selected product", "সিলেক্টেড প্রোডাক্ট")}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">{itemCount} {t("item", "আইটেম")}</span>
          {r.coupon_code && <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-700"><Tag className="h-3 w-3" />{r.coupon_code}</span>}
        </div>
      </td>
      <td className="px-3 py-3 text-base font-extrabold text-slate-950">{fmtMoney(Number(r.total))}</td>
      <td className="px-3 py-3 text-xs text-slate-500">
        <div className="font-semibold text-slate-700">{formatWhen(r.last_seen_at || r.updated_at || r.created_at)}</div>
        <div className="mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{r.source || t("Website", "ওয়েবসাইট")}</div>
      </td>
      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <IconBtn title={t("View", "দেখুন")} onClick={onView} tone="sky"><Eye className="w-4 h-4" /></IconBtn>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp"
              className="a-action a-action-emerald">
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          <IconBtn title={t("Mark contacted", "কন্টাক্ট করা হয়েছে")} onClick={onContact} tone="violet"><ArrowRight className="w-4 h-4" /></IconBtn>
          <button
            onClick={onCreateOrder}
            disabled={creating}
            title={t("Create order", "অর্ডার তৈরি করুন")}
            className="a-action a-action-amber disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
          <IconBtn title={t("Delete", "ডিলিট")} onClick={onDelete} tone="rose"><Trash2 className="w-4 h-4" /></IconBtn>
        </div>
      </td>
    </tr>
  );
}

function IconBtn({ children, onClick, title, tone = "violet" }: { children: React.ReactNode; onClick: () => void; title: string; tone?: "violet" | "emerald" | "sky" | "amber" | "rose" }) {
  const toneClass: Record<string, string> = {
    violet: "a-action-violet",
    emerald: "a-action-emerald",
    sky: "a-action-sky",
    amber: "a-action-amber",
    rose: "a-action-rose",
  };
  return (
    <button
      onClick={onClick} title={title}
      className={`a-action ${toneClass[tone]}`}
    >
      {children}
    </button>
  );
}

function stageText(stage: string | null | undefined, t: (en: string, bn: string) => string) {
  const map: Record<string, string> = {
    intent: t("Browsing", "ব্রাউজ করছে"),
    product_view: t("Viewing product", "প্রোডাক্ট দেখছে"),
    cart: t("Cart", "কার্ট"),
    contact: t("Info entered", "তথ্য দিয়েছে"),
    payment: t("Payment step", "পেমেন্ট ধাপে"),
  };
  return map[stage || ""] || t("Activity", "অ্যাক্টিভিটি");
}

function DetailModal({ row, creating, onClose, onUpdate, onCreateOrder, onDelete }: { row: Row; creating?: boolean; onClose: () => void; onUpdate: (p: Partial<Row>) => void; onCreateOrder: () => void; onDelete: () => void }) {
  const { t } = useAdminLang();
  const [note, setNote] = useState(row.admin_note || "");
  const waLink = row.phone ? `https://wa.me/${row.phone.replace(/\D/g, "")}?text=${encodeURIComponent(buildRecoveryMessage(row))}` : "";
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="min-w-0 truncate text-lg font-extrabold text-slate-950">{row.full_name || t("Guest visitor", "গেস্ট ভিজিটর")}</h2>
            <StatusBadge status={row.status} />
            <span className="text-xs font-semibold text-slate-500">{formatWhen(row.last_seen_at || row.created_at)}</span>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{t("Contact", "কন্টাক্ট")}</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Mail className="w-4 h-4 text-slate-400" />{row.email || t("Not given yet", "এখনো দেয়নি")}</div>
              {row.phone && <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Phone className="w-4 h-4 text-slate-400" />{row.phone}</div>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{t("Cart Value", "কার্ট ভ্যালু")}</div>
              <div className="text-2xl font-extrabold text-slate-950">{fmtMoney(Number(row.total))}</div>
              {row.coupon_code && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700"><Tag className="h-3 w-3" />{row.coupon_code}</div>}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{t("Activity", "অ্যাক্টিভিটি")}</div>
              <div className="text-sm font-bold text-slate-900">{stageText(row.stage, t)}</div>
              <div className="mt-1 text-xs font-semibold text-slate-500">{row.source || t("Website", "ওয়েবসাইট")}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">{t("Items", "আইটেম")}</div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {(row.items ?? []).map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0">
                  <div className="min-w-0 text-sm">
                    <span className="font-medium text-slate-900">{it.emoji ? `${it.emoji} ` : ""}{it.name}</span>
                    {it.planPeriod && <span className="text-xs text-slate-500 ml-1">({it.planPeriod})</span>}
                    <span className="text-xs text-slate-400 ml-1.5">×{it.qty ?? 1}</span>
                  </div>
                  <div className="text-sm font-bold text-violet-700">{fmtMoney(Number(it.price) * (it.qty ?? 1))}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a href={waLink || "#"} target={waLink ? "_blank" : undefined} rel="noreferrer"
               className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${waLink ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "cursor-not-allowed border-slate-200 text-slate-400"}`}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <button onClick={() => onUpdate({ status: "contacted", contacted_at: new Date().toISOString() })}
               className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 text-sm font-bold text-sky-700 hover:bg-sky-100">
              <ArrowRight className="w-4 h-4" /> {t("Mark Contacted", "কন্টাক্ট করা হয়েছে")}
            </button>
            <button onClick={onCreateOrder} disabled={creating}
               className="a-save-btn h-11 justify-center disabled:opacity-60">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
              {t("Create Order", "অর্ডার তৈরি")}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t("Status", "স্ট্যাটাস")}</label>
            <select value={row.status} onChange={(e) => onUpdate({ status: e.target.value as Row["status"] })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm capitalize outline-none focus:border-violet-400">
              {["pending","contacted","recovered","lost"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t("Admin Note", "অ্যাডমিন নোট")}</label>
            <div className="flex gap-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"
                placeholder={t("Internal notes…", "ইন্টারনাল নোট...")} />
              <button onClick={() => onUpdate({ admin_note: note })}
                className="a-save-btn self-start">
                {t("Save", "সেভ")}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button onClick={onDelete} className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> {t("Delete this entry", "এন্ট্রি ডিলিট করুন")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
