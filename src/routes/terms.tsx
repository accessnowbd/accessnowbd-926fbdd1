import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms & Conditions — AccessNow BD" },
      { name: "description", content: "Terms of use for purchasing digital subscriptions on AccessNow BD." },
      { property: "og:title", content: "Terms & Conditions — AccessNow BD" },
      { property: "og:description", content: "Read the terms governing your purchase and account use." },
    ],
  }),
});

function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      subtitle="AccessNow BD ব্যবহারের শর্তাবলী।"
    >
      <h2>সেবার ব্যবহার</h2>
      <p>আমাদের সাইট ব্যবহার করে আপনি এই শর্তাবলীতে সম্মতি দিচ্ছেন। সকল ডিজিটাল প্রোডাক্ট ব্যক্তিগত ব্যবহারের জন্য — পুনঃবিক্রয় নিষিদ্ধ।</p>

      <h2>অ্যাকাউন্ট দায়িত্ব</h2>
      <ul>
        <li>লগইন তথ্য গোপন রাখুন।</li>
        <li>শেয়ার্ড অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করবেন না।</li>
        <li>সঠিক তথ্য দিয়ে অর্ডার করুন।</li>
      </ul>

      <h2>মূল্য ও পেমেন্ট</h2>
      <p>সকল মূল্য বাংলাদেশী টাকায়। অর্ডার কনফার্ম হবে পেমেন্ট সম্পন্ন হওয়ার পরে।</p>

      <h2>দায়বদ্ধতা সীমা</h2>
      <p>তৃতীয় পক্ষের সার্ভিস (যেমন Netflix, Spotify) এর নীতি পরিবর্তনের জন্য আমরা দায়ী নই, তবে আমাদের ওয়ারেন্টি সর্বদা সক্রিয়।</p>
    </PolicyPage>
  );
}
