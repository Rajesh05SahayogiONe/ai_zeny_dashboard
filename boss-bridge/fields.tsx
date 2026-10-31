import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD =
  "flex w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

/** Native select styled like the shared Input. */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(FIELD, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, "min-h-20 resize-y py-2", className)} {...props} />;
}

export type StepState = "done" | "current" | "locked";

const STEP_BADGE: Record<StepState | "plain", string> = {
  plain: "border-[var(--divider)] text-[var(--text-secondary)]",
  done: "border-[var(--status-healthy-fg)]/40 bg-[var(--status-healthy-bg)] text-[var(--status-healthy-fg)]",
  current: "border-transparent bg-[var(--accent-solid)] text-white",
  locked: "border-[var(--divider)] text-[var(--text-muted)]",
};

/**
 * Numbered how-to list (circled number + title + helper line), reused across the Connect pages.
 * A step may carry a `state` (done / current / locked) and an `action` shown under its text, which
 * turns the list into a walk-through of a real flow.
 */
export function Steps({ steps }: { steps: { title: string; text: string; state?: StepState; action?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step.title} className={cn("flex gap-3", step.state === "locked" && "opacity-70")}>
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", STEP_BADGE[step.state ?? "plain"])}>
            {step.state === "done" ? <Check size={13} aria-label="Done" /> : index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-heading)]">{step.title}</p>
            <p className="text-xs text-[var(--text-muted)]">{step.text}</p>
            {step.action && <div className="mt-2">{step.action}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Label/value pairs in a responsive grid. */
export function InfoGrid({ items, className }: { items: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-3 screen-sm:grid-cols-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-[var(--text-muted)]">{item.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-semibold text-[var(--text-heading)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Two-column row used in summary cards: muted label left, value right. */
export function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--divider)] py-1.5 text-sm last:border-b-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="min-w-0 truncate font-medium text-[var(--text-heading)]">{children}</span>
    </div>
  );
}

/** A single progress bar (term elapsed, API quota). */
export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div className="h-full rounded-full bg-[var(--accent-solid)]" style={{ width: `${Math.max(pct, 2)}%` }} />
    </div>
  );
}
