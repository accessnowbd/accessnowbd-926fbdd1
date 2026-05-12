import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — AccessNow BD" }] }),
});

const BRAND = "#1D4ED8";
const BRAND_LIGHT = "#EFF6FF";
const BRAND_DARK = "#1E3A8A";

type UserData = {
  name: string;
  username: string;
  email: string;
  phone: string;
  country: string;
  memberSince: string;
  avatar: string;
  verified: boolean;
  orders: number;
  total: number;
  wishlist: number;
  wallet: number;
  points: number;
  referrals: number;
};

const defaultUser: UserData = {
  name: "Md Shahed",
  username: "@shahed",
  email: "info.shahed@gmail.com",
  phone: "01820060046",
  country: "Bangladesh",
  memberSince: "January 2025",
  avatar: "MS",
  verified: true,
  orders: 0,
  total: 0,
  wishlist: 0,
  wallet: 0,
  points: 120,
  referrals: 3,
};

const NAV_SECTIONS = [
  {
    label: "Account",
    items: [
      { id: "profile", icon: "👤", label: "Profile" },
      { id: "addresses", icon: "📍", label: "Addresses" },
      { id: "security", icon: "🔒", label: "Security" },
    ],
  },
  {
    label: "Activity",
    items: [
      { id: "orders", icon: "🛍️", label: "My Orders" },
      { id: "licenses", icon: "🔑", label: "My Licenses" },
      { id: "wishlist", icon: "❤️", label: "Wishlist" },
      { id: "notifications", icon: "🔔", label: "Notifications" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { id: "wallet", icon: "💳", label: "Wallet" },
      { id: "points", icon: "🪙", label: "Points" },
      { id: "referral", icon: "👥", label: "Referral" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "language", icon: "🌐", label: "Language" },
      { id: "install", icon: "📲", label: "Install App" },
    ],
  },
];

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#F0F4FF",
  } as CSSProperties,
  sidebar: {
    width: 220,
    minWidth: 220,
    background: "#fff",
    borderRight: "1px solid #E5EAFF",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 12,
  } as CSSProperties,
  logoWrap: {
    padding: "20px 18px 16px",
    borderBottom: "1px solid #E5EAFF",
    marginBottom: 8,
  } as CSSProperties,
  logoMain: { fontSize: 16, fontWeight: 700, color: BRAND, letterSpacing: "-0.4px" } as CSSProperties,
  logoSub: { fontSize: 11, color: "#94A3B8", marginTop: 2 } as CSSProperties,
  navGroup: { padding: "6px 10px", marginBottom: 4 } as CSSProperties,
  navLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    padding: "4px 8px",
    marginBottom: 2,
  } as CSSProperties,
  navItem: (active: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? BRAND : "#475569",
    background: active ? BRAND_LIGHT : "transparent",
    marginBottom: 1,
    transition: "all 0.15s",
    border: "none",
    width: "100%",
    textAlign: "left",
  }),
  specialBtn: (bg: string, color: string): CSSProperties => ({
    margin: "4px 10px",
    borderRadius: 9,
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: bg,
    color,
    border: "none",
    width: "calc(100% - 20px)",
    textAlign: "left",
  }),
  logoutBtn: {
    margin: "8px 10px 0",
    padding: "8px 12px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#DC2626",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    width: "calc(100% - 20px)",
    textAlign: "left" as const,
  } as CSSProperties,
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 } as CSSProperties,
  banner: {
    background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #4F46E5 100%)`,
    padding: "18px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    flexWrap: "wrap" as const,
    gap: 16,
  } as CSSProperties,
  avatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid rgba(255,255,255,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
  } as CSSProperties,
  statCard: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 10,
    padding: "10px 18px",
    textAlign: "center" as const,
    minWidth: 80,
    color: "#fff",
  } as CSSProperties,
  content: { flex: 1, padding: "24px 28px" } as CSSProperties,
  pageTitle: { fontSize: 22, fontWeight: 700, color: "#1E293B", margin: 0 } as CSSProperties,
  pageSub: { fontSize: 13, color: "#64748B", margin: "4px 0 18px" } as CSSProperties,
  card: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  } as CSSProperties,
  emptyCard: {
    background: "#fff",
    border: "1px dashed #CBD5E1",
    borderRadius: 12,
    padding: 40,
    textAlign: "center" as const,
    color: "#64748B",
  } as CSSProperties,
};

