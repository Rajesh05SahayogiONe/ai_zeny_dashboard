import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { INITIAL_CONVERSATIONS } from "../../api/assistant-mock/assistant-chats";
import { useAssistantChats } from "../../hooks/useAssistantChats";
import type { AssistantMode } from "../../types/assistant";
import { AssistantRegion } from "./AssistantRegion";

/**
 * The assistant region on Setu's structure: closed (zero-width, inert),
 * compact (docked, with an embedded history pane toggle), fullscreen (history
 * rail, collapsible), with expand / collapse / close controls.
 */

beforeAll(() => {
  // jsdom has no Element.scrollTo; the panel auto-scrolls on new messages.
  Element.prototype.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Harness({
  initial = "compact",
  random = () => 0.99,
}: {
  initial?: AssistantMode;
  random?: () => number;
}) {
  const [mode, setMode] = useState<AssistantMode>(initial);
  const chat = useAssistantChats({ random });
  return (
    <AssistantRegion
      mode={mode}
      conversations={chat.conversations}
      activeId={chat.activeId}
      activeConversation={chat.activeConversation}
      activeStatus={chat.activeStatus}
      onSelect={chat.handleSelect}
      onNewChat={chat.handleNewChat}
      onSend={chat.handleSend}
      onRegenerate={chat.handleRegenerate}
      onExpand={() => setMode("fullscreen")}
      onCollapse={() => setMode("compact")}
      onClose={() => setMode("closed")}
    />
  );
}

function region(container: HTMLElement) {
  const el = container.firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("region not rendered");
  return el;
}

describe("AssistantRegion modes", () => {
  it("closed: zero width, hidden and inert", () => {
    const { container } = render(<Harness initial="closed" />);
    const el = region(container);
    expect(el.style.flexBasis).toBe("0px");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveAttribute("inert");
  });

  it("compact: docked at clamp(20rem,28vw,26rem), not growing, with the history pane closed", () => {
    const { container } = render(<Harness />);
    const el = region(container);
    expect(el.style.flexBasis).toBe("clamp(20rem, 28vw, 26rem)");
    expect(el.style.flexGrow).toBe("0");
    expect(el).not.toHaveAttribute("inert");
    expect(screen.queryByRole("dialog", {name: "Chat history"})).not.toBeInTheDocument();
  });

  it("compact: history overlays the conversation and preserves the named header", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open chat history" }));

    const history = screen.getByRole("dialog", {name: "Chat history"});
    expect(within(history).getByRole("textbox", {name: "Find conversation"})).toHaveFocus();
    expect(screen.getByText("Boss Bridge")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand assistant" })).toBeInTheDocument();
    // Embedded pane is icon-only: one row per conversation, named for the tooltip/AT.
    expect(within(history).getByRole("button", { name: "Dashboard KPI overview" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close history" }));
    expect(screen.queryByRole("dialog", {name: "Chat history"})).not.toBeInTheDocument();
  });

  it("compact: choosing a conversation shows it and closes the history pane", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open chat history" }));
    await user.click(screen.getByRole("button", { name: "Running payroll" }));
    expect(screen.getByText("Where do I start a payroll run?")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", {name: "Chat history"})).not.toBeInTheDocument();
  });

  it("expand goes fullscreen: the region grows and the history rail shows grouped conversations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Expand assistant" }));

    const el = region(container);
    expect(el.style.flexGrow).toBe("1");
    expect(screen.getByRole("button", { name: "Collapse assistant" })).toBeInTheDocument();

    const rail = screen.getByLabelText("Chat history", { selector: "aside" });
    expect(rail.className).toContain("w-[200px]");
    expect(within(rail).getByText("Today")).toBeInTheDocument();
    expect(within(rail).getByText("Yesterday")).toBeInTheDocument();
    expect(within(rail).getByText("Previous 7 Days")).toBeInTheDocument();
    for (const conversation of INITIAL_CONVERSATIONS) {
      expect(within(rail).getByRole("button", { name: conversation.title })).toBeInTheDocument();
    }
  });

  it("fullscreen: the rail collapses to icons and expands back, never leaving fullscreen", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial="fullscreen" />);
    await user.click(screen.getByRole("button", { name: "Collapse chat history" }));
    expect(screen.getByLabelText("Chat history", { selector: "aside" }).className).toContain("w-[48px]");
    expect(region(container).style.flexGrow).toBe("1");

    await user.click(screen.getByRole("button", { name: "Expand chat history" }));
    expect(screen.getByLabelText("Chat history", { selector: "aside" }).className).toContain("w-[200px]");
  });

  it("fullscreen: the active conversation is marked in the rail", async () => {
    const user = userEvent.setup();
    render(<Harness initial="fullscreen" />);
    const rail = screen.getByLabelText("Chat history", { selector: "aside" });
    await user.click(within(rail).getByRole("button", { name: "Leave requests" }));
    expect(within(rail).getByRole("button", { name: "Leave requests" })).toHaveAttribute("aria-current", "true");
    expect(within(rail).getByRole("button", { name: "Running payroll" })).not.toHaveAttribute("aria-current");
  });

  it("fullscreen: the mobile history control opens a drawer, which closes on a conversation pick", async () => {
    const user = userEvent.setup();
    render(<Harness initial="fullscreen" />);
    expect(screen.getAllByLabelText("Chat history", { selector: "aside" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Open chat history" }));
    const asides = screen.getAllByLabelText("Chat history", { selector: "aside" });
    expect(asides).toHaveLength(2);
    await user.click(within(asides.at(-1) ?? document.body).getByRole("button", { name: "Running payroll" }));
    expect(screen.getAllByLabelText("Chat history", { selector: "aside" })).toHaveLength(1);
  });

  it("collapse returns to compact; close returns to closed", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initial="fullscreen" />);
    await user.click(screen.getByRole("button", { name: "Collapse assistant" }));
    expect(region(container).style.flexBasis).toBe("clamp(20rem, 28vw, 26rem)");
    await user.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(region(container).style.flexBasis).toBe("0px");
  });

  it("Escape closes the docked panel", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    await user.keyboard("{Escape}");
    expect(region(container).style.flexBasis).toBe("0px");
  });

  it("moves focus into the message input when opened", () => {
    render(<Harness initial="compact" />);
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus();
  });
});

