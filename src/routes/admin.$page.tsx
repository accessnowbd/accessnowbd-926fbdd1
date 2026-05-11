import { createFileRoute, Link, useParams, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Construction, ArrowLeft, Plus, Trash2, Pencil, Loader2, X, Check, Save, GripVertical, Upload, Search } from "lucide-react";
import { findAdminPage, ADMIN_MENU } from "@/lib/admin-menu";
import { getFeatureConfig, validateField, type AdminField } from "@/lib/admin-fields";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/$page")({
  component: AdminFeaturePage,
});

type Record = {
  id: string;
  kind: string;
  data: Record_;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
type Record_ = { [k: string]: unknown };

function AdminFeaturePage() {
  const { page } = useParams({ from: "/admin/$page" });
  const item = findAdminPage(`/admin/${page}`);
  const group = ADMIN_MENU.find((g) => g.items.some((i) => i.to === `/admin/${page}`));
  const cfg = getFeatureConfig(page);

  if (cfg?.kind === "_redirect_products") return <Navigate to="/admin/products" />;
  if (cfg?.kind === "_redirect_users") return <Navigate to="/admin/users" />;

  if (!item) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 grid place-items-center text-slate-400 mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
        <Link to="/admin" className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.grad} grid place-items-center text-white shadow-md shrink-0`}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group?.title}</div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{item.label}</h1>
            <p className="text-sm text-slate-500 mt-1">{cfg?.description ?? `Manage ${item.label.toLowerCase()}.`}</p>
          </div>
        </div>
      </div>

      {cfg ? (
        cfg.mode === "list" ? (
          <ListCrud kind={cfg.kind} fields={cfg.fields} />
        ) : (
          <SingleSettings kind={cfg.kind} fields={cfg.fields} />
        )
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">No editor configured for this module yet.</p>
        </div>
      )}
    </div>
  );
}

/* ============================== LIST CRUD ============================== */

function ListCrud({ kind, fields }: { kind: string; fields: AdminField[] }) {
  const [rows, setRows] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record | null>(null);
  const [showForm, setShowForm] = useState(false);

  const primary = useMemo(() => fields.find((f) => f.primary) ?? fields[0], [fields]);
  const secondary = useMemo(() => fields.filter((f) => f !== primary).slice(0, 2), [fields, primary]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_records")
      .select("*")
      .eq("kind", kind)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Record[]);
    setLoading(false);
  }, [kind]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("admin_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (row: Record) => {
    const { error } = await supabase
      .from("admin_records")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    load();
  };

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const persistOrder = async (next: Record[]) => {
    const changed = next
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => r.sort_order !== i);
    if (!changed.length) return;
    const results = await Promise.all(
      changed.map(({ r, i }) =>
        supabase.from("admin_records").update({ sort_order: i }).eq("id", r.id)
      )
    );
    const err = results.find((x) => x.error)?.error;
    if (err) {
      toast.error(err.message);
      load();
    } else {
      toast.success("Order saved");
    }
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const from = rows.findIndex((r) => r.id === dragId);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0) return;
    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const renumbered = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(renumbered);
    setDragId(null); setOverId(null);
    persistOrder(renumbered);
  };

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const searchableNames = useMemo(
    () => [primary, ...secondary].filter(Boolean).map((f) => f!.name),
    [primary, secondary]
  );

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;
      if (!q) return true;
      return searchableNames.some((n) => String(r.data?.[n] ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, statusFilter, searchableNames]);

  const filtering = query.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm text-slate-500">
          {filtering ? `${visibleRows.length} of ${rows.length}` : `${rows.length}`} {rows.length === 1 ? "entry" : "entries"}
          {!filtering && <> · drag <GripVertical className="w-3 h-3 inline" /> to reorder</>}
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow"
        >
          <Plus className="w-4 h-4" /> Add new
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${[primary, ...secondary].filter(Boolean).map((f) => f!.label.toLowerCase()).join(", ")}…`}
            className="w-full h-10 pl-9 pr-9 rounded-full border border-slate-200 text-sm bg-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Clear">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="inline-flex h-10 rounded-full border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 rounded-full capitalize transition ${
                statusFilter === s ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
        ) : visibleRows.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            {rows.length === 0 ? `No entries yet. Click "Add new" to create the first one.` : "No matches for your search."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-4 py-3">{primary?.label ?? "Item"}</th>
                {secondary.map((f) => <th key={f.name} className="text-left px-4 py-3">{f.label}</th>)}
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((r) => (
                <tr
                  key={r.id}
                  draggable={!filtering}
                  onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = "move"; }}
                  onDragOver={(e) => { e.preventDefault(); if (overId !== r.id) setOverId(r.id); }}
                  onDragLeave={() => { if (overId === r.id) setOverId(null); }}
                  onDrop={(e) => { e.preventDefault(); onDrop(r.id); }}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  className={`hover:bg-slate-50/60 ${dragId === r.id ? "opacity-40" : ""} ${overId === r.id && dragId !== r.id ? "bg-violet-50/60 outline outline-1 outline-violet-300" : ""}`}
                >
                  <td className="px-2 py-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                    <GripVertical className="w-4 h-4" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{String(r.data?.[primary?.name ?? ""] ?? "—")}</td>
                  {secondary.map((f) => (
                    <td key={f.name} className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                      {renderCell(r.data?.[f.name], f)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {r.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => { setEditing(r); setShowForm(true); }}
                        className="w-8 h-8 grid place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="w-8 h-8 grid place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <RecordForm
          kind={kind}
          fields={fields}
          record={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function renderCell(value: unknown, f: AdminField) {
  if (value == null || value === "") return <span className="text-slate-300">—</span>;
  if (f.type === "boolean") return value ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-slate-400" />;
  if (f.type === "image") return <img src={String(value)} alt="" className="w-8 h-8 rounded object-cover" />;
  return String(value);
}

/* ============================== FORM MODAL ============================== */

function RecordForm({
  kind, fields, record, onClose, onSaved,
}: {
  kind: string; fields: AdminField[]; record: Record | null; onClose: () => void; onSaved: () => void;
}) {
  const [data, setData] = useState<Record_>(record?.data ?? {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    for (const f of fields) {
      if (f.required && !data[f.name]) return toast.error(`${f.label} is required`);
    }
    setSaving(true);
    const payload = { kind, data: data as never, is_active: record?.is_active ?? true };
    const op = record
      ? supabase.from("admin_records").update(payload).eq("id", record.id)
      : supabase.from("admin_records").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(record ? "Updated" : "Created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{record ? "Edit entry" : "New entry"}</h2>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {fields.map((f) => (
            <FieldInput key={f.name} field={f} value={data[f.name]} onChange={(v) => setData({ ...data, [f.name]: v })} />
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={saving} className="h-10 px-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow inline-flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== SINGLE SETTINGS ============================== */

function SingleSettings({ kind, fields }: { kind: string; fields: AdminField[] }) {
  const [data, setData] = useState<Record_>({});
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("admin_records").select("*").eq("kind", kind).limit(1);
      if (error) toast.error(error.message);
      const row = rows?.[0];
      if (row) { setData(row.data as Record_); setRecordId(row.id); }
      setLoading(false);
    })();
  }, [kind]);

  const save = async () => {
    setSaving(true);
    const payload = { kind, data: data as never, is_active: true };
    const { data: out, error } = recordId
      ? await supabase.from("admin_records").update(payload).eq("id", recordId).select().single()
      : await supabase.from("admin_records").insert(payload).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (out) setRecordId(out.id);
    toast.success("Saved");
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-slate-400" />
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
            <FieldInput field={f} value={data[f.name]} onChange={(v) => setData({ ...data, [f.name]: v })} />
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button onClick={save} disabled={saving} className="h-10 px-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow inline-flex items-center gap-1.5 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save settings
        </button>
      </div>
    </div>
  );
}

/* ============================== FIELD INPUT ============================== */

function FieldInput({ field, value, onChange }: { field: AdminField; value: unknown; onChange: (v: unknown) => void }) {
  const base = "w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white";
  const label = (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {field.label}{field.required && <span className="text-rose-500"> *</span>}
    </label>
  );
  const v = value ?? "";
  switch (field.type) {
    case "textarea":
      return (
        <div>{label}
          <textarea value={String(v)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} className={base + " h-auto py-2 resize-y"} />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-3 h-10 px-3 rounded-lg border border-slate-200 bg-white">
          <span className="text-sm font-medium text-slate-700">{field.label}</span>
          <button type="button" onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full relative transition ${value ? "bg-violet-600" : "bg-slate-300"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition ${value ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      );
    case "select":
      return (
        <div>{label}
          <select value={String(v)} onChange={(e) => onChange(e.target.value)} className={base}>
            <option value="">—</option>
            {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    case "number":
      return (
        <div>{label}
          <input type="number" value={v === "" ? "" : Number(v)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} placeholder={field.placeholder} className={base} />
        </div>
      );
    case "color":
      return (
        <div>{label}
          <div className="flex gap-2">
            <input type="color" value={String(v) || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-10 w-14 rounded-lg border border-slate-200" />
            <input type="text" value={String(v)} onChange={(e) => onChange(e.target.value)} className={base} />
          </div>
        </div>
      );
    case "date":
      return (
        <div>{label}
          <input type="datetime-local" value={String(v)} onChange={(e) => onChange(e.target.value)} className={base} />
        </div>
      );
    case "image":
      return <ImageField field={field} value={v} label={label} base={base} onChange={onChange} />;
    default:
      return (
        <div>{label}
          <input type={field.type === "url" ? "url" : "text"} value={String(v)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={base} />
        </div>
      );
  }
}

function ImageField({
  field, value, label, base, onChange,
}: {
  field: AdminField; value: unknown; label: React.ReactNode; base: string; onChange: (v: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onPick = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${field.name}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("admin-uploads").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Uploaded");
  };
  return (
    <div>{label}
      <div className="flex gap-2">
        <input type="url" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" className={base} />
        <label className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      {!!value && <img src={String(value)} alt="" className="mt-2 h-20 rounded-lg border border-slate-200 object-cover" />}
    </div>
  );
}
