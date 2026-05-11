import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, X, Tag, Calendar, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promotions")({
  component: AdminPromotions,
});

type Promo = {
  id?: string;
  title: string;
  description: string;
  code: string | null;
  badge: string | null;
  product_slug: string | null;
  discount_percent: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

const empty: Promo = {
  title: "",
  description: "",
  code: "",
  badge: "",
  product_slug: "",
  discount_percent: null,
  starts_at: null,
  ends_at: null,
  is_active: true,
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminPromotions() {
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Promo[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title.trim(),
      description: editing.description ?? "",
      code: editing.code?.trim() || null,
      badge: editing.badge?.trim() || null,
      product_slug: editing.product_slug?.trim() || null,
      discount_percent: editing.discount_percent ?? null,
      starts_at: editing.starts_at,
      ends_at: editing.ends_at,
      is_active: editing.is_active,
    };
    if (!payload.title) return toast.error("Title is required");
    if (isNew) {
      const { error } = await supabase.from("promotions").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Promotion created");
    } else {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editing.id!);
      if (error) return toast.error(error.message);
      toast.success("Promotion updated");
    }
    setEditing(null);
    setIsNew(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (p: Promo) => {
    const { error } = await supabase.from("promotions").update({ is_active: !p.is_active }).eq("id", p.id!);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-aurora">Promotions</h1>
          <p className="text-sm text-white/60 mt-1">Discounts, coupon codes and campaigns.</p>
        </div>
        <button
          onClick={() => { setEditing({ ...empty }); setIsNew(true); }}
          className="btn-aurora px-4 h-10 rounded-full text-sm inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> New promotion
        </button>
      </div>

      <div className="gradient-border-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-white/60">No promotions yet. Create your first campaign.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/60">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Ends</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{p.title}</div>
                    {p.badge && <div className="text-[10px] text-violet-300 mt-0.5">{p.badge}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/80">{p.code || "—"}</td>
                  <td className="px-4 py-3 text-white/80">{p.discount_percent ? `${p.discount_percent}%` : "—"}</td>
                  <td className="px-4 py-3 text-white/60">{p.ends_at ? new Date(p.ends_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.is_active ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" : "bg-white/5 text-white/50 border-white/10"}`}
                    >
                      {p.is_active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setEditing(p); setIsNew(false); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(p.id!)} className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="gradient-border-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{isNew ? "New Promotion" : "Edit Promotion"}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <Field label="Title"><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="admin-input" /></Field>
              <Field label="Description"><textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="admin-input" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" icon={<Tag className="w-3.5 h-3.5" />}><input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} className="admin-input" placeholder="SAVE20" /></Field>
                <Field label="Badge"><input value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} className="admin-input" placeholder="HOT" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount %" icon={<Percent className="w-3.5 h-3.5" />}>
                  <input type="number" min={0} max={100} value={editing.discount_percent ?? ""} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value === "" ? null : Number(e.target.value) })} className="admin-input" />
                </Field>
                <Field label="Product slug"><input value={editing.product_slug ?? ""} onChange={(e) => setEditing({ ...editing, product_slug: e.target.value })} className="admin-input" placeholder="netflix" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts" icon={<Calendar className="w-3.5 h-3.5" />}>
                  <input type="datetime-local" value={toLocalInput(editing.starts_at)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="admin-input" />
                </Field>
                <Field label="Ends" icon={<Calendar className="w-3.5 h-3.5" />}>
                  <input type="datetime-local" value={toLocalInput(editing.ends_at)} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="admin-input" />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-white/80">
                <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 h-9 rounded-full border border-white/15 text-white/80 text-xs font-semibold">Cancel</button>
              <button onClick={save} className="btn-aurora px-4 h-9 rounded-full text-xs inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 8px 12px;
          color: white;
          font-size: 13px;
          outline: none;
        }
        .admin-input:focus { border-color: rgba(167,139,250,0.5); background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
}

function Field({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-white/60 font-bold mb-1 flex items-center gap-1.5">{icon}{label}</span>
      {children}
    </label>
  );
}
