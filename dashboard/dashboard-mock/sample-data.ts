import type { RevenueRangeData, SampleDashboard } from "./types";

/*
 * Illustrative numbers for an Indian SME electronics-distribution business
 * (INR). Hand-written and static on purpose - no Math.random / Date - so the
 * server render and the client render always agree, and so the figures are
 * internally consistent: the monthly series sum to the FY KPIs they sit under
 * (revenue -> Total Sales, cash-flow receipts -> Receipts, and margin is about
 * revenue - expense).
 *
 * FUTURE API, per figure:
 *   finance-accounting -> totalSales, tradingMargin, cashInBank, receipts,
 *                         receivables, revenueVsExpense (net cash flow included)
 *   inventory          -> inventoryValue, itemsByCategory
 *   sales-crm          -> salesOrders7d
 * Delete the matching entry here as each module ships and read the real API
 * from ./index.ts instead.
 */

/** Indian fiscal year, April to March. */
const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const LAKH = 100_000;

/** Whole rupees from figures given in lakh. */
const lakh = (values: number[]): number[] => values.map((v) => v * LAKH);

/*
 * Monthly series for the Revenue vs Expense card, plus the cash-flow series its
 * Net cash flow stat is taken from. Revenue sums to 1,846 lakh = the Total
 * Sales KPI, receipts to 1,692 lakh = the Receipts KPI.
 */
const MONTHLY_REVENUE = lakh([128, 132, 139, 141, 150, 158, 172, 186, 164, 148, 152, 176]);
const MONTHLY_EXPENSE = lakh([109, 114, 119, 122, 128, 136, 146, 158, 140, 127, 130, 143]);
const MONTHLY_RECEIPTS = lakh([118, 125, 131, 136, 142, 150, 160, 172, 151, 139, 143, 125]);
const MONTHLY_PAYMENTS = lakh([104, 111, 118, 121, 127, 133, 143, 152, 139, 126, 131, 119]);

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

/**
 * The last `months` months of the fiscal year, with the stats the card shows.
 * This stands in for the finance-accounting API, which will return all of it
 * (stats included) - the UI never computes any of these.
 */
function rangeOf(months: number): RevenueRangeData {
  const revenue = MONTHLY_REVENUE.slice(-months);
  const expense = MONTHLY_EXPENSE.slice(-months);
  const revenueTotal = sum(revenue);
  const expenseTotal = sum(expense);
  return {
    months: FY_MONTHS.slice(-months),
    revenue,
    expense,
    stats: {
      revenue: revenueTotal,
      expense: expenseTotal,
      netCashFlow: sum(MONTHLY_RECEIPTS.slice(-months)) - sum(MONTHLY_PAYMENTS.slice(-months)),
      marginPct: Math.round(((revenueTotal - expenseTotal) / revenueTotal) * 1000) / 10,
    },
  };
}

export const SAMPLE_DASHBOARD: SampleDashboard = {
  isSample: true,
  kpis: [
    {
      key: "totalSales",
      title: "Total Sales (FY)",
      kind: "inr",
      value: 184_600_000,
      note: "Sales invoices · current financial year",
      status: "healthy",
      trend: { direction: "up", changePct: 12.4 },
      source: "finance-accounting",
      isSample: true,
    },
    {
      key: "tradingMargin",
      title: "Trading Margin (FY)",
      kind: "inr",
      value: 27_400_000,
      note: "14.8% of sales · gross margin proxy",
      status: "healthy",
      trend: { direction: "up", changePct: 1.1 },
      source: "finance-accounting",
      isSample: true,
    },
    {
      key: "cashInBank",
      title: "Cash in Bank",
      kind: "inr",
      value: 6_418_200,
      note: "Across 3 bank accounts",
      status: "info",
      trend: { direction: "down", changePct: 4.3 },
      source: "finance-accounting",
      isSample: true,
    },
    {
      key: "receipts",
      title: "Receipts (FY)",
      kind: "inr",
      value: 169_200_000,
      note: "Receipt vouchers · current FY",
      status: "healthy",
      trend: { direction: "up", changePct: 9.8 },
      source: "finance-accounting",
      isSample: true,
    },
    {
      key: "receivables",
      title: "Receivables",
      kind: "inr",
      value: 18_736_400,
      note: "₹42.1 L overdue by 30+ days",
      status: "warning",
      source: "finance-accounting",
      isSample: true,
    },
    {
      key: "inventoryValue",
      title: "Inventory Value",
      kind: "inr",
      value: 32_674_800,
      note: "Stock at cost · all warehouses",
      status: "info",
      source: "inventory",
      isSample: true,
    },
    {
      key: "salesOrders7d",
      title: "Sales Orders · 7d",
      kind: "count",
      value: 128,
      note: "Orders in the last 7 days",
      status: "healthy",
      trend: { direction: "up", changePct: 6.2 },
      source: "sales-crm",
      isSample: true,
    },
  ],
  itemsByCategory: {
    categories: [
      { label: "Mobile Accessories", value: 412, sharePct: 32, status: "healthy", statusLabel: "In stock" },
      { label: "Small Appliances", value: 286, sharePct: 22, status: "healthy", statusLabel: "In stock" },
      { label: "Lighting & Electricals", value: 241, sharePct: 19, status: "warning", statusLabel: "Reorder soon" },
      { label: "Audio & Speakers", value: 198, sharePct: 15, status: "healthy", statusLabel: "In stock" },
      { label: "Cables & Chargers", value: 147, sharePct: 12, status: "critical", statusLabel: "Low stock" },
    ],
    topSellingItems: [
      { id: "itm-1", name: "20W USB-C Fast Charger", category: "Mobile Accessories", unitsSold: 1840, status: "healthy" },
      { id: "itm-2", name: "Bluetooth Speaker Mini", category: "Audio & Speakers", unitsSold: 1215, status: "healthy" },
      { id: "itm-3", name: "9W LED Bulb (4-pack)", category: "Lighting & Electricals", unitsSold: 960, status: "warning" },
    ],
    source: "inventory",
    isSample: true,
  },
  revenueVsExpense: {
    ranges: {
      "3M": rangeOf(3),
      "6M": rangeOf(6),
      "12M": rangeOf(12),
    },
    defaultRange: "12M",
    source: "finance-accounting",
    isSample: true,
  },
};
