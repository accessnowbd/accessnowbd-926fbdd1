import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert, LogOut, Bell, Globe, Search,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, ExternalLink, Menu, X, Pin,
} from "lucide-react";
import { AdminGlobalSearch, useAdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";
import { SearchTrigger } from "@/components/SearchBar";
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
  const [search, setSearch] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open: globalOpen, setOpen: setGlobalOpen } = useAdminGlobalSearch();
  const { lang, toggle, t } = useAdminLang();

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

  const currentPage = useMemo(() => {
    for (const g of ADMIN_MENU) {
      const item = g.items.find((i) => i.to === pathname);
      if (item) return { group: g, item };
    }
    return null;
  }, [pathname]);

  return (
    <div className="lg:h-screen lg:overflow-hidden min-h-screen flex relative bg-[#f3f4ff] font-['Manrope',ui-sans-serif,system-ui] text-slate-800 overflow-hidden">
      {/* Aurora background blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-purple-300/40 blur-[120px] -z-0" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-24 w-[600px] h-[600px] rounded-full bg-pink-200/40 blur-[130px] -z-0" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 w-[450px] h-[450px] rounded-full bg-blue-300/30 blur-[110px] -z-0" />
      <div aria-hidden className="pointer-events-none absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-emerald-200/30 blur-[100px] -z-0" />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          "shrink-0 transition-all duration-200 flex flex-col h-screen relative z-10",
          "bg-white/60 backdrop-blur-2xl border-r border-white/60",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-10",
          collapsed ? "lg:w-[76px]" : "lg:w-[268px]",
          "fixed top-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-2xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className={[
          "border-b border-slate-200/70",
          collapsed
            ? "flex flex-col items-center justify-center gap-1.5 py-3 px-2"
            : "h-[68px] flex items-center justify-between px-4",
        ].join(" ")}>
          <Link to="/admin" className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "justify-center" : ""}`}>
            <span className="relative shrink-0 grid place-items-center w-10 h-10 rounded-xl overflow-hidden ring-1 ring-slate-200 shadow-[0_4px_14px_-6px_rgba(59,130,246,0.4)] bg-white">
              <img
                src={accessNowLogo}
                alt="AccessNow BD"
                draggable={false}
                className="relative w-[140%] h-[140%] object-contain translate-y-[2%]"
              />
            </span>
            {!collapsed && (
              <span className="leading-tight min-w-0 font-['Sora',ui-sans-serif,system-ui]">
                <span className="block text-[15px] font-bold tracking-tight text-slate-900">AccessNow BD</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 mt-0.5">Admin Console</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={[
              "hidden lg:inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition",
              collapsed ? "w-9 h-9 ring-1 ring-slate-200 bg-white shadow-sm" : "w-8 h-8",
            ].join(" ")}
            aria-label={collapsed ? t("Expand sidebar", "সাইডবার বড় করুন") : t("Collapse sidebar", "সাইডবার ছোট করুন")}
            title={collapsed ? t("Expand sidebar", "সাইডবার বড় করুন") : t("Collapse sidebar", "সাইডবার ছোট করুন")}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <SearchTrigger
              size="sm"
              onClick={() => setGlobalOpen(true)}
              placeholder={t("Search anything…", "যেকোনো কিছু খুঁজুন…")}
            />
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 pb-4 admin-scroll">
          {filteredMenu.map((group) => (
            <SidebarGroup key={group.id} group={group} collapsed={collapsed} pathname={pathname} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-200/70 p-3 space-y-2 bg-gradient-to-b from-white to-slate-50/60">
          <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white grid place-items-center text-xs font-bold shrink-0 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.6)] font-['Sora']">
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold truncate text-slate-900 font-['Sora']">{t("Admin", "অ্যাডমিন")}</div>
                <div className="text-[11px] truncate text-slate-500">{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              className="w-full h-9 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white transition"
            >
              <LogOut className="w-3.5 h-3.5" /> {t("Logout", "লগআউট")}
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col lg:h-screen lg:overflow-y-auto relative z-10">
        {/* Top bar */}
        <header className="h-[68px] sticky top-0 z-20 bg-white/50 backdrop-blur-xl border-b border-white/60">
          <div className="h-full px-3 md:px-6 flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg grid place-items-center border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm min-w-0">
              <span className="px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <span className="text-blue-600">{currentPage?.group.icon ?? ADMIN_MENU[0].icon}</span>
                <span className="font-semibold text-[12px]">
                  {currentPage
                    ? t(currentPage.group.title, currentPage.group.titleBn)
                    : t(ADMIN_MENU[0].title, ADMIN_MENU[0].titleBn)}
                </span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 truncate font-['Sora']">
                {currentPage
                  ? t(currentPage.item.label, currentPage.item.labelBn)
                  : t("Dashboard", "ড্যাশবোর্ড")}
              </span>
            </div>

            <div className="md:hidden flex-1 min-w-0 font-bold text-sm truncate text-slate-900 font-['Sora']">
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
              className="inline-flex h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 bg-white transition shrink-0"
            >
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "বাং" : "EN"}
            </button>
            <SearchTrigger
              size="sm"
              onClick={() => setGlobalOpen(true)}
              placeholder={t("Search…", "খুঁজুন…")}
              className="hidden xl:block w-64"
            />

            <Link to="/" className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-bold items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition">
              <ExternalLink className="w-3.5 h-3.5" /> {t("View store", "স্টোর দেখুন")}
            </Link>
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 min-w-0 overflow-x-hidden text-slate-800 admin-glass-scope">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </div>
      </div>

      <AdminGlobalSearch open={globalOpen} onOpenChange={setGlobalOpen} />

      <style>{`
        .admin-scroll::-webkit-scrollbar { width: 6px; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.22); border-radius: 999px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,.35); }

        /* Aurora glass cascade across ALL admin sub-pages — frosted cards on the pastel canvas */
        .admin-glass-scope .bg-white:not(input):not(textarea):not(select):not(.keep-solid) {
          background-color: rgba(255,255,255,0.65) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .admin-glass-scope .bg-slate-50,
        .admin-glass-scope .bg-gray-50,
        .admin-glass-scope .bg-neutral-50 {
          background-color: rgba(255,255,255,0.45) !important;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .admin-glass-scope [class*="ring-slate-200"],
        .admin-glass-scope [class*="ring-slate-100"],
        .admin-glass-scope [class*="border-slate-200"],
        .admin-glass-scope [class*="border-slate-100"] {
          --tw-ring-color: rgba(255,255,255,0.7) !important;
          border-color: rgba(255,255,255,0.6) !important;
        }
        .admin-glass-scope .shadow-sm,
        .admin-glass-scope .shadow {
          box-shadow: 0 8px 24px -16px rgba(79,70,229,0.18) !important;
        }
        /* Keep form inputs readable & solid */
        .admin-glass-scope input,
        .admin-glass-scope textarea,
        .admin-glass-scope select {
          background-color: rgba(255,255,255,0.9) !important;
          backdrop-filter: none !important;
        }
        /* Soften default table row stripes */
        .admin-glass-scope tbody tr.bg-white {
          background-color: rgba(255,255,255,0.55) !important;
        }
        /* Active-pill helper for inner nav-style buttons (matches sidebar pill) */
        .admin-glass-scope .bg-blue-600,
        .admin-glass-scope .bg-indigo-600 {
          box-shadow: 0 10px 24px -10px rgba(59,130,246,0.45);
        }
      `}</style>
    </div>
  );
}

