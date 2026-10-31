import { apiFetch, type ApiClientConfig } from "./client";
import type { FinancialYearRecord } from "./financial-years";
import type { Paginated } from "./tenants";

export type WorkspacePermissionScope = "ALL" | "BRANCH" | "TEAM" | "OWN";

export interface WorkspaceOrganization {
  id: string;
  slug: string;
  displayName: string;
  status: string;
}

export interface WorkspaceContext {
  /** Authenticated tenant identity, read from its canonical record. */
  workspace?: { id: string; slug: string; displayName: string } | null;
  user: { id: string; email: string; displayName: string; tenantRole: string };
  organizations: WorkspaceOrganization[];
  activeOrganization: WorkspaceOrganization | null;
  permissions: { key: string; scope: WorkspacePermissionScope }[];
  moduleKeys: string[];
  /** Tenant ceiling ∩ org-level narrowing — prefer this over `moduleKeys`
   *  for nav filtering (self-service-portal-plan.md §D6). */
  orgModuleKeys: string[];
  /** Modules this user holds at least one permission in. Nav filtering
   *  should use `orgModuleKeys ∩ grantedModuleKeys`, not `orgModuleKeys`
   *  alone — org-level enablement says nothing about this user's own
   *  grants within that module. */
  grantedModuleKeys: string[];
  /** The active organization's real financial years, oldest first. Empty without an active organization. */
  financialYears: FinancialYearRecord[];
  /** The viewing year: the saved preference when it is one of `financialYears`, else the current year. A view preference only. */
  activeFinancialYear: FinancialYearRecord | null;
  /** True only when the member holds Branch.Read organization-wide in the active organization: an empty `branches` then means "none yet", otherwise the member simply may not list them. */
  canViewBranches: boolean;
  /** Active branches of the active organization; empty unless `canViewBranches`. */
  branches: WorkspaceBranch[];
  /** The saved branch filter when it is one of `branches`; null means "All branches". A view filter, never an authority. */
  activeBranch: WorkspaceBranch | null;
}

/** A branch as the header picker needs it. */
export interface WorkspaceBranch {
  id: string;
  name: string;
  code: string | null;
  isHeadOffice: boolean;
}

/** Length caps the API enforces on the two view hints (GetWorkspaceQuery). */
export const MAX_FINANCIAL_YEAR_HINT_LENGTH = 8;
export const MAX_BRANCH_HINT_LENGTH = 64;

/** View preferences sent as hints; the API re-validates them against the active organization on every call. */
export interface WorkspacePreferences {
  financialYear?: number;
  branchId?: string;
}

export function getMyWorkspace(config: ApiClientConfig, organizationId?: string, preferences: WorkspacePreferences = {}): Promise<WorkspaceContext> {
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  // The API refuses hints longer than these caps (a 400 would blank the whole workspace), so an oversize one is never sent.
  if (preferences.financialYear !== undefined && String(preferences.financialYear).length <= MAX_FINANCIAL_YEAR_HINT_LENGTH) params.set("financialYear", String(preferences.financialYear));
  if (preferences.branchId && preferences.branchId.length <= MAX_BRANCH_HINT_LENGTH) params.set("branchId", preferences.branchId);
  const query = params.toString();
  return apiFetch<WorkspaceContext>(config, `/me/workspace${query ? `?${query}` : ""}`);
}

/**
 * One row of the workspace "recent activity" feed (Super Admin only; every
 * other user gets an empty page). Mirrors apps/api's WorkspaceActivityEntry: no
 * actor email/id and no entity id. `actorLabel` is already a display phrase: the
 * actor's name, "System", or "Platform team".
 */
export interface WorkspaceActivityRecord {
  id: string;
  action: string;
  entityType: string;
  organizationId: string | null;
  actorLabel: string;
  createdAt: string;
}

export function listMyWorkspaceActivity(
  config: ApiClientConfig,
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<WorkspaceActivityRecord>> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return apiFetch<Paginated<WorkspaceActivityRecord>>(config, `/me/workspace/activity${qs ? `?${qs}` : ""}`);
}
