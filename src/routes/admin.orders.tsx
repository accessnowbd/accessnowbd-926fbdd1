import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Eye, Search, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateReceiptPDF } from "@/lib/receipt";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

type OrderItem = { name: string; plan?: string; price: number; qty?: number };
type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
  transaction_id: string;
  payment_method: string;
  phone: string;
  email: string;
  full_name: string;
  user_id: string;
};

const STATUSES = ["pending", "processing", "completed", "cancelled", "refunded"] as const;

const statusColor = (s: string) => {
  switch (s) {
    case "completed": return "bg-emerald-100 text-emerald-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "cancelled": return "bg-rose-100 text-rose-700";
    case "refunded": return "bg-amber-100 text-amber-700";
    default: return "bg-secondary text-muted-foreground";
  }
};

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const prev = orders;
    setOrders((o) => o.map((x) => x.id === id ? { ...x, status } : x));
    setSelected((s) => s && s.id === id ? { ...s, status } : s);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setOrders(prev);
      toast.error(error.message);
    } else {
      toast.success(`Status updated to ${status}`);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      o.id.toLowerCase().includes(s) ||
      o.full_name?.toLowerCase().includes(s) ||
      o.email?.toLowerCase().includes(s) ||
      o.phone?.toLowerCase().includes(s) ||
      o.transaction_id?.toLowerCase().includes(s)
    );
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Orders</h1>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <FilterChip label={`All (${orders.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
        {STATUSES.map((s) => (
          <FilterChip key={s} label={`${s} (${counts[s] ?? 0})`} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order ID, name, email, phone, or transaction ID…"
          className="w-full h-10 pl-9 pr-3 rounded-full border border-border bg-white text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Order</th>
                  <th className="text-left px-3 py-2">Customer</th>
                  <th className="text-left px-3 py-2">Total</th>
                  <th className="text-left px-3 py-2">Payment</th>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">#{o.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{o.items?.length ?? 0} items</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{o.full_name}</div>
                      <div className="text-xs text-muted-foreground">{o.email}</div>
                    </td>
                    <td className="px-3 py-2 font-semibold">৳{Number(o.total).toLocaleString()}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      <div className="capitalize">{o.payment_method}</div>
                      <div className="text-xs font-mono truncate max-w-[120px]">{o.transaction_id}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className={`text-xs px-2 h-7 rounded-full border-0 outline-none cursor-pointer font-semibold capitalize ${statusColor(o.status)}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelected(o)}
                        className="inline-flex items-center gap-1 px-3 h-8 rounded-full border border-border text-xs hover:bg-secondary"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} onStatusChange={(s) => updateStatus(selected.id, s)} />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-8 rounded-full text-xs font-semibold capitalize transition ${active ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}

function OrderDetail({ order, onClose, onStatusChange }: { order: Order; onClose: () => void; onStatusChange: (s: string) => void }) {
  const [downloading, setDownloading] = useState(false);

  const downloadReceipt = async () => {
    setDownloading(true);
    try {
      await generateReceiptPDF({
        orderId: order.id,
        createdAt: order.created_at,
        fullName: order.full_name,
        email: order.email,
        phone: order.phone,
        items: order.items,
        total: Number(order.total),
        paymentMethod: order.payment_method,
        transactionId: order.transaction_id,
      });
      toast.success("Receipt downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate receipt");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>Order details</h2>
            <p className="text-xs text-muted-foreground font-mono">#{order.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-md hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Customer" value={order.full_name} />
            <Info label="Email" value={order.email} />
            <Info label="Phone" value={order.phone} />
            <Info label="Date" value={new Date(order.created_at).toLocaleString()} />
            <Info label="Payment method" value={order.payment_method} mono />
            <Info label="Transaction ID" value={order.transaction_id} mono />
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</div>
            <div className="border border-border rounded-xl divide-y divide-border">
              {order.items.map((it, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{it.name}</div>
                    {it.plan && <div className="text-xs text-muted-foreground">{it.plan}</div>}
                  </div>
                  <div className="text-sm font-semibold">
                    {it.qty && it.qty > 1 && <span className="text-muted-foreground text-xs mr-1">×{it.qty}</span>}
                    ৳{Number(it.price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-3 h-8 rounded-full text-xs font-semibold capitalize ${order.status === s ? statusColor(s) + " ring-2 ring-primary" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-6 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-full border border-border text-sm font-semibold">Close</button>
          <button
            onClick={downloadReceipt}
            disabled={downloading}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</div>
    </div>
  );
}
