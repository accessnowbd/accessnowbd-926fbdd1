import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Shield, ShieldOff, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  is_admin: boolean;
};

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,phone,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role").eq("role", "admin"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    const adminSet = new Set((roles ?? []).map((r) => r.user_id));
    setRows((profiles ?? []).map((p) => ({ ...p, is_admin: adminSet.has(p.id) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAdmin = async (row: Row) => {
    if (row.is_admin) {
      if (!confirm(`Revoke admin from ${row.display_name || row.id.slice(0, 8)}?`)) return;
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Admin revoked");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: row.id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Admin granted");
    }
    load();
  };

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.display_name || "").toLowerCase().includes(s) || (r.phone || "").includes(s) || r.id.includes(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-aurora">Users</h1>
          <p className="text-sm text-white/60 mt-1">Manage customers and admin permissions.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, id…"
            className="pl-9 pr-3 h-10 w-72 max-w-full rounded-full bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:border-violet-400/50"
          />
        </div>
      </div>

      <div className="gradient-border-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/60"><Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-white/60">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/60">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 grid place-items-center text-xs font-bold text-white border border-white/10">
                        {(r.display_name || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{r.display_name || <span className="text-white/40">Unnamed</span>}</div>
                        <div className="text-[10px] text-white/40 font-mono">{r.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/80">{r.phone || "—"}</td>
                  <td className="px-4 py-3 text-white/60">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-violet-500/15 text-violet-300 border-violet-400/30">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-white/5 text-white/50 border-white/10">
                        <User className="w-3 h-3" /> Customer
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleAdmin(r)}
                      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold border transition ${
                        r.is_admin
                          ? "border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                          : "border-violet-400/30 text-violet-200 hover:bg-violet-500/10"
                      }`}
                    >
                      {r.is_admin ? <><ShieldOff className="w-3.5 h-3.5" /> Revoke admin</> : <><Shield className="w-3.5 h-3.5" /> Make admin</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
