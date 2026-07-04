import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Loader2, Eye, Trash2, MessageCircle, RefreshCw, Search as SearchIcon,
  Mail, Phone, ArrowRight, X, ShoppingBag, Tag, UserRound,
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
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join("").toUpperCase() || "?";
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

const AVATAR_TONES = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
];
function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function AbandonedCheckoutPage() {
  const { t } = useAdminLang();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"pending" | "all" | "recovered" | "contacted" | "high">("pending");
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

  const HIGH_VALUE_THRESHOLD = 500;
  const HIGH_VALUE_THRESHOLD_FOR_COUNT = HIGH_VALUE_THRESHOLD;

  const _visibleForCounts = useMemo(
    () => rows.filter((r) => {
      const name = (r.full_name || "").trim();
      const email = (r.email || "").trim();
      const phone = (r.phone || "").trim();
      if (r.user_id) return true;
      return Boolean(email || phone || (name && name !== "—"));
    }),
    [rows],
  );

  const counts = useMemo(() => ({
    all: _visibleForCounts.length,
    pending: _visibleForCounts.filter((r) => r.status === "pending").length,
    recovered: _visibleForCounts.filter((r) => r.status === "recovered").length,
    contacted: _visibleForCounts.filter((r) => r.status === "contacted").length,
    lost: _visibleForCounts.filter((r) => r.status === "lost").length,
    high: _visibleForCounts.filter((r) => Number(r.total) >= HIGH_VALUE_THRESHOLD_FOR_COUNT).length,
  }), [_visibleForCounts]);

  const potentialRevenue = useMemo(
    () => _visibleForCounts.filter((r) => r.status === "pending" || r.status === "contacted").reduce((a, r) => a + Number(r.total || 0), 0),
    [_visibleForCounts],
  );
  const recoveredValue = useMemo(
    () => _visibleForCounts.filter((r) => r.status === "recovered").reduce((a, r) => a + Number(r.total || 0), 0),
    [_visibleForCounts],
  );
  const recoveryRate = counts.all ? (counts.recovered / counts.all) * 100 : 0;

  // Guests (no user_id) must have submitted their info via the form.
  // Signed-in users always show. This keeps anonymous browsers out.
  const hasSubmittedInfo = (r: Row) => {
    const name = (r.full_name || "").trim();
    const email = (r.email || "").trim();
    const phone = (r.phone || "").trim();
    if (r.user_id) return true;
    return Boolean(email || phone || (name && name !== "—"));
  };

  const visibleRows = useMemo(() => rows.filter(hasSubmittedInfo), [rows]);

  const filtered = useMemo(() => visibleRows.filter((r) => {
    if (tab === "pending" && r.status !== "pending") return false;
    if (tab === "recovered" && r.status !== "recovered") return false;
    if (tab === "contacted" && r.status !== "contacted") return false;
    if (tab === "high" && Number(r.total) < HIGH_VALUE_THRESHOLD) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.phone?.toLowerCase().includes(s) ||
      r.coupon_code?.toLowerCase().includes(s) ||
      (r.items ?? []).some((it) => it.name?.toLowerCase().includes(s))
    );
  }), [visibleRows, tab, q]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("Potential Revenue", "সম্ভাব্য রেভিনিউ")}
          value={fmtMoney(potentialRevenue)}
          note={`${counts.pending + counts.contacted} ${t("open carts", "ওপেন কার্ট")}`}
          noteTone="slate"
          loading={loading}
        />
        <StatCard
          label={t("Recovery Rate", "রিকভারি রেট")}
          value={`${recoveryRate.toFixed(1)}%`}
          note={t("Target: 18%", "টার্গেট: ১৮%")}
          noteTone="indigo"
          loading={loading}
        />
        <StatCard
          label={t("Active Checkouts", "অ্যাক্টিভ চেকআউট")}
          value={String(counts.all)}
          note={`${counts.high} ${t("high value", "হাই ভ্যালু")}`}
          noteTone="amber"
          loading={loading}
        />
        <StatCard
          label={t("Recovered Value", "রিকভারড ভ্যালু")}
          value={fmtMoney(recoveredValue)}
          note={`${counts.recovered} ${t("carts", "কার্ট")}`}
          noteTone="emerald"
          loading={loading}
        />
      </div>

      {/* Table container with search + filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("Search by name, email, phone, coupon or product…", "নাম, ইমেইল, ফোন, কুপন বা প্রোডাক্ট...")}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPill active={tab === "pending"} onClick={() => setTab("pending")}>
              {t("Pending", "পেন্ডিং")} <span className="ml-1 opacity-70">{counts.pending}</span>
            </FilterPill>
            <FilterPill active={tab === "all"} onClick={() => setTab("all")}>
              {t("All sessions", "সব")} <span className="ml-1 opacity-70">{counts.all}</span>
            </FilterPill>
            <FilterPill active={tab === "high"} onClick={() => setTab("high")}>
              {t("High Value (>৳500)", "হাই ভ্যালু (>৳৫০০)")} <span className="ml-1 opacity-70">{counts.high}</span>
            </FilterPill>
            <FilterPill active={tab === "contacted"} onClick={() => setTab("contacted")}>
              {t("Contacted", "কন্টাক্টেড")} <span className="ml-1 opacity-70">{counts.contacted}</span>
            </FilterPill>
            <FilterPill active={tab === "recovered"} onClick={() => setTab("recovered")}>
              {t("Recovered", "রিকভারড")} <span className="ml-1 opacity-70">{counts.recovered}</span>
            </FilterPill>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button onClick={load} title={t("Refresh", "রিফ্রেশ")}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">{t("Customer / Session", "কাস্টমার / সেশন")}</th>
                <th className="px-6 py-4">{t("Potential Revenue", "সম্ভাব্য রেভিনিউ")}</th>
                <th className="px-6 py-4">{t("Status", "স্ট্যাটাস")}</th>
                <th className="px-6 py-4 text-center">{t("Items", "আইটেম")}</th>
                <th className="px-6 py-4 text-right">{t("Last Activity", "শেষ অ্যাক্টিভিটি")}</th>
                <th className="px-6 py-4 text-right">{t("Action", "অ্যাকশন")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-slate-400" /></td></tr>
              )}
              {!loading && filtered.map((r) => (
                <TableRow
                  key={r.id}
                  row={r}
                  creating={creatingId === r.id}
                  highValue={Number(r.total) >= HIGH_VALUE_THRESHOLD}
                  onView={() => setSelected(r)}
                  onContact={() => updateRow(r.id, { status: "contacted", contacted_at: new Date().toISOString() })}
                  onDelete={() => deleteRow(r.id)}
                />
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm">{t("No abandoned checkouts.", "কোনো অ্যাবান্ডনড চেকআউট নেই।")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {t("Showing", "দেখানো হচ্ছে")} {filtered.length} {t("of", "মোট")} {counts.all} {t("sessions", "সেশন")}
          </span>
        </div>
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

function StatCard({ label, value, note, noteTone, loading }: { label: string; value: string | number; note?: string; noteTone?: "slate" | "indigo" | "emerald" | "amber"; loading?: boolean }) {
  const toneCls: Record<string, string> = {
    slate: "text-slate-400",
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-slate-900">{loading ? "…" : value}</span>
        {note && <span className={`text-xs font-medium ${toneCls[noteTone || "slate"]}`}>{note}</span>}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
        active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const { t } = useAdminLang();
  const m: Record<Row["status"], { cls: string; en: string; bn: string }> = {
    pending: { cls: "bg-amber-50 text-amber-700", en: "Actionable", bn: "অ্যাকশনেবল" },
    contacted: { cls: "bg-sky-50 text-sky-700", en: "Contacted", bn: "কন্টাক্টেড" },
    recovered: { cls: "bg-emerald-50 text-emerald-700", en: "Recovered", bn: "রিকভারড" },
    lost: { cls: "bg-slate-100 text-slate-500", en: "Not Given", bn: "নট গিভেন" },
  };
  const v = m[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.cls}`}>{t(v.en, v.bn)}</span>;
}

function TableRow({ row: r, creating, highValue, onView, onContact, onDelete }: { row: Row; creating?: boolean; highValue: boolean; onView: () => void; onContact: () => void; onDelete: () => void }) {
  const { t } = useAdminLang();
  const waLink = r.phone ? `https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(buildRecoveryMessage(r))}` : "";
  const itemCount = (r.items ?? []).reduce((a, it) => a + (it.qty ?? 1), 0);
  const isGuest = !r.full_name || r.full_name.trim() === "";
  const displayName = isGuest ? t("Guest Visitor", "গেস্ট ভিজিটর") : r.full_name;
  const sub = isGuest
    ? (r.email || `Session #${(r.session_key || r.id).slice(-6).toUpperCase()}`)
    : (r.email || r.phone || "—");

  return (
    <tr className={`transition-colors group ${highValue && r.status === "pending" ? "hover:bg-violet-50/40" : "hover:bg-slate-50"}`}>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-3 ${isGuest ? "opacity-70" : ""}`}>
          {isGuest ? (
            <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
              <UserRound className="h-4 w-4" />
            </span>
          ) : (
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarTone(r.full_name)}`}>
              {initials(r.full_name)}
            </span>
          )}
          <div className="min-w-0">
            <div className={`text-sm font-semibold text-slate-900 truncate max-w-[220px] ${isGuest ? "italic text-slate-600 font-medium" : ""}`}>{displayName}</div>
            <div className="text-xs text-slate-500 truncate max-w-[220px] flex items-center gap-1.5">
              {!isGuest && r.email && <Mail className="w-3 h-3 text-slate-400 shrink-0" />}
              {!isGuest && !r.email && r.phone && <Phone className="w-3 h-3 text-slate-400 shrink-0" />}
              <span className="truncate">{sub}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${highValue ? "text-slate-900" : "text-slate-700"}`}>{fmtMoney(Number(r.total))}</span>
          {highValue && r.status === "pending" && <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" title={t("High value pending", "হাই ভ্যালু পেন্ডিং")} />}
          {r.coupon_code && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-700 bg-violet-50 rounded px-1.5 py-0.5">
              <Tag className="w-2.5 h-2.5" />{r.coupon_code}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
      <td className="px-6 py-4 text-sm text-slate-600 text-center font-semibold">{itemCount}</td>
      <td className="px-6 py-4 text-right text-xs text-slate-500 whitespace-nowrap">{formatWhen(r.last_seen_at || r.updated_at || r.created_at)}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {r.status === "pending" && (
            <button
              onClick={onContact}
              title={t("Mark contacted", "কন্টাক্ট করা হয়েছে")}
              className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            title={t("Delete", "ডিলিট")}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onView}
            disabled={creating}
            className={`ml-1 px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors inline-flex items-center gap-1.5 ${
              highValue && r.status === "pending"
                ? "text-white bg-violet-600 hover:bg-violet-700"
                : r.status === "pending"
                ? "text-violet-700 hover:text-violet-800"
                : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            {highValue && r.status === "pending" ? t("Recover Now", "রিকভার করুন") : t("Details", "ডিটেইল")}
          </button>
        </div>
      </td>
    </tr>
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
               className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">
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
                className="self-start px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700">
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
