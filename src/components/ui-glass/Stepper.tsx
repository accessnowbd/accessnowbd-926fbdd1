import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  label: string;
  bn?: string;
}

interface StepperProps {
  steps: StepperStep[];
  current: number; // 1-indexed
  onStepClick?: (n: number) => void;
}

export function Stepper({ steps, current, onStepClick }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4 w-full" aria-label="Checkout steps">
      {steps.map((step, idx) => {
        const n = idx + 1;
        const status =
          n < current ? "complete" : n === current ? "current" : "upcoming";
        const clickable = onStepClick && n < current;

        return (
          <li key={step.label} className="flex items-center gap-2 sm:gap-4 flex-1">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(n)}
              aria-current={status === "current" ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg",
                clickable && "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "grid place-items-center w-8 h-8 rounded-full text-xs font-bold transition-all shrink-0",
                  status === "complete" &&
                    "bg-aurora text-primary-foreground glow-violet",
                  status === "current" &&
                    "bg-aurora text-primary-foreground glow-aqua ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                  status === "upcoming" &&
                    "glass-soft text-muted-foreground",
                )}
              >
                {status === "complete" ? <Check className="w-4 h-4" /> : n}
              </span>
              <span
                className={cn(
                  "text-xs sm:text-sm font-semibold hidden sm:block",
                  status === "upcoming" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </button>
            {n < steps.length && (
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  n < current ? "bg-aurora" : "bg-[var(--glass-border-soft)]",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
