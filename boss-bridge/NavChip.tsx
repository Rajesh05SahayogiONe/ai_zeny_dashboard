import type { ReactNode } from "react";

/** Rail icon: a tinted chip carrying a stroke icon, using the same tokens as the KPI tiles so it follows light/dark. */
export function NavChip({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-lg"
      style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}
    >
      {children}
    </span>
  );
}
