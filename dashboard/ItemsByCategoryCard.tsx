import { Card } from "@/components/dashboard/Card";
import { DonutChart } from "@/components/dashboard/charts/DonutChart";
import { SampleDataBadge } from "@/components/dashboard/SampleDataBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { ItemsByCategory } from "../api/dashboard-mock";
import { formatCount } from "../utils/format-inr";

// Setu's chart palette, in order (values defined in app/globals.css).
const SLICE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-5)", "var(--chart-6)"];

/**
 * Setu's "Controls effective by framework" card, carrying items instead:
 * donut + per-category list (dot, label, (count), share %, status badge), then
 * the bordered "Top risks"-style sub-section as "Top-selling items". Every
 * figure, share and tone comes from the data layer; nothing is derived here.
 */
export function ItemsByCategoryCard({ data, className }: { data: ItemsByCategory; className?: string }) {
  const slices = data.categories.map((c, i) => ({
    label: c.label,
    value: c.value,
    color: SLICE_COLORS[i % SLICE_COLORS.length] ?? "var(--chart-1)",
  }));

  return (
    <Card
      title="Items by category"
      description="Top 5 · number of items"
      className={className}
      action={data.isSample ? <SampleDataBadge /> : undefined}
    >
      <div className="flex flex-col items-center gap-[var(--space-xs)] screen-sm:flex-row screen-sm:items-center">
        <div className="flex w-full justify-center screen-sm:w-auto screen-sm:flex-1">
          <DonutChart data={slices} size={92} centerLabel="items" legend={false} />
        </div>
        <ul className="flex w-full flex-col gap-1.5 screen-sm:flex-1">
          {data.categories.map((c, i) => (
            <li key={c.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-[var(--role-text)]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slices[i]?.color }} />
                {c.label}
                <span className="text-xs text-[var(--text-muted)]">({formatCount(c.value)})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-[var(--text-secondary)]">{c.sharePct}%</span>
                <StatusBadge status={c.status} label={c.statusLabel} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-[var(--space-xs)] border-t border-[var(--divider)] pt-[var(--space-xs)]">
        <h3 className="mb-[var(--space-xs)] text-sm font-semibold text-[var(--text-heading)]">Top-selling items</h3>
        <ul className="flex flex-col gap-1">
          {data.topSellingItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm text-[var(--text-secondary)]">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-[var(--role-text)]"> &middot; {item.category}</span>
              </p>
              <StatusBadge status={item.status} label={`${formatCount(item.unitsSold)} sold`} />
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
