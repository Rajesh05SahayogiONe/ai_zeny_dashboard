export type Breadcrumb = {
  label: string;
  href?: string;
};

/**
 * Generates a default breadcrumb trail from the current pathname.
 * E.g., "/people/employees" -> ["Dashboard", "People & Payroll", "Employees"]
 */
export function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  if (!pathname) return [];
  // Ignore query params or hashes if passed in accidentally
  const cleanPath = pathname.split("?")[0]?.split("#")[0];
  if (!cleanPath) return [];
  const segments = cleanPath.split("/").filter(Boolean);

  // If we are at the root or just /dashboard, no breadcrumbs (or handled by component)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
    return [];
  }

  const breadcrumbs: Breadcrumb[] = [];
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    let label = formatSegmentLabel(segment);

    // If the path legitimately includes dashboard, we don't skip it, but typically it won't be needed
    // if we just follow segments. If segment is dashboard and it's the first, we can skip it to be safe.
    if (index === 0 && segment === "dashboard") {
      return;
    }

    const isLast = index === segments.length - 1;
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}

function formatSegmentLabel(segment: string): string {
  // Known overrides for better UX
  const overrides: Record<string, string> = {
    people: "People & Payroll",
    payroll: "Payroll",
    setup: "Setup Centre",
    admin: "Administration",
    crm: "Sales & CRM",
  };

  if (overrides[segment]) {
    return overrides[segment];
  }

  // Check if it's a UUID (very basic check) - usually we'd want to pass custom breadcrumbs
  // for entity pages to show the entity name, but this handles fallbacks.
  if (segment.length >= 32 && segment.includes("-")) {
    return "Details";
  }

  // Same for a Prisma cuid ("cmuug8oau…"): 20+ lowercase letters and digits,
  // with both present. Title-casing one put a raw role id at the end of the
  // role page's trail (retest 2026-10-05); no route segment looks like this.
  if (isIdLike(segment)) {
    return "Details";
  }

  // Convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isIdLike(segment: string): boolean {
  return /^[a-z0-9]{20,}$/.test(segment) && /[a-z]/.test(segment) && /\d/.test(segment);
}
