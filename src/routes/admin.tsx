import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, LogOut, Bell, Globe, Search,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, ExternalLink, Menu, X, Pin,
} from "lucide-react";
import { AdminGlobalSearch, useAdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";
import { AdminMfaGate } from "@/components/admin/AdminMfaGate";
import { AdminLangProvider, useAdminLang } from "@/context/AdminLangContext";
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
// NOTE: ADMIN_CACHE_KEY is intentionally NOT included — we keep it so the
// shell can render optimistically while re-verifying in the background.
const LEGACY_SPLASH_KEYS = [
  "anbd:adminSplashSeen",
  "anbd:adminBoot",
  "anbd:adminBootSplash",
  "anbd:splash",
  "anbd:bootSplash",
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

function readCachedAdmin(): boolean {
  if (typeof localStorage === "undefined") return false;
  try { return localStorage.getItem(ADMIN_CACHE_KEY) === "1"; } catch { return false; }
}

function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  // Wipe historical splash/admin flags immediately on mount so a stale client
  // flag can never leave the route on an empty gradient screen.
  useEffect(() => { purgeLegacySplashFlags(); }, []);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => readCachedAdmin());
  const [verified, setVerified] = useState<boolean>(() => readCachedAdmin());
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
        try {
          if (ok) localStorage.setItem(ADMIN_CACHE_KEY, "1");
          else localStorage.removeItem(ADMIN_CACHE_KEY);
        } catch { /* ignore */ }
      } catch (e: any) {
        setCheckedAt(new Date().toISOString());
        setRoleError({
          message: e?.message || "Network/unknown error calling has_role",
          raw: e,
        });
        setIsAdmin(false);
        try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch { /* ignore */ }
      }
    },
    [],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch {}
      navigate({ to: "/login" });
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
                    navigate({ to: "/login" });
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

  // MFA gate: requires Authenticator code OR email OTP fallback before admin shell renders.
  return (
    <AdminLangProvider>
      <AdminMfaGate
        userEmail={user?.email}
        onSignOut={async () => {
          try { localStorage.removeItem(ADMIN_CACHE_KEY); } catch { /* ignore */ }
          await signOut();
          navigate({ to: "/login" });
        }}
      >
        <AdminShell user={user} signOut={signOut} navigate={navigate} />
      </AdminMfaGate>
    </AdminLangProvider>
  );
}

function AdminBlankState() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#fafafa]" role="status" aria-label="Loading admin panel">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
        <span className="text-xs font-medium tracking-wide">Loading admin…</span>
      </div>
    </div>
  );
}

