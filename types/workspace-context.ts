import type { ReactNode } from "react";

export type { WorkspaceContext, WorkspaceOrganization } from "@boss/sdk";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Hidden unless the tenant's enabled moduleKeys include this key. */
  moduleKey?: string;
  /** Hidden unless the active organization's resolved permissions include
   *  this key. */
  permissionKey?: string;
}

/** A labeled cluster of NavItems in a categorized sidebar (e.g.
 *  self-service-portal's own "Employee"/"Attendance" sections) — distinct
 *  from the flat global rail (NAV_ITEMS), which has no sub-grouping. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}
