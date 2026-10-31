import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import { THEME_STORAGE_KEY } from "../utils/theme";

/**
 * Theme switching: light / dark / system toggles the `dark` class on <html>,
 * "system" follows the OS preference live, the choice is persisted per browser
 * (localStorage, tolerant of a blocked or corrupt store), and leaving the
 * workspace removes the class again so login/platform never inherit dark.
 */

type MediaListener = (event: MediaQueryListEvent) => void;

/** A controllable stand-in for matchMedia("(prefers-color-scheme: dark)"). */
function stubSystemTheme(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<MediaListener>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return dark;
    },
    addEventListener: (_type: string, cb: MediaListener) => listeners.add(cb),
    removeEventListener: (_type: string, cb: MediaListener) => listeners.delete(cb),
  }));
  return {
    set(next: boolean) {
      dark = next;
      act(() => listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent)));
    },
    listenerCount: () => listeners.size,
  };
}

const isDark = () => document.documentElement.classList.contains("dark");

function ModeProbe() {
  const { mode, resolvedTheme } = useTheme();
  return <p data-testid="probe">{`${mode}/${resolvedTheme}`}</p>;
}

function renderWithToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
      <ModeProbe />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("defaults to system and follows the OS preference", () => {
    stubSystemTheme(true);
    renderWithToggle();
    expect(screen.getByTestId("probe")).toHaveTextContent("system/dark");
    expect(isDark()).toBe(true);
  });

  it("adds and removes the dark class as the toggle moves between modes", async () => {
    stubSystemTheme(false);
    const user = userEvent.setup();
    renderWithToggle();
    expect(isDark()).toBe(false);

    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(isDark()).toBe(true);
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Light theme" }));
    expect(isDark()).toBe(false);
    expect(screen.getByTestId("probe")).toHaveTextContent("light/light");
  });

  it("in system mode reacts live to the OS changing, and stops listening in a fixed mode", async () => {
    const system = stubSystemTheme(false);
    const user = userEvent.setup();
    renderWithToggle();
    expect(isDark()).toBe(false);
    expect(system.listenerCount()).toBe(1);

    system.set(true);
    expect(isDark()).toBe(true);
    system.set(false);
    expect(isDark()).toBe(false);

    await user.click(screen.getByRole("button", { name: "Light theme" }));
    expect(system.listenerCount()).toBe(0);
    system.set(true);
    expect(isDark()).toBe(false);
  });

  it("persists the chosen mode per browser", async () => {
    stubSystemTheme(false);
    const user = userEvent.setup();
    renderWithToggle();

    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Match system" }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
  });

  it("restores a stored mode on mount, even against the OS preference", () => {
    stubSystemTheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    renderWithToggle();
    expect(screen.getByTestId("probe")).toHaveTextContent("dark/dark");
    expect(isDark()).toBe(true);
    expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores a corrupt stored value and falls back to system", () => {
    stubSystemTheme(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "{not-a-theme");
    renderWithToggle();
    expect(screen.getByTestId("probe")).toHaveTextContent("system/light");
  });

  it("still works when localStorage throws (blocked storage / private mode)", async () => {
    stubSystemTheme(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const user = userEvent.setup();
    renderWithToggle();

    await user.click(screen.getByRole("button", { name: "Dark theme" }));
    expect(isDark()).toBe(true);
  });

  it("removes the dark class when it unmounts, so login and platform never inherit it", () => {
    stubSystemTheme(true);
    const { unmount } = renderWithToggle();
    expect(isDark()).toBe(true);
    unmount();
    expect(isDark()).toBe(false);
  });

  it("works where matchMedia does not exist, treating the system as light", () => {
    vi.stubGlobal("matchMedia", undefined);
    renderWithToggle();
    expect(screen.getByTestId("probe")).toHaveTextContent("system/light");
    expect(isDark()).toBe(false);
  });
});

describe("useTheme", () => {
  it("refuses to be used outside a ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ModeProbe />)).toThrow(/within a ThemeProvider/);
  });
});
