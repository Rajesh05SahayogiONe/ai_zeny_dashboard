// Type-only stand-in for the private @boss/sdk package (shapes copied from types/sdk-*.ts).
export interface FinancialYearRecord { startYear: number; label: string; startDate: string; endDate: string; isCurrent: boolean }
export type WorkspacePermissionScope = "ALL" | "BRANCH" | "TEAM" | "OWN";
export interface WorkspaceOrganization { id: string; slug: string; displayName: string; status: string }
export interface WorkspaceBranch { id: string; name: string; code: string | null; isHeadOffice: boolean }
export interface WorkspaceContext {
  workspace?: { id: string; slug: string; displayName: string } | null;
  user: { id: string; email: string; displayName: string; tenantRole: string };
  organizations: WorkspaceOrganization[];
  activeOrganization: WorkspaceOrganization | null;
  permissions: { key: string; scope: WorkspacePermissionScope }[];
  moduleKeys: string[];
  orgModuleKeys: string[];
  grantedModuleKeys: string[];
  financialYears: FinancialYearRecord[];
  activeFinancialYear: FinancialYearRecord | null;
  canViewBranches: boolean;
  branches: WorkspaceBranch[];
  activeBranch: WorkspaceBranch | null;
}
