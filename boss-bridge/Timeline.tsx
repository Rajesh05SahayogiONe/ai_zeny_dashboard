import type { ReactNode } from "react";

export interface TimelineItem { id: string; icon: ReactNode; title: string; detail?: string; meta: string; by?: string }

/** Vertical event feed: icon on a rail, title + detail on the left, time + actor on the right. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item, index) => (
        <li key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--divider)] bg-[var(--surface-muted)] text-[var(--text-secondary)]">
              {item.icon}
            </span>
            {index < items.length - 1 && <span aria-hidden="true" className="w-px flex-1 bg-[var(--divider)]" />}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 pb-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-heading)]">{item.title}</p>
              {item.detail && <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>}
            </div>
            <div className="text-right text-xs text-[var(--text-muted)]">
              <p>{item.meta}</p>
              {item.by && <p>{item.by}</p>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
