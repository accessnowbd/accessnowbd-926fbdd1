import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Mail, Clock, MapPin, Send, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — AccessNow BD" },
      { name: "description", content: "Reach AccessNow BD via WhatsApp, email, or the contact form. Office hours 11 AM – 11 PM." },
      { property: "og:title", content: "Contact AccessNow BD" },
      { property: "og:description", content: "We're here to help — WhatsApp, email, or send us a message." },
    ],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative bg-[#07071a] text-white overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/35 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[var(--color-aqua)]/35 blur-[140px]" />
        <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-14 md:py-20">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800 }}>
            যোগাযোগ করুন
          </h1>
          <p className="mt-3 text-white/75 max-w-xl">যেকোনো প্রশ্ন বা সাপোর্টের জন্য — আমরা আছি।</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 md:px-10 py-12 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <InfoCard icon={MessageCircle} title="WhatsApp" desc="দ্রুততম রেসপন্স — ১৫ মিনিটের মধ্যে।"
            action={<a href="https://wa.me/8801000000000" className="text-primary font-bold hover:underline">+880 1000-000000</a>} />
          <InfoCard icon={Mail} title="Email" desc="বিস্তারিত প্রশ্নের জন্য।"
            action={<a href="mailto:hello@accessnowbd.com" className="text-primary font-bold hover:underline">hello@accessnowbd.com</a>} />
          <InfoCard icon={Clock} title="Office Hours" desc="প্রতিদিন খোলা।"
            action={<span className="font-bold">11 AM – 11 PM</span>} />
          <InfoCard icon={MapPin} title="Location" desc="Online-first business।"
            action={<span className="font-bold">Dhaka, Bangladesh</span>} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
          className="glass-strong rounded-3xl p-6 md:p-8 space-y-4"
        >
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto" />
              <h3 className="mt-3 text-lg font-bold">মেসেজ পাঠানো হয়েছে!</h3>
              <p className="text-sm text-muted-foreground mt-1">আমরা শীঘ্রই উত্তর দেব।</p>
              <button onClick={() => setSent(false)} className="mt-5 h-10 px-5 rounded-full bg-aurora text-white text-sm font-bold">
                Send another
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-extrabold">Send us a message</h2>
              <Field label="আপনার নাম">
                <input required className="w-full h-11 px-4 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-primary/30" />
              </Field>
              <Field label="ইমেইল">
                <input required type="email" className="w-full h-11 px-4 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-primary/30" />
              </Field>
              <Field label="বিষয়">
                <input className="w-full h-11 px-4 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-primary/30" />
              </Field>
              <Field label="মেসেজ">
                <textarea required rows={5} className="w-full px-4 py-3 rounded-xl bg-white border border-border outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </Field>
              <button className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full bg-aurora text-white font-bold glow-violet hover:scale-[1.01] transition">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </>
          )}
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc, action }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4">
      <div className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-aurora text-white glow-violet"><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-base font-bold tracking-tight">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
        <div className="mt-2 text-sm">{action}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
