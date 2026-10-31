import { Activity, CreditCard, KeyRound, LayoutDashboard, Monitor, Plug, Radio } from "lucide-react";
import type { WorkspaceContext } from "@boss/sdk";
import type { NavItem } from "../types/workspace-context";
import { NavChip } from "../boss-bridge/NavChip";
import { filterNavItems } from "../utils/filter-nav";
import { effectiveModuleKeys } from "../utils/workspace-access";

const chip = (icon: React.ReactNode) => <NavChip>{icon}</NavChip>;

/**
 * Sidebar nav config for Boss Bridge. Every entry is a real page (no module
 * drawers), so the rail simply navigates. Profile is not here: it lives in the
 * header, under the organization's name. The shell's template shape is kept:
 * swap this list to change the rail.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: chip(<LayoutDashboard size={17} />) },
  { href: "/device", label: "Device", icon: chip(<Monitor size={17} />) },
  { href: "/pusher", label: "Pusher", icon: chip(<Radio size={17} />) },
  { href: "/integrations", label: "Integrations", icon: chip(<Plug size={17} />) },
  { href: "/api-tokens", label: "API tokens", icon: chip(<KeyRound size={17} />) },
  { href: "/activity", label: "Activity", icon: chip(<Activity size={17} />) },
  { href: "/subscription", label: "Subscription", icon: chip(<CreditCard size={17} />) },
];

/** The rail entries this user can see (UX filtering only — each page still guards itself). */
export function visibleNavItems(context: WorkspaceContext): NavItem[] {
  const permissionKeys = new Set(context.permissions.map((p) => p.key));
  return filterNavItems(NAV_ITEMS, permissionKeys, effectiveModuleKeys(context));
}
