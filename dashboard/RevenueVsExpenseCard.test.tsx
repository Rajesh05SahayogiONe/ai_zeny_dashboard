import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getSampleDashboard } from "../api/dashboard-mock";
import { formatInrCompact } from "../utils/format-inr";
import { RevenueVsExpenseCard } from "./RevenueVsExpenseCard";

/**
 * The range toggle is the card's only state: each range shows that range's own
 * stats from the data layer (nothing is recomputed in the component), the
 * pressed pill follows the choice, and the sample label stays on the card.
 */

beforeAll(() => {
  // recharts' ResponsiveContainer measures with ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(() => cleanup());

const { revenueVsExpense } = getSampleDashboard();

function statValue(label: string): string {
  const term = screen.getByText(label, { selector: "dt" });
  const definition = term.nextElementSibling;
  if (!definition) throw new Error(`no value for ${label}`);
  return definition.textContent ?? "";
}

describe("RevenueVsExpenseCard", () => {
  it("opens on the data layer's default range with that range's stats", () => {
    render(<RevenueVsExpenseCard data={revenueVsExpense} />);
    expect(screen.getByRole("button", { name: "12M" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "3M" })).toHaveAttribute("aria-pressed", "false");

    const stats = revenueVsExpense.ranges["12M"].stats;
    expect(statValue("Revenue")).toBe(formatInrCompact(stats.revenue));
    expect(statValue("Expense")).toBe(formatInrCompact(stats.expense));
    expect(statValue("Net cash flow")).toBe(formatInrCompact(stats.netCashFlow));
    expect(statValue("Margin")).toBe(`${stats.marginPct}%`);
  });

  it("switches the stats and the pressed pill when another range is chosen", async () => {
    const user = userEvent.setup();
    render(<RevenueVsExpenseCard data={revenueVsExpense} />);

    await user.click(screen.getByRole("button", { name: "3M" }));
    expect(screen.getByRole("button", { name: "3M" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "12M" })).toHaveAttribute("aria-pressed", "false");

    const stats = revenueVsExpense.ranges["3M"].stats;
    expect(statValue("Revenue")).toBe(formatInrCompact(stats.revenue));
    expect(statValue("Margin")).toBe(`${stats.marginPct}%`);
    expect(statValue("Revenue")).not.toBe(formatInrCompact(revenueVsExpense.ranges["12M"].stats.revenue));

    await user.click(screen.getByRole("button", { name: "6M" }));
    expect(statValue("Expense")).toBe(formatInrCompact(revenueVsExpense.ranges["6M"].stats.expense));
  });

  it("lists Revenue and Expense in the legend and keeps the Sample data label beside the toggle", () => {
    render(<RevenueVsExpenseCard data={revenueVsExpense} />);
    const heading = screen.getByRole("heading", { name: "Revenue vs Expense" });
    const card = heading.closest("section");
    if (!card) throw new Error("card not found");
    expect(within(card).getAllByText("Revenue").length).toBeGreaterThanOrEqual(2); // legend + stat
    expect(within(card).getAllByText("Expense").length).toBeGreaterThanOrEqual(2);
    expect(within(card).getByText("Sample data")).toBeInTheDocument();
    expect(within(card).getAllByRole("button")).toHaveLength(3);
  });
});
