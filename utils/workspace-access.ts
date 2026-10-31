import type { WorkspaceContext } from "@boss/sdk";

/** Org-enabled modules the user also holds a grant in. */
export function effectiveModuleKeys(context: WorkspaceContext): Set<string> {
  const granted = new Set(context.grantedModuleKeys);
  return new Set(context.orgModuleKeys.filter((key) => granted.has(key)));
}

export function hasWorkspaceAccess(context: WorkspaceContext): boolean {
  return context.permissions.length > 0;
}

export function workspaceLandingPath(_context: WorkspaceContext): string {
  return "/self-service/profile";
}
