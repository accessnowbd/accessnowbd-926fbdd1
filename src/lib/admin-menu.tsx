import type { ReactNode } from "react";
import {
  LayoutDashboard, Package, PlusSquare, FolderTree, Image as ImageIcon, PartyPopper,
  Megaphone, Star, Percent, MessageCircle, Images, Home, PanelBottom, Lock,
  ShoppingBag, Users, Wallet, CreditCard, Truck, Boxes, Bell, FileCheck, FileText,
  TicketPercent, Gift, Share2, Megaphone as MegaphoneIcon, Target, Activity, BarChart3, Search,
  MapPin, LifeBuoy, BookOpen, Headphones, DollarSign,
  FileEdit, Newspaper, UserCircle2, Download,
  PieChart, UsersRound, ClipboardList, Bot, Settings, ShieldCheck, DatabaseBackup, ShoppingCart, ListChecks, Sparkles, Gauge, Timer,
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
  titleBn?: string;
  icon: ReactNode;
  items: AdminMenuItem[];
};

const ic = (Icon: any) => <Icon className="w-4 h-4" />;

export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    id: "product",
    title: "Product Management",
    titleBn: "প্রোডাক্ট ম্যানেজমেন্ট",
    icon: ic(Package),
    items: [
      { to: "/admin", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: ic(LayoutDashboard), grad: "from-red-500 to-orange-500", exact: true },
      { to: "/admin/products", label: "All Products", labelBn: "সব প্রোডাক্ট", icon: ic(Package), grad: "from-blue-500 to-sky-600" },
      { to: "/admin/bulk-update", label: "Bulk Update", labelBn: "বাল্ক আপডেট", icon: ic(ListChecks), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/add-product", label: "Add New Product", labelBn: "নতুন প্রোডাক্ট যোগ", icon: ic(PlusSquare), grad: "from-emerald-500 to-green-600" },
      { to: "/admin/categories", label: "Categories", labelBn: "ক্যাটাগরি", icon: ic(FolderTree), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/banner-slider", label: "Banner Slider", labelBn: "ব্যানার স্লাইডার", icon: ic(ImageIcon), grad: "from-orange-500 to-red-500" },
      { to: "/admin/welcome-popup", label: "Welcome Popup", labelBn: "ওয়েলকাম পপআপ", icon: ic(PartyPopper), grad: "from-red-500 to-rose-600" },
      { to: "/admin/announcement-bar", label: "Announcement Bar", labelBn: "ঘোষণা বার", icon: ic(Megaphone), grad: "from-red-500 to-rose-600" },
      { to: "/admin/reviews", label: "Manage Reviews", labelBn: "রিভিউ ম্যানেজ", icon: ic(Star), grad: "from-amber-400 to-yellow-500" },
      { to: "/admin/biggest-discount", label: "Biggest Discount", labelBn: "সর্বোচ্চ ডিসকাউন্ট", icon: ic(Percent), grad: "from-orange-500 to-red-600" },
      { to: "/admin/whatsapp-button", label: "WhatsApp Button", labelBn: "হোয়াটসঅ্যাপ বাটন", icon: ic(MessageCircle), grad: "from-emerald-500 to-green-600" },
      { to: "/admin/media-gallery", label: "Media Gallery", labelBn: "মিডিয়া গ্যালারি", icon: ic(Images), grad: "from-teal-500 to-cyan-600" },
      { to: "/admin/homepage-editor", label: "Homepage Editor", labelBn: "হোমপেজ এডিটর", icon: ic(Home), grad: "from-cyan-500 to-blue-600" },
      { to: "/admin/footer-editor", label: "Footer Editor", labelBn: "ফুটার এডিটর", icon: ic(PanelBottom), grad: "from-slate-500 to-slate-700" },
      { to: "/admin/owner-pin", label: "Owner PIN", labelBn: "ওনার পিন", icon: ic(Lock), grad: "from-slate-700 to-slate-900" },
    ],
  },
  {
    id: "orders",
    title: "Orders & Payment",
    titleBn: "অর্ডার ও পেমেন্ট",
    icon: ic(ShoppingCart),
    items: [
      { to: "/admin/orders", label: "Orders", labelBn: "অর্ডার", icon: ic(ShoppingBag), grad: "from-blue-500 to-blue-700" },
      { to: "/admin/users", label: "Customers", labelBn: "কাস্টমার", icon: ic(Users), grad: "from-cyan-500 to-sky-600" },
      { to: "/admin/wallet", label: "Wallet", labelBn: "ওয়ালেট", icon: ic(Wallet), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/shop-config", label: "Shop & WhatsApp", labelBn: "শপ ও হোয়াটসঅ্যাপ", icon: ic(MessageCircle), grad: "from-green-500 to-emerald-600" },
      { to: "/admin/payments", label: "Payments", labelBn: "পেমেন্ট", icon: ic(CreditCard), grad: "from-emerald-600 to-teal-700" },
      { to: "/admin/account-delivery", label: "Account Delivery", labelBn: "অ্যাকাউন্ট ডেলিভারি", icon: ic(Truck), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/inventory", label: "Inventory", labelBn: "ইনভেন্টরি", icon: ic(Boxes), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/notifications", label: "Notifications", labelBn: "নোটিফিকেশন", icon: ic(Bell), grad: "from-red-500 to-rose-600" },
      { to: "/admin/checkout-policy", label: "Checkout Policy", labelBn: "চেকআউট পলিসি", icon: ic(FileCheck), grad: "from-teal-500 to-emerald-600" },
      { to: "/admin/custom-invoice", label: "Custom Invoice", labelBn: "কাস্টম ইনভয়েস", icon: ic(FileText), grad: "from-blue-500 to-sky-600" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    titleBn: "মার্কেটিং",
    icon: ic(Sparkles),
    items: [
      { to: "/admin/coupons", label: "Coupons", labelBn: "কুপন", icon: ic(TicketPercent), grad: "from-red-500 to-orange-500" },
      { to: "/admin/referral", label: "Referral", labelBn: "রেফারেল", icon: ic(Gift), grad: "from-amber-500 to-red-500" },
      { to: "/admin/affiliates", label: "Affiliates", labelBn: "অ্যাফিলিয়েট", icon: ic(Share2), grad: "from-blue-500 to-cyan-600" },
      { to: "/admin/marketing", label: "Marketing", labelBn: "মার্কেটিং", icon: ic(MegaphoneIcon), grad: "from-orange-500 to-rose-500" },
      { to: "/admin/ad-campaigns", label: "Ad Campaigns", labelBn: "অ্যাড ক্যাম্পেইন", icon: ic(Target), grad: "from-red-500 to-rose-600" },
      { to: "/admin/fb-pixel", label: "FB Pixel & CAPI", labelBn: "এফবি পিক্সেল ও CAPI", icon: ic(BarChart3), grad: "from-blue-500 to-blue-700" },
      { to: "/admin/google-ads", label: "Google Ads & GA4", labelBn: "গুগল অ্যাডস ও GA4", icon: ic(Activity), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/ga4-realtime", label: "GA4 Realtime Report", labelBn: "GA4 রিয়েলটাইম রিপোর্ট", icon: ic(Activity), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/search-console", label: "Search Console & SEO", labelBn: "সার্চ কনসোল ও SEO", icon: ic(Search), grad: "from-cyan-500 to-blue-600" },
    ],
  },
  {
    id: "support",
    title: "Support",
    titleBn: "সাপোর্ট",
    icon: ic(LifeBuoy),
    items: [
      { to: "/admin/tracking", label: "Tracking", labelBn: "ট্র্যাকিং", icon: ic(MapPin), grad: "from-emerald-500 to-teal-600" },
      { to: "/admin/tickets", label: "Tickets", labelBn: "টিকেট", icon: ic(LifeBuoy), grad: "from-emerald-500 to-green-600" },
      { to: "/admin/refund-requests", label: "Refund Requests", labelBn: "রিফান্ড রিকোয়েস্ট", icon: ic(DollarSign), grad: "from-slate-600 to-slate-800" },
      { to: "/admin/help-center", label: "Help Center", labelBn: "হেল্প সেন্টার", icon: ic(BookOpen), grad: "from-cyan-500 to-teal-500" },
      { to: "/admin/support-channels", label: "Support Channels", labelBn: "সাপোর্ট চ্যানেল", icon: ic(Headphones), grad: "from-emerald-500 to-teal-600" },
    ],
  },
  {
    id: "content",
    title: "Content",
    titleBn: "কনটেন্ট",
    icon: ic(FileEdit),
    items: [
      { to: "/admin/pages", label: "Page Management", labelBn: "পেজ ম্যানেজমেন্ট", icon: ic(FileEdit), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/description-template", label: "Description Template", labelBn: "ডেসক্রিপশন টেমপ্লেট", icon: ic(FileEdit), grad: "from-slate-600 to-slate-800" },
      { to: "/admin/description-preview", labelBn: "ডেসক্রিপশন প্রিভিউ", label: "Description Preview", icon: ic(FileEdit), grad: "from-sky-500 to-blue-600" },
      { to: "/admin/blog", label: "Blog", labelBn: "ব্লগ", icon: ic(Newspaper), grad: "from-orange-500 to-red-500" },
      { to: "/admin/ceo-message", label: "CEO Message", labelBn: "CEO বার্তা", icon: ic(UserCircle2), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/software-downloads", label: "Software Downloads", labelBn: "সফটওয়্যার ডাউনলোড", icon: ic(Download), grad: "from-emerald-500 to-green-600" },
    ],
  },
  {
    id: "system",
    title: "System",
    titleBn: "সিস্টেম",
    icon: ic(Settings),
    items: [
      { to: "/admin/analytics", label: "Analytics Dashboard", labelBn: "অ্যানালিটিক্স ড্যাশবোর্ড", icon: ic(PieChart), grad: "from-blue-500 to-sky-600" },
      { to: "/admin/web-vitals", label: "Web Vitals (Performance)", labelBn: "ওয়েব ভাইটালস", icon: ic(Gauge), grad: "from-slate-700 to-slate-900" },
      { to: "/admin/checkout-funnel-latency", label: "Checkout Funnel Latency", labelBn: "চেকআউট ফানেল ল্যাটেন্সি", icon: ic(Timer), grad: "from-slate-700 to-slate-900" },
      { to: "/admin/customer-insights", label: "Customer Insights", labelBn: "কাস্টমার ইনসাইট", icon: ic(UsersRound), grad: "from-cyan-500 to-teal-500" },
      { to: "/admin/reports", label: "Reports", labelBn: "রিপোর্ট", icon: ic(BarChart3), grad: "from-blue-500 to-sky-600" },
      { to: "/admin/ai-api", label: "AI API Settings", labelBn: "AI API সেটিংস", icon: ic(Bot), grad: "from-cyan-500 to-blue-600" },
      { to: "/admin/settings", label: "Settings", labelBn: "সেটিংস", icon: ic(Settings), grad: "from-slate-600 to-slate-800" },
      { to: "/admin/roles", label: "Admin Roles", labelBn: "অ্যাডমিন রোল", icon: ic(ShieldCheck), grad: "from-red-500 to-rose-600" },
      { to: "/admin/security", label: "Security & MFA", labelBn: "সিকিউরিটি ও MFA", icon: ic(ShieldCheck), grad: "from-rose-600 to-red-700" },
      { to: "/admin/backup", label: "Backup", labelBn: "ব্যাকআপ", icon: ic(DatabaseBackup), grad: "from-blue-500 to-cyan-600" },
      { to: "/admin/order-recovery", label: "Order Recovery", labelBn: "অর্ডার রিকভারি", icon: ic(ShoppingCart), grad: "from-orange-500 to-amber-500" },
      { to: "/admin/activity-log", label: "Activity Log", labelBn: "অ্যাক্টিভিটি লগ", icon: ic(ClipboardList), grad: "from-amber-500 to-orange-500" },
      { to: "/admin/ai-command", label: "AI Command Center", labelBn: "AI কমান্ড সেন্টার", icon: ic(Sparkles), grad: "from-orange-500 to-red-600" },
    ],
  },
];

export const ALL_ADMIN_PAGES = ADMIN_MENU.flatMap((g) => g.items);

export function findAdminPage(pathname: string): AdminMenuItem | undefined {
  return ALL_ADMIN_PAGES.find((p) => p.to === pathname);
}
