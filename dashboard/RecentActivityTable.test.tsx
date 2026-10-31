import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecentActivityTable, type RecentActivityRow } from "./RecentActivityTable";

afterEach(() => cleanup());

const ROWS: RecentActivityRow[] = [
  { id: "1", activity: "Role Updated", by: "b@x.com", when: "Oct 5, 2026, 9:00 AM", whenIso: "2026-10-05T09:00:00.000Z" },
  { id: "2", activity: "Employee Created", by: "a@x.com", when: "Oct 6, 2026, 9:00 AM", whenIso: "2026-10-06T09:00:00.000Z" },
  { id: "3", activity: "Leave Approved", by: "System", when: "Oct 4, 2026, 9:00 AM", whenIso: "2026-10-04T09:00:00.000Z" },
];

function activities(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent ?? "");
}

describe("RecentActivityTable", () => {
  it("renders the Activity, By and When columns with the rows as given", () => {
    render(<RecentActivityTable rows={ROWS} />);
    for (const header of ["Activity", "By", "When"]) expect(screen.getByRole("button", { name: header })).toBeInTheDocument();
    expect(activities()).toEqual(["Role Updated", "Employee Created", "Leave Approved"]);
    expect(screen.getByText("Oct 6, 2026, 9:00 AM")).toBeInTheDocument();
  });

  it("sorts by activity name", async () => {
    const user = userEvent.setup();
    render(<RecentActivityTable rows={ROWS} />);
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(activities()).toEqual(["Employee Created", "Leave Approved", "Role Updated"]);
  });

  it("sorts When by the timestamp, not by the display text", async () => {
    const user = userEvent.setup();
    render(<RecentActivityTable rows={ROWS} />);
    await user.click(screen.getByRole("button", { name: "When" }));
    expect(activities()).toEqual(["Leave Approved", "Role Updated", "Employee Created"]);
    await user.click(screen.getByRole("button", { name: /When/ }));
    expect(activities()).toEqual(["Employee Created", "Role Updated", "Leave Approved"]);
  });

  it("shows the honest empty state, with no sample label, when the log is empty", () => {
    render(<RecentActivityTable rows={[]} />);
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
    expect(screen.getByText("Recent changes in your organization will appear here.")).toBeInTheDocument();
    expect(screen.queryByText("Sample data")).not.toBeInTheDocument();
  });
});