function AdminShell({ user, signOut, navigate }: any) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = false;
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open: globalOpen, setOpen: setGlobalOpen } = useAdminGlobalSearch();
  const { lang, toggle, t } = useAdminLang();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const filteredMenu = useMemo(() => {
    if (!search.trim()) return ADMIN_MENU;
    const q = search.toLowerCase();
    return ADMIN_MENU.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.labelBn ?? "").toLowerCase().includes(q),
      ),
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
    <div className="min-h-screen flex relative bg-[#fafafa]">
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
          "shrink-0 transition-transform duration-200 flex flex-col h-screen",
          "bg-white border-r border-slate-200/80",
          // Desktop: sticky sidebar with collapse width
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-10",
          collapsed ? "lg:w-[72px]" : "lg:w-[280px]",
          // Mobile: fixed drawer that slides in
          "fixed top-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
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
                  <span className="font-extrabold tracking-tight text-[14px] text-slate-900">Access</span>
                  <span className="font-extrabold tracking-tight text-[14px] text-slate-900">Now</span>
                  <span className="font-extrabold tracking-tight text-[14px] text-slate-900">BD</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1">
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Fast</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Secure</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
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
          <div className="px-3 pt-3 pb-1">
            <button
              type="button"
              onClick={() => setGlobalOpen(true)}
              className="w-full h-9 flex items-center gap-2 px-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white transition text-left"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex-1 text-xs text-slate-500 truncate">{t("Search anything…", "যেকোনো কিছু খুঁজুন…")}</span>
              <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">⌘K</kbd>
            </button>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 admin-scroll">
          {filteredMenu.map((group) => (
            <SidebarGroup key={group.id} group={group} collapsed={collapsed} dark={dark} pathname={pathname} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-200/80 p-3 space-y-2">
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold shrink-0">
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate text-slate-900">{t("Admin", "অ্যাডমিন")}</div>
                <div className="text-[11px] truncate text-slate-500">{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              className="w-full h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" /> {t("Logout", "লগআউট")}
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-20 bg-[#fafafa]/90 backdrop-blur-xl border-b border-slate-200/80">
          <div className="h-full px-3 md:px-6 flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg grid place-items-center border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <span className="px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 bg-slate-100 text-slate-700">
                {currentPage?.group.icon ?? ADMIN_MENU[0].icon}
                <span className="font-medium">
                  {currentPage
                    ? t(currentPage.group.title, currentPage.group.titleBn)
                    : t(ADMIN_MENU[0].title, ADMIN_MENU[0].titleBn)}
                </span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">
                {currentPage
                  ? t(currentPage.item.label, currentPage.item.labelBn)
                  : t("Dashboard", "ড্যাশবোর্ড")}
              </span>
            </div>

            <div className="md:hidden flex-1 min-w-0 font-semibold text-sm truncate text-slate-900">
              {currentPage
                ? t(currentPage.item.label, currentPage.item.labelBn)
                : t("Dashboard", "ড্যাশবোর্ড")}
            </div>

            <div className="hidden md:block flex-1" />

            <button
              type="button"
              onClick={toggle}
              aria-label={t("Switch to Bangla", "ইংরেজিতে পরিবর্তন")}
              title={lang === "en" ? "বাংলায় দেখুন" : "Show in English"}
              className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-semibold items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-300 bg-white transition"
            >
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "বাং" : "EN"}
            </button>
            <button
              type="button"
              onClick={() => setGlobalOpen(true)}
              className="hidden xl:flex items-center gap-2 h-9 w-64 px-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition text-left"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="flex-1 text-xs text-slate-500 truncate">{t("Search…", "খুঁজুন…")}</span>
              <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">⌘K</kbd>
            </button>
            <Link to="/" className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-semibold items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              <ExternalLink className="w-3.5 h-3.5" /> {t("View store", "স্টোর দেখুন")}
            </Link>
          </div>
        </header>

        <div className={`flex-1 p-3 md:p-6 min-w-0 overflow-x-hidden ${dark ? "text-slate-100" : "text-slate-900"}`}>
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </div>
      </div>

      <AdminGlobalSearch open={globalOpen} onOpenChange={setGlobalOpen} />

      <style>{`
        .admin-scroll::-webkit-scrollbar { width: 6px; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.25); border-radius: 999px; }
      `}</style>
    </div>
  );
}

function SidebarGroup({ group, collapsed, dark, pathname }: { group: any; collapsed: boolean; dark: boolean; pathname: string }) {
  const [open, setOpen] = useState<boolean>(true);
  const { t } = useAdminLang();

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
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-slate-500">{group.icon}</span>
          {t(group.title, group.titleBn)}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform text-slate-400 ${open ? "" : "-rotate-90"}`} />
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

function SidebarItem({ item, collapsed, dark: _dark, active }: { item: AdminMenuItem; collapsed?: boolean; dark: boolean; active: boolean }) {
  const { t } = useAdminLang();
  const label = t(item.label, item.labelBn);
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact }}
      title={collapsed ? label : undefined}
      className={[
        "group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm transition-all relative",
        collapsed ? "justify-center" : "",
        active
          ? "bg-slate-100 text-slate-900"
          : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 w-9 h-9 rounded-full grid place-items-center text-white",
          "bg-gradient-to-br shadow-sm ring-1 ring-white/40",
          item.grad,
        ].join(" ")}
      >
        {item.icon}
      </span>
      {!collapsed && <span className="font-semibold truncate flex-1 text-[14px]">{item.label}</span>}
      {!collapsed && active && (
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" aria-hidden />
      )}
      {!collapsed && !active && (
        <Pin
          className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-hidden
        />
      )}
    </Link>
  );
}