function SidebarGroup({ group, collapsed, pathname }: { group: any; collapsed: boolean; pathname: string }) {
  const hasActive = group.items.some((i: AdminMenuItem) => pathname === i.to);
  const [open, setOpen] = useState<boolean>(true);
  const { t } = useAdminLang();

  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  if (collapsed) {
    return (
      <div className="py-2 border-b border-slate-100 last:border-0">
        {group.items.map((item: AdminMenuItem) => (
          <SidebarItem key={item.to} item={item} collapsed active={pathname === item.to} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition font-['Sora']"
      >
        <span className="inline-flex items-center gap-2">
          <span className="text-slate-400">{group.icon}</span>
          {t(group.title, group.titleBn)}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform text-slate-400 ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="space-y-0.5 mt-1">
          {group.items.map((item: AdminMenuItem) => (
            <SidebarItem key={item.to} item={item} active={pathname === item.to} />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarItem({ item, collapsed, active }: { item: AdminMenuItem; collapsed?: boolean; active: boolean }) {
  const { t } = useAdminLang();
  const label = t(item.label, item.labelBn);
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: item.exact }}
      title={collapsed ? label : undefined}
      className={[
        "group relative flex items-center gap-3 text-sm transition-all",
        collapsed ? "justify-center px-2 py-2 mx-1 my-0.5 rounded-2xl" : "px-3 py-2.5 rounded-2xl",
        active
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
          : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 w-8 h-8 rounded-xl grid place-items-center transition-colors",
          active
            ? "bg-white/20 text-white"
            : "bg-white/40 text-slate-600 group-hover:bg-white group-hover:text-blue-700 ring-1 ring-white/60",
        ].join(" ")}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span className={`truncate flex-1 text-[13px] ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
      )}
      {!collapsed && !active && (
        <Pin
          className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-hidden
        />
      )}
    </Link>
  );
}


