import type { WorkspaceContext } from "@boss/sdk";
import { MODULE_LABELS } from "../constants/module-labels";
import { SAMPLE_ORG } from "../boss-bridge/sample";

const ALL_MODULES = Object.keys(MODULE_LABELS);

/** Static preview context: replace with your real /me/workspace call. */
export async function fetchWorkspaceContext(): Promise<WorkspaceContext> {
  const org = { id: "org1", slug: "demo", displayName: SAMPLE_ORG.name, status: "ACTIVATED" };
  const fy = { startYear: 2026, label: "2026-27", startDate: "2026-04-01", endDate: "2027-03-31", isCurrent: true };
  return {
    workspace: { id: "t1", slug: "demo", displayName: "Demo Workspace" },
    user: { id: "u1", email: "rrajchaudhary.hajipur@gmail.com", displayName: "Raj Chaudhary", tenantRole: "SUPER_ADMIN" },
    organizations: [org],
    activeOrganization: org,
    permissions: [{ key: "*", scope: "ALL" }],
    moduleKeys: ALL_MODULES,
    orgModuleKeys: ALL_MODULES,
    grantedModuleKeys: ALL_MODULES,
    financialYears: [fy],
    activeFinancialYear: fy,
    canViewBranches: true,
    branches: [{ id: "b1", name: "Head Office", code: "HO", isHeadOffice: true }],
    activeBranch: null,
  };
}
