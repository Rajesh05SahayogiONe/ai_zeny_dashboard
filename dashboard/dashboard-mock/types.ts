/**
 * Shape of the dashboard's SAMPLE data layer. Every type here is deliberately
 * shaped like the response its future API would return, so that wiring a real
 * module in means replacing the loader in ./index.ts and nothing in the page
 * or components. Amounts are whole rupees (INR); the UI formats them.
 *
 * None of this is real tenant data. `isSample: true` is part of the contract
 * and the page renders a visible "Sample data" label wherever it is set.
 */

/** The (not yet built) catalog module that will own each figure. */
export type DashboardDataSource = "finance-accounting" | "inventory" | "sales-crm";

/** Mirrors the dashboard status tones; a future API supplies the tone, the UI never derives it. */
export type DashboardKpiStatus = "healthy" | "warning" | "critical" | "info" | "neutral";

export type DashboardKpiKey =
  | "totalSales"
  | "tradingMargin"
  | "cashInBank"
  | "receipts"
  | "receivables"
  | "inventoryValue"
  | "salesOrders7d";

export interface DashboardKpiTrend {
  direction: "up" | "down";
  /** Absolute percentage change vs the comparison period, e.g. 12.4 for "12.4%". */
  changePct: number;
}

export interface DashboardKpi {
  key: DashboardKpiKey;
  title: string;
  /** "inr" values are rupees; "count" values are plain integers. */
  kind: "inr" | "count";
  value: number;
  note: string;
  status: DashboardKpiStatus;
  trend?: DashboardKpiTrend;
  /** Which module will replace this sample value. */
  source: DashboardDataSource;
  isSample: true;
}

export interface CategorySlice {
  label: string;
  /** Number of items (SKUs) in the category. */
  value: number;
  /** This category's share of the plotted categories, in whole percent. The API
   *  supplies it; the UI only displays it. */
  sharePct: number;
  /** Stock-health tone and its wording for the category (the API decides both). */
  status: DashboardKpiStatus;
  statusLabel: string;
}

export interface TopSellingItem {
  id: string;
  name: string;
  category: string;
  /** Units sold in the comparison period. */
  unitsSold: number;
  status: DashboardKpiStatus;
}

export interface ItemsByCategory {
  /** The top categories, largest first. */
  categories: CategorySlice[];
  /** Best sellers, best first. */
  topSellingItems: TopSellingItem[];
  source: "inventory";
  isSample: true;
}

/** The ranges the Revenue vs Expense card can show: the last N months of the fiscal year. */
export const REVENUE_RANGES = ["3M", "6M", "12M"] as const;
export type RevenueRange = (typeof REVENUE_RANGES)[number];

/** One plotted range. Every figure, the summary stats included, is supplied by
 *  the data source: the UI computes nothing from the series. */
export interface RevenueRangeData {
  /** Month labels in order, one value per label in every series. */
  months: string[];
  /** Rupees per month. */
  revenue: number[];
  /** Rupees per month. */
  expense: number[];
  stats: {
    /** Rupees over the range. */
    revenue: number;
    /** Rupees over the range. */
    expense: number;
    /** Receipts minus payments over the range, in rupees (may be negative). */
    netCashFlow: number;
    /** Margin as a percentage of revenue, to one decimal. */
    marginPct: number;
  };
}

export interface RevenueVsExpense {
  ranges: Record<RevenueRange, RevenueRangeData>;
  defaultRange: RevenueRange;
  source: "finance-accounting";
  isSample: true;
}

export interface SampleDashboard {
  isSample: true;
  /** Exactly seven, in display order. */
  kpis: DashboardKpi[];
  itemsByCategory: ItemsByCategory;
  revenueVsExpense: RevenueVsExpense;
}
