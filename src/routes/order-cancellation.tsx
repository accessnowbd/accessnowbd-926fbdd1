import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/order-cancellation")({
  component: OrderCancellationPage,
  head: () => ({
    meta: [
      { title: "Order & Cancellation Policy — AccessNow BD" },
      { name: "description", content: "How to cancel your order and our cancellation policy." },
      { property: "og:title", content: "Order & Cancellation — AccessNow BD" },
      { property: "og:description", content: "Order cancellation rules and procedures." },
    ],
  }),
});

function OrderCancellationPage() {
  return (
    <PolicyPage
      title="Order & Cancellation Policy"
      subtitle="অর্ডার ক্যান্সেল করার নিয়মাবলী।"
    >
      <h2>কখন ক্যান্সেল করা যাবে</h2>
      <ul>
        <li>ডেলিভারি সম্পন্ন হওয়ার আগে — ফুল রিফান্ড।</li>
        <li>ডেলিভারির পর — সমস্যা থাকলে ওয়ারেন্টি পলিসি প্রযোজ্য।</li>
      </ul>

      <h2>ক্যান্সেল কীভাবে করবেন</h2>
      <ul>
        <li>WhatsApp-এ মেসেজ দিন: +880 1580-607614</li>
        <li>অর্ডার আইডি উল্লেখ করুন।</li>
        <li>ক্যান্সেলের কারণ জানান।</li>
      </ul>

      <h2>রিফান্ড সময়</h2>
      <p>ক্যান্সেল কনফার্ম হওয়ার পর ২৪–৭২ ঘণ্টার মধ্যে টাকা ফেরত যাবে।</p>
    </PolicyPage>
  );
}
