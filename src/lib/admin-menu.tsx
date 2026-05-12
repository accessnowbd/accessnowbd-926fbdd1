import type { ReactNode } from "react";
import {
  LayoutDashboard, Package, PlusSquare, FolderTree, Image as ImageIcon, PartyPopper,
  Megaphone, Star, Percent, MessageCircle, Images, Home, PanelBottom,
  ShoppingBag, Users, Wallet, CreditCard, Truck, Boxes, Bell, FileCheck, FileText,
  TicketPercent, Gift, Share2, Megaphone as MegaphoneIcon, Target, Activity, BarChart3, Search,
  MapPin, LifeBuoy, BookOpen, Headphones,
  FileEdit, Newspaper, UserCircle2, Download,
  PieChart, UsersRound, ClipboardList, Bot, Settings, ShieldCheck, DatabaseBackup, ShoppingCart, ListChecks, Sparkles,
} from "lucide-react";

export type AdminMenuItem = {
  to: string;
  label: string;
  labelBn?: string;
  icon: ReactNode;
  /** Tailwind gradient classes for the round icon background */
  grad: string;
  /** If true, render as the dashboard root */
  exact?: boolean;
};

export type AdminMenuGroup = {
  id: string;
  title: string;
  icon: ReactNode;
  items: AdminMenuItem[];
};

const ic = (Icon: any) => <Icon className="w-4 h-4" />;

