import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/newsletter")({
  component: NewsletterPage,
  head: () => ({ meta: [{ title: "Newsletter — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function NewsletterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Newsletter</h1>
        <p className="text-sm text-slate-500 mt-1">নিউজলেটার সাবস্ক্রাইবার এবং ক্যাম্পেইন ম্যানেজ করুন</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
        <p className="text-slate-500">নিউজলেটার মডিউল শীঘ্রই আসছে।</p>
      </div>
    </div>
  );
}
