import type { ReactNode } from "react";

/** Wraps a GET form of filter controls, modeled on the reference's `.items-filters`
 *  bar (search + selects + date range + Filter/Clear + an export link on the right). */
export function FilterBar({
  action,
  children,
  trailing,
}: {
  action: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <form method="GET" action={action} className="mb-4 flex flex-wrap items-center gap-2">
      {children}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </form>
  );
}
