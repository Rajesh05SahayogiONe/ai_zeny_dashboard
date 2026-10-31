import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog, type ConfirmOutcome } from "./confirm-dialog";

/**
 * The app's replacement for native confirm()/alert() (UI test 2026-10-05):
 * a refusal stays readable in the dialog, success closes it, and it can't be
 * submitted twice while the action runs.
 */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Harness({ onConfirm }: { onConfirm: () => Promise<ConfirmOutcome> }) {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete this department?"
      description='"Engineering" will be deleted.'
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      destructive
      onConfirm={onConfirm}
    />
  );
}

describe("ConfirmDialog", () => {
  it("closes once the action succeeds", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("stays open and shows the refusal when the action fails", async () => {
    const onConfirm = vi.fn().mockResolvedValue({ ok: false, error: "Department is still in use" });
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Department is still in use");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a thrown error's message instead of failing silently", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable");
  });

  it("disables both buttons while the action runs, so a double click sends it once", async () => {
    let resolve!: (value: ConfirmOutcome) => void;
    const onConfirm = vi.fn(() => new Promise<ConfirmOutcome>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    const dialog = screen.getByRole("dialog");
    await user.dblClick(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await within(dialog).findByRole("button", { name: /deleting/i })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(onConfirm).toHaveBeenCalledTimes(1);

    resolve({ ok: true });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not run the action when cancelled", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<Harness onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
