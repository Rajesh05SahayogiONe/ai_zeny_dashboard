export function friendlyName(user: { displayName?: string | null; email: string }): string {
  const name = user.displayName?.trim();
  if (name && name !== user.email) return name;
  return (user.email.split("@")[0] ?? user.email).replace(/[._-]+/g, " ");
}
