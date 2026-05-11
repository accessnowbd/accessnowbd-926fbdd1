import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Search, Menu, X, ChevronRight, LogIn, UserCircle2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { CartIcon } from "@/components/CartIcon";
import { AccountIcon } from "@/components/AccountIcon";
import { useAuth } from "@/context/AuthContext";
import { GlobalSearch, useGlobalSearch } from "@/components/GlobalSearch";

const NAV: Array<{
  label: string;
  to: "/" | "/products" | "/streaming" | "/ai-tools" | "/education" | "/faq" | "/contact";
}> = [
  { label: "Store", to: "/products" },
  { label: "Streaming", to: "/streaming" },
  { label: "AI Tools", to: "/ai-tools" },
  { label: "Education", to: "/education" },
  { label: "Support", to: "/faq" },
  { label: "Contact", to: "/contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { open: searchOpen, setOpen: setSearchOpen } = useGlobalSearch();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[rgba(10,10,18,0.72)] backdrop-blur-xl border-b border-white/[0.08]">
        <div className="mx-auto max-w-[1024px] px-5 h-11 flex items-center justify-between gap-6 text-[13px]">
          {/* Brand — minimal Apple-style wordmark */}
          <Link
            to="/"
            className="text-white/90 hover:text-white transition-colors font-semibold tracking-tight text-[15px] shrink-0"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            AccessNow<span className="text-white/55"> BD</span>
          </Link>

          {/* Desktop nav — plain text links, equal spacing */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "relative text-[12.5px] tracking-tight transition-colors duration-200 py-1",
                  isActive(n.to)
                    ? "text-white"
                    : "text-white/72 hover:text-white",
                ].join(" ")}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right actions — minimal icons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid place-items-center w-9 h-9 rounded-full text-white/72 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>

            <div className="hidden sm:flex items-center">
              <AccountIcon />
              <CartIcon />
            </div>

            {user ? (
              <button
                onClick={handleLogout}
                className="hidden sm:grid place-items-center w-9 h-9 rounded-full text-white/72 hover:text-white transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-[17px] h-[17px]" strokeWidth={1.5} />
              </button>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:inline-flex items-center gap-1 ml-1 h-7 px-3 rounded-full text-[12px] font-medium text-white/85 hover:text-white border border-white/15 hover:border-white/30 transition-colors"
              >
                Sign in
              </Link>
            )}

            {/* Mobile cart/account */}
            <div className="flex sm:hidden items-center">
              <CartIcon />
            </div>

            <button
              onClick={() => setOpen((o) => !o)}
              className="lg:hidden grid place-items-center w-9 h-9 rounded-full text-white/85 hover:text-white transition-colors"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? (
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              ) : (
                <Menu className="w-[18px] h-[18px]" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile fullscreen menu — Apple-style */}
        {open && (
          <div className="lg:hidden fixed inset-x-0 top-11 bottom-0 z-30 bg-[rgba(10,10,18,0.96)] backdrop-blur-2xl overflow-y-auto">
            <nav className="px-6 pt-4 pb-8">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 border-b border-white/[0.08] text-[22px] font-medium tracking-tight text-white/90 hover:text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {n.label}
                  <ChevronRight className="w-4 h-4 text-white/40" strokeWidth={2} />
                </Link>
              ))}

              <div className="mt-6 grid gap-2">
                {user ? (
                  <>
                    <Link
                      to="/orders"
                      onClick={() => setOpen(false)}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-white text-[#0a0a12] text-[13px] font-semibold"
                    >
                      <UserCircle2 className="w-4 h-4" /> My Account
                    </Link>
                    <button
                      onClick={async () => {
                        setOpen(false);
                        await handleLogout();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full border border-white/15 text-white text-[13px] font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-white text-[#0a0a12] text-[13px] font-semibold"
                  >
                    <LogIn className="w-4 h-4" /> Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

// Kept for backwards compatibility with any imports — minimal Apple-style top strip.
export function TopUtilityBar() {
  return null;
}
