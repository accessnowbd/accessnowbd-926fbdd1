import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

/**
 * Unified search input — clean, flat design (no gradient ring).
 * Used site-wide (public + admin).
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
  const btnSizes: Record<Size, string> = { sm: "h-7 px-3", md: "h-8 px-3.5", lg: "h-9 px-4" };
  const padLeft: Record<Size, string> = { sm: "pl-9", md: "pl-10", lg: "pl-11" };
  const iconLeft: Record<Size, string> = { sm: "left-3", md: "left-3.5", lg: "left-4" };
  const textSizes: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      role="search"
      className={cn("relative w-full", className)}
    >
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
          iconLeft[size],
          iconSizes[size],
        )}
        strokeWidth={2}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring",
          "transition-colors",
          heights[size],
          padLeft[size],
          showSubmit ? "pr-24" : "pr-3",
          textSizes[size],
          inputClassName,
        )}
      />
      {showSubmit && (
        <button
          type="submit"
          aria-label="Submit search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 right-1.5 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition font-medium",
            btnSizes[size],
            textSizes[size],
          )}
        >
          Search
        </button>
      )}
    </form>
  );
}

/**
 * Trigger button — flat search-shaped button that opens the command palette.
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
  const padLeft: Record<Size, string> = { sm: "pl-9", md: "pl-10", lg: "pl-11" };
  const iconLeft: Record<Size, string> = { sm: "left-3", md: "left-3.5", lg: "left-4" };
  const textSizes: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };
  const iconSizes: Record<Size, string> = { sm: "w-4 h-4", md: "w-4 h-4", lg: "w-5 h-5" };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open search"
      className={cn(
        "relative w-full rounded-md border border-input bg-background text-left",
        "hover:border-ring/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-colors",
        heights[size],
        className,
      )}
    >
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          iconLeft[size],
          iconSizes[size],
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          "block truncate text-muted-foreground pr-14",
          padLeft[size],
          textSizes[size],
        )}
      >
        {placeholder}
      </span>
      {showShortcut && (
        <kbd className="hidden lg:inline-flex absolute top-1/2 -translate-y-1/2 right-2 items-center gap-0.5 h-6 px-1.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
          <span className="opacity-70">⌘</span>K
        </kbd>
      )}
    </button>
  );
}
