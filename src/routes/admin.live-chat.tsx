import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/live-chat")({
  component: LiveChatPage,
  head: () => ({ meta: [{ title: "Live Chat — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function LiveChatPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Live Chat</h1>
        <p className="text-sm text-slate-500 mt-1">গ্রাহকদের লাইভ চ্যাট ম্যানেজ করুন</p>
      </div>
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
        <p className="text-slate-500">লাইভ চ্যাট মডিউল শীঘ্রই আসছে।</p>
      </div>
    </div>
  );
}
