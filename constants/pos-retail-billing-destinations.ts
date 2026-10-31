export interface PosRetailBillingDestination {
  href: string;
  label: string;
  permissionKey?: string;
  windowName?: string;
  pendingHandoversBadge?: boolean;
}

export const POS_RETAIL_BILLING_DESTINATIONS: readonly PosRetailBillingDestination[] = [
  { href: "/pos/terminal", label: "POS Terminal", windowName: "boss-pos-terminal" },
  { href: "/pos/cash/shifts", label: "Cash shifts" },
  { href: "/pos/cash/handovers", label: "Cash handovers", pendingHandoversBadge: true },
  { href: "/pos/cash/day", label: "Cash day" },
  { href: "/pos/cash/days", label: "Closed days" },
];

export function visiblePosDestinations(permissionKeys: ReadonlySet<string>): PosRetailBillingDestination[] {
  return POS_RETAIL_BILLING_DESTINATIONS.filter((d) => !d.permissionKey || permissionKeys.has(d.permissionKey) || permissionKeys.has("*"));
}
