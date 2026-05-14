import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/delivery-info")({
  component: DeliveryInfoPage,
  head: () => ({
    meta: [
      { title: "Delivery Info — AccessNow BD" },
      { name: "description", content: "Digital delivery times and process for AccessNow BD orders." },
      { property: "og:title", content: "Delivery Info — AccessNow BD" },
      { property: "og:description", content: "Fast digital delivery — usually 10-30 minutes." },
    ],
  }),
});

function DeliveryInfoPage() {
  return (
    <PolicyPage
      title="Delivery Information"
      subtitle="দ্রুত ডিজিটাল ডেলিভারি — সাধারণত ১০–৩০ মিনিট।"
    >
      <h2>ডেলিভারি টাইম</h2>
      <ul>
        <li>অফিস আওয়ারে (১১ AM – ১১ PM): ১০–৩০ মিনিট।</li>
        <li>অফিস বন্ধ থাকলে: সর্বোচ্চ ৩ ঘণ্টা।</li>
        <li>ছুটির দিনেও WhatsApp-এ ২৪/৭ সাপোর্ট।</li>
      </ul>

      <h2>ডেলিভারি প্রক্রিয়া</h2>
      <ul>
        <li>পেমেন্ট কনফার্ম হওয়ার পর অ্যাকাউন্ট তথ্য ইমেইল ও WhatsApp-এ পাঠানো হবে।</li>
        <li>"My Orders" পেজ থেকেও দেখতে পারবেন।</li>
        <li>সাইন ইন করার পরে instant access।</li>
      </ul>

      <h2>সমস্যা হলে</h2>
      <p>ডেলিভারিতে দেরি হলে সাথে সাথে WhatsApp-এ যোগাযোগ করুন।</p>
    </PolicyPage>
  );
}
