import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, LayoutDashboard, Package, Tag, ShoppingBag, Users, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AccessNow BD" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const ADMIN_CACHE_KEY = "anbd:isAdmin";

function readAdminCache(userId: string | undefined): boolean | null {
  if (!userId || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { uid: string; isAdmin: boolean };
    return parsed.uid === userId ? parsed.isAdmin : null;
  } catch { return null; }
}

function writeAdminCache(userId: string, isAdmin: boolean) {
  try { sessionStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ uid: userId, isAdmin })); } catch {}
}

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const cached = readAdminCache(user?.id);
  const [checking, setChecking] = useState(cached === null);
  const [isAdmin, setIsAdmin] = useState(cached ?? false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const cachedNow = readAdminCache(user.id);
    if (cachedNow !== null) {
      setIsAdmin(cachedNow);
      setChecking(false);
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      const ok = !!data && !error;
      writeAdminCache(user.id, ok);
      setIsAdmin(ok);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Verifying admin access…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4">
        <div className="max-w-md w-full bg-white border border-border rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>Access denied</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account ({user?.email}) does not have admin permissions. Please contact an administrator if you believe this is an error.
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Link to="/" className="h-10 px-4 inline-flex items-center rounded-full border border-border text-sm font-semibold">Home</Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
              className="h-10 px-4 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="grid place-items-center w-9 h-9 rounded-full bg-white text-primary font-bold">A</span>
            Admin Panel
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="opacity-80 hidden sm:inline">{user?.email}</span>
            <Link to="/" className="px-3 h-8 inline-flex items-center rounded-full bg-white/10 hover:bg-white/20">View site</Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
              className="px-3 h-8 inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 md:px-10 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-white border border-border rounded-2xl p-3 h-fit md:sticky md:top-6">
          <nav className="space-y-1 text-sm">
            <NavItem to="/admin" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" exact />
            <NavItem to="/admin/products" icon={<Package className="w-4 h-4" />} label="Products" />
            <NavItem to="/admin/promotions" icon={<Tag className="w-4 h-4" />} label="Promotions" />
            <NavItem to="/admin/orders" icon={<ShoppingBag className="w-4 h-4" />} label="Orders" />
            <NavItem to="/admin/users" icon={<Users className="w-4 h-4" />} label="Users" />
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, exact }: { to: string; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "bg-primary/10 text-primary" }}
      className="flex items-center gap-2 px-3 h-9 rounded-lg hover:bg-secondary text-foreground/80"
    >
      {icon} {label}
    </Link>
  );
}
