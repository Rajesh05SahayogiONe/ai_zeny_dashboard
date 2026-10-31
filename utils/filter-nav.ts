import type { NavItem, NavGroup } from "../types/workspace-context";

function allowed(item: NavItem, permissionKeys: ReadonlySet<string>, moduleKeys: ReadonlySet<string>): boolean {
  if (item.moduleKey && !moduleKeys.has(item.moduleKey)) return false;
  if (item.permissionKey && !permissionKeys.has(item.permissionKey) && !permissionKeys.has("*")) return false;
  return true;
}

export function filterNavItems(items: NavItem[], permissionKeys: ReadonlySet<string>, moduleKeys: ReadonlySet<string>): NavItem[] {
  return items.filter((item) => allowed(item, permissionKeys, moduleKeys));
}

export function filterNavGroups(groups: NavGroup[], permissionKeys: ReadonlySet<string>, moduleKeys: ReadonlySet<string>): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: filterNavItems(group.items, permissionKeys, moduleKeys) }))
    .filter((group) => group.items.length > 0);
}