export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    id: "product",
    title: "Product Management",
    icon: ic(Package),
    items: [
      { to: "/admin", label: "Dashboard", icon: ic(LayoutDashboard), grad: "from-violet-500 to-indigo-500", exact: true },
      { to: "/admin/products", label: "All Products", icon: ic(Package), grad: "from-violet-500 to-fuchsia-500" },
      { to: "/admin/add-product", label: "Add New Product", icon: ic(PlusSquare), grad: "from-emerald-500 to-teal-500" },
      { to: "/admin/categories", label: "Categories", icon: ic(FolderTree), grad: "from-slate-700 to-slate-900" },
      { to: "/admin/banner-slider", label: "Banner Slider", icon: ic(ImageIcon), grad: "from-fuchsia-500 to-pink-500" },
      { to: "/admin/welcome-popup", label: "Welcome Popup", icon: ic(PartyPopper), grad: "from-pink-500 to-rose-500" },
      { to: "/admin/announcement-bar", label: "Announcement Bar", icon: ic(Megaphone), grad: "from-orange-500 to-rose-500" },
      { to: "/admin/reviews", label: "Manage Reviews", icon: ic(Star), grad: "from-amber-400 to-orange-500" },
      { to: "/admin/biggest-discount", label: "Biggest Discount", icon: ic(Percent), grad: "from-rose-500 to-red-600" },
      { to: "/admin/whatsapp-button", label: "WhatsApp Button", icon: ic(MessageCircle), grad: "from-green-500 to-emerald-600" },
      { to: "/admin/media-gallery", label: "Media Gallery", icon: ic(Images), grad: "from-blue-500 to-indigo-600" },
      { to: "/admin/homepage-editor", label: "Homepage Editor", icon: ic(Home), grad: "from-orange-400 to-amber-500" },
      { to: "/admin/footer-editor", label: "Footer Editor", icon: ic(PanelBottom), grad: "from-slate-600 to-slate-800" },
    ],
  },
  {
    id: "orders",
    title: "Orders & Payment",
    icon: ic(ShoppingCart),
    items: [
      { to: "/admin/orders", label: "Orders", icon: ic(ShoppingBag), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/users", label: "Customers", icon: ic(Users), grad: "from-cyan-500 to-teal-500" },
      { to: "/admin/wallet", label: "ওয়ালেট", icon: ic(Wallet), grad: "from-amber-400 to-orange-500" },
      { to: "/admin/shop-config", label: "Shop & WhatsApp", icon: ic(MessageCircle), grad: "from-green-500 to-emerald-600" },
      { to: "/admin/payments", label: "Payments", icon: ic(CreditCard), grad: "from-emerald-500 to-green-600" },
      { to: "/admin/account-delivery", label: "Account Delivery", icon: ic(Truck), grad: "from-amber-500 to-yellow-500" },
      { to: "/admin/inventory", label: "Inventory", icon: ic(Boxes), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/notifications", label: "Notifications", icon: ic(Bell), grad: "from-rose-500 to-red-500" },
      { to: "/admin/checkout-policy", label: "Checkout Policy", icon: ic(FileCheck), grad: "from-blue-500 to-cyan-500" },
      { to: "/admin/custom-invoice", label: "Custom Invoice", icon: ic(FileText), grad: "from-slate-600 to-slate-800" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: ic(Sparkles),
    items: [
      { to: "/admin/coupons", label: "Coupons", icon: ic(TicketPercent), grad: "from-rose-500 to-pink-500" },
      { to: "/admin/referral", label: "Referral", icon: ic(Gift), grad: "from-pink-500 to-fuchsia-500" },
      { to: "/admin/affiliates", label: "Affiliates", icon: ic(Share2), grad: "from-violet-500 to-purple-600" },
      { to: "/admin/marketing", label: "Marketing", icon: ic(MegaphoneIcon), grad: "from-orange-500 to-rose-500" },
      { to: "/admin/ad-campaigns", label: "Ad Campaigns", icon: ic(Target), grad: "from-rose-500 to-red-500" },
      { to: "/admin/fb-pixel", label: "FB Pixel & CAPI", icon: ic(BarChart3), grad: "from-blue-600 to-indigo-700" },
      { to: "/admin/google-ads", label: "Google Ads & GA4", icon: ic(Activity), grad: "from-sky-500 to-blue-600" },
      { to: "/admin/ga4-realtime", label: "GA4 Realtime Report", icon: ic(Activity), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/search-console", label: "Search Console & SEO", icon: ic(Search), grad: "from-cyan-500 to-blue-600" },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: ic(LifeBuoy),
    items: [
      { to: "/admin/tracking", label: "Tracking", icon: ic(MapPin), grad: "from-emerald-500 to-teal-600" },
      { to: "/admin/tickets", label: "Tickets", icon: ic(LifeBuoy), grad: "from-emerald-500 to-green-600" },
      { to: "/admin/help-center", label: "Help Center", icon: ic(BookOpen), grad: "from-emerald-500 to-teal-600" },
      { to: "/admin/support-channels", label: "Support Channels", icon: ic(Headphones), grad: "from-emerald-500 to-green-600" },
    ],
  },
  {
    id: "content",
    title: "Content",
    icon: ic(FileEdit),
    items: [
      { to: "/admin/pages", label: "Page Management", icon: ic(FileEdit), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/blog", label: "Blog", icon: ic(Newspaper), grad: "from-rose-500 to-red-500" },
      { to: "/admin/ceo-message", label: "CEO Message", icon: ic(UserCircle2), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/software-downloads", label: "Software Downloads", icon: ic(Download), grad: "from-emerald-500 to-green-600" },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: ic(Settings),
    items: [
      { to: "/admin/analytics", label: "Analytics Dashboard", icon: ic(PieChart), grad: "from-violet-500 to-indigo-600" },
      { to: "/admin/customer-insights", label: "Customer Insights", icon: ic(UsersRound), grad: "from-cyan-500 to-teal-500" },
      { to: "/admin/reports", label: "Reports", icon: ic(BarChart3), grad: "from-blue-500 to-indigo-600" },
      { to: "/admin/ai-api", label: "AI API Settings", icon: ic(Bot), grad: "from-violet-500 to-fuchsia-500" },
      { to: "/admin/settings", label: "Settings", icon: ic(Settings), grad: "from-slate-600 to-slate-800" },
      { to: "/admin/roles", label: "Admin Roles", icon: ic(ShieldCheck), grad: "from-rose-500 to-red-500" },
      { to: "/admin/backup", label: "Backup", icon: ic(DatabaseBackup), grad: "from-cyan-500 to-blue-600" },
      { to: "/admin/order-recovery", label: "অর্ডার রিকভারি", icon: ic(ShoppingCart), grad: "from-emerald-500 to-teal-500" },
      { to: "/admin/activity-log", label: "Activity Log", icon: ic(ClipboardList), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/ai-command", label: "AI Command Center", icon: ic(Sparkles), grad: "from-violet-500 to-fuchsia-500" },
    ],
  },
];

export const ALL_ADMIN_PAGES = ADMIN_MENU.flatMap((g) => g.items);

export function findAdminPage(pathname: string): AdminMenuItem | undefined {
  return ALL_ADMIN_PAGES.find((p) => p.to === pathname);
}
