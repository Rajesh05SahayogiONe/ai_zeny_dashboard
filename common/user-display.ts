/**
 * How a signed-in user is shown in the UI (initials, readable role). Shared by
 * the platform console's UserMenu and the tenant workspace header's profile
 * menu so the two can never label the same account differently.
 */

export function initialsOf(nameOrEmail: string): string {
  const local = nameOrEmail.split("@")[0] ?? nameOrEmail;
  // Split on any run of whitespace so "Asha  Verma" (double space) or a
  // tab can't yield an empty word, whose [0] would be undefined.
  const parts = local.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (parts.length > 1 && first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  return local.trim().slice(0, 2).toUpperCase();
}

/** Readable labels for every TenantRole and PlatformRole value in
 *  packages/database/prisma/schema.prisma (both enums are SUPER_ADMIN/ADMIN/
 *  USER today). A Map rather than an object literal so a value like
 *  "constructor" can't resolve to an Object.prototype member; a value with no
 *  entry (a role added to the schema before this table) shows as-is rather
 *  than blank. */
const ROLE_LABELS: ReadonlyMap<string, string> = new Map([
  ["SUPER_ADMIN", "Super Admin"],
  ["ADMIN", "Admin"],
  ["USER", "User"],
]);

export function readableRole(role: string): string {
  return ROLE_LABELS.get(role) ?? role;
}
