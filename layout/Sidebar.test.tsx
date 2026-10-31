import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NavItem } from "../types/workspace-context";
import { Sidebar } from "./Sidebar";

/**
 * The rail on Setu's structure: Dashboard navigates, a module entry with a
 * "#<moduleKey>" placeholder href opens its drawer, and the active marker
 * follows either the route or the open drawer.
 */

let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

afterEach(() => {
  cleanup();
  pathname = "/dashboard";
});

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <span /> },
  { href: "#people-payroll", label: "People & Payroll", icon: <span />, moduleKey: "people-payroll" },
  { href: "#inventory", label: "Inventory", icon: <span />, moduleKey: "inventory" },
];

describe("Sidebar (rail)", () => {
  it("renders Dashboard as a link and modules as drawer buttons", () => {
    render(<Sidebar items={ITEMS} activeModuleKey={null} onModuleClick={() => {}} />);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("button", { name: "People & Payroll" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inventory" })).toBeInTheDocument();
  });

  it("is labelled as the module navigation and carries the marker the drawer's outside-click skips", () => {
    render(<Sidebar items={ITEMS} activeModuleKey={null} onModuleClick={() => {}} />);
    const rail = screen.getByRole("complementary", { name: "Primary navigation" });
    expect(rail).toHaveAttribute("data-workspace-rail");
  });

  it("calls onModuleClick with the module key when a module is clicked", async () => {
    const onModuleClick = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar items={ITEMS} activeModuleKey={null} onModuleClick={onModuleClick} />);

    await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(onModuleClick).toHaveBeenCalledWith("inventory");
  });

  it("marks Dashboard active only on /dashboard", () => {
    const { rerender } = render(<Sidebar items={ITEMS} activeModuleKey={null} onModuleClick={() => {}} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

    pathname = "/people/employees";
    rerender(<Sidebar items={ITEMS} activeModuleKey={null} onModuleClick={() => {}} />);
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("marks the module whose drawer is open as the active one", () => {
    render(<Sidebar items={ITEMS} activeModuleKey="people-payroll" onModuleClick={() => {}} />);
    expect(screen.getByRole("button", { name: "People & Payroll" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Inventory" })).toHaveAttribute("aria-pressed", "false");
  });
});
