import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — AccessNow BD" },
      { name: "description", content: "30-day warranty, replacement and refund policy for digital subscriptions." },
      { property: "og:title", content: "Refund & Return Policy — AccessNow BD" },
      { property: "og:description", content: "Our hassle-free refund and replacement policy." },
    ],
  }),
});

function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund & Return Policy"
      subtitle="৩০ দিনের ফুল ওয়ারেন্টি — রিপ্লেসমেন্ট অথবা সম্পূর্ণ টাকা ফেরত।"
    >
      <h2>ওয়ারেন্টি কভারেজ</h2>
      <ul>
        <li>অ্যাকাউন্ট কাজ না করলে — তাৎক্ষণিক রিপ্লেসমেন্ট।</li>
        <li>রিপ্লেসমেন্ট সম্ভব না হলে — সম্পূর্ণ টাকা ফেরত।</li>
        <li>৩০ দিনের মধ্যে যেকোনো সমস্যায় কভারেজ।</li>
      </ul>

      <h2>রিফান্ড পাওয়ার শর্ত</h2>
      <ul>
        <li>অ্যাকাউন্টের পাসওয়ার্ড/ইমেইল পরিবর্তন করেননি।</li>
        <li>সঠিক ব্যবহারবিধি মেনে চলেছেন।</li>
        <li>৩০ দিনের মধ্যে অভিযোগ জানিয়েছেন।</li>
      </ul>

      <h2>রিফান্ড প্রক্রিয়া</h2>
      <p>WhatsApp বা ইমেইলে অভিযোগ জানান। ভেরিফিকেশনের পর ২৪–৭২ ঘণ্টার মধ্যে আপনার মূল পেমেন্ট মেথডে টাকা ফেরত যাবে।</p>
    </PolicyPage>
  );
}
