import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/email-dashboard")({
  component: EmailDashboardPage,
  head: () => ({ meta: [{ title: "Email Dashboard — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function EmailDashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Email Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">ইমেইল ক্যাম্পেইন পারফরম্যান্স এবং অ্যানালিটিক্স দেখুন</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
        <p className="text-slate-500">ইমেইল ড্যাশবোর্ড মডিউল শীঘ্রই আসছে।</p>
      </div>
    </div>
  );
}
