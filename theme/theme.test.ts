import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  parseThemeMode,
  readStoredThemeMode,
  resolveTheme,
} from "./theme";

describe("parseThemeMode", () => {
  it("accepts exactly the three modes", () => {
    expect(parseThemeMode("light")).toBe("light");
    expect(parseThemeMode("dark")).toBe("dark");
    expect(parseThemeMode("system")).toBe("system");
  });

  it("rejects anything else, including a missing value", () => {
    expect(parseThemeMode("Dark")).toBeNull();
    expect(parseThemeMode("")).toBeNull();
    expect(parseThemeMode("{}")).toBeNull();
    expect(parseThemeMode(null)).toBeNull();
    expect(parseThemeMode(undefined)).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("returns a fixed mode as-is and resolves system from the OS preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("readStoredThemeMode", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("reads a stored mode, and treats a blocked store as no preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredThemeMode()).toBe("dark");

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredThemeMode()).toBeNull();
  });
});

/**
 * An inline <script> executes inside jsdom's own window object, which is NOT
 * the test file's global (vitest copies jsdom's keys onto globalThis), so
 * matchMedia has to be defined on the real jsdom window — vitest exposes the
 * JSDOM instance as `globalThis.jsdom`. vi.stubGlobal only reaches the copy.
 */
function setMatchMedia(impl: unknown) {
  const dom: unknown = Reflect.get(globalThis, "jsdom");
  const win: unknown = typeof dom === "object" && dom !== null ? Reflect.get(dom, "window") : undefined;
  if (typeof win !== "object" || win === null) throw new Error("jsdom window not available");
  Object.defineProperty(win, "matchMedia", { value: impl, configurable: true, writable: true });
}

/** Run the script exactly as the browser does: as an inline <script> element (jsdom executes it synchronously). */
function runInitScript() {
  const el = document.createElement("script");
  el.textContent = THEME_INIT_SCRIPT;
  document.head.append(el);
  el.remove();
}

function runAt(path: string, { stored, osDark }: { stored?: string; osDark: boolean }) {
  window.history.pushState({}, "", path);
  window.localStorage.clear();
  if (stored !== undefined) window.localStorage.setItem(THEME_STORAGE_KEY, stored);
  setMatchMedia(() => ({ matches: osDark }));
  document.documentElement.classList.remove("dark");
  runInitScript();
  return document.documentElement.classList.contains("dark");
}

/**
 * The pre-paint script is a string that must mirror the functions above, so it
 * is executed here for real (against jsdom) rather than just string-matched.
 */
describe("THEME_INIT_SCRIPT", () => {
  afterEach(() => {
    setMatchMedia(undefined);
    document.documentElement.classList.remove("dark");
    window.history.pushState({}, "", "/");
  });

  it("applies a stored dark mode on a workspace route", () => {
    expect(runAt("/dashboard", { stored: "dark", osDark: false })).toBe(true);
  });

  it("applies a stored light mode even when the OS is dark", () => {
    expect(runAt("/people/employees", { stored: "light", osDark: true })).toBe(false);
  });

  it("follows the OS when the mode is system or nothing is stored", () => {
    expect(runAt("/dashboard", { stored: "system", osDark: true })).toBe(true);
    expect(runAt("/dashboard", { osDark: true })).toBe(true);
    expect(runAt("/dashboard", { osDark: false })).toBe(false);
  });

  it("ignores a corrupt stored value", () => {
    expect(runAt("/dashboard", { stored: "purple", osDark: false })).toBe(false);
  });

  it("never darkens login, the platform console or public onboarding", () => {
    expect(runAt("/login", { stored: "dark", osDark: true })).toBe(false);
    expect(runAt("/platform", { stored: "dark", osDark: true })).toBe(false);
    expect(runAt("/platform/tenants/abc", { stored: "dark", osDark: true })).toBe(false);
    expect(runAt("/onboarding/some-token", { stored: "dark", osDark: true })).toBe(false);
  });

  it("does not mistake a workspace route that merely shares a prefix for an excluded one", () => {
    expect(runAt("/loginhelp", { stored: "dark", osDark: false })).toBe(true);
  });

  it("never throws when storage and matchMedia are both unavailable", () => {
    window.history.pushState({}, "", "/dashboard");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setMatchMedia(undefined);
    expect(() => runInitScript()).not.toThrow();
    vi.restoreAllMocks();
  });
});
