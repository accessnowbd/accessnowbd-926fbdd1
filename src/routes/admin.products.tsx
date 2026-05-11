import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2, Save, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Plan = { label: string; price: number; original_price?: number; duration?: string; note?: string };
type Product = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  badge: string | null;
  tagline: string;
  description: string;
  delivery_time: string;
  warranty: string;
  features: string[];
  plans: Plan[];
  is_active: boolean;
  sort_order: number;
};

const empty: Product = {
  slug: "", name: "", emoji: "📦", gradient: "from-primary to-primary",
  category: "OTT & Streaming", badge: null, tagline: "", description: "",
  delivery_time: "Within 30 mins", warranty: "Full warranty",
  features: [], plans: [{ label: "1 Month", price: 0, duration: "1 month" }],
  is_active: true, sort_order: 0,
};

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setProducts((data ?? []) as unknown as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (slug: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("slug", slug);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    load();
  };

  const move = async (slug: string, dir: -1 | 1) => {
    const idx = products.findIndex((p) => p.slug === slug);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= products.length) return;
    const a = products[idx], b = products[swap];
    const aOrder = a.sort_order, bOrder = b.sort_order;
    // Optimistic
    const next = [...products];
    next[idx] = { ...a, sort_order: bOrder };
    next[swap] = { ...b, sort_order: aOrder };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setProducts(next);
    const [r1, r2] = await Promise.all([
      supabase.from("products").update({ sort_order: bOrder }).eq("slug", a.slug),
      supabase.from("products").update({ sort_order: aOrder }).eq("slug", b.slug),
    ]);
    if (r1.error || r2.error) {
      toast.error("Reorder failed");
      load();
    }
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("slug", p.slug);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.map((x) => x.slug === p.slug ? { ...x, is_active: !p.is_active } : x));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} total</p>
        </div>
        <button
          onClick={() => { setEditing({ ...empty, sort_order: (products.at(-1)?.sort_order ?? 0) + 10 }); setIsNew(true); }}
          className="h-10 px-4 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-12">#</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2">Plans</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.slug} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.plans?.length ?? 0}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"}`}
                    >
                      {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {p.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="Move up" onClick={() => move(p.slug, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Move down" onClick={() => move(p.slug, 1)} disabled={i === products.length - 1}><ArrowDown className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Edit" onClick={() => { setEditing(p); setIsNew(false); }}><Pencil className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Delete" onClick={() => remove(p.slug)} danger><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function IconBtn({ children, onClick, disabled, danger, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 grid place-items-center rounded-md border border-border ${danger ? "text-destructive hover:bg-destructive/10" : "hover:bg-secondary"} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ProductEditor({ product, isNew, onClose, onSaved }: { product: Product; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Product>(product);
  const [busy, setBusy] = useState(false);
  const [featuresText, setFeaturesText] = useState((product.features ?? []).join("\n"));

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setForm((f) => ({ ...f, [k]: v }));

  const setPlan = (i: number, patch: Partial<Plan>) => {
    setForm((f) => ({ ...f, plans: f.plans.map((p, idx) => idx === i ? { ...p, ...patch } : p) }));
  };
  const addPlan = () => setForm((f) => ({ ...f, plans: [...f.plans, { label: "New plan", price: 0, duration: "" }] }));
  const removePlan = (i: number) => setForm((f) => ({ ...f, plans: f.plans.filter((_, idx) => idx !== i) }));
  const movePlan = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    setForm((f) => {
      if (j < 0 || j >= f.plans.length) return f;
      const next = [...f.plans];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, plans: next };
    });
  };

  const save = async () => {
    if (!form.slug.trim() || !form.name.trim()) return toast.error("Slug and name are required");
    setBusy(true);
    const features = featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    const payload = { ...form, features, plans: form.plans };
    const op = isNew
      ? supabase.from("products").insert(payload as never)
      : supabase.from("products").update(payload as never).eq("slug", form.slug);
    const { error } = await op;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Product created" : "Product updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
            {isNew ? "Add product" : `Edit: ${product.name}`}
          </h2>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Slug *" value={form.slug} onChange={(v) => set("slug", v)} disabled={!isNew} placeholder="netflix-premium" />
            <Field label="Name *" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Category" value={form.category} onChange={(v) => set("category", v)} />
            <Field label="Badge (optional)" value={form.badge ?? ""} onChange={(v) => set("badge", v || null)} placeholder="HOT, SALE…" />
            <Field label="Emoji" value={form.emoji} onChange={(v) => set("emoji", v)} />
            <Field label="Gradient (Tailwind)" value={form.gradient} onChange={(v) => set("gradient", v)} placeholder="from-red-500 to-rose-600" />
            <Field label="Delivery time" value={form.delivery_time} onChange={(v) => set("delivery_time", v)} />
            <Field label="Warranty" value={form.warranty} onChange={(v) => set("warranty", v)} />
          </div>

          <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
          <TextArea label="Description" value={form.description} onChange={(v) => set("description", v)} rows={4} />
          <TextArea label="Features (one per line)" value={featuresText} onChange={setFeaturesText} rows={5} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#333]">Plans</label>
              <button onClick={addPlan} className="text-xs px-3 h-8 inline-flex items-center gap-1 rounded-full bg-secondary hover:bg-primary/10">
                <Plus className="w-3.5 h-3.5" /> Add plan
              </button>
            </div>
            <div className="space-y-2">
              {form.plans.map((p, i) => (
                <div key={i} className="border border-border rounded-xl p-3 grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-3 h-9 px-3 rounded-md border border-border text-sm" placeholder="Label" value={p.label} onChange={(e) => setPlan(i, { label: e.target.value })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" type="number" placeholder="Price" value={p.price} onChange={(e) => setPlan(i, { price: Number(e.target.value) })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" type="number" placeholder="MRP" value={p.original_price ?? ""} onChange={(e) => setPlan(i, { original_price: e.target.value ? Number(e.target.value) : undefined })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" placeholder="Duration" value={p.duration ?? ""} onChange={(e) => setPlan(i, { duration: e.target.value })} />
                  <input className="col-span-2 h-9 px-3 rounded-md border border-border text-sm" placeholder="Note" value={p.note ?? ""} onChange={(e) => setPlan(i, { note: e.target.value })} />
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <IconBtn title="Up" onClick={() => movePlan(i, -1)} disabled={i === 0}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn title="Down" onClick={() => movePlan(i, 1)} disabled={i === form.plans.length - 1}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
                    <IconBtn title="Remove" onClick={() => removePlan(i)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort order" type="number" value={String(form.sort_order)} onChange={(v) => set("sort_order", Number(v) || 0)} />
            <label className="flex items-end gap-2 pb-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              <span className="text-sm">Active (visible on storefront)</span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-full border border-border text-sm font-semibold">Cancel</button>
          <button onClick={save} disabled={busy} className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#333]">{label}</span>
      <input
        type={type} value={value} disabled={disabled} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-10 px-3 rounded-md border border-border text-sm outline-none focus:border-primary disabled:bg-secondary disabled:text-muted-foreground"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#333]">{label}</span>
      <textarea
        value={value} rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2 rounded-md border border-border text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
