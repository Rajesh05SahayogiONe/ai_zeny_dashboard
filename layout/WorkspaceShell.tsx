import type { ReactNode } from "react";
import type { WorkspaceContext } from "@boss/sdk";
import { WorkspaceBody } from "./WorkspaceBody";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ThemeProvider } from "./ThemeProvider";
import { visibleNavItems } from "./navConfig";
import { filterNavGroups } from "../utils/filter-nav";
import { buildSearchDestinations } from "../utils/search-destinations";
import { visiblePosDestinations } from "../constants/pos-retail-billing-destinations";
import { effectiveModuleKeys } from "../utils/workspace-access";
// Direct leaf import, not the "@/modules/self-service-portal" barrel — that
// barrel also re-exports server-only page components; a leaf import here
// keeps this module-content data cleanly separate from them.
import { SELF_SERVICE_EMPLOYEE_NAV_GROUPS, SELF_SERVICE_ADMIN_NAV_GROUPS } from "@/modules/self-service-portal/nav";

/**
 * The tenant-workspace frame, on Setu's shell structure: icon rail (a bottom
 * tab bar on phones) beside a header over the page area, with Boss's header
 * items (search · quick-create/notifications/setup · organization profile) and Boss's
 * rail+drawer body. Wraps everything in the theme provider (light / dark /
 * system, persisted per browser). Quick-create and notifications are honest
 * placeholders (CLAUDE.md §1.1 no-time-pass) — no business module exists yet
 * to back them; search is real but indexes only the pages this user can
 * navigate to; Setup Centre is a real link since it needs no business data.
 * The rail+drawer body (WorkspaceBody) owns its own click/collapse state — a
 * Server Component can't hold that, hence the split. Nav is filtered to what
 * the tenant's enabled modules actually allow — UX only, each page still
 * guards itself.
 */
export function WorkspaceShell({
  context,
  hasLinkedEmployee,
  pendingCashHandovers = null,
  children,
}: {
  context: WorkspaceContext;
  /** Does the caller themselves have a linked, login-enabled Employee
   *  record in the active organization — computed once in
   *  app/(workspace)/layout.tsx. Gates the "My Profile/Attendance/
   *  Documents" self-service drawer section independently of raw
   *  permission keys, since owner/admin roles grant "*" (which would
   *  otherwise satisfy those permission checks for someone who isn't an
   *  employee at all, leading them into a page that just 403s). */
  hasLinkedEmployee: boolean;
  /** The caller's waiting cash handovers (POS drawer badge, owner decision D7), read once in
   *  app/(workspace)/layout.tsx; null when not applicable or unreadable — no badge, never a made-up 0. */
  pendingCashHandovers?: number | null;
  children: ReactNode;
}) {
  const permissionKeys = new Set(context.permissions.map((p) => p.key));
  // visibleNavItems: orgModuleKeys (tenant ceiling ∩ org-level narrowing —
  // self-service-portal-plan.md §D6/§H.3), further narrowed to modules THIS
  // user actually holds a permission in: orgModuleKeys alone only says the org
  // enabled the module for someone, so without it every logged-in user would
  // see every org-enabled module regardless of their own grants. Shared with
  // the landing decision (`hasWorkspaceAccess`) and the dashboard's "Modules
  // at a Glance", so none of them can disagree.
  const items = visibleNavItems(context);
  const moduleKeys = effectiveModuleKeys(context);
  const employeeGroups = hasLinkedEmployee
    ? filterNavGroups(SELF_SERVICE_EMPLOYEE_NAV_GROUPS, permissionKeys, moduleKeys)
    : [];
  const selfServiceGroups = [...employeeGroups, ...filterNavGroups(SELF_SERVICE_ADMIN_NAV_GROUPS, permissionKeys, moduleKeys)];
  const posDestinations = visiblePosDestinations(permissionKeys);
  const posNav = { destinations: posDestinations, pendingHandovers: pendingCashHandovers };
  const searchDestinations = buildSearchDestinations({ items, selfServiceGroups, posDestinations });

  // Keyed because it crosses the server→client boundary as a prop and
  // WorkspaceBody renders it beside sibling elements: an element arriving over
  // RSC can't be marked as a static child on the client, so without a key React
  // logs "Each child in a list should have a unique key" for it in dev.
  const header = (
    <WorkspaceHeader
      key="workspace-header"
      organizationName={context.activeOrganization?.displayName ?? context.workspace?.displayName ?? ""}
      searchDestinations={searchDestinations}
    />
  );

  return (
    <ThemeProvider>
      <div className="workspace-root flex h-dvh w-full flex-col overflow-hidden bg-[var(--shell-bg)] text-foreground">
        <WorkspaceBody items={items} selfServiceGroups={selfServiceGroups} posNav={posNav} header={header}>
          {children}
        </WorkspaceBody>
      </div>
    </ThemeProvider>
  );
}
