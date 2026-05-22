import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

/**
 * Unified search input — "Glow gradient ring" design.
 * Used site-wide (public + admin). Mirrors the trigger button style in
 * SiteHeader and the admin top/side bars.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "প্রোডাক্ট সার্চ করুন...",
  size = "md",
  autoFocus = false,
  className,
  inputClassName,
  ariaLabel = "Search",
  showSubmit = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  size?: Size;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  showSubmit?: boolean;
}) {
  const heights: Record<Size, string> = { sm: "h-9", md: "h-11", lg: "h-12" };
  const iconSizes: Record<Size, string> = { sm: "w-4 h-4", md: "w-4 h-4", lg: "w-5 h-5" };
  const btnSizes: Record<Size, string> = { sm: "w-7 h-7", md: "w-8 h-8", lg: "w-9 h-9" };
  const padLeft: Record<Size, string> = { sm: "pl-3", md: "pl-4", lg: "pl-5" };
  const textSizes: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };

  return (
    <div className={cn("relative group", className)}>
      {/* Ambient outer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#22d3ee] opacity-15 blur-xl transition-opacity duration-500 group-hover:opacity-30 group-focus-within:opacity-40"
      />
      {/* Gradient ring */}
      <div className="relative rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] p-[1.5px] shadow-[0_10px_30px_-15px_rgba(99,102,241,0.45)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(value);
          }}
          role="search"
          className={cn(
            "flex items-center gap-2 rounded-full pr-1.5 transition-colors !bg-white",
            padLeft[size],
            heights[size],
          )}
        >
          <Search className={cn("text-indigo-500 shrink-0", iconSizes[size])} strokeWidth={2.5} />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            className={cn(
              "flex-1 min-w-0 bg-transparent border-0 outline-none placeholder:text-slate-400 text-slate-800 font-medium",
              "focus:outline-none focus-visible:outline-none focus:ring-0",
              textSizes[size],
              inputClassName,
            )}
            style={{ outline: "none" }}
            autoComplete="off"
            spellCheck={false}
          />
          {showSubmit && (
            <button
              type="submit"
              aria-label="Submit search"
              className={cn(
                "grid place-items-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white shadow-[0_4px_12px_-4px_rgba(124,58,237,0.55)] hover:brightness-110 active:scale-95 transition shrink-0",
                btnSizes[size],
              )}
            >
              <Search className={iconSizes[size]} strokeWidth={2.5} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * Trigger button — same gradient ring, but rendered as a passive button that
 * opens a command-palette dialog (e.g. SiteHeader / Admin layout).
 */
export function SearchTrigger({
  onClick,
  placeholder = "প্রোডাক্ট সার্চ করুন...",
  className,
  size = "md",
  showShortcut = true,
}: {
  onClick: () => void;
  placeholder?: string;
  className?: string;
  size?: Size;
  showShortcut?: boolean;
}) {
  const heights: Record<Size, string> = { sm: "h-9", md: "h-11", lg: "h-12" };
  const padLeft: Record<Size, string> = { sm: "pl-3", md: "pl-4", lg: "pl-5" };
  const textSizes: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };
  const iconSizes: Record<Size, string> = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" };

  return (
    <div className={cn("relative group", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 rounded-full bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#22d3ee] opacity-15 blur-xl transition-opacity duration-500 group-hover:opacity-30"
      />
      <div className="relative rounded-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] p-[1.5px] shadow-[0_10px_30px_-15px_rgba(99,102,241,0.45)]">
        <button
          type="button"
          onClick={onClick}
          aria-label="Open search"
          className={cn(
            "w-full flex items-center gap-2 rounded-full pr-1.5 text-left transition-colors !bg-white hover:!bg-slate-50",
            padLeft[size],
            heights[size],
          )}
        >
          <Search className={cn("text-indigo-500 shrink-0", iconSizes[size])} strokeWidth={2.5} />
          <span className={cn("flex-1 truncate text-slate-400 font-medium", textSizes[size])}>
            {placeholder}
          </span>
          {showShortcut && (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 h-6 px-1.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200/70">
              <span className="text-slate-400">⌘</span>K
            </kbd>
          )}
        </button>
      </div>
    </div>
  );
}
