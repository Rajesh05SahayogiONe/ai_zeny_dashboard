import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SearchDestination } from "../utils/search-destinations";
import { ThemeProvider } from "./ThemeProvider";
import { WorkspaceHeader } from "./WorkspaceHeader";

/**
 * Behaviour of the header's Setu-style dropdowns: one panel open at a time,
 * closed by the backdrop or Escape, an honest empty state in the placeholders,
 * the profile menu's Profile gate and sign-out, and the search over Boss's own
 * destinations.
 */

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/dashboard",
}));
vi.mock("@/modules/auth/api/auth.api", () => ({ logoutRequest: vi.fn() }));
const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));
// The switcher's own behaviour is covered in OrgSwitcher.test.tsx; here we only check what the header hands it.
vi.mock("./OrgSwitcher", () => ({
  OrgSwitcher: (props: { financialYears?: unknown[]; activeFinancialYearStart?: number; branches?: unknown[]; canViewBranches?: boolean; branchesSetupHref?: string; activeBranchId?: string | null }) => (
    <div data-testid="org-switcher" data-years={props.financialYears?.length} data-year={props.activeFinancialYearStart} data-branches={props.branches?.length} data-can-view={String(props.canViewBranches)} data-setup={props.branchesSetupHref} data-branch={props.activeBranchId ?? "none"} />
  ),
}));

import { logoutRequest } from "@/modules/auth/api/auth.api";

const DESTINATIONS: SearchDestination[] = [
  { id: "/dashboard", type: "Page", label: "Dashboard", sublabel: "Workspace home", href: "/dashboard" },
  { id: "/people/employees", type: "People & Payroll", label: "Employees", sublabel: "People", href: "/people/employees" },
  { id: "/payroll/run", type: "People & Payroll", label: "Payroll", sublabel: "Payroll", href: "/payroll/run" },
];

function renderHeader(props: Partial<React.ComponentProps<typeof WorkspaceHeader>> = {}) {
  return render(
    <ThemeProvider>
      <WorkspaceHeader
        organizations={[]}
        activeOrganizationId="org-1"
        user={{ name: "Asha Verma", email: "asha@example.com", roleLabel: "ADMIN" }}
        searchDestinations={DESTINATIONS}
        {...props}
      />
    </ThemeProvider>,
  );
}

const profileButton = () => screen.getByRole("button", { name: /account menu/i });
const box = () => screen.getByRole("textbox", { name: "Search modules and pages" });

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe("WorkspaceHeader — dropdowns", () => {
  it("opens the notifications panel with an honest empty state, and shows no unread dot or mark-all-read", async () => {
    const user = userEvent.setup();
    renderHeader();
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell).toHaveAttribute("aria-expanded", "false");

    await user.click(bell);
    expect(bell).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("No notifications yet.")).toBeInTheDocument();
    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("opens the quick-create panel and says there is nothing to create yet", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Quick create" }));
    expect(screen.getByText("No quick actions available yet.")).toBeInTheDocument();
  });

  it("closes an open panel when its button is clicked again", async () => {
    const user = userEvent.setup();
    renderHeader();
    const bell = screen.getByRole("button", { name: "Notifications" });
    await user.click(bell);
    await user.click(bell);
    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
  });

  it("closes on a click outside (the backdrop) and on Escape", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByTestId("header-backdrop"));
    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-backdrop")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
  });

  it("keeps one panel open at a time", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByRole("button", { name: "Quick create" }));
    expect(screen.queryByText("No notifications yet.")).not.toBeInTheDocument();
    expect(screen.getByText("No quick actions available yet.")).toBeInTheDocument();
  });

  it("shows the org switcher only when the user has an organization", () => {
    const { unmount } = renderHeader();
    expect(screen.getByTestId("org-switcher")).toBeInTheDocument();
    unmount();
    renderHeader({ activeOrganizationId: null });
    expect(screen.queryByTestId("org-switcher")).not.toBeInTheDocument();
  });

  it("hands the year and branch data to the one connected control, and renders no separate year or branch box", () => {
    const years = [{ startYear: 2026, label: "2026-27", startDate: "2026-04-01", endDate: "2027-03-31", isCurrent: true }];
    const branches = [{ id: "b1", name: "Kaithal", code: null, isHeadOffice: true }];
    renderHeader({ financialYears: years, activeFinancialYearStart: 2026, branches, activeBranchId: "b1", canViewBranches: true, branchesSetupHref: "/setup/x" });
    const switcher = screen.getByTestId("org-switcher");
    expect(switcher).toHaveAttribute("data-years", "1");
    expect(switcher).toHaveAttribute("data-year", "2026");
    expect(switcher).toHaveAttribute("data-branches", "1");
    expect(switcher).toHaveAttribute("data-branch", "b1");
    expect(switcher).toHaveAttribute("data-can-view", "true");
    expect(switcher).toHaveAttribute("data-setup", "/setup/x");
    expect(screen.queryByRole("button", { name: /^Financial year:/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Branch:/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId("no-branches")).not.toBeInTheDocument();
  });

  it("stays a single row at every width: no wrapping and no second row for context pickers", () => {
    renderHeader({ canViewBranches: true });
    const header = screen.getByRole("banner");
    expect(header.className).not.toMatch(/flex-wrap|basis-full|order-last/);
    expect(header.querySelector(".basis-full")).toBeNull();
    expect(header.className).toContain("h-[var(--header-h)]");
  });

  it("links the Setup Centre", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "Setup centre" })).toHaveAttribute("href", "/setup");
  });
});

