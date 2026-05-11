import { Link } from "@tanstack/react-router";

type LinkTo =
  | "/"
  | "/products"
  | "/streaming"
  | "/ai-tools"
  | "/education"
  | "/faq"
  | "/contact"
  | "/orders"
  | "/profile"
  | "/auth"
  | "/cart"
  | "/checkout";

const COLUMNS: { title: string; links: { label: string; to: LinkTo }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", to: "/products" },
      { label: "Streaming", to: "/streaming" },
      { label: "AI Tools", to: "/ai-tools" },
      { label: "Education", to: "/education" },
      { label: "Cart", to: "/cart" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Manage Profile", to: "/profile" },
      { label: "Order History", to: "/orders" },
      { label: "Sign In", to: "/auth" },
      { label: "Checkout", to: "/checkout" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact Us", to: "/contact" },
      { label: "Delivery Info", to: "/faq" },
      { label: "Refund & Return", to: "/faq" },
    ],
  },
  {
    title: "About AccessNow BD",
    links: [
      { label: "Why Choose Us", to: "/" },
      { label: "Verified Service", to: "/" },
      { label: "Privacy Policy", to: "/faq" },
      { label: "Terms & Conditions", to: "/faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#0a0a12] text-white/60 text-[12px] leading-[1.5]">
      <div className="mx-auto max-w-[1024px] px-5 py-8">
        {/* ===== Fine-print disclaimer ===== */}
        <div className="space-y-3 pb-6 border-b border-white/[0.08]">
          <p>
            <sup className="text-[10px]">1.</sup> Delivery times for digital
            subscriptions are typically within 5–10 minutes after order
            confirmation. Some products may require manual activation during
            office hours (11 AM – 11 PM).
          </p>
          <p>
            <sup className="text-[10px]">2.</sup> All prices are in BDT and
            include applicable charges. Renewals, refunds, and warranty terms
            are governed by the policies listed below.
          </p>
          <p className="text-white/55">
            অর্ডার সংক্রান্ত যেকোনো সাহায্যের জন্য আমাদের সাপোর্ট টিমের
            সাথে যোগাযোগ করুন — আমরা ২৪/৭ অনলাইনে আছি।
          </p>
        </div>

        {/* ===== Link columns ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 py-8 border-b border-white/[0.08]">
          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-2.5">
              <h4 className="text-[12px] font-semibold text-white tracking-tight">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.to + l.label}>
                    <Link
                      to={l.to}
                      className="text-white/55 hover:text-white hover:underline underline-offset-2 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== More ways to shop / contact prompt ===== */}
        <div className="py-5 border-b border-white/[0.08]">
          <p className="text-white/70">
            More ways to get help:{" "}
            <a
              href="https://wa.me/8801580607614"
              className="text-aqua hover:underline"
            >
              Chat on WhatsApp
            </a>
            ,{" "}
            <a
              href="tel:+8801580607614"
              className="text-aqua hover:underline"
            >
              call +880 1580-607614
            </a>
            , or{" "}
            <a
              href="mailto:support@accessnowbd.com"
              className="text-aqua hover:underline"
            >
              email support
            </a>
            .
          </p>
        </div>

        {/* ===== Bottom bar ===== */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-white/55">
            Copyright © 2026 AccessNow BD. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/faq" className="text-white/55 hover:text-white hover:underline underline-offset-2">
              Privacy Policy
            </Link>
            <span className="text-white/15">|</span>
            <Link to="/faq" className="text-white/55 hover:text-white hover:underline underline-offset-2">
              Terms of Use
            </Link>
            <span className="text-white/15">|</span>
            <Link to="/faq" className="text-white/55 hover:text-white hover:underline underline-offset-2">
              Sales Policy
            </Link>
            <span className="text-white/15">|</span>
            <Link to="/faq" className="text-white/55 hover:text-white hover:underline underline-offset-2">
              Legal
            </Link>
            <span className="text-white/15">|</span>
            <Link to="/sitemap" className="text-white/55 hover:text-white hover:underline underline-offset-2">
              Site Map
            </Link>
          </div>
        </div>

        <div className="pt-4 text-white/40">
          Bangladesh ·{" "}
          <a
            href="https://shahedit.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:underline underline-offset-2"
          >
            Crafted by Shahed IT
          </a>
        </div>
      </div>
    </footer>
  );
}
