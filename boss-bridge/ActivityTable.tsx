"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge, type StatusLevel } from "@/components/dashboard/StatusBadge";
import { formatDateTime } from "./format";
import type { ActivityRow } from "./sample";

const LEVEL: Record<ActivityRow["status"], StatusLevel> = { Completed: "healthy", Failed: "critical", "Timed out": "warning" };

const COLUMNS: Column<ActivityRow>[] = [
  { key: "at", header: "When", render: (r) => formatDateTime(r.at), sortValue: (r) => r.at },
  { key: "token", header: "Token", render: (r) => r.token, sortValue: (r) => r.token },
  { key: "request", header: "Request", render: (r) => r.request },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={LEVEL[r.status]} label={r.status} />, sortValue: (r) => r.status },
  { key: "duration", header: "Duration", render: (r) => r.duration, className: "text-right" },
];

export function ActivityTable({ rows, pageSize = 8 }: { rows: ActivityRow[]; pageSize?: number }) {
  return (
    <DataTable
      columns={COLUMNS}
      rows={rows}
      getRowKey={(r) => r.id}
      pageSize={pageSize}
      textClassName="text-sm"
      emptyTitle="No API activity yet"
      emptyDescription="Requests appear here once an external system calls Boss Bridge with one of your tokens."
    />
  );
}
