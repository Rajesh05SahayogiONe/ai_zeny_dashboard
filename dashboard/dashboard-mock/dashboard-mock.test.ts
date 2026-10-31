import { describe, expect, it } from "vitest";
import { getSampleDashboard, REVENUE_RANGES } from "./index";
import type { DashboardKpiKey } from "./types";

/**
 * Pins the contract the dashboard page and its future APIs rely on: the shape,
 * the "this is sample data" flags, and that the figures agree with each other
 * (a chart that sums to something different from the tile above it would look
 * like a bug to a customer even though it is all illustrative).
 */

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const sample = getSampleDashboard();
const kpi = (key: DashboardKpiKey) => {
  const found = sample.kpis.find((k) => k.key === key);
  if (!found) throw new Error(`missing KPI ${key}`);
  return found;
};

describe("sample dashboard — shape", () => {
  it("is flagged as sample data at every level", () => {
    expect(sample.isSample).toBe(true);
    for (const k of sample.kpis) expect(k.isSample).toBe(true);
    expect(sample.itemsByCategory.isSample).toBe(true);
    expect(sample.revenueVsExpense.isSample).toBe(true);
  });

  it("has exactly the seven agreed tiles, in display order", () => {
    expect(sample.kpis.map((k) => k.key)).toEqual([
      "totalSales",
      "tradingMargin",
      "cashInBank",
      "receipts",
      "receivables",
      "inventoryValue",
      "salesOrders7d",
    ]);
  });

  it("gives every tile a title, a note, a finite non-negative value and a known tone", () => {
    const tones = ["healthy", "warning", "critical", "info", "neutral"];
    for (const k of sample.kpis) {
      expect(k.title.length).toBeGreaterThan(0);
      expect(k.note.length).toBeGreaterThan(0);
      expect(Number.isFinite(k.value)).toBe(true);
      expect(k.value).toBeGreaterThanOrEqual(0);
      expect(tones).toContain(k.status);
    }
  });

  it("uses whole rupees for money tiles and an integer for the order count", () => {
    for (const k of sample.kpis) expect(Number.isInteger(k.value)).toBe(true);
    expect(kpi("salesOrders7d").kind).toBe("count");
    expect(sample.kpis.filter((k) => k.kind === "inr")).toHaveLength(6);
  });

  it("names the future owning module for each figure", () => {
    expect(kpi("totalSales").source).toBe("finance-accounting");
    expect(kpi("tradingMargin").source).toBe("finance-accounting");
    expect(kpi("cashInBank").source).toBe("finance-accounting");
    expect(kpi("receipts").source).toBe("finance-accounting");
    expect(kpi("receivables").source).toBe("finance-accounting");
    expect(kpi("inventoryValue").source).toBe("inventory");
    expect(kpi("salesOrders7d").source).toBe("sales-crm");
    expect(sample.itemsByCategory.source).toBe("inventory");
    expect(sample.revenueVsExpense.source).toBe("finance-accounting");
  });

  it("gives a trend a direction and a positive percentage", () => {
    for (const k of sample.kpis) {
      if (!k.trend) continue;
      expect(["up", "down"]).toContain(k.trend.direction);
      expect(k.trend.changePct).toBeGreaterThan(0);
    }
  });
});

describe("sample dashboard — charts", () => {
  const { ranges, defaultRange } = sample.revenueVsExpense;

  it("offers 3M, 6M and 12M, defaulting to the full fiscal year", () => {
    expect(REVENUE_RANGES).toEqual(["3M", "6M", "12M"]);
    expect(Object.keys(ranges).sort()).toEqual([...REVENUE_RANGES].sort());
    expect(defaultRange).toBe("12M");
  });

  it("has one value per month in every series of every range, the last N months of the fiscal year", () => {
    const counts = { "3M": 3, "6M": 6, "12M": 12 } as const;
    for (const range of REVENUE_RANGES) {
      const data = ranges[range];
      expect(data.months).toHaveLength(counts[range]);
      expect(data.revenue).toHaveLength(counts[range]);
      expect(data.expense).toHaveLength(counts[range]);
      expect(data.months.at(-1)).toBe("Mar");
    }
    expect(ranges["12M"].months[0]).toBe("Apr");
    expect(ranges["3M"].months).toEqual(["Jan", "Feb", "Mar"]);
  });

  it("makes each shorter range the tail of the longer one", () => {
    expect(ranges["6M"].revenue).toEqual(ranges["12M"].revenue.slice(-6));
    expect(ranges["3M"].expense).toEqual(ranges["12M"].expense.slice(-3));
  });

  it("supplies stats that agree with the plotted series of the same range", () => {
    for (const range of REVENUE_RANGES) {
      const { revenue, expense, stats } = ranges[range];
      expect(stats.revenue).toBe(sum(revenue));
      expect(stats.expense).toBe(sum(expense));
      expect(stats.marginPct).toBeCloseTo(((sum(revenue) - sum(expense)) / sum(revenue)) * 100, 1);
    }
  });

  it("lists five categories, largest first, each with a share, a tone and a label", () => {
    const { categories } = sample.itemsByCategory;
    const counts = categories.map((c) => c.value);
    expect(counts).toHaveLength(5);
    expect(counts.every((c) => c > 0)).toBe(true);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
    expect(new Set(categories.map((c) => c.label)).size).toBe(5);
    expect(sum(categories.map((c) => c.sharePct))).toBe(100);
    for (const c of categories) expect(c.statusLabel.length).toBeGreaterThan(0);
  });

  it("lists top-selling items, best first, each in a known category", () => {
    const { topSellingItems, categories } = sample.itemsByCategory;
    expect(topSellingItems.length).toBeGreaterThan(0);
    const units = topSellingItems.map((i) => i.unitsSold);
    expect([...units].sort((a, b) => b - a)).toEqual(units);
    const known = categories.map((c) => c.label);
    for (const item of topSellingItems) expect(known).toContain(item.category);
  });

  it("agrees with the tiles: monthly revenue sums to Total Sales, net cash flow is receipts minus payments", () => {
    expect(ranges["12M"].stats.revenue).toBe(kpi("totalSales").value);
    // Receipts 1,692 lakh (= the Receipts KPI) less payments 1,524 lakh.
    expect(ranges["12M"].stats.netCashFlow).toBe(16_800_000);
  });

  it("keeps the margin tile close to revenue minus expense", () => {
    const { revenue, expense } = ranges["12M"].stats;
    const margin = revenue - expense;
    expect(Math.abs(margin - kpi("tradingMargin").value) / margin).toBeLessThan(0.02);
  });
});

describe("getSampleDashboard", () => {
  it("is deterministic, so server and client renders always agree", () => {
    expect(getSampleDashboard()).toEqual(getSampleDashboard());
  });
});
