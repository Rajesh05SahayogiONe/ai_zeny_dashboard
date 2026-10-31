import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { NavItem } from "../types/workspace-context";
import { ModulesAtAGlance } from "./ModulesAtAGlance";

afterEach(() => cleanup());

const nav = (label: string, moduleKey?: string): NavItem => ({
  href: moduleKey ? `#${moduleKey}` : "/dashboard",
  label,
  icon: <img alt="" src="/x.svg" />,
  moduleKey,
});

const ITEMS: NavItem[] = [
  nav("Dashboard"),
  nav("People & Payroll", "people-payroll"),
  nav("Self-Service Portal", "self-service-portal"),
  nav("Inventory", "inventory"),
];

describe("ModulesAtAGlance", () => {
  it("shows one tile per module in the user's nav, and not the Dashboard entry", () => {
    render(<ModulesAtAGlance items={ITEMS} />);
    expect(screen.getByText("People & Payroll")).toBeInTheDocument();
    expect(screen.getByText("Self-Service Portal")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("marks modules that have a page Live and links them to it", () => {
    render(<ModulesAtAGlance items={ITEMS} />);
    const people = screen.getByRole("link", { name: /People & Payroll/ });
    expect(people).toHaveAttribute("href", "/people");
    expect(within(people).getByText("Live")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Self-Service Portal/ })).toHaveAttribute("href", "/self-service");
  });

  it("marks a module with no page Coming soon, as a tile that does not link anywhere", () => {
    render(<ModulesAtAGlance items={ITEMS} />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Inventory/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shows a short description for each module", () => {
    render(<ModulesAtAGlance items={ITEMS} />);
    expect(screen.getByText("Items, stock levels and movements")).toBeInTheDocument();
  });

  it("renders nothing when the user can see no modules", () => {
    const { container } = render(<ModulesAtAGlance items={[nav("Dashboard")]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is real data: carries no Sample data label", () => {
    render(<ModulesAtAGlance items={ITEMS} />);
    expect(screen.queryByText("Sample data")).not.toBeInTheDocument();
  });
});
