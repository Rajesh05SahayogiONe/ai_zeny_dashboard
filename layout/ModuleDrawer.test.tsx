import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { POS_RETAIL_BILLING_DESTINATIONS } from "../constants/pos-retail-billing-destinations";
import { ModuleDrawer } from "./ModuleDrawer";

/**
 * Regression cover for the sidebar and its destination pages drifting apart:
 * the drawer entries were renamed ("Run Payroll" -> "Payroll", "Employee
 * Salary Assignments" -> "Salary Assignments") while the pages they open kept
 * the old names in their H1, breadcrumbs and metadata titles. This pins the
 * drawer's side of that contract; RunPayrollPage.test.tsx,
 * PayrollRunDetailPage.test.tsx, lib/breadcrumbs.test.ts and the two route
 * files' page.test.tsx pin the page side to the same names.
 */

vi.mock("next/navigation", () => ({
  usePathname: () => "/payroll/run",
}));

afterEach(() => {
  cleanup();
});

describe("ModuleDrawer — People & Payroll", () => {
  function renderPayrollDrawer() {
    render(<ModuleDrawer activeModuleKey="people-payroll" collapsed={false} selfServiceGroups={[]} />);
  }

  it('labels the /payroll/run entry "Payroll"', () => {
    renderPayrollDrawer();
    expect(screen.getByRole("link", { name: "Payroll" })).toHaveAttribute("href", "/payroll/run");
  });

  it('labels the /payroll/salary-assignments entry "Salary Assignments"', () => {
    renderPayrollDrawer();
    expect(screen.getByRole("link", { name: "Salary Assignments" })).toHaveAttribute(
      "href",
      "/payroll/salary-assignments",
    );
  });

  it("no longer shows either pre-rename label", () => {
    renderPayrollDrawer();
    expect(screen.queryByText("Run Payroll")).not.toBeInTheDocument();
    expect(screen.queryByText("Employee Salary Assignments")).not.toBeInTheDocument();
  });
});

describe("ModuleDrawer — People & Payroll Overview", () => {
  it("links Overview to /people (it used to point at a /people/overview page that does not exist)", () => {
    render(<ModuleDrawer activeModuleKey="people-payroll" collapsed={false} selfServiceGroups={[]} />);
    const overview = screen.getByRole("link", { name: "Overview" });
    expect(overview).toHaveAttribute("href", "/people");
    expect(overview).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText("Soon")).not.toBeInTheDocument();
  });
});

describe("ModuleDrawer — states", () => {
  it("is closed (and hidden from assistive tech) when no module is active", () => {
    render(<ModuleDrawer activeModuleKey={null} collapsed={false} selfServiceGroups={[]} />);
    const drawer = screen.getByLabelText("Module navigation", { selector: "aside" });
    expect(drawer).toHaveAttribute("data-state", "closed");
    expect(drawer).toHaveAttribute("aria-hidden", "true");
  });

  it("is closed when the rail has collapsed it, even with a module active", () => {
    render(<ModuleDrawer activeModuleKey="people-payroll" collapsed selfServiceGroups={[]} />);
    expect(screen.getByLabelText("People & Payroll module navigation", { selector: "aside" })).toHaveAttribute("data-state", "closed");
  });

  it("opens as a strip and the chevron pill expands it to the full panel and back", async () => {
    const user = userEvent.setup();
    render(<ModuleDrawer activeModuleKey="people-payroll" collapsed={false} selfServiceGroups={[]} />);
    const drawer = screen.getByLabelText("People & Payroll module navigation");
    expect(drawer).toHaveAttribute("data-state", "strip");

    await user.click(screen.getByRole("button", { name: "Expand module panel" }));
    expect(drawer).toHaveAttribute("data-state", "panel");

    await user.click(screen.getByRole("button", { name: "Collapse module panel" }));
    expect(drawer).toHaveAttribute("data-state", "strip");
  });

  it("lists POS & Retail Billing's Terminal, and opens it in its own full-screen window", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue({ focus: vi.fn() } as unknown as Window); // only .focus() is called on the opened window
    const user = userEvent.setup();
    render(<ModuleDrawer activeModuleKey="pos-retail-billing" collapsed={false} selfServiceGroups={[]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Terminal"]);
    const terminal = links[0];
    if (!terminal) throw new Error("Terminal link missing");
    expect(terminal).toHaveAttribute("href", "/pos/terminal");
    expect(terminal).toHaveAccessibleName("Terminal (opens in a new window)");
    expect(screen.queryByText("Coming soon")).not.toBeInTheDocument();

    await user.click(terminal);
    expect(open).toHaveBeenCalledWith("/pos/terminal", "boss-pos-terminal", expect.stringContaining("popup=yes"));
    open.mockRestore();
  });

  it("lists only the POS cash pages it is given, and badges 'Cash handed to me' with the waiting count", () => {
    const destinations = POS_RETAIL_BILLING_DESTINATIONS.filter((d) => !d.permissionKey || d.href === "/pos/cash/handovers");
    render(
      <ModuleDrawer
        activeModuleKey="pos-retail-billing"
        collapsed={false}
        selfServiceGroups={[]}
        posNav={{ destinations, pendingHandovers: 3 }}
      />,
    );
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/pos/terminal", "/pos/cash/handovers"]);
    expect(screen.getByLabelText("3 waiting")).toHaveTextContent("3");
  });

  it("shows no badge when the waiting count is unknown or zero", () => {
    const destinations = POS_RETAIL_BILLING_DESTINATIONS.filter((d) => d.href === "/pos/cash/handovers");
    const { rerender } = render(
      <ModuleDrawer activeModuleKey="pos-retail-billing" collapsed={false} selfServiceGroups={[]} posNav={{ destinations, pendingHandovers: null }} />,
    );
    expect(screen.queryByLabelText(/waiting/)).not.toBeInTheDocument();
    rerender(<ModuleDrawer activeModuleKey="pos-retail-billing" collapsed={false} selfServiceGroups={[]} posNav={{ destinations, pendingHandovers: 0 }} />);
    expect(screen.queryByLabelText(/waiting/)).not.toBeInTheDocument();
  });

  it("shows an honest coming-soon note for a module with no pages yet", () => {
    render(<ModuleDrawer activeModuleKey="inventory" collapsed={false} selfServiceGroups={[]} />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText(/Features for Inventory will land here/)).toBeInTheDocument();
  });

  it("renders the already-filtered self-service groups it is given, and nothing else", () => {
    render(
      <ModuleDrawer
        activeModuleKey="self-service-portal"
        collapsed={false}
        selfServiceGroups={[{ label: "Employee", items: [{ href: "/self-service/profile", label: "My Profile", icon: null }] }]}
      />,
    );
    expect(screen.getByRole("link", { name: "My Profile" })).toHaveAttribute("href", "/self-service/profile");
    expect(screen.getByText("EMPLOYEE")).toBeInTheDocument();
  });
});
