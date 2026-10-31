import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FinancialYearRecord, WorkspaceBranch } from "@boss/sdk";
import { OrgSwitcher } from "./OrgSwitcher";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  save: vi.fn(async (_id: string) => {}),
  saveYear: vi.fn(async (_org: string, _start: number) => {}),
  saveBranch: vi.fn(async (_org: string, _branch: string | null) => {}),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("../api/active-org.actions", () => ({ setActiveOrganizationAction: mocks.save }));
vi.mock("../api/financial-year.actions", () => ({ setFinancialYearAction: mocks.saveYear }));
vi.mock("../api/branch.actions", () => ({ setBranchAction: mocks.saveBranch }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const organizations = [{ id: "a", slug: "a", displayName: "Alpha", status: "ACTIVE" }, { id: "b", slug: "b", displayName: "Beta", status: "ACTIVE" }];
const year = (startYear: number, isCurrent = false): FinancialYearRecord => ({
  startYear,
  label: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
  startDate: `${startYear}-04-01`,
  endDate: `${startYear + 1}-03-31`,
  isCurrent,
});
// An organization that started in 2024-25: its own years plus next year. Nothing earlier exists.
const years = [year(2024), year(2025), year(2026, true), year(2027)];
const branches: WorkspaceBranch[] = [
  { id: "b1", name: "Kaithal", code: "KTL", isHeadOffice: true },
  { id: "b2", name: "Gurugram", code: null, isHeadOffice: false },
];
type Props = Partial<React.ComponentProps<typeof OrgSwitcher>>;
const show = (props: Props = {}) => render(<OrgSwitcher organizations={organizations} activeOrganizationId="a" {...props} />);
const full: Props = { financialYears: years, activeFinancialYearStart: 2026, branches };
const trigger = () => screen.getByRole("button", { name: /^Organization:/ });
const open = async (user: ReturnType<typeof userEvent.setup>) => { await user.click(trigger()); };

describe("OrgSwitcher", () => {
  it("labels the header with the workspace name, and only falls back to the word \"Workspace\" without one", () => {
    const { rerender } = render(<OrgSwitcher workspaceName="AV" organizations={organizations} activeOrganizationId="a" />);
    const button = screen.getByRole("button", { name: "Organization: Alpha" });
    expect(button).toHaveTextContent("AV");
    expect(button).toHaveTextContent("Alpha");
    expect(button).not.toHaveTextContent("Workspace");
    rerender(<OrgSwitcher organizations={organizations} activeOrganizationId="a" />);
    expect(screen.getByRole("button", { name: "Organization: Alpha" })).toHaveTextContent("Workspace");
  });

  describe("subline", () => {
    it("shows the year and All branches by default", () => {
      show(full);
      expect(screen.getByTestId("context-subline")).toHaveTextContent("FY 2026-27 · All branches");
    });
    it("shows the chosen branch's name", () => {
      show({ ...full, activeBranchId: "b2" });
      expect(screen.getByTestId("context-subline")).toHaveTextContent("FY 2026-27 · Gurugram");
    });
    it("falls back to All branches when the saved branch is no longer listed", () => {
      show({ ...full, activeBranchId: "gone" });
      expect(screen.getByTestId("context-subline")).toHaveTextContent("FY 2026-27 · All branches");
    });
    it("shows only the year without a branch list, and nothing without years", () => {
      const { unmount } = show({ financialYears: years, activeFinancialYearStart: 2025 });
      expect(screen.getByTestId("context-subline").textContent).toBe("FY 2025-26");
      unmount();
      show();
      expect(screen.queryByTestId("context-subline")).toBeNull();
    });
  });

  it("searches authorized organizations and restores focus on Escape", async () => {
    const user = userEvent.setup();
    show(full);
    await open(user);
    await user.type(screen.getByRole("textbox", { name: "Find organization" }), "Beta");
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("switches once even with two same-frame clicks", async () => {
    let finish!: () => void;
    mocks.save.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    show();
    await open(user);
    const beta = screen.getByRole("button", { name: "Beta" });
    fireEvent.click(beta);
    fireEvent.click(beta);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    finish();
  });

  it("keeps failed switches visible and does not refresh stale context", async () => {
    mocks.save.mockRejectedValueOnce(new Error("synthetic"));
    const user = userEvent.setup();
    show();
    await open(user);
    await user.click(screen.getByRole("button", { name: "Beta" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not switch organization");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  describe("Financial year section", () => {
    const yearToggle = () => within(screen.getByRole("region", { name: "Financial year" })).getByRole("button", { name: /Financial year/ });

    it("is a collapsed row showing the active year, expanding to only the organization's real years, newest first", async () => {
      const user = userEvent.setup();
      show(full);
      await open(user);
      expect(yearToggle()).toHaveTextContent("2026-27");
      expect(screen.queryByRole("group", { name: "Available financial years" })).toBeNull();
      await user.click(yearToggle());
      const labels = within(screen.getByRole("group", { name: "Available financial years" })).getAllByRole("button").map((b) => b.textContent ?? "");
      expect(labels).toHaveLength(4);
      expect(labels[0]).toContain("2027-28");
      expect(labels[0]).toContain("Upcoming");
      expect(labels[1]).toContain("2026-27");
      expect(labels[1]).toContain("Current");
      expect(labels[1]).toContain("Apr 2026 to Mar 2027");
      expect(labels[3]).toContain("2024-25");
      expect(screen.queryByText(/2023-24|2028-29/)).toBeNull();
    });

    it("is hidden without years", async () => {
      const user = userEvent.setup();
      show({ branches });
      await open(user);
      expect(screen.queryByRole("region", { name: "Financial year" })).toBeNull();
    });

    it("saves a different year for the active organization, closes, refreshes and returns focus", async () => {
      const user = userEvent.setup();
      show(full);
      await open(user);
      await user.click(yearToggle());
      await user.click(screen.getByRole("button", { name: /2025-26/ }));
      expect(mocks.saveYear).toHaveBeenCalledWith("a", 2025);
      await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
      expect(screen.queryByRole("region", { name: "Choose organization" })).toBeNull();
      await vi.waitFor(() => expect(trigger()).toHaveFocus());
    });

    it("choosing the year already shown saves nothing", async () => {
      const user = userEvent.setup();
      show(full);
      await open(user);
      await user.click(yearToggle());
      await user.click(within(screen.getByRole("group", { name: "Available financial years" })).getByRole("button", { name: /2026-27/ }));
      expect(mocks.saveYear).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("keeps a failed save visible and does not refresh", async () => {
      mocks.saveYear.mockRejectedValueOnce(new Error("synthetic"));
      const user = userEvent.setup();
      show(full);
      await open(user);
      await user.click(yearToggle());
      await user.click(screen.getByRole("button", { name: /2025-26/ }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Could not change financial year");
      expect(mocks.refresh).not.toHaveBeenCalled();
    });
  });

  describe("Branch section", () => {
    const branchToggle = () => within(screen.getByRole("region", { name: "Branch" })).getByRole("button", { name: /^Branch/ });

    it("lists All branches first, then each branch, marking the head office", async () => {
      const user = userEvent.setup();
      show(full);
      await open(user);
      await user.click(branchToggle());
      const names = within(screen.getByRole("group", { name: "Available branches" })).getAllByRole("button").map((b) => b.textContent ?? "");
      expect(names[0]).toContain("All branches");
      expect(names[1]).toContain("Kaithal");
      expect(names[1]).toContain("Head office");
      expect(names[1]).toContain("KTL");
      expect(names[2]).toContain("Gurugram");
    });

    it("saves the chosen branch, and null for All branches", async () => {
      const user = userEvent.setup();
      const { unmount } = show(full);
      await open(user);
      await user.click(branchToggle());
      await user.click(screen.getByRole("button", { name: /Gurugram/ }));
      expect(mocks.saveBranch).toHaveBeenCalledWith("a", "b2");
      await vi.waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
      unmount();

      show({ ...full, activeBranchId: "b2" });
      await open(user);
      await user.click(branchToggle());
      await user.click(screen.getByRole("button", { name: /All branches/ }));
      expect(mocks.saveBranch).toHaveBeenLastCalledWith("a", null);
    });

    it("is hidden entirely without the key (no branches and no canViewBranches)", async () => {
      const user = userEvent.setup();
      show({ financialYears: years, activeFinancialYearStart: 2026 });
      await open(user);
      expect(screen.queryByRole("region", { name: "Branch" })).toBeNull();
      expect(screen.queryByText("No branches yet")).toBeNull();
    });

    it("keeps a failed save visible and does not refresh", async () => {
      mocks.saveBranch.mockRejectedValueOnce(new Error("synthetic"));
      const user = userEvent.setup();
      show(full);
      await open(user);
      await user.click(branchToggle());
      await user.click(screen.getByRole("button", { name: /Kaithal/ }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Could not change branch");
      expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it("offers a search box for a long list", async () => {
      const many = Array.from({ length: 12 }, (_, i) => ({ id: `m${i}`, name: `Branch ${i}`, code: null, isHeadOffice: false }));
      const user = userEvent.setup();
      show({ ...full, branches: many });
      await open(user);
      await user.click(branchToggle());
      await user.type(screen.getByRole("searchbox", { name: "Find branch" }), "Branch 11");
      expect(screen.getByRole("button", { name: /Branch 11/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Branch 3/ })).toBeNull();
    });
  });

  describe("with no branches listed", () => {
    it("says 'No branches yet' (no control, no link) when the member may view branches but cannot reach Setup", async () => {
      const user = userEvent.setup();
      show({ financialYears: years, activeFinancialYearStart: 2026, canViewBranches: true });
      await open(user);
      expect(screen.getByTestId("no-branches")).toHaveTextContent("No branches yet");
      expect(screen.getByText("No branches yet")).toHaveAttribute("aria-disabled", "true");
      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.getByTestId("context-subline").textContent).toBe("FY 2026-27");
    });

    it("links to the Setup Centre Branches page only when a link is given", async () => {
      const user = userEvent.setup();
      show({ canViewBranches: true, branchesSetupHref: "/setup/organizations/a?tab=branches" });
      await open(user);
      expect(screen.getByRole("link", { name: "Add" })).toHaveAttribute("href", "/setup/organizations/a?tab=branches");
    });

    it("shows nothing about branches when the member may not view them, even if a link is given", async () => {
      const user = userEvent.setup();
      show({ canViewBranches: false, branchesSetupHref: "/setup/organizations/a?tab=branches" });
      await open(user);
      expect(screen.queryByTestId("no-branches")).toBeNull();
      expect(screen.queryByRole("link")).toBeNull();
    });
  });

  it("starts from collapsed sections each time the menu opens, and a remount (organization switch) resets them", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<OrgSwitcher key="a" organizations={organizations} activeOrganizationId="a" {...full} />);
    await open(user);
    await user.click(within(screen.getByRole("region", { name: "Financial year" })).getByRole("button", { name: /Financial year/ }));
    expect(screen.getByRole("group", { name: "Available financial years" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await open(user);
    expect(screen.queryByRole("group", { name: "Available financial years" })).toBeNull();
    // The header keys the switcher by organization: a different one mounts clean, with the new organization's data.
    await user.click(within(screen.getByRole("region", { name: "Financial year" })).getByRole("button", { name: /Financial year/ }));
    rerender(<OrgSwitcher key="b" organizations={organizations} activeOrganizationId="b" financialYears={[year(2026, true)]} activeFinancialYearStart={2026} />);
    expect(screen.queryByRole("region", { name: "Choose organization" })).toBeNull();
    expect(screen.getByTestId("context-subline").textContent).toBe("FY 2026-27");
    await user.click(trigger());
    expect(screen.queryByRole("group", { name: "Available financial years" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Branch" })).toBeNull();
  });
});