describe("AssistantRegion conversation flow", () => {
  it("shows Setu's empty state for a new chat", () => {
    render(<Harness />);
    expect(screen.getByRole("heading", { name: "How can I help?" })).toBeInTheDocument();
    expect(screen.getByText("Ask about your workspace.")).toBeInTheDocument();
  });

  it("send: pending dots, then the reply; Enter sends and the input clears", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Message" });
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();

    await user.type(input, "hello there{Enter}");
    expect(screen.getByText("hello there")).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(screen.getByRole("status", { name: "Assistant is typing" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.queryByRole("status", { name: "Assistant is typing" })).not.toBeInTheDocument();
    expect(screen.getByText(/Here's a quick summary/)).toBeInTheDocument();
  });

  it("a failed reply shows the error bubble and Try again recovers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const draws = [0, 0.99];
    render(<Harness random={() => draws.shift() ?? 0.99} />);
    await user.type(screen.getByRole("textbox", { name: "Message" }), "hi{Enter}");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.getByText("Unable to generate a response.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });
    expect(screen.queryByText("Unable to generate a response.")).not.toBeInTheDocument();
    expect(screen.getByText(/Here's a quick summary/)).toBeInTheDocument();
  });

  it("New chat in the history rail returns to the empty state", async () => {
    const user = userEvent.setup();
    render(<Harness initial="fullscreen" />);
    const rail = screen.getByLabelText("Chat history", { selector: "aside" });
    await user.click(within(rail).getByRole("button", { name: "Running payroll" }));
    expect(screen.queryByRole("heading", { name: "How can I help?" })).not.toBeInTheDocument();
    await user.click(within(rail).getByRole("button", { name: "Start a new chat" }));
    expect(screen.getByRole("heading", { name: "How can I help?" })).toBeInTheDocument();
  });
});
