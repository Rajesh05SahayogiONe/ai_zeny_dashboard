"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/dashboard/Card";
import { AreaTrendChart } from "@/components/dashboard/charts/AreaTrendChart";
import { SampleDataBadge } from "@/components/dashboard/SampleDataBadge";
import { REVENUE_RANGES, type RevenueRange, type RevenueVsExpense } from "../api/dashboard-mock";
import { formatInrCompact, formatLakh, toLakh } from "../utils/format-inr";

/**
 * Setu's "Growth" card, carrying revenue instead: a two-series area chart with
 * a segmented range toggle in the card header and a stats row underneath.
 * Which range is showing is the only state; the series and every stat come
 * from the data layer. Client component because of that state (and because
 * the chart's formatter functions cannot cross the server boundary).
 */
export function RevenueVsExpenseCard({ data, className }: { data: RevenueVsExpense; className?: string }) {
  const [range, setRange] = useState<RevenueRange>(data.defaultRange);
  const current = data.ranges[range];

  const series = useMemo(
    () => [
      { key: "revenue", label: "Revenue", color: "var(--chart-1)", data: current.revenue.map(toLakh) },
      { key: "expense", label: "Expense", color: "var(--chart-3)", data: current.expense.map(toLakh) },
    ],
    [current],
  );

  const stats = [
    { label: "Revenue", value: formatInrCompact(current.stats.revenue) },
    { label: "Expense", value: formatInrCompact(current.stats.expense) },
    { label: "Net cash flow", value: formatInrCompact(current.stats.netCashFlow) },
    { label: "Margin", value: `${current.stats.marginPct}%` },
  ];

  return (
    <Card
      title="Revenue vs Expense"
      description="By month · ₹ lakh"
      className={className}
      action={
        <div className="flex items-center gap-2">
          {data.isSample && <SampleDataBadge />}
          <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface-muted)] p-0.5">
            {REVENUE_RANGES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  range === value
                    ? "bg-[var(--surface)] text-[var(--text-heading)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <AreaTrendChart
        className="min-h-0 flex-1"
        heightClassName="h-full min-h-[9.5rem]"
        series={series}
        xLabels={current.months}
        formatValue={formatLakh}
      />
      <dl className="mt-[var(--space-xs)] grid grid-cols-2 gap-[var(--space-sm)] border-t border-[var(--divider)] pt-[var(--space-xs)] screen-sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-[var(--role-text)]">{s.label}</dt>
            <dd className="text-lg font-semibold text-[var(--text-secondary)]">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
