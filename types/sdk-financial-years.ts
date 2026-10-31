import { apiFetch, type ApiClientConfig } from "./client";

/**
 * The financial years of one organization (org structure plan 3.6), read only. They are derived by the API from the
 * organization's starting year (through the current year plus the next), so there is nothing to create or change. Mirrors
 * apps/api's FinancialYearView. Dates are "YYYY-MM-DD" calendar days.
 */
export interface FinancialYearRecord {
  /** The calendar year it starts in: the `financialYearStart` other modules key on. */
  startYear: number;
  /** "2026-27". */
  label: string;
  /** 1 April. */
  startDate: string;
  /** 31 March. */
  endDate: string;
  /** The year today falls in (business time zone). */
  isCurrent: boolean;
}

export interface FinancialYearPage {
  data: FinancialYearRecord[];
  meta: { page: number; pageSize: number; total: number };
}

export function listFinancialYears(config: ApiClientConfig, orgId: string): Promise<FinancialYearPage> {
  return apiFetch<FinancialYearPage>(config, `/organizations/${encodeURIComponent(orgId)}/financial-years`);
}
