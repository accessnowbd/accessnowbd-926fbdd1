import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — AccessNow BD" },
      { name: "description", content: "How AccessNow BD collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — AccessNow BD" },
      { property: "og:description", content: "Read our privacy practices for orders, payments and account data." },
    ],
  }),
});

function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      subtitle="আপনার তথ্যের নিরাপত্তা আমাদের কাছে সর্বোচ্চ গুরুত্বপূর্ণ।"
    >
      <h2>আমরা কী তথ্য সংগ্রহ করি</h2>
      <ul>
        <li>নাম, ইমেইল, ফোন নম্বর — অর্ডার ও সাপোর্টের জন্য।</li>
        <li>পেমেন্ট তথ্য — শুধুমাত্র লেনদেন প্রক্রিয়ার জন্য, আমরা কার্ড ডিটেইল সংরক্ষণ করি না।</li>
        <li>ব্রাউজিং তথ্য — সাইট অভিজ্ঞতা উন্নত করতে।</li>
      </ul>

      <h2>তথ্য কীভাবে ব্যবহার করি</h2>
      <ul>
        <li>অর্ডার প্রসেস ও ডেলিভারি।</li>
        <li>সাপোর্ট ও ওয়ারেন্টি সেবা।</li>
        <li>প্রোমোশনাল আপডেট (আপনার সম্মতিতে)।</li>
      </ul>

      <h2>তথ্য শেয়ারিং</h2>
      <p>আমরা কখনোই আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না। শুধুমাত্র পেমেন্ট গেটওয়ে ও ডেলিভারি পার্টনারের সাথে প্রয়োজনীয় তথ্য শেয়ার হয়।</p>

      <h2>যোগাযোগ</h2>
      <p>প্রশ্ন থাকলে ইমেইল করুন: support@accessnowbd.com</p>
    </PolicyPage>
  );
}
