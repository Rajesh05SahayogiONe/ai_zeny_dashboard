"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";

/** One audit-log row, already shaped for display on the server (labels
 *  resolved, timestamp formatted there) so the client render and the server
 *  render can never disagree on a timezone or locale. */
export interface RecentActivityRow {
  id: string;
  activity: string;
  by: string;
  /** Display text, formatted on the server. */
  when: string;
  /** ISO timestamp, the sort key for "When". */
  whenIso: string;
}

const COLUMNS: Column<RecentActivityRow>[] = [
  {
    key: "activity",
    header: "Activity",
    render: (r) => <span className="font-medium">{r.activity}</span>,
    sortValue: (r) => r.activity,
  },
  { key: "by", header: "By", render: (r) => r.by, sortValue: (r) => r.by },
  { key: "when", header: "When", render: (r) => r.when, sortValue: (r) => r.whenIso },
];

/** Setu's "Needs Your Decision" table, carrying the tenant's real audit log. */
export function RecentActivityTable({ rows }: { rows: RecentActivityRow[] }) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyTitle="No activity yet"
      emptyDescription="Recent changes in your organization will appear here."
      textClassName="text-sm"
    />
  );
}
