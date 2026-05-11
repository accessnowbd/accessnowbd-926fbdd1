import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Construction, Sparkles, ArrowLeft } from "lucide-react";
import { findAdminPage, ADMIN_MENU } from "@/lib/admin-menu";

export const Route = createFileRoute("/admin/$page")({
  component: AdminFeaturePage,
});

function AdminFeaturePage() {
  const { page } = useParams({ from: "/admin/$page" });
  const item = findAdminPage(`/admin/${page}`);
  const group = ADMIN_MENU.find((g) => g.items.some((i) => i.to === `/admin/${page}`));

  if (!item) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 grid place-items-center text-slate-400 mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
        <p className="text-sm text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/admin" className="mt-5 inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.grad} grid place-items-center text-white shadow-md shrink-0`}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{group?.title}</div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">{item.label}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and configure {item.label.toLowerCase()} for your store.
            </p>
          </div>
        </div>
      </div>

      {/* Coming-soon style content area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-white shadow-lg mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{item.label} module</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          এই module এর জন্য basic structure তৈরি হয়েছে। নির্দিষ্ট feature গুলো (CRUD, settings, integration) যোগ করতে আমাকে বলো — আমি একে একে full functional করে দেব।
        </p>
        <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {["Configure", "View data", "Settings"].map((t) => (
            <div key={t} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
              <div className="text-xs font-bold text-slate-500 uppercase">{t}</div>
              <div className="text-xs text-slate-500 mt-1">Coming soon</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sibling navigation */}
      {group && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">More in {group.title}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {group.items.filter((i) => i.to !== item.to).slice(0, 6).map((i) => (
              <Link key={i.to} to={i.to} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                <span className={`w-8 h-8 rounded-full bg-gradient-to-br ${i.grad} grid place-items-center text-white shrink-0`}>
                  {i.icon}
                </span>
                <span className="text-sm font-medium text-slate-700 truncate">{i.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
