import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, LogOut, Search, Bell, Plus, Globe,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, ExternalLink, Menu, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";
import accessNowLogo from "@/assets/accessnow-bd-mark.webp";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AccessNow BD" }, { name: "robots", content: "noindex,nofollow" }] }),
});

const ADMIN_CACHE_KEY = "anbd:isAdmin";
const ADMIN_ROLE_CHECK_TIMEOUT_MS = 8000;

async function withAdminTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Admin permission check timed out")), ADMIN_ROLE_CHECK_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Legacy splash/loader cache keys written by earlier versions. We scrub these
// on every admin mount so any stale "splash seen" / "boot" flag is wiped from
// localStorage and the splash can never reappear.
const LEGACY_SPLASH_KEYS = [
  "anbd:adminSplashSeen",
  "anbd:adminBoot",
  "anbd:adminBootSplash",
  "anbd:splash",
  "anbd:bootSplash",
  ADMIN_CACHE_KEY,
  "adminSplash",
  "admin:splash",
];

function purgeLegacySplashFlags() {
  if (typeof localStorage === "undefined") return;
  for (const k of LEGACY_SPLASH_KEYS) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
    try { sessionStorage.removeItem(k); } catch { /* ignore */ }
  }
}

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  // Wipe historical splash/admin flags immediately on mount so a stale client
  // flag can never leave the route on an empty gradient screen.
  useEffect(() => { purgeLegacySplashFlags(); }, []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verified, setVerified] = useState(false);
  const [roleError, setRoleError] = useState<{
    message: string;
    code?: string;
    details?: string;
    hint?: string;
    raw?: unknown;
  } | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const verifyRole = useMemo(
    () => async (uid: string) => {
      setRoleError(null);
      try {
        const { data, error } = await withAdminTimeout(
          supabase.rpc("has_role", {
            _user_id: uid,
            _role: "admin",
          }),
        );
        setCheckedAt(new Date().toISOString());
        if (error) {
          setRoleError({
            message: error.message || "Unknown RPC error",
            code: (error as any).code,
            details: (error as any).details,
            hint: (error as any).hint,
            raw: error,
          });
          setIsAdmin(false);
          return;
        }
        if (data !== true) {
          setRoleError({
            message: `has_role returned ${JSON.stringify(data)} (expected true). Your account is not assigned the 'admin' role in user_roles.`,
          });
        }
        const ok = data === true;
        setIsAdmin(ok);
      } catch (e: any) {
        setCheckedAt(new Date().toISOString());
        setRoleError({
          message: e?.message || "Network/unknown error calling has_role",
          raw: e,
        });
        setIsAdmin(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch {}
      navigate({ to: "/auth" });
      return;
    }
    let cancelled = false;
    (async () => {
      await verifyRole(user.id);
      if (cancelled) return;
      setVerified(true);
    })();
    return () => { cancelled = true; };
  }, [user, loading, navigate, verifyRole]);

  if (loading || !user || !verified) {
    return <AdminBlankState />;
  }

  if (!isAdmin && verified) {
    const hasError = !!roleError;
    return (
      <div className="min-h-screen grid place-items-center bg-[#f6f7fb] px-4 py-10">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-full bg-rose-50 text-rose-600 grid place-items-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-slate-900">
                {hasError ? "Permission check failed" : "Access denied"}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {hasError
                  ? `We couldn't verify admin permissions for ${user?.email}.`
                  : `Your account (${user?.email}) does not have admin permissions.`}
              </p>

              {hasError && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    has_role error
                  </div>
                  <p className="mt-1 text-sm font-medium text-rose-900 break-words">
                    {roleError!.message}
                  </p>
                  <dl className="mt-3 grid grid-cols-[88px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                    {roleError!.code && (
                      <>
                        <dt className="text-slate-500">Code</dt>
                        <dd className="font-mono text-slate-800 break-all">{roleError!.code}</dd>
                      </>
                    )}
                    {roleError!.details && (
                      <>
                        <dt className="text-slate-500">Details</dt>
                        <dd className="text-slate-800 break-words">{roleError!.details}</dd>
                      </>
                    )}
                    {roleError!.hint && (
                      <>
                        <dt className="text-slate-500">Hint</dt>
                        <dd className="text-slate-800 break-words">{roleError!.hint}</dd>
                      </>
                    )}
                    <dt className="text-slate-500">User ID</dt>
                    <dd className="font-mono text-slate-800 break-all">{user?.id}</dd>
                    <dt className="text-slate-500">Checked</dt>
                    <dd className="text-slate-800">{checkedAt ?? "—"}</dd>
                  </dl>
                  {roleError!.raw !== undefined && (
                    <details className="mt-3">
                      <summary className="text-[12px] font-semibold text-rose-700 cursor-pointer">
                        Raw response
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 text-slate-100 text-[11px] p-3 font-mono whitespace-pre-wrap break-all">
{JSON.stringify(roleError!.raw, null, 2)}
                      </pre>
                    </details>
                  )}
                  <p className="mt-3 text-[12px] text-slate-600">
                    Common causes: not signed in (missing JWT), RPC <code className="font-mono">has_role</code> not deployed, RLS blocking the call, or network/CORS error.
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {hasError && user && (
                  <button
                    onClick={() => verifyRole(user.id)}
                    className="h-10 px-4 inline-flex items-center rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                  >
                    Retry check
                  </button>
                )}
                <Link to="/" className="h-10 px-4 inline-flex items-center rounded-full border border-slate-200 text-sm font-semibold text-slate-700">Home</Link>
                <button
                  onClick={async () => {
                    try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch {}
                    await signOut();
                    navigate({ to: "/auth" });
                  }}
                  className="h-10 px-4 inline-flex items-center gap-1 rounded-full bg-slate-900 text-white text-sm font-semibold"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell user={user} signOut={signOut} navigate={navigate} />;
}

function AdminBlankState() {
  return <div className="min-h-screen bg-white" aria-hidden="true" />;
}

function AdminShell({ user, signOut, navigate }: any) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = false;
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          "shrink-0 transition-transform duration-200 border-r flex flex-col h-screen",
          "bg-white/80 lg:bg-white/70 backdrop-blur-2xl border-white/60 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] lg:shadow-none",
          // Desktop: sticky sidebar with collapse width
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-10",
          collapsed ? "lg:w-[72px]" : "lg:w-[280px]",
          // Mobile: fixed drawer that slides in
          "fixed top-0 left-0 z-50 w-[280px] max-w-[85vw]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/60">
          <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
            <span className="relative shrink-0 grid place-items-center w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/30 shadow-[0_6px_18px_-6px_rgba(47,109,255,0.6)] bg-[radial-gradient(120%_120%_at_30%_20%,rgba(255,255,255,0.95)_0%,rgba(225,236,255,0.9)_55%,rgba(196,218,255,0.88)_100%)]">
              <img
                src={accessNowLogo}
                alt="AccessNow BD"
                draggable={false}
                className="relative w-[145%] h-[145%] object-contain translate-y-[2%]"
              />
            </span>
            {!collapsed && (
              <span className="leading-[1.05] min-w-0">
                <span className="flex items-baseline gap-1 whitespace-nowrap">
                  <span className="font-extrabold tracking-tight text-[14px] bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(180deg, #7cb6ff 0%, #2f6dff 55%, #1e3fb8 100%)" }}>Access</span>
                  <span className="font-extrabold tracking-tight text-[14px] bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(180deg, #6ce4b8 0%, #1fc796 55%, #0e9472 100%)" }}>Now</span>
                  <span className="font-extrabold tracking-tight text-[14px] bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(180deg, #ffd86b 0%, #f59e0b 55%, #c2780a 100%)" }}>BD</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Fast</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#2f6dff]" />
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Secure</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#1fc796]" />
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Reliable</span>
                </span>
              </span>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-3">
            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border bg-white/60 backdrop-blur-md border-white/60">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="bg-transparent flex-1 outline-none text-sm text-slate-900 placeholder:text-slate-500"
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
        <div className="border-t border-white/60 p-3 space-y-2">
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white grid place-items-center text-xs font-bold shrink-0">
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate text-slate-900">Admin</div>
                <div className="text-[11px] truncate text-slate-500">{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
              className="w-full h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600"
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
          <div className="h-full px-3 md:px-6 flex items-center gap-2 md:gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden h-9 w-9 rounded-lg grid place-items-center border ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb */}
            <div className={`hidden md:flex items-center gap-2 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
              <span className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${dark ? "bg-slate-800" : "bg-slate-100"}`}>
                {currentPage?.group.icon ?? ADMIN_MENU[0].icon}
                <span className="font-medium">{currentPage?.group.title ?? "Product Management"}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {currentPage?.item.label ?? "Dashboard"}
              </span>
            </div>

            {/* Mobile page title */}
            <div className={`md:hidden flex-1 min-w-0 font-semibold text-sm truncate ${dark ? "text-white" : "text-slate-900"}`}>
              {currentPage?.item.label ?? "Dashboard"}
            </div>

            <div className="hidden md:block flex-1" />

            {/* Actions */}
            <button className={`hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-semibold items-center gap-1.5 border ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <Globe className="w-3.5 h-3.5" /> বাং
            </button>
            <div className={`hidden xl:flex items-center gap-2 h-9 px-3 rounded-lg border ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input placeholder="Search" className={`bg-transparent outline-none text-xs w-32 ${dark ? "text-white placeholder:text-slate-500" : "placeholder:text-slate-500"}`} />
              <kbd className={`text-[10px] px-1.5 py-0.5 rounded border ${dark ? "border-slate-700 text-slate-500" : "border-slate-300 text-slate-500"}`}>⌘K</kbd>
            </div>
            <button className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-semibold items-center gap-1.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:opacity-90 shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)]">
              <Plus className="w-3.5 h-3.5" /> Create <ChevronDown className="w-3 h-3" />
            </button>
            <button className={`relative h-9 w-9 rounded-lg grid place-items-center border ${dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold grid place-items-center">22</span>
            </button>
            <Link to="/" className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-semibold items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700">
              <ExternalLink className="w-3.5 h-3.5" /> View store
            </Link>
          </div>
        </header>

        <div className={`flex-1 p-3 md:p-6 min-w-0 overflow-x-hidden ${dark ? "text-slate-100" : "text-slate-900"}`}>
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </div>
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
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50"
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
          ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-[0_8px_22px_-8px_rgba(37,99,235,0.6)]"
          : "text-slate-700 hover:bg-white/70",
      ].join(" ")}
    >
      <span className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center transition ${active ? "bg-white/20 text-white" : "bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-sm"}`}>
        {item.icon}
      </span>
      {!collapsed && <span className="font-semibold truncate flex-1">{item.label}</span>}
    </Link>
  );
}
