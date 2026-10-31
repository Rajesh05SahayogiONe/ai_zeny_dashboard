import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { KPITile } from "./KPITile";
import { SampleDataBadge } from "./SampleDataBadge";

/**
 * A tile backed by the dashboard's sample layer must say so on the tile
 * itself — the customer-facing guard against mistaking mock figures for real
 * ones. A tile with real data must not carry the label.
 */

afterEach(() => cleanup());

describe("KPITile sample-data label", () => {
  it("shows a visible Sample data label when the figure is sample data", () => {
    render(<KPITile title="Total Sales (FY)" value="₹18.46 Cr" status="healthy" sample />);
    expect(screen.getByText("Sample data")).toBeVisible();
  });

  it("does not show the label for real data", () => {
    render(<KPITile title="Open invoices" value="12" status="info" />);
    expect(screen.queryByText("Sample data")).not.toBeInTheDocument();
  });

  it("explains itself on hover", () => {
    render(<KPITile title="Cash in Bank" value="₹64.18 L" status="info" sample />);
    expect(screen.getByText("Sample data").closest("span")).toHaveAttribute(
      "title",
      "Illustrative sample data — not your figures",
    );
  });
});

describe("KPITile content", () => {
  it("renders title, value and note", () => {
    render(<KPITile title="Receivables" value="₹1.87 Cr" note="₹42.1 L overdue by 30+ days" status="warning" />);
    expect(screen.getByText("Receivables")).toBeInTheDocument();
    expect(screen.getByText("₹1.87 Cr")).toBeInTheDocument();
    expect(screen.getByText("₹42.1 L overdue by 30+ days")).toBeInTheDocument();
  });

  it("renders a trend chip only when a direction and value are both given", () => {
    const { rerender } = render(<KPITile title="Sales" value="1" status="healthy" trendDirection="up" trendValue="12.4%" />);
    expect(screen.getByText("12.4%")).toBeInTheDocument();

    rerender(<KPITile title="Sales" value="1" status="healthy" trendDirection="up" />);
    expect(screen.queryByText("12.4%")).not.toBeInTheDocument();
  });

  it("renders as a link only when it has somewhere to drill into", () => {
    const { rerender } = render(<KPITile title="Sales" value="1" status="healthy" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<KPITile title="Sales" value="1" status="healthy" drillHref="/somewhere" />);
    expect(screen.getByRole("link", { name: "Sales — view detail" })).toHaveAttribute("href", "/somewhere");
  });
});

describe("SampleDataBadge", () => {
  it("is plain text a screen reader reads", () => {
    render(<SampleDataBadge />);
    expect(screen.getByText("Sample data")).toBeInTheDocument();
  });
});
