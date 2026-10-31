import type { NavItem, NavGroup } from "../types/workspace-context";
import { PEOPLE_PAYROLL_DESTINATIONS } from "../constants/people-payroll-destinations";
import type { PosRetailBillingDestination } from "../constants/pos-retail-billing-destinations";

export interface SearchDestination { id: string; label: string; sublabel: string; type: string; href: string }

export function buildSearchDestinations({
  items,
  selfServiceGroups,
  posDestinations,
}: {
  items: NavItem[];
  selfServiceGroups: NavGroup[];
  posDestinations: readonly PosRetailBillingDestination[];
}): SearchDestination[] {
  const out: SearchDestination[] = [];
  for (const item of items) {
    out.push({ id: `nav:${item.href}`, label: item.label, sublabel: item.moduleKey ? "Module" : "Page", type: item.moduleKey ? "Module" : "Page", href: item.href.startsWith("#") ? "/" : item.href });
  }
  for (const d of PEOPLE_PAYROLL_DESTINATIONS) out.push({ id: `pp:${d.href}`, label: d.label, sublabel: "People & Payroll", type: "Page", href: d.href });
  for (const d of posDestinations) out.push({ id: `pos:${d.href}`, label: d.label, sublabel: "POS & Retail Billing", type: "Page", href: d.href });
  for (const g of selfServiceGroups) for (const i of g.items) out.push({ id: `ss:${i.href}`, label: i.label, sublabel: g.label, type: "Page", href: i.href });
  return out;
}

export function searchDestinations(destinations: SearchDestination[], query: string): SearchDestination[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return destinations.filter((d) => d.label.toLowerCase().includes(q) || d.sublabel.toLowerCase().includes(q)).slice(0, 8);
}
