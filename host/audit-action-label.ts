export function auditActionLabel(action: string): string {
  return action.replace(/[._]/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
