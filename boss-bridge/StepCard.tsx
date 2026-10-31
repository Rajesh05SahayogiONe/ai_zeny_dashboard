import type { ReactNode } from "react";
import { StatusBadge, type StatusLevel } from "@/components/dashboard/StatusBadge";
import { SummaryRow } from "./fields";

/**
 * One "Get started" step on the dashboard: icon chip, step label, status pill, a few facts and one action.
 * With `connector`, a node-and-line joins it to the next card (only when the cards sit in one row, where the grid gap is 2rem).
 */
export function StepCard({
  step,
  title,
  icon,
  status,
  statusLabel,
  rows,
  action,
  connector = false,
}: {
  step: string;
  title: string;
  icon: ReactNode;
  status: StatusLevel;
  statusLabel: string;
  rows: { label: string; value: ReactNode }[];
  action: ReactNode;
  connector?: boolean;
}) {
  return (
    <div className="relative flex h-full min-w-0 flex-col gap-3 rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--surface)] p-[var(--card-pad)]" style={{ boxShadow: "var(--card-shadow)" }}>
      {connector && (
        // Spans the 2rem column gap (set on the grid in DashboardView) and sits level with the icon chip.
        <span aria-hidden="true" className="pointer-events-none absolute hidden -translate-y-1/2 items-center @[72rem]:flex" style={{ left: "100%", width: "2rem", top: "calc(var(--card-pad) + 1.125rem)" }}>
          <span className="h-px flex-1 bg-[var(--divider)]" />
          <span className="absolute left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[1.5px] border-[var(--divider)] bg-[var(--surface)]" />
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{step}</p>
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">{title}</h3>
        </div>
      </div>
      <div>
        <StatusBadge status={status} label={statusLabel} />
      </div>
      <div className="flex-1">
        {rows.map((row) => (
          <SummaryRow key={row.label} label={row.label}>
            {row.value}
          </SummaryRow>
        ))}
      </div>
      <div>{action}</div>
    </div>
  );
}
