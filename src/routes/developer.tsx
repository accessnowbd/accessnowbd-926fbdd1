import { createFileRoute } from "@tanstack/react-router";
import {
  Globe,
  Code2,
  Palette,
  Megaphone,
  ShieldCheck,
  Clock,
  Users,
  Award,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Rocket,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/developer")({
  component: DeveloperPage,
  head: () => ({
    meta: [
      { title: "Developer — Shahed IT | AccessNow BD" },
      {
        name: "description",
        content:
          "AccessNow BD is designed and developed by Shahed IT — a trusted Bangladeshi digital agency since 2014, offering web development, graphic design and digital marketing.",
      },
      { property: "og:title", content: "Meet the Developer — Shahed IT" },
      {
        property: "og:description",
        content:
          "The team behind AccessNow BD: Shahed IT, a premium Bangladeshi IT agency with 10+ years of experience and 1000+ projects delivered.",
      },
    ],
  }),
});

const STATS = [
  { icon: Users, label: "সন্তুষ্ট গ্রাহক", value: "500+" },
  { icon: Award, label: "সম্পন্ন প্রজেক্ট", value: "1000+" },
  { icon: Clock, label: "বছরের অভিজ্ঞতা", value: "10+" },
  { icon: Globe, label: "দেশে সার্ভিস", value: "20+" },
];

const SERVICES = [
  {
    icon: Code2,
    title: "Web Development",
    desc: "Business website, e-commerce, WordPress এবং কাস্টম ওয়েব অ্যাপ্লিকেশন — যা দ্রুত, নিরাপদ ও SEO-ফ্রেন্ডলি।",
  },
  {
    icon: Palette,
    title: "Graphics Design",
    desc: "Logo, branding, social media creatives এবং video editing — আপনার ব্র্যান্ডকে professional look দেয়।",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    desc: "Facebook Ads, Google Ads, SEO ও content marketing — যা আপনার ব্যবসাকে এগিয়ে নিয়ে যায়।",
  },
  {
    icon: ShieldCheck,
    title: "Website Maintenance",
    desc: "Speed optimization, security এবং regular backup — আপনার সাইট সবসময় চালু ও নিরাপদ থাকবে।",
  },
];

const VALUES = [
  "100% স্বচ্ছ লেনদেন নিশ্চিত করা হয়",
  "দ্রুত ও সময়মতো ডেলিভারি",
  "গ্রাহক সন্তুষ্টি সর্বোচ্চ অগ্রাধিকার",
  "নিরাপদ ও নির্ভরযোগ্য সার্ভিস প্রদান",
  "সাশ্রয়ী মূল্যে মানসম্পন্ন ডিজিটাল সেবা",
  "24/7 গ্রাহক সহায়তা ও সাপোর্ট",
];

function DeveloperPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        {/* Hero */}
        <article>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Developer Spotlight
          </div>

          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
            এই ওয়েবসাইটটি ডিজাইন ও ডেভেলপ করেছে{" "}
            <span className="bg-gradient-to-r from-primary to-aqua bg-clip-text text-transparent">
              Shahed IT
            </span>
          </h1>

          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            প্রকাশিত: 2026 • লেখক: AccessNow BD Team • পড়ার সময়: ~4 মিনিট
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-base leading-relaxed text-foreground/90 md:text-lg">
              <strong>AccessNow BD</strong> ওয়েবসাইটটির সম্পূর্ণ ডিজাইন,
              ডেভেলপমেন্ট ও রক্ষণাবেক্ষণের দায়িত্বে রয়েছে{" "}
              <strong>Shahed IT</strong> — বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম
              আইটি এজেন্সি, যারা 2014 সাল থেকে দেশি-বিদেশি গ্রাহকদের জন্য
              উচ্চমানের ডিজিটাল সল্যুশন তৈরি করে আসছে।
            </p>
          </div>

          {/* Stats */}
          <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <div className="text-2xl font-extrabold">{value}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </section>

          {/* Who they are */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              Shahed IT — কারা তারা?
            </h2>
            <p className="mt-4 leading-relaxed text-foreground/85">
              Shahed IT একটি বিশ্বস্ত ডিজিটাল সার্ভিস প্রদানকারী প্রতিষ্ঠান।
              তারা বিভিন্ন ধরনের আইটি সেবা, ডিজিটাল সাবস্ক্রিপশন, সফটওয়্যার
              সল্যুশন এবং অনলাইন সার্ভিস প্রদান করে। তাদের লক্ষ্য হলো
              গ্রাহকদের নিরাপদ, দ্রুত এবং সাশ্রয়ী মূল্যে ডিজিটাল সেবা প্রদান
              করা — এবং AccessNow BD সেই দর্শনেরই বাস্তব রূপ।
            </p>
            <p className="mt-4 leading-relaxed text-foreground/85">
              10 বছরের অধিক অভিজ্ঞতা, 1000+ সফল প্রজেক্ট এবং 20+ দেশে সেবা
              প্রদানের ট্র্যাক রেকর্ড নিয়ে Shahed IT দাঁড়িয়ে আছে বাংলাদেশের
              অগ্রণী আইটি এজেন্সিগুলোর কাতারে।
            </p>
          </section>

          {/* Services */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              তাদের সেবাসমূহ
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {SERVICES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Values */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              কেন Shahed IT?
            </h2>
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {VALUES.map((v) => (
                <li
                  key={v}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed">{v}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Project story */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold md:text-3xl">
              AccessNow BD প্রজেক্ট সম্পর্কে
            </h2>
            <p className="mt-4 leading-relaxed text-foreground/85">
              AccessNow BD একটি আধুনিক ডিজিটাল সাবস্ক্রিপশন ও সার্ভিস প্ল্যাটফর্ম,
              যেখানে গ্রাহকরা সহজে premium subscriptions, software এবং digital
              products কিনতে পারেন। এই প্ল্যাটফর্মের পুরো UI/UX, frontend,
              backend, payment integration এবং admin panel — সবকিছুই Shahed IT
              টিমের নিজস্ব নকশা ও কোডিংয়ে তৈরি।
            </p>
            <p className="mt-4 leading-relaxed text-foreground/85">
              মোবাইল-ফার্স্ট রেসপনসিভ ডিজাইন, দ্রুত লোডিং, নিরাপদ পেমেন্ট ফ্লো
              এবং 24/7 সাপোর্ট সিস্টেম — প্রতিটি ফিচারই গ্রাহকের অভিজ্ঞতাকে
              সর্বোচ্চ গুরুত্ব দিয়ে তৈরি করা হয়েছে।
            </p>
          </section>

          {/* CTA */}
          <section className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-aqua/10 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold md:text-2xl">
                আপনারও কি একটি ওয়েবসাইট দরকার?
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85 md:text-base">
              আপনার ব্যবসার জন্য একটি প্রিমিয়াম ওয়েবসাইট, ই-কমার্স স্টোর কিংবা
              কাস্টম সফটওয়্যার সল্যুশন তৈরি করতে চাইলে আজই Shahed IT-এর সাথে
              যোগাযোগ করুন।
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://shahedit.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Visit Shahed IT
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://shahedit.com/get-quote"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold transition hover:border-primary/40"
              >
                Get a Quote
              </a>
            </div>
          </section>

          <p className="mt-12 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} AccessNow BD · Crafted with care by
            Shahed IT
          </p>
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}
