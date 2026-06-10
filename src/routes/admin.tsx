import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AuthPageEntry } from "@/components/AuthPage";
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
import accessNowLogo from "@/assets/logo-gold-a.png";

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
  // Admin panel is always light/white themed regardless of the user-selected
  // site theme. Force `theme-white` on <html> while mounted, then restore on unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const hadWhite = root.classList.contains("theme-white");
    root.classList.add("theme-white");
    return () => { if (!hadWhite) root.classList.remove("theme-white"); };
  }, []);
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
      return;
    }
    let cancelled = false;
    (async () => {
      await verifyRole(user.id);
      if (cancelled) return;
      setVerified(true);
    })();
    return () => { cancelled = true; };
  }, [user, loading, verifyRole]);

  if (loading) {
    return <AdminBlankState />;
  }

  if (!user) {
    return <AuthPageEntry initialMode="login" />;
  }

  if (!verified) {
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
    <div className="admin-glass lg:h-screen lg:overflow-hidden min-h-screen flex relative font-['Manrope',ui-sans-serif,system-ui] text-slate-800 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100">
      {/* Ambient glow orbs (whole admin) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-violet-400/30 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-fuchsia-300/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full bg-indigo-300/25 blur-[130px]" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-violet-950/40 backdrop-blur-md"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={[
          "shrink-0 transition-all duration-200 flex flex-col h-screen relative z-10",
          "bg-white/55 backdrop-blur-2xl border-r border-white/60 ring-1 ring-violet-200/40 shadow-[0_20px_60px_-30px_rgba(109,40,217,0.35)]",
          "lg:sticky lg:top-0 lg:translate-x-0 lg:z-10",
          collapsed ? "lg:w-[76px]" : "lg:w-[268px]",
          "fixed top-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-2xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand */}
        <div className={[
          "border-b border-white/50 bg-white/30 backdrop-blur-xl",
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
        <div className="border-t border-white/50 p-3 space-y-2 bg-white/40 backdrop-blur-xl">
          <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white grid place-items-center text-xs font-bold shrink-0 shadow-[0_4px_14px_-4px_rgba(139,92,246,0.7)] ring-1 ring-white/40 font-['Sora']">
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
              className="w-full h-9 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-md shadow-violet-500/30 ring-1 ring-white/30 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> {t("Logout", "লগআউট")}
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col lg:h-screen lg:overflow-y-auto relative z-[1]">

        {/* Top bar */}
        <header className="h-[68px] sticky top-0 z-20 bg-white/40 backdrop-blur-2xl border-b border-white/50 ring-1 ring-violet-200/30 shadow-[0_8px_24px_-16px_rgba(109,40,217,0.25)]">
          <div className="h-full px-3 md:px-6 flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg grid place-items-center border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm min-w-0">
              <span className="px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 bg-white/60 backdrop-blur text-violet-700 ring-1 ring-violet-200/60">
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
              className="inline-flex h-9 px-2.5 sm:px-3 rounded-lg text-xs font-bold items-center gap-1.5 border border-white/60 bg-white/50 backdrop-blur text-slate-700 hover:bg-white/80 hover:border-violet-300 hover:text-violet-700 transition shrink-0"
            >
              <Globe className="w-3.5 h-3.5" /> {lang === "en" ? "বাং" : "EN"}
            </button>
            <SearchTrigger
              size="sm"
              onClick={() => setGlobalOpen(true)}
              placeholder={t("Search…", "খুঁজুন…")}
              className="hidden xl:block w-64"
            />

            <Link to="/" className="hidden sm:inline-flex h-9 px-3 rounded-lg text-xs font-bold items-center gap-1.5 bg-white/50 backdrop-blur border border-white/60 text-slate-700 hover:bg-white/80 hover:border-violet-300 hover:text-violet-700 transition">
              <ExternalLink className="w-3.5 h-3.5" /> {t("View store", "স্টোর দেখুন")}
            </Link>
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 min-w-0 overflow-x-hidden text-slate-800">
          <div className="mx-auto max-w-[1400px] space-y-4 md:space-y-6">
            {currentPage && <AdminPageHero group={currentPage.group} item={currentPage.item} t={t} />}
            <Outlet />
          </div>
        </div>

      </div>

      <AdminGlobalSearch open={globalOpen} onOpenChange={setGlobalOpen} />

      <style>{`
        .admin-scroll::-webkit-scrollbar { width: 6px; }
        .admin-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.22); border-radius: 999px; }
        .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,.35); }
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
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10.5px] font-bold uppercase tracking-[0.14em] hover:bg-slate-50 transition font-['Sora'] text-[#629aea]"
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
        "group relative flex items-center gap-3 rounded-xl text-sm transition-all",
        collapsed ? "justify-center px-2 py-2 mx-1 my-0.5" : "px-2.5 py-2",
        active
          ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/15 backdrop-blur text-violet-900 ring-1 ring-violet-400/50 shadow-sm shadow-violet-500/20"
          : "text-slate-700 hover:bg-white/50 hover:backdrop-blur hover:text-violet-700",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 w-8 h-8 rounded-full grid place-items-center text-white shadow-sm transition-transform",
          "bg-gradient-to-br",
          item.grad,
          "ring-1 ring-black/5 group-hover:scale-[1.05]",
        ].join(" ")}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span className={`truncate flex-1 text-[13px] ${active ? "font-bold text-slate-900" : "font-semibold"}`}>{label}</span>
      )}
      {!collapsed && active && (
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-violet-600" aria-hidden />
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

function AdminPageHero({ group, item, t }: { group: any; item: AdminMenuItem; t: (en: string, bn?: string) => string }) {
  const title = t(item.label, item.labelBn);
  const groupTitle = t(group.title, group.titleBn);
  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-violet-100/80 via-indigo-50/70 to-fuchsia-100/60",
        "ring-1 ring-white/60 shadow-[0_10px_40px_-20px_rgba(99,102,241,0.45)]",
        "px-5 md:px-8 py-5 md:py-7",
      ].join(" ")}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-80 h-80 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute top-1/2 right-6 -translate-y-1/2 hidden md:flex items-center gap-6 opacity-70">
          <span className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur grid place-items-center text-violet-500 ring-1 ring-white/70">{group.icon}</span>
          <span className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur grid place-items-center text-pink-500 ring-1 ring-white/70">{item.icon}</span>
          <span className="w-12 h-12 rounded-2xl bg-white/60 backdrop-blur grid place-items-center text-indigo-500 ring-1 ring-white/70">{group.icon}</span>
        </div>
      </div>

      <div className="relative flex items-center gap-4 md:gap-5">
        <span
          className={[
            "shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl grid place-items-center text-white",
            "bg-gradient-to-br", item.grad,
            "shadow-[0_10px_30px_-10px_rgba(99,102,241,0.55)] ring-1 ring-white/40",
          ].join(" ")}
        >
          <span className="[&>svg]:w-7 [&>svg]:h-7 md:[&>svg]:w-8 md:[&>svg]:h-8">{item.icon}</span>
        </span>
        <div className="min-w-0">
          <h1 className="font-['Sora',ui-sans-serif,system-ui] font-extrabold tracking-tight text-[26px] md:text-[36px] leading-none bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent truncate">
            {title}
          </h1>
          <p className="mt-1.5 text-[12px] md:text-[13px] font-semibold text-slate-600">
            <span className="text-violet-600">{groupTitle}</span>
            <span className="mx-2 text-slate-400">•</span>
            <span>{t("Manage and configure", "ম্যানেজ ও কনফিগার")} {title.toLowerCase()}</span>
          </p>
        </div>
      </div>
    </section>
  );
}




