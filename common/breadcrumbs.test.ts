// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateBreadcrumbs } from "./breadcrumbs";

/**
 * The salary-assignments pages that don't pass explicit breadcrumbs (the
 * list, create and history pages) rely on this pathname-derived trail, so the
 * "salary-assignments" segment must render as the sidebar's own label,
 * "Salary Assignments" — the name ModuleDrawer, the list page's H1 and its
 * metadata title all use.
 */
describe("generateBreadcrumbs", () => {
  it('names /payroll/salary-assignments "Salary Assignments", matching the sidebar', () => {
    expect(generateBreadcrumbs("/payroll/salary-assignments")).toEqual([
      { label: "Payroll", href: "/payroll" },
      { label: "Salary Assignments", href: undefined },
    ]);
  });

  it("links back to Salary Assignments from the create and history sub-pages", () => {
    expect(generateBreadcrumbs("/payroll/salary-assignments/create?employeeId=e1")).toEqual([
      { label: "Payroll", href: "/payroll" },
      { label: "Salary Assignments", href: "/payroll/salary-assignments" },
      { label: "Create", href: undefined },
    ]);
    expect(generateBreadcrumbs("/payroll/salary-assignments/history")).toEqual([
      { label: "Payroll", href: "/payroll" },
      { label: "Salary Assignments", href: "/payroll/salary-assignments" },
      { label: "History", href: undefined },
    ]);
  });

  // Retest 2026-10-05: the role page's trail ended in "Cmuug8oau…", its id.
  it('names a cuid segment "Details" instead of title-casing the id', () => {
    expect(generateBreadcrumbs("/roles/cmuug8oau0001xyzab12cd34e")).toEqual([
      { label: "Roles", href: "/roles" },
      { label: "Details", href: undefined },
    ]);
    expect(generateBreadcrumbs("/platform/tenants/cmuug8oau0001xyzab12cd34e/users")).toEqual([
      { label: "Platform", href: "/platform" },
      { label: "Tenants", href: "/platform/tenants" },
      { label: "Details", href: "/platform/tenants/cmuug8oau0001xyzab12cd34e" },
      { label: "Users", href: undefined },
    ]);
  });

  it("still title-cases ordinary segments, including long or digit-bearing ones", () => {
    expect(generateBreadcrumbs("/setup/attendance-settings")).toEqual([
      { label: "Setup Centre", href: "/setup" },
      { label: "Attendance Settings", href: undefined },
    ]);
    expect(generateBreadcrumbs("/reports/form16")).toEqual([
      { label: "Reports", href: "/reports" },
      { label: "Form16", href: undefined },
    ]);
  });

  it("returns no trail for the dashboard or an empty path", () => {
    expect(generateBreadcrumbs("/dashboard")).toEqual([]);
    expect(generateBreadcrumbs("")).toEqual([]);
  });
});
