// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { lightClass, missingDarkVariants, scanSourceForMissingDark } from "./dark-variants";

/**
 * Dark-mode sweep 2026-10-06: 21 of 49 workspace pages hard-coded light palette
 * classes (bg-white, text-gray-*, bg-green-50 chips …) and looked half-light in
 * dark mode. Every such class now carries a `dark:` counterpart on the same
 * className (see lib/dark-variants.ts for the convention). This keeps new code
 * from regressing: add the counterpart next to the light class.
 *
 * Out of scope on purpose: app/onboarding (never dark — the theme init script
 * excludes it) and app/platform (the platform console has no theme).
 */

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Everything that renders inside the authenticated workspace. */
const WORKSPACE_ROOTS = [
  "modules/people-payroll",
  "modules/self-service-portal",
  "modules/workspace",
  "modules/administration",
  "modules/pos-retail-billing",
  "modules/sales-crm",
  "modules/procurement",
  "modules/inventory",
  "app/(workspace)",
  // The POS terminal runs outside the shell but follows the same theme.
  "app/(terminal)",
  "components",
  // Shared table primitives (Pagination) render inside workspace pages too.
  // Note: Tailwind only scans apps/web, so a dark: class used here must also
  // appear somewhere in apps/web to be generated.
  "../../packages/common/ui",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe("dark: counterparts for hard-coded light classes", () => {
  it("every workspace file pairs a light palette class with a dark: class on the same string", () => {
    const offenders = WORKSPACE_ROOTS.flatMap((root) => sourceFiles(path.join(webRoot, root)))
      .flatMap((file) => {
        const rel = path.relative(webRoot, file).split(path.sep).join("/");
        return scanSourceForMissingDark(readFileSync(file, "utf8")).map((o) => `${rel}:${o.line} ${o.token}`);
      });

    expect(offenders).toEqual([]);
  });
});

describe("lightClass / missingDarkVariants", () => {
  it("maps surfaces, text and borders onto Setu's tokens", () => {
    expect(lightClass("bg-white")?.dark).toBe("dark:bg-[var(--surface)]");
    expect(lightClass("bg-gray-50")?.dark).toBe("dark:bg-[var(--surface-muted)]");
    expect(lightClass("text-gray-900")?.dark).toBe("dark:text-[var(--text-heading)]");
    expect(lightClass("text-gray-600")?.dark).toBe("dark:text-[var(--text-secondary)]");
    expect(lightClass("text-gray-500")?.dark).toBe("dark:text-[var(--text-muted)]");
    expect(lightClass("border-gray-200")?.dark).toBe("dark:border-[var(--divider)]");
    expect(lightClass("divide-gray-100")?.dark).toBe("dark:divide-[var(--divider)]");
  });

  it("maps status chips onto the status tokens and keeps variants and alpha", () => {
    expect(lightClass("bg-green-50")?.dark).toBe("dark:bg-[var(--status-healthy-bg)]");
    expect(lightClass("text-amber-800")?.dark).toBe("dark:text-[var(--status-warning-fg)]");
    expect(lightClass("bg-red-50")?.dark).toBe("dark:bg-[var(--status-critical-bg)]");
    expect(lightClass("text-blue-700")?.dark).toBe("dark:text-[var(--status-info-fg)]");
    expect(lightClass("hover:bg-gray-50")?.dark).toBe("dark:hover:bg-[var(--surface-muted)]");
    expect(lightClass("bg-gray-50/50")?.dark).toBe("dark:bg-[var(--surface-muted)]/50");
    expect(lightClass("bg-violet-50")?.dark).toBe("dark:bg-violet-500/15");
  });

  it("leaves solid accents, 500-level text and existing dark: classes alone", () => {
    for (const token of ["bg-blue-600", "bg-red-500", "text-red-500", "text-white", "dark:bg-white", "border-red-500"]) {
      expect(lightClass(token)).toBeNull();
    }
  });

  it("reports only the classes whose counterpart is missing", () => {
    expect(missingDarkVariants("bg-white text-gray-900 dark:text-[var(--text-heading)]")).toEqual(["bg-white"]);
    expect(missingDarkVariants("hover:bg-gray-50 dark:bg-[var(--surface-muted)]")).toEqual(["hover:bg-gray-50"]);
    expect(missingDarkVariants("bg-white dark:bg-[var(--surface)]")).toEqual([]);
  });

  it("judges each branch of a conditional on its own and ignores comments", () => {
    const source = [
      '// a bg-white comment is fine',
      'const a = ok ? "bg-green-50 dark:bg-[var(--status-healthy-bg)]" : "bg-red-50";',
    ].join("\n");
    expect(scanSourceForMissingDark(source)).toEqual([{ token: "bg-red-50", line: 2 }]);
  });
});
