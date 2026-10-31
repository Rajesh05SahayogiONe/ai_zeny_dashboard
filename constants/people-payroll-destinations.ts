export interface PeoplePayrollDestination { href: string; label: string; section: string | null; exact?: boolean }

export const PEOPLE_PAYROLL_DESTINATIONS: readonly PeoplePayrollDestination[] = [
  { href: "/people", label: "Overview", section: null, exact: true },
];
