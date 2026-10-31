"use client";

import { useState } from "react";
import { Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioPill, RadioPillGroup } from "@/components/ui/radio-pill";
import { Card } from "@/components/dashboard/Card";
import { ActivityTable } from "./ActivityTable";
import { PageHeader } from "./PageHeader";
import { previewOnly } from "./preview";
import { SAMPLE_ACTIVITY, type ActivityRow } from "./sample";

const FILTERS: ("All" | ActivityRow["status"])[] = ["All", "Completed", "Failed", "Timed out"];

export function ActivityView() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows = filter === "All" ? SAMPLE_ACTIVITY : SAMPLE_ACTIVITY.filter((row) => row.status === filter);

  return (
    <>
      <PageHeader
        sample
        title="Activity"
        description="What your API tokens asked your PC for, and how each request ended."
        action={<Button variant="outline" onClick={() => previewOnly("Refreshing")}><RefreshCw size={16} />Refresh</Button>}
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <RadioPillGroup>
              {FILTERS.map((value) => (
                <RadioPill key={value} name="activity-status" value={value} label={value} checked={filter === value} onChange={() => setFilter(value)} />
              ))}
            </RadioPillGroup>
            <p className="text-xs text-[var(--text-muted)]">{rows.length} request{rows.length === 1 ? "" : "s"}</p>
          </div>
          <ActivityTable rows={rows} pageSize={10} />
        </Card>

        <p className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
          <Lock size={13} className="mt-0.5 shrink-0" />
          Boss Bridge never stores the data a request returned. This history records what was asked for and how it ended, which is why a completed request cannot be replayed from here.
        </p>
      </div>
    </>
  );
}