// ---------------- Pages ----------------

function ProfilePage({ user }: { user: UserData }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const fields: { key: keyof UserData; label: string; icon: string; verified?: boolean; readonly?: boolean }[] = [
    { key: "name", label: "Full Name", icon: "👤" },
    { key: "username", label: "Username", icon: "@" },
    { key: "email", label: "Email", icon: "✉️", verified: true },
    { key: "phone", label: "Phone Number", icon: "📞" },
    { key: "country", label: "Country", icon: "🏳️" },
    { key: "memberSince", label: "Member Since", icon: "📅", readonly: true },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={styles.pageTitle}>Profile</h2>
          <p style={styles.pageSub}>Manage your personal information</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          style={{
            background: editing ? "#10B981" : BRAND,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {editing ? "✓ Save" : "✏️ Edit"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {fields.map((f) => (
          <div key={f.key} style={styles.card}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
              {f.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>
              {editing && !f.readonly ? (
                <input
                  value={String(form[f.key] ?? "")}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#1E293B", outline: "none" }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 13, color: "#1E293B", fontWeight: 500 }}>{String(form[f.key] ?? "")}</span>
              )}
              {f.verified && (
                <span style={{ fontSize: 11, color: "#059669", background: "#D1FAE5", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>✓ Verified</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPage() {
  const orders = [
    { id: "#ANB001", product: "Adobe Creative Cloud", date: "12 May 2025", amount: "৳2,500", status: "Active" },
    { id: "#ANB002", product: "Microsoft Office 365", date: "03 Apr 2025", amount: "৳1,800", status: "Delivered" },
    { id: "#ANB003", product: "Canva Pro", date: "20 Mar 2025", amount: "৳900", status: "Expired" },
  ];
  const statusColor: Record<string, { bg: string; text: string }> = {
    Active: { bg: "#D1FAE5", text: "#065F46" },
    Delivered: { bg: "#DBEAFE", text: "#1E40AF" },
    Expired: { bg: "#FEE2E2", text: "#991B1B" },
  };
  return (
    <div>
      <h2 style={styles.pageTitle}>My Orders</h2>
      <p style={styles.pageSub}>Track and manage your purchases</p>
      {orders.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={{ fontSize: 32 }}>🛍️</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <div>
          {orders.map((o) => {
            const sc = statusColor[o.status] || { bg: "#F1F5F9", text: "#475569" };
            return (
              <div key={o.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 14 }}>{o.product}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{o.id} · {o.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>{o.amount}</span>
                  <span style={{ background: sc.bg, color: sc.text, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{o.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WalletPage({ user }: { user: UserData }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Wallet</h2>
      <div style={{ ...styles.card, background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #4F46E5 100%)`, color: "#fff", border: "none" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>Available Balance</div>
        <div style={{ fontSize: 32, fontWeight: 700, margin: "6px 0" }}>৳{user.wallet.toLocaleString()}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>AccessNow BD Wallet</div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {([["💰 Add Money", BRAND_LIGHT, BRAND], ["💸 Withdraw", "#FFF7ED", "#C2410C"]] as const).map(([label, bg, color]) => (
          <button key={label} style={{ flex: 1, minWidth: 140, padding: "12px 18px", background: bg, color, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={styles.card}>
        <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: 8 }}>Transaction History</div>
        <div style={{ fontSize: 13, color: "#94A3B8" }}>No transactions yet</div>
      </div>
    </div>
  );
}

function PointsPage({ user }: { user: UserData }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Points</h2>
      <div style={{ ...styles.card, textAlign: "center", background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "none" }}>
        <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>Your Points</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: "#78350F", margin: "6px 0" }}>{user.points} pts</div>
        <div style={{ fontSize: 12, color: "#92400E" }}>Earn more by shopping & referring!</div>
      </div>
      <div style={styles.card}>
        <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>How to earn points</div>
        {[["🛍️ Place an order", "Earn 10 pts per ৳100"], ["👥 Refer a friend", "Earn 50 pts per referral"], ["✅ Complete profile", "Earn 30 pts once"]].map(([title, desc]) => (
          <div key={title} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 22 }}>{title.split(" ")[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{title.slice(2)}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralPage({ user }: { user: UserData }) {
  const code = "SHAHED-ANB";
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <h2 style={styles.pageTitle}>Referral Program</h2>
      <div style={{ ...styles.card, textAlign: "center" }}>
        <div style={{ fontSize: 36 }}>👥</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1E293B", marginTop: 6 }}>{user.referrals} Friends Referred</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Earn 50 points per successful referral</div>
      </div>
      <div style={styles.card}>
        <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Your Referral Code</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: BRAND_LIGHT, padding: "12px 16px", borderRadius: 10 }}>
          <span style={{ flex: 1, fontWeight: 700, color: BRAND, letterSpacing: "1px" }}>{code}</span>
          <button onClick={copy} style={{ background: BRAND, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityPage() {
  return (
    <div>
      <h2 style={styles.pageTitle}>Security</h2>
      {[
        { icon: "🔑", title: "Change Password", desc: "Update your account password", btn: "Change", btnColor: BRAND },
        { icon: "📱", title: "Two-Factor Authentication", desc: "Add extra security to your account", btn: "Enable", btnColor: "#10B981" },
        { icon: "🖥️", title: "Active Sessions", desc: "Manage your logged-in devices", btn: "View", btnColor: "#64748B" },
      ].map((item) => (
        <div key={item.title} style={{ ...styles.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>{item.icon}</div>
            <div>
              <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 14 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>{item.desc}</div>
            </div>
          </div>
          <button style={{ background: item.btnColor, color: "#fff", border: "none", padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {item.btn}
          </button>
        </div>
      ))}
    </div>
  );
}

function WishlistPage() {
  return (
    <div>
      <h2 style={styles.pageTitle}>Wishlist</h2>
      <p style={styles.pageSub}>Products you've saved for later</p>
      <div style={styles.emptyCard}>
        <div style={{ fontSize: 32 }}>❤️</div>
        <p style={{ fontWeight: 600, color: "#1E293B", margin: "6px 0" }}>Your wishlist is empty</p>
        <p style={{ fontSize: 13, margin: 0 }}>Browse products and add them here</p>
      </div>
    </div>
  );
}

function NotificationsPage() {
  const notifs = [
    { icon: "🎉", text: "Welcome to AccessNow BD!", time: "2 days ago", unread: true },
    { icon: "🔑", text: "Your account has been verified successfully.", time: "3 days ago", unread: false },
  ];
  return (
    <div>
      <h2 style={styles.pageTitle}>Notifications</h2>
      {notifs.map((n, i) => (
        <div key={i} style={{ ...styles.card, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 22 }}>{n.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#1E293B", fontWeight: 500 }}>{n.text}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{n.time}</div>
          </div>
          {n.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: BRAND }} />}
        </div>
      ))}
    </div>
  );
}

function AddressesPage() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={styles.pageTitle}>Addresses</h2>
        <button style={{ background: BRAND, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add New</button>
      </div>
      <div style={styles.emptyCard}>
        <div style={{ fontSize: 32 }}>📍</div>
        <p style={{ fontWeight: 600, color: "#1E293B", margin: "6px 0" }}>No addresses saved</p>
        <p style={{ fontSize: 13, margin: 0 }}>Add a delivery address to get started</p>
      </div>
    </div>
  );
}

function LicensesPage() {
  return (
    <div>
      <h2 style={styles.pageTitle}>My Licenses</h2>
      <div style={styles.emptyCard}>
        <div style={{ fontSize: 32 }}>🔑</div>
        <p style={{ fontWeight: 600, color: "#1E293B", margin: "6px 0" }}>No licenses yet</p>
        <p style={{ fontSize: 13, margin: 0 }}>Purchase a product to see your licenses here</p>
      </div>
    </div>
  );
}

function LanguagePage() {
  const [lang, setLang] = useState("English");
  return (
    <div>
      <h2 style={styles.pageTitle}>Language</h2>
      {([["🇬🇧 English", "English"], ["🇧🇩 বাংলা", "বাংলা"]] as const).map(([label, val]) => (
        <button
          key={val}
          onClick={() => setLang(val)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            background: lang === val ? BRAND_LIGHT : "#fff",
            border: `1px solid ${lang === val ? "#BFDBFE" : "#E2E8F0"}`,
            borderRadius: 10,
            marginBottom: 10,
            cursor: "pointer",
            width: "100%",
            fontSize: 14,
            color: "#1E293B",
            fontWeight: 500,
          }}
        >
          <span>{label}</span>
          {lang === val && <span style={{ color: BRAND, fontWeight: 700 }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

function InstallPage() {
  return (
    <div style={{ ...styles.emptyCard, padding: 60 }}>
      <div style={{ fontSize: 40 }}>📲</div>
      <p style={{ fontWeight: 700, color: "#1E293B", fontSize: 16, margin: "8px 0" }}>Install AccessNow BD App</p>
      <p style={{ fontSize: 13, margin: 0 }}>Coming soon on Android & iOS</p>
    </div>
  );
}

// ---------------- Main ----------------

function DashboardPage() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("profile");
  const [user, setUser] = useState<UserData>(defaultUser);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate({ to: "/auth" });
      return;
    }
    if (authUser) {
      supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("id", authUser.id)
        .maybeSingle()
        .then(({ data }) => {
          const name = (data?.display_name as string) || authUser.email?.split("@")[0] || "User";
          setUser((u) => ({
            ...u,
            name,
            email: authUser.email || u.email,
            phone: (data?.phone as string) || u.phone,
            username: "@" + (authUser.email?.split("@")[0] || "user"),
            avatar: name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase(),
          }));
        });
    }
  }, [authUser, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const renderPage = () => {
    switch (active) {
      case "profile": return <ProfilePage user={user} />;
      case "orders": return <OrdersPage />;
      case "wallet": return <WalletPage user={user} />;
      case "points": return <PointsPage user={user} />;
      case "referral": return <ReferralPage user={user} />;
      case "security": return <SecurityPage />;
      case "wishlist": return <WishlistPage />;
      case "notifications": return <NotificationsPage />;
      case "addresses": return <AddressesPage />;
      case "licenses": return <LicensesPage />;
      case "language": return <LanguagePage />;
      case "install": return <InstallPage />;
      default: return <ProfilePage user={user} />;
    }
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logoWrap}>
          <div style={styles.logoMain}>AccessNow BD</div>
          <div style={styles.logoSub}>User Dashboard</div>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={styles.navGroup}>
            <div style={styles.navLabel}>{section.label}</div>
            {section.items.map((item) => (
              <button key={item.id} style={styles.navItem(active === item.id)} onClick={() => setActive(item.id)}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 8 }}>
          <button style={styles.specialBtn(BRAND_LIGHT, BRAND)}>🤝 Affiliate Program</button>
          <button style={styles.specialBtn("#FFFBEB", "#B45309")}>🎁 Free Tools</button>
          <button style={styles.specialBtn("#F0FDF4", "#15803D")}>⚙️ Admin Panel</button>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>🚪 Logout</button>
      </aside>

      {/* Main */}
      <div style={styles.main}>
        {/* Banner */}
        <div style={styles.banner}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={styles.avatar}>{user.avatar}</div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600, letterSpacing: "1px" }}>WELCOME BACK</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{user.name}</span>
                {user.verified && (
                  <span style={{ fontSize: 10, color: "#fff", background: "rgba(16,185,129,0.4)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>✓ Verified</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                {user.username} · {user.email}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {([["ORDERS", user.orders], ["TOTAL ৳", user.total], ["WISHLIST", user.wishlist]] as const).map(([label, val]) => (
              <div key={label} style={styles.statCard}>
                <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600, letterSpacing: "0.6px" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>{renderPage()}</div>
      </div>
    </div>
  );
}
