// Illustrative data for the Boss Bridge UI preview. Nothing here is real; every
// screen that shows it carries a "Sample data" badge.

export const SAMPLE_ORG = {
  id: "org_DEMO000000000000000000",
  name: "Demo Traders Pvt Ltd",
  owner: "Raj Chaudhary",
  email: "owner@example.com",
  whatsapp: "+91 98765 43210",
  country: "India (+91)",
};

export const SAMPLE_DEVICE = {
  id: "dev_41R7Q6YBC6M6AHGJHG0QQ3Z05H",
  name: "Office PC",
  status: "Active",
  enrolled: "2026-10-30T12:37:00+05:30",
  lastSeen: "2026-10-30T13:28:00+05:30",
  version: "0.4.2",
  seatsUsed: 1,
  seatsTotal: 1,
};

export interface EnrollmentCode { id: string; code: string; pc: string; state: "Consumed" | "Expired" | "Pending"; created: string; expires: string; attempts: number }
export const SAMPLE_CODES: EnrollmentCode[] = [
  { id: "c1", code: "bb_enroll_7QK2…", pc: "Office PC", state: "Consumed", created: "2026-10-30T12:34:00+05:30", expires: "2026-10-30T12:49:00+05:30", attempts: 0 },
];

export interface HistoryEntry { id: string; title: string; detail: string; at: string; by: string; kind: "device" | "code" }
export const SAMPLE_HISTORY: HistoryEntry[] = [
  { id: "h3", title: "PC sign-in renewed", detail: "Office PC", at: "2026-10-30T13:35:00+05:30", by: "Boss Bridge on Office PC", kind: "device" },
  { id: "h2", title: "PC enrolled", detail: "Office PC joined with code bb_enroll_7QK2… · Boss Bridge 0.4.2", at: "2026-10-30T12:37:00+05:30", by: "Boss Bridge on Office PC", kind: "device" },
  { id: "h1", title: "Enrollment code created", detail: "bb_enroll_7QK2… for Office PC", at: "2026-10-30T12:34:00+05:30", by: "Raj Chaudhary", kind: "code" },
];

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  access: string;
  created: string;
  /** Set for tokens made in this session ("Today, 5:53 pm"); sample tokens show their date instead. */
  createdLabel?: string;
  lastUsed: string | null;
  expires: string | null;
  status: "Active" | "Revoked";
}
export const SAMPLE_TOKENS: ApiToken[] = [
  { id: "t1", name: "Nightly export", prefix: "bb_pat_9f3a…", access: "All companies", created: "2026-10-31T10:00:00+05:30", lastUsed: "2026-11-04T02:00:00+05:30", expires: null, status: "Active" },
  { id: "t2", name: "Dashboard sync", prefix: "bb_pat_c71e…", access: "C01, C02", created: "2026-10-28T16:20:00+05:30", lastUsed: null, expires: "2026-11-20T00:00:00+05:30", status: "Active" },
  { id: "t3", name: "Old script", prefix: "bb_pat_1d08…", access: "All companies", created: "2026-07-01T09:00:00+05:30", lastUsed: "2026-07-15T18:40:00+05:30", expires: null, status: "Revoked" },
];

export interface ActivityRow { id: string; at: string; token: string; request: string; status: "Completed" | "Failed" | "Timed out"; duration: string }
export const SAMPLE_ACTIVITY: ActivityRow[] = [
  { id: "a1", at: "2026-11-04T02:00:12+05:30", token: "Nightly export", request: "Read · ledger balances", status: "Completed", duration: "184 ms" },
  { id: "a2", at: "2026-11-04T02:00:09+05:30", token: "Nightly export", request: "Read · item master", status: "Completed", duration: "412 ms" },
  { id: "a3", at: "2026-11-03T02:00:21+05:30", token: "Nightly export", request: "Read · ledger balances", status: "Failed", duration: "96 ms" },
  { id: "a4", at: "2026-11-03T02:00:10+05:30", token: "Nightly export", request: "Read · item master", status: "Timed out", duration: "30 s" },
  { id: "a5", at: "2026-11-02T02:00:14+05:30", token: "Nightly export", request: "Read · ledger balances", status: "Completed", duration: "201 ms" },
  { id: "a6", at: "2026-11-02T02:00:08+05:30", token: "Nightly export", request: "Read · item master", status: "Completed", duration: "388 ms" },
];

export const SAMPLE_PLAN = {
  name: "Trial",
  status: "Active",
  started: "2026-10-30",
  ends: "2026-11-13",
  daysLeft: 9,
  elapsedPct: 36,
  companies: 2,
  financialYears: 2,
  devices: 1,
  amount: "₹0.00",
  included: [
    { label: "Read API", on: true },
    { label: "Write API", on: true },
    { label: "Scripting", on: true },
    { label: "Google Sheets", on: true },
    { label: "Assistant", on: false },
    { label: "Backups", on: true },
    { label: "Realtime relay", on: true },
  ],
};

export const SUBSCRIPTION_STATUS_HELP = [
  { status: "healthy" as const, label: "Active", text: "Everything in your plan works until the end date." },
  { status: "warning" as const, label: "Expired", text: "The term ended. Relay and device enrolment are blocked until it is renewed." },
  { status: "warning" as const, label: "Suspended", text: "Paused by the Boss Bridge team. Relay and enrolment are blocked until it is resumed." },
  { status: "neutral" as const, label: "Cancelled", text: "Stopped. You can still sign in and see your record." },
];

export const GOOGLE_CALLS = { used: 0, limit: 2000 };
