import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

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
}) {
  const heights: Record<Size, string> = { sm: "h-9", md: "h-11", lg: "h-12" };
  const iconSizes: Record<Size, string> = { sm: "w-4 h-4", md: "w-4 h-4", lg: "w-5 h-5" };
  const btnSizes: Record<Size, string> = { sm: "w-7 h-7", md: "w-8 h-8", lg: "w-9 h-9" };
  const padLeft: Record<Size, string> = { sm: "pl-3", md: "pl-4", lg: "pl-5" };
  const textSizes: Record<Size, string> = { sm: "text-xs", md: "text-sm", lg: "text-sm" };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={cn(
        "flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-[0_4px_14px_-8px_rgba(15,23,42,0.18)] focus-within:border-slate-400 focus-within:shadow-[0_8px_20px_-12px_rgba(15,23,42,0.35)] transition pr-1.5",
        padLeft[size],
        heights[size],
        className,
      )}
      role="search"
    >
      <Search className={cn("text-slate-400 shrink-0", iconSizes[size])} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none border-0 placeholder:text-slate-400 text-slate-900",
          "focus:outline-none focus-visible:outline-none focus:ring-0",
          textSizes[size],
          inputClassName,
        )}
        style={{ outline: "none" }}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        aria-label="Submit search"
        className={cn(
          "grid place-items-center rounded-full bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition shrink-0",
          btnSizes[size],
        )}
      >
        <Search className={iconSizes[size]} />
      </button>
    </form>
  );
}