describe("WorkspaceHeader — profile menu", () => {
  it("shows name, email, readable role, the theme switch and Sign out", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(profileButton());

    expect(screen.getByText("Asha Verma")).toBeInTheDocument();
    expect(screen.getByText("asha@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("offers Profile only when the caller has a profile page", async () => {
    const user = userEvent.setup();
    const { unmount } = renderHeader({ profileHref: "/self-service/profile" });
    await user.click(profileButton());
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/self-service/profile");
    unmount();

    renderHeader();
    await user.click(profileButton());
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("closes when Profile is followed", async () => {
    const user = userEvent.setup();
    renderHeader({ profileHref: "/self-service/profile" });
    await user.click(profileButton());
    await user.click(screen.getByRole("link", { name: "Profile" }));
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("signs out through the existing logout request, then goes to /login", async () => {
    const user = userEvent.setup();
    vi.mocked(logoutRequest).mockResolvedValue(undefined);
    renderHeader();
    await user.click(profileButton());
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(logoutRequest).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
  });

  it("reports a failed sign-out instead of leaving the user stuck", async () => {
    const user = userEvent.setup();
    vi.mocked(logoutRequest).mockRejectedValue(new Error("Network down"));
    renderHeader();
    await user.click(profileButton());
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Network down"));
    expect(push).not.toHaveBeenCalled();
  });

  it("switches the theme from the menu", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(profileButton());
    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("dark");
    await user.click(screen.getByRole("button", { name: "Light theme" }));
    expect(document.documentElement).not.toHaveClass("dark");
  });
});

describe("WorkspaceHeader — search", () => {
  it("shows no results for fewer than two characters", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(box(), "e");
    expect(screen.queryByRole("link", { name: /employees/i })).not.toBeInTheDocument();
  });

  it("lists matching destinations with their type, and each is a link to the page", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(box(), "pay");
    const result = screen.getByRole("link", { name: /^Payroll/ });
    expect(result).toHaveAttribute("href", "/payroll/run");
    expect(result).toHaveTextContent("People & Payroll");
  });

  it("clears the box when a result is followed, and on Escape", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(box(), "emp");
    await user.click(screen.getByRole("link", { name: /^Employees/ }));
    expect(box()).toHaveValue("");

    await user.type(box(), "emp");
    await user.keyboard("{Escape}");
    expect(box()).toHaveValue("");
  });

  it("says nothing for a query that matches no page", async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.type(box(), "zzzz");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
