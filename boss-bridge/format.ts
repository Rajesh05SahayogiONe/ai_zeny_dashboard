// Fixed locale + zone so the server render and the browser hydrate to the same text.
const OPTS: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" };

export const formatDateTime = (iso: string) => new Date(iso).toLocaleString("en-IN", OPTS);
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });
