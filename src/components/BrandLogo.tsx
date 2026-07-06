import accessNowLogo from "@/assets/logo-gold-a.webp";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, {
  badge: string;
  word: string;
  tag: string;
  gap: string;
  dot: string;
  tagMax: string;
}> = {
  sm: {
    badge: "w-9 h-9",
    word: "text-[15px]",
    tag: "text-[8px]",
    gap: "gap-2",
    dot: "w-[3px] h-[3px]",
    tagMax: "max-w-[140px]",
  },
  md: {
    badge: "w-12 h-12",
    word: "text-[20px]",
    tag: "text-[9.5px]",
    gap: "gap-2.5",
    dot: "w-1 h-1",
    tagMax: "max-w-[180px]",
  },
  lg: {
    badge: "w-16 h-16",
    word: "text-[28px]",
    tag: "text-[10.5px]",
    gap: "gap-3",
    dot: "w-1 h-1",
    tagMax: "max-w-[210px]",
  },
};

interface BrandLogoProps {
  size?: Size;
  /** Color of the FAST · SECURE · RELIABLE tagline. Defaults to slate for light backgrounds. */
  tagClassName?: string;
  className?: string;
  /** Hide the wordmark, showing only the round badge. */
  iconOnly?: boolean;
}

/**
 * Canonical brand mark used across SiteHeader, SiteFooter, AuthPage, Admin
 * sidebar, and any other in-app surface. Keep the visual language identical
 * to what appears in the email / invoice header so the brand feels the same
 * wherever a customer sees it.
 */
export function BrandLogo({
  size = "md",
  tagClassName = "text-slate-500",
  className = "",
  iconOnly = false,
}: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`} style={{ fontFamily: "var(--font-heading, inherit)" }}>
      {/* Round premium badge */}
      <span className="relative shrink-0">
        <span
          aria-hidden
          className="absolute -inset-[2px] rounded-full opacity-90"
          style={{
            background: "conic-gradient(from 0deg, #2f6dff, #1fc796, #f59e0b, #2f6dff)",
            filter: "blur(0.5px)",
          }}
        />
        <span
          className={`relative grid place-items-center ${s.badge} rounded-full overflow-hidden ring-1 ring-white/40 shadow-[0_8px_24px_-6px_rgba(15,23,42,0.35)]`}
          style={{ background: "#ffffff" }}
        >
          <span className="pointer-events-none absolute inset-x-1 top-0.5 h-3 rounded-full bg-white/60 blur-[3px]" />
          <img
            src={accessNowLogo}
            alt="AccessNow BD"
            draggable={false}
            className="relative w-[145%] h-[145%] object-contain -translate-y-[6%]"
          />
        </span>
      </span>

      {!iconOnly && (
        <span className="leading-[1.05] min-w-0">
          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span
              className={`${s.word} font-extrabold tracking-normal bg-clip-text text-transparent`}
              style={{ backgroundImage: "linear-gradient(180deg, #1e3fb8 0%, #1d4ed8 55%, #0f2773 100%)" }}
            >
              Access
            </span>
            <span
              className={`${s.word} font-extrabold tracking-normal bg-clip-text text-transparent`}
              style={{ backgroundImage: "linear-gradient(180deg, #6ce4b8 0%, #1fc796 55%, #0e9472 100%)" }}
            >
              Now
            </span>
            <span
              className={`${s.word} font-extrabold tracking-normal bg-clip-text text-transparent`}
              style={{ backgroundImage: "linear-gradient(180deg, #ffd86b 0%, #f59e0b 55%, #c2780a 100%)" }}
            >
              BD
            </span>
          </span>
          <span className={`mt-1 flex w-full ${s.tagMax} items-center justify-between gap-2`}>
            <span className={`${s.tag} uppercase tracking-[0.22em] font-bold ${tagClassName}`}>Fast</span>
            <span className={`${s.dot} rounded-full bg-[#2f6dff] shadow-[0_0_6px_rgba(47,109,255,0.7)]`} />
            <span className={`${s.tag} uppercase tracking-[0.22em] font-bold ${tagClassName}`}>Secure</span>
            <span className={`${s.dot} rounded-full bg-[#1fc796] shadow-[0_0_6px_rgba(31,199,150,0.7)]`} />
            <span className={`${s.tag} uppercase tracking-[0.22em] font-bold ${tagClassName}`}>Reliable</span>
          </span>
        </span>
      )}
    </span>
  );
}

export default BrandLogo;
