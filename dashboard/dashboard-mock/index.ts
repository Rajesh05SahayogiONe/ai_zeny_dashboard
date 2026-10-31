import { SAMPLE_DASHBOARD } from "./sample-data";
import type { SampleDashboard } from "./types";

export type {
  CategorySlice,
  DashboardDataSource,
  DashboardKpi,
  DashboardKpiKey,
  DashboardKpiStatus,
  DashboardKpiTrend,
  ItemsByCategory,
  RevenueRange,
  RevenueRangeData,
  RevenueVsExpense,
  SampleDashboard,
  TopSellingItem,
} from "./types";
export { REVENUE_RANGES } from "./types";

/**
 * The single seam between the dashboard page and its (not yet existing) data
 * sources. Synchronous and pure today; when finance-accounting / inventory /
 * sales-crm ship, this becomes an async loader over @boss/sdk (an
 * `api/*.data.ts` file) and the page awaits it. The returned shape is already
 * what those APIs should return, see ./types.ts.
 */
export function getSampleDashboard(): SampleDashboard {
  return SAMPLE_DASHBOARD;
}
