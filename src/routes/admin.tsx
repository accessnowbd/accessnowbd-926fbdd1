import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, LogOut, Search, Bell, Plus, Moon, Sun, Globe, Sparkles,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, ExternalLink, Menu, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "RxB Admin — AccessNow BD" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const ADMIN_CACHE_KEY = "anbd:isAdmin";

type AdminCache = { uid: string; isAdmin: boolean };

function readAdminCacheAny(): AdminCache | null {
  try {
    const store = typeof localStorage !== "undefined" ? localStorage : null;
    if (!store) return null;
    const raw = store.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminCache;
  } catch { return null; }
}
function writeAdminCache(userId: string, isAdmin: boolean) {
  try { localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({ uid: userId, isAdmin })); } catch {}
}

/** Modern animated loader — only shown on the very first verification ever. */
function AdminBootSplash() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#0f1535] to-[#1a0f3d] grid place-items-center">
      {/* aurora blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-violet-500/30 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full bg-cyan-400/25 blur-[120px] animate-pulse" style={{ animationDelay: "0.6s" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* orbit logo */}
        <div className="relative w-24 h-24">
          <span className="absolute inset-0 rounded-full border border-white/10" />
          <span className="absolute inset-0 rounded-full border-t-2 border-violet-400 animate-spin" style={{ animationDuration: "1.4s" }} />
          <span className="absolute inset-2 rounded-full border-b-2 border-cyan-300 animate-spin" style={{ animationDuration: "2.2s", animationDirection: "reverse" }} />
          <span className="absolute inset-4 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 grid place-items-center shadow-[0_0_40px_-5px_rgba(139,92,246,0.7)]">
            <Sparkles className="w-7 h-7 text-white" />
          </span>
        </div>

        <div className="text-center">
          <div className="text-white text-base font-bold tracking-tight">AccessNow BD</div>
          <div className="mt-1 text-[12px] text-white/55">Preparing your workspace…</div>
        </div>

        {/* progress bar */}
        <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 animate-[adminslide_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes adminslide {
          0%   { transform: translateX(-120%); }
          50%  { transform: translateX(80%); }
          100% { transform: translateX(260%); }
        }
      `}</style>
    </div>
  );
}

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  // Read cache eagerly (any uid). If it says admin, render shell instantly while auth resolves.
  const cached = useMemo(() => readAdminCacheAny(), []);
  const [isAdmin, setIsAdmin] = useState<boolean>(cached?.isAdmin === true);
  const [verified, setVerified] = useState<boolean>(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (cancelled) return;
      const ok = !!data && !error;
      writeAdminCache(user.id, ok);
      setIsAdmin(ok);
      setVerified(true);
    })();
    return () => { cancelled = true; };
  }, [user, loading, navigate]);

  // Only block when we have NO optimistic admin signal at all.
  if (!isAdmin && (loading || !verified)) {
    return <AdminBootSplash />;
  }


  if (verified && !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f6f7fb] px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 text-rose-600 grid place-items-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
          <p className="text-sm text-slate-500 mt-2">
            Your account ({user?.email}) does not have admin permissions.
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Link to="/" className="h-10 px-4 inline-flex items-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700">Home</Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
              className="h-10 px-4 inline-flex items-center gap-1 rounded-full bg-slate-900 text-white text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell user={user} signOut={signOut} navigate={navigate} />;
}

function AdminShell({ user, signOut, navigate }: any) {
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const filteredMenu = useMemo(() => {
    if (!search.trim()) return ADMIN_MENU;
    const q = search.toLowerCase();
    return ADMIN_MENU.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [search]);

  // Find current page for header breadcrumb
  const currentPage = useMemo(() => {
    for (const g of ADMIN_MENU) {
      const item = g.items.find((i) => i.to === pathname);
      if (item) return { group: g, item };
    }
    return null;
  }, [pathname]);

  return (
    <div className={`min-h-screen flex relative ${dark ? "bg-slate-900" : ""}`} style={!dark ? { background: "linear-gradient(135deg,#eef2ff 0%,#f5f3ff 30%,#fdf2f8 65%,#fff7ed 100%)" } : undefined}>
      {!dark && (
        <>
          <div className="pointer-events-none fixed -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-violet-300/35 blur-[120px]" />
          <div className="pointer-events-none fixed top-1/3 right-1/4 w-[380px] h-[380px] rounded-full bg-pink-200/40 blur-[120px]" />
          <div className="pointer-events-none fixed bottom-0 left-1/4 w-[460px] h-[460px] rounded-full bg-fuchsia-300/30 blur-[140px]" />
        </>
      )}
      {/* SIDEBAR */}
      <aside
        className={`${collapsed ? "w-[72px]" : "w-[280px]"} shrink-0 transition-all duration-200 border-r ${dark ? "bg-slate-950 border-slate-800" : "bg-white/70 backdrop-blur-xl border-white/60"} flex flex-col h-screen sticky top-0 z-10`}
      >
        {/* Brand */}
        <div className={`h-16 flex items-center justify-between px-4 border-b ${dark ? "border-slate-800" : "border-white/60"}`}>
          <Link to="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 grid place-items-center text-white font-bold text-sm shrink-0 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.6)]">
              Rx
            </div>
            {!collapsed && (
              <div className={`font-extrabold text-[15px] tracking-tight truncate ${dark ? "text-white" : "text-slate-900"}`}>
                RxB Admin
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`p-1.5 rounded-lg ${dark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"}`}
            aria-label="Collapse sidebar"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-3">
            <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border ${dark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className={`bg-transparent flex-1 outline-none text-sm ${dark ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
              />
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 admin-scroll">
          {filteredMenu.map((group) => (
            <SidebarGroup key={group.id} group={group} collapsed={collapsed} dark={dark} pathname={pathname} />
          ))}
        </nav>

        {/* User */}
        <div className={`border-t ${dark ? "border-slate-800" : "border-slate-200"} p-3 space-y-2`}>
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white grid place-items-center text-xs font-bold shrink-0">
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-slate-900"}`}>Admin</div>
                <div className={`text-[11px] truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
              className={`w-full h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${dark ? "bg-slate-800 hover:bg-slate-700 text-rose-300" : "bg-rose-50 hover:bg-rose-100 text-rose-600"}`}
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className={`h-16 sticky top-0 z-20 backdrop-blur-xl border-b ${dark ? "bg-slate-900/80 border-slate-800" : "bg-white/50 border-white/60"}`}>
          <div className="h-full px-4 md:px-6 flex items-center gap-3">
            {/* Breadcrumb */}
            <div className={`hidden md:flex items-center gap-2 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
              <span className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                {currentPage?.group.icon ?? ADMIN_MENU[0].icon}
                <span className="font-medium">{currentPage?.group.title ?? "Product Management"}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {currentPage?.item.label ?? "Dashboard"}
              </span>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <button className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <Globe className="w-3.5 h-3.5" /> বাং
            </button>
            <button onClick={() => setDark((v) => !v)} className={`h-9 w-9 rounded-lg grid place-items-center border ${dark ? "border-slate-700 text-amber-300 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={`hidden md:flex items-center gap-2 h-9 px-3 rounded-lg border ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input placeholder="Search" className={`bg-transparent outline-none text-xs w-32 ${dark ? "text-white placeholder:text-slate-500" : "placeholder:text-slate-400"}`} />
              <kbd className={`text-[10px] px-1.5 py-0.5 rounded border ${dark ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"}`}>⌘K</kbd>
            </div>
            <button className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]">
              <Plus className="w-3.5 h-3.5" /> Create <ChevronDown className="w-3 h-3" />
            </button>
            <button className={`relative h-9 w-9 rounded-lg grid place-items-center border ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">22</span>
            </button>
            <Link to="/" className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
              <ExternalLink className="w-3.5 h-3.5" /> View store
            </Link>
          </div>
        </header>

        <main className={`flex-1 p-4 md:p-6 ${dark ? "text-slate-100" : "text-slate-900"}`}>
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        .admin-scroll::-webkit-scrollbar { width: 6px; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.25); border-radius: 999px; }
      `}</style>
    </div>
  );
}

function SidebarGroup({ group, collapsed, dark, pathname }: { group: any; collapsed: boolean; dark: boolean; pathname: string }) {
  const hasActive = group.items.some((i: AdminMenuItem) => pathname === i.to);
  const [open, setOpen] = useState<boolean>(hasActive || group.id === "product");

  if (collapsed) {
    // collapsed: just stack icons
    return (
      <div className="py-2">
        {group.items.map((item: AdminMenuItem) => (
          <SidebarItem key={item.to} item={item} collapsed dark={dark} active={pathname === item.to} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider ${dark ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50"}`}
      >
          <span className="inline-flex items-center gap-2">
          <span className="text-blue-600">{group.icon}</span>
          {group.title}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="space-y-1 mt-1">
          {group.items.map((item: AdminMenuItem) => (
            <SidebarItem key={item.to} item={item} dark={dark} active={pathname === item.to} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItem({ item, collapsed, dark, active }: { item: AdminMenuItem; collapsed?: boolean; dark: boolean; active: boolean }) {
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact }}
      title={collapsed ? item.label : undefined}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all relative",
        collapsed ? "justify-center" : "",
        active
          ? (dark ? "bg-slate-800 text-white" : "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_8px_22px_-8px_rgba(37,99,235,0.6)]")
          : (dark ? "text-slate-300 hover:bg-slate-800/70" : "text-slate-700 hover:bg-white/70"),
      ].join(" ")}
    >
      <span className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center transition ${active ? "bg-white/20 text-white" : "bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-sm"}`}>
        {item.icon}
      </span>
      {!collapsed && <span className="font-semibold truncate flex-1">{item.label}</span>}
    </Link>
  );
}
