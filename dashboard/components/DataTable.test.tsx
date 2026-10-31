import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type Column } from "./DataTable";

afterEach(() => cleanup());

interface Row {
  id: string;
  name: string;
  n: number;
}

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name, sortValue: (r) => r.name },
  { key: "n", header: "Count", render: (r) => String(r.n), sortValue: (r) => r.n },
  { key: "plain", header: "Plain", render: () => "-" },
];

const ROWS: Row[] = [
  { id: "1", name: "Bravo", n: 2 },
  { id: "2", name: "Alpha", n: 10 },
  { id: "3", name: "Charlie", n: 1 },
];

/** First-column cell text of each body row, in order. */
function names(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent ?? "");
}

describe("DataTable", () => {
  it("keeps the given order until a header is clicked", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    expect(names()).toEqual(["Bravo", "Alpha", "Charlie"]);
  });

  it("sorts ascending on the first click, descending on the second, with an arrow", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);

    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(names()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(screen.getByRole("button", { name: /Name/ })).toHaveTextContent("↑");

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(names()).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(screen.getByRole("button", { name: /Name/ })).toHaveTextContent("↓");
  });

  it("sorts numbers numerically (10 after 2, not before)", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    await user.click(screen.getByRole("button", { name: "Count" }));
    expect(names()).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("restarts at ascending when a different column is chosen", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    await user.click(screen.getByRole("button", { name: "Name" }));
    await user.click(screen.getByRole("button", { name: /Name/ }));
    await user.click(screen.getByRole("button", { name: "Count" }));
    expect(names()).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("disables the header of a column that has no sort value", () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} />);
    expect(screen.getByRole("button", { name: "Plain" })).toBeDisabled();
  });

  it("shows the empty title and description when there are no rows", () => {
    render(
      <DataTable columns={COLUMNS} rows={[]} getRowKey={(r) => r.id} emptyTitle="Nothing yet" emptyDescription="Check back later." />,
    );
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    expect(screen.getByText("Check back later.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("pages rows and disables Prev/Next at the ends", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} pageSize={2} />);
    expect(names()).toEqual(["Bravo", "Alpha"]);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(names()).toEqual(["Charlie"]);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("calls onRowClick with the clicked row", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={COLUMNS} rows={ROWS} getRowKey={(r) => r.id} onRowClick={onRowClick} />);
    await user.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[1]);
  });
});
