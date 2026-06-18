import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/renewal-reminders")({
  component: RenewalRemindersPage,
  head: () => ({ meta: [{ title: "Renewal Reminders — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function RenewalRemindersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Renewal Reminders</h1>
        <p className="text-sm text-slate-500 mt-1">সাবস্ক্রিপশন রিনিউয়াল রিমাইন্ডার ম্যানেজ করুন</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
        <p className="text-slate-500">রিনিউয়াল রিমাইন্ডার মডিউল শীঘ্রই আসছে।</p>
      </div>
    </div>
  );
}
