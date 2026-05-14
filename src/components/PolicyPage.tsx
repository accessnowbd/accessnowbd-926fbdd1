import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";

export function PolicyPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <header className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent"
            style={{ backgroundImage: "var(--gradient-aurora)" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-white/70 leading-7">{subtitle}</p>
          ) : null}
        </header>
        <article className="space-y-6 rounded-3xl border border-[var(--glass-border)] bg-white/[0.04] p-6 md:p-8 text-[15px] leading-8 text-white/82 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-aqua [&_a]:underline">
          {children}
        </article>
      </div>
      <SiteFooter />
    </div>
  );
}
