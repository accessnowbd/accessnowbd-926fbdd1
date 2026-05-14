import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/refund-request")({
  component: RefundRequestPage,
  head: () => ({
    meta: [
      { title: "Refund Request — AccessNow BD" },
      { name: "description", content: "Request a refund for your AccessNow BD order." },
      { property: "og:title", content: "Refund Request — AccessNow BD" },
      { property: "og:description", content: "Submit your refund request quickly." },
    ],
  }),
});

function RefundRequestPage() {
  return (
    <PolicyPage
      title="Refund Request"
      subtitle="রিফান্ড পেতে নিচের যেকোনো একটি উপায়ে যোগাযোগ করুন।"
    >
      <h2>WhatsApp-এ যোগাযোগ (সবচেয়ে দ্রুত)</h2>
      <p>
        <a href="https://wa.me/8801580607614" target="_blank" rel="noreferrer">
          +880 1580-607614
        </a>
      </p>

      <h2>ইমেইল</h2>
      <p>
        <a href="mailto:support@accessnowbd.com">support@accessnowbd.com</a>
      </p>

      <h2>রিকোয়েস্টে যা উল্লেখ করবেন</h2>
      <ul>
        <li>অর্ডার আইডি</li>
        <li>রিফান্ডের কারণ</li>
        <li>আপনার পেমেন্ট মেথড (BKash/Nagad/কার্ড নম্বরের শেষ ৪ ডিজিট)</li>
      </ul>

      <h2>প্রক্রিয়াকাল</h2>
      <p>ভেরিফিকেশনের পর ২৪–৭২ ঘণ্টার মধ্যে আপনার মূল পেমেন্ট মেথডে টাকা ফেরত যাবে।</p>

      <p className="pt-4">
        বিস্তারিত পলিসি দেখুন:{" "}
        <Link to="/refund-policy">Refund & Return Policy</Link>
      </p>
    </PolicyPage>
  );
}
