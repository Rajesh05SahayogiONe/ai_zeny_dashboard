import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { CalendarCard } from "./CalendarCard";
import { GreetingCard } from "./GreetingCard";

/**
 * Hydration safety for Setu's two date-dependent cards — the regression first
 * hit by the dashboard's earlier CalendarWidget (now replaced by CalendarCard),
 * which failed hydration on every dashboard load. Both are "use client" but also pre-rendered on the server, so
 * anything read from the clock during render is evaluated twice — against the
 * server's day, then the viewer's — and a mismatch fails hydration. The
 * contract: what the server emits (and the first client render must match) is
 * independent of the clock; the real date only appears after mount.
 */

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CalendarCard", () => {
  it("server-renders identically no matter what day the server clock is on", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-01-01T23:30:00Z"));
    const newYearsEve = renderToString(<CalendarCard />);

    vi.setSystemTime(new Date("2026-07-15T11:00:00Z"));
    const midJuly = renderToString(<CalendarCard />);

    expect(newYearsEve).toBe(midJuly);
    expect(newYearsEve).not.toMatch(/January|July|2026/);
  });

  it("reserves the full 6x7 grid before the date is known, so nothing shifts on mount", () => {
    const html = renderToString(<CalendarCard />);
    // 7 weekday headers + 42 day slots are in the pre-mount markup already.
    expect(html.match(/<span[^>]*aspect-square/g)).toHaveLength(42);
    expect(html).toContain("Mo");
    expect(html).toContain("Su");
  });

  it("shows the real month once mounted, highlighting the viewer's today", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0, 0)); // local 15 July 2026

    render(<CalendarCard />);

    expect(screen.getByText("July")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("15").className).toContain("bg-[var(--accent-solid)]");
  });

  it("pages between months after mount and offers a way back to today", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 15, 12, 0, 0));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CalendarCard />);

    expect(screen.queryByRole("button", { name: "Today" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("June")).toBeInTheDocument();
    expect(screen.queryByText("July")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByText("July")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next month"));
    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("September")).toBeInTheDocument();
  });

  it("rolls the year over when paging past December", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 11, 10, 12, 0, 0));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CalendarCard />);

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("January")).toBeInTheDocument();
    expect(screen.getByText("2027")).toBeInTheDocument();
  });
});

describe("GreetingCard", () => {
  it("server-renders identically at any hour of the server clock", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 6, 15, 8, 0, 0));
    const morning = renderToString(<GreetingCard name="Asha Verma" />);

    vi.setSystemTime(new Date(2026, 6, 15, 23, 0, 0));
    const night = renderToString(<GreetingCard name="Asha Verma" />);

    expect(morning).toBe(night);
    expect(morning).not.toMatch(/Good (Morning|Afternoon|Evening|Night)/);
    expect(morning).toContain("Asha Verma");
  });

  it.each([
    [8, "Good Morning,"],
    [14, "Good Afternoon,"],
    [18, "Good Evening,"],
    [23, "Good Night,"],
    [2, "Good Night,"],
  ])("greets the viewer for their local hour %i with %s once mounted", (hour, expected) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 6, 15, hour, 0, 0));

    render(<GreetingCard name="Asha Verma" />);

    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByText("Asha Verma")).toBeInTheDocument();
  });

  it("keeps a long unbroken name inside the card and shows it in full on hover", () => {
    const longName = "averyveryverylongusernamewithoutanyspaces2005";
    render(<GreetingCard name={longName} />);

    const nameLine = screen.getByText(longName);
    expect(nameLine).toHaveAttribute("title", longName);
    expect(nameLine.className).toContain("line-clamp-2");
    expect(nameLine.className).toContain("[overflow-wrap:anywhere]");
  });
});
