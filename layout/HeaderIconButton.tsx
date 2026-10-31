import type { ReactNode } from "react";

/** Setu's header IconButton, as a class string shared by the header's icon
 *  controls (the button, and the Setup Centre link). */
export const HEADER_ICON_BUTTON_CLASS =
  "tap-pop flex h-[2.875rem] w-[2.875rem] shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 hover:bg-[var(--search-bg)]";

/** Setu's header IconButton: a transparent 2.875rem square that tints and
 *  scales slightly on hover. */
export function HeaderIconButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick?: () => void;
  /** Set on a button that opens a panel, so assistive tech hears its state. */
  expanded?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={HEADER_ICON_BUTTON_CLASS}
    >
      {children}
    </button>
  );
}
