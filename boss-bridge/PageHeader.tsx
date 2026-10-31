import type { ReactNode } from "react";
import { SampleDataBadge } from "@/components/dashboard/SampleDataBadge";

/** Title row for a Boss Bridge page: h1 + optional status pill, description, and a right-hand action. */
export function PageHeader({
  title,
  description,
  status,
  action,
  sample = false,
}: {
  title: string;
  description?: string;
  status?: ReactNode;
  action?: ReactNode;
  /** The page shows illustrative data from boss-bridge/sample.ts. */
  sample?: boolean;
}) {
  return (
    <div className="mb-[var(--space-lg)] flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[length:var(--font-page-title)] font-semibold leading-tight text-[var(--text-heading)]">{title}</h1>
          {status}
          {sample && <SampleDataBadge />}
        </div>
        {description && <p className="mt-1 max-w-2xl text-[length:var(--font-body)] text-[var(--text-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
