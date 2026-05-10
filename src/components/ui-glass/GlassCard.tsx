import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "strong" | "soft";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ tone = "strong", className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        tone === "strong" ? "glass-strong" : "glass-soft",
        "rounded-2xl p-6",
        className,
      )}
      {...rest}
    />
  ),
);
GlassCard.displayName = "GlassCard";
