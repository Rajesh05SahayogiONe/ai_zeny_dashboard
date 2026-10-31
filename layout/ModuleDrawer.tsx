"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { moduleLabel } from "../constants/module-labels";
import { PEOPLE_PAYROLL_DESTINATIONS } from "../constants/people-payroll-destinations";
import { POS_RETAIL_BILLING_DESTINATIONS, type PosRetailBillingDestination } from "../constants/pos-retail-billing-destinations";
import type { NavGroup } from "../types/workspace-context";
import { openFullScreenWindow } from "@/lib/open-window";
import { cn } from "@/lib/utils";

/**
 * Secondary panel that opens beside the rail when a module icon is clicked,
 * rebuilt on Setu's tokens/classes (surface, divider, card radius/shadow) while
 * keeping Boss's two-step width model:
 *   - It opens as a 2.75rem strip; the chevron pill in the head expands it to
 *     the full 13.125rem panel (the chevron rotates, the title fades in).
 *   - The expansion resets whenever the active module changes.
 *   - A mousedown outside the drawer collapses it back to the strip — except
 *     inside the rail (`[data-workspace-rail]`), which owns its own toggle.
 * `data-state` ("closed" | "strip" | "panel") is also what WorkspaceBody's
 * <main> keys its left offset off, via Tailwind's `peer-data-*`.
 *
 * Below `screen-sm` the rail is a bottom tab bar, so the drawer becomes a sheet
 * above it (always full-width — the strip/pill only exist from `screen-sm` up).
 */
const EXPANDED_STORAGE_KEY = "boss.workspace.drawerExpanded";

/** What the POS entry needs beyond the module key: the pages this caller may open, and the waiting-handover badge. */
export interface PosDrawerNav {
  destinations: readonly PosRetailBillingDestination[];
  /** Null when it could not be read: no badge rather than a made-up 0 (owner decision D7). */
  pendingHandovers: number | null;
}

/** Without a `posNav` only the destinations that need no permission (the terminal) are listed. */
const DEFAULT_POS_NAV: PosDrawerNav = {
  destinations: POS_RETAIL_BILLING_DESTINATIONS.filter((destination) => !destination.permissionKey),
  pendingHandovers: null,
};

export function ModuleDrawer({
  activeModuleKey,
  collapsed,
  selfServiceGroups,
  posNav = DEFAULT_POS_NAV,
}: {
  activeModuleKey: string | null;
  /** Hidden entirely — the rail's toggle, persisted across navigation. */
  collapsed: boolean;
  /** Already permission-filtered (WorkspaceShell.tsx) — self-service-portal's
   *  drawer content, same pattern as PeopleAndPayrollNav but data-driven
   *  since its items vary per-employee's actual grants. */
  selfServiceGroups: NavGroup[];
  /** Already permission-filtered (WorkspaceShell.tsx) — POS & Retail Billing's drawer content. */
  posNav?: PosDrawerNav;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (raw) setExpanded(JSON.parse(raw) === true);
    } catch {
      // Ignore corrupt/stale localStorage payloads.
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [expanded, isMounted]);

  const prevModuleKey = useRef(activeModuleKey);

  // Switching to a different module collapses the drawer so a wide panel
  // doesn't follow the user. The initial mount is ignored.
  useEffect(() => {
    if (!isMounted) return;
    if (prevModuleKey.current !== null && activeModuleKey !== null && prevModuleKey.current !== activeModuleKey) {
      setExpanded(false);
    }
    prevModuleKey.current = activeModuleKey;
  }, [activeModuleKey, isMounted]);

  useEffect(() => {
    if (!expanded) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || drawerRef.current?.contains(target)) return;
      // A rail icon click is a module switch, not a dismiss — let the rail's
      // own handler decide, rather than racing it to collapse first.
      if (target.closest("[data-workspace-rail]")) return;
      setExpanded(false);
    }

    // Capture phase, so a child that stops propagation can't trap it open.
    document.addEventListener("mousedown", handlePointerDown, true);
    return () => document.removeEventListener("mousedown", handlePointerDown, true);
  }, [expanded]);

  const open = Boolean(activeModuleKey) && !collapsed;
  const label = activeModuleKey ? moduleLabel(activeModuleKey) : null;
  const state = !open ? "closed" : expanded ? "panel" : "strip";

  // The <aside> stays in the DOM even when closed (display:none) so switching
  // modules doesn't reflow the body around a node appearing and disappearing.
  return (
    <aside
      ref={drawerRef}
      data-state={state}
      aria-label={label ? `${label} module navigation` : "Module navigation"}
      aria-hidden={!open}
      className="
        peer
        group/drawer
        no-scrollbar
        fixed inset-x-2 bottom-[4.5rem] z-30
        flex max-h-[60dvh] flex-col
        overflow-y-auto overflow-x-hidden overscroll-y-contain
        rounded-[var(--card-radius)] border border-[var(--divider)]
        bg-[var(--surface)] shadow-xl
        data-[state=closed]:hidden

        screen-sm:absolute
        screen-sm:inset-x-auto screen-sm:bottom-auto
        screen-sm:left-0 screen-sm:top-0
        screen-sm:z-20
        screen-sm:h-max screen-sm:max-h-full screen-sm:min-h-full
        screen-sm:w-[220px]
        screen-sm:shadow-none screen-sm:rounded-none screen-sm:border-0 screen-sm:border-r
        screen-sm:transition-[width] screen-sm:duration-200
        data-[state=strip]:screen-sm:w-[48px]
        data-[state=strip]:screen-sm:overflow-visible
      "
    >
      {open && label && (
        <>
          <header
            className="
              flex w-full items-center justify-between gap-3
              px-3 pb-2 pt-3
              group-data-[state=strip]/drawer:screen-sm:justify-start
              group-data-[state=strip]/drawer:screen-sm:gap-0
              group-data-[state=strip]/drawer:screen-sm:px-[0.625rem]
            "
          >
            <span
              className="
                min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--text-heading)]
                transition-opacity duration-200
                group-data-[state=strip]/drawer:screen-sm:opacity-0
              "
            >
              {label}
            </span>
            <button
              type="button"
              className="
                hidden h-8 w-8 shrink-0 items-center justify-center rounded-md
                text-[var(--text-muted)]
                transition-colors hover:bg-[var(--search-bg)]
                screen-sm:inline-flex
              "
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse module panel" : "Expand module panel"}
              title={expanded ? "Collapse" : "Expand"}
            >
              <svg
                className={cn("transition-transform duration-200", expanded && "rotate-180")}
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </header>

          <div
            className="
              flex flex-1 flex-col gap-0.5 p-2
              group-data-[state=strip]/drawer:screen-sm:items-center
              group-data-[state=strip]/drawer:screen-sm:px-[0.3125rem]
            "
          >
            {activeModuleKey === "people-payroll" ? (
              <PeopleAndPayrollNav pathname={pathname} />
            ) : activeModuleKey === "self-service-portal" ? (
              <SelfServicePortalNav groups={selfServiceGroups} pathname={pathname} />
            ) : activeModuleKey === "pos-retail-billing" ? (
              <PosRetailBillingNav pathname={pathname} nav={posNav} />
            ) : (
              <DrawerEmpty title="Coming soon" description={`Features for ${label} will land here as they ship.`} />
            )}
          </div>
        </>
      )}
    </aside>
  );
}

// ─── Sub-sidebar implementations ─────────────────────────────────────────────

/** Coming-soon placeholder — hidden in the strip, which has no room for it. */
function DrawerEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-[0.625rem] border border-dashed border-[var(--divider)] px-4 py-[1.125rem] text-center group-data-[state=strip]/drawer:screen-sm:hidden">
      <p className="mb-1 text-[0.8125rem] font-semibold text-[var(--text-heading)]">{title}</p>
      <p className="text-[0.71875rem] leading-snug text-[var(--text-muted)]">{description}</p>
    </div>
  );
}

function NavSectionTitle({ title }: { title: string }) {
  return (
    <li className="mb-1 mt-4 px-3 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--text-muted)] group-data-[state=strip]/drawer:screen-sm:hidden">
      {title}
    </li>
  );
}

const DRAWER_LIST =
  "m-0 flex list-none flex-col gap-px p-0 group-data-[state=strip]/drawer:screen-sm:w-full group-data-[state=strip]/drawer:screen-sm:items-center";

/** 18px stroke icon shell shared by the People & Payroll and POS entries below. */
function DrawerIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// Icons by destination href; the list itself (labels, order, headings) is
// PEOPLE_PAYROLL_DESTINATIONS, shared with the header search.
const PEOPLE_PAYROLL_ICONS: Record<string, React.ReactNode> = {
  "/people": (
    <DrawerIcon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </DrawerIcon>
  ),
  "/people/employees": (
    <DrawerIcon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </DrawerIcon>
  ),
  "/people/onboarding-pipeline": (
    <DrawerIcon>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14h6" />
      <path d="M9 10h6" />
    </DrawerIcon>
  ),
  "/payroll/attendance": (
    <DrawerIcon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </DrawerIcon>
  ),
  "/payroll/leave-requests": (
    <DrawerIcon>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </DrawerIcon>
  ),
  "/payroll/run": (
    <DrawerIcon>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </DrawerIcon>
  ),
  "/payroll/salary-advances": (
    <DrawerIcon>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </DrawerIcon>
  ),
  "/payroll/reimbursements": (
    <DrawerIcon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </DrawerIcon>
  ),
  "/payroll/salary-assignments": (
    <DrawerIcon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <rect x="17" y="11" width="5" height="5" rx="1" />
      <path d="M19.5 16v5" />
      <path d="M17 18.5h5" />
    </DrawerIcon>
  ),
  "/payroll/leave-balances": (
    <DrawerIcon>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </DrawerIcon>
  ),
  "/payroll/leave-encashment": (
    <DrawerIcon>
      <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </DrawerIcon>
  ),
};

function PeopleAndPayrollNav({ pathname }: { pathname: string }) {
  return (
    <ul className={DRAWER_LIST}>
      {PEOPLE_PAYROLL_DESTINATIONS.map((destination, index) => {
        const previous = PEOPLE_PAYROLL_DESTINATIONS[index - 1];
        const startsSection = destination.section !== null && destination.section !== previous?.section;
        return (
          <Fragment key={destination.href}>
            {startsSection && destination.section && <NavSectionTitle title={destination.section} />}
            <NavItem
              href={destination.href}
              label={destination.label}
              pathname={pathname}
              exact={destination.exact}
              icon={PEOPLE_PAYROLL_ICONS[destination.href]}
            />
          </Fragment>
        );
      })}
    </ul>
  );
}

// Icons by destination href; the list itself is POS_RETAIL_BILLING_DESTINATIONS,
// shared with the header search.
const POS_RETAIL_BILLING_ICONS: Record<string, React.ReactNode> = {
  "/pos/cash/shifts": (
    <DrawerIcon>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01" />
      <path d="M18 12h.01" />
    </DrawerIcon>
  ),
  "/pos/cash/handovers": (
    <DrawerIcon>
      <path d="M11 17l2 2 6-6" />
      <path d="M3 7h12" />
      <path d="M3 12h6" />
      <path d="M3 17h4" />
    </DrawerIcon>
  ),
  "/pos/cash/day": (
    <DrawerIcon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </DrawerIcon>
  ),
  "/pos/cash/days": (
    <DrawerIcon>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </DrawerIcon>
  ),
  "/pos/terminal": (
    <DrawerIcon>
      <rect x="2" y="3" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 16v5" />
      <path d="M7 8h6" />
      <path d="M7 11h4" />
    </DrawerIcon>
  ),
};

/** pos-retail-billing's drawer content: one flat list, no section headings yet. */
function PosRetailBillingNav({ pathname, nav }: { pathname: string; nav: PosDrawerNav }) {
  return (
    <ul className={DRAWER_LIST}>
      {nav.destinations.map((destination) => (
        <NavItem
          key={destination.href}
          href={destination.href}
          label={destination.label}
          pathname={pathname}
          icon={POS_RETAIL_BILLING_ICONS[destination.href]}
          windowName={destination.windowName}
          badge={destination.pendingHandoversBadge ? nav.pendingHandovers : null}
        />
      ))}
    </ul>
  );
}

/** self-service-portal's drawer content — same visual pattern as
 *  PeopleAndPayrollNav (grouped sections, NavSectionTitle + NavItem), but
 *  data-driven from `groups` (already permission-filtered per-employee in
 *  WorkspaceShell.tsx via filterNavGroups) instead of one hardcoded list,
 *  since which items an employee sees genuinely varies by their own grants
 *  — unlike people-payroll's admin-facing drawer, where "ready" alone
 *  decides visibility. */
function SelfServicePortalNav({ groups, pathname }: { groups: NavGroup[]; pathname: string }) {
  if (groups.length === 0) {
    return <DrawerEmpty title="Nothing to show yet" description="Self-service features will appear here once granted." />;
  }

  return (
    <ul className={DRAWER_LIST}>
      {groups.map((group) => (
        <Fragment key={group.label}>
          <NavSectionTitle title={group.label.toUpperCase()} />
          {group.items.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} pathname={pathname} icon={item.icon} />
          ))}
        </Fragment>
      ))}
    </ul>
  );
}

function NavItem({
  href,
  label,
  pathname,
  icon,
  ready = true,
  exact = false,
  windowName,
  badge = null,
}: {
  href: string;
  label: string;
  pathname: string;
  icon: React.ReactNode;
  /** False for routes with no page yet — kept visible (parity with the rail)
   * but non-navigating, since following the link would 404 outside the
   * workspace layout and take the whole shell down with it. */
  ready?: boolean;
  /** Active only on this exact path — for an entry (Overview at /people) whose
   *  path is a prefix of its siblings' paths. */
  exact?: boolean;
  /** Open in its own full-screen window of this name (the POS terminal)
   *  rather than navigating the workspace. A modified click (new tab) is left
   *  to the browser. */
  windowName?: string;
  /** A count shown as a pill (the waiting handovers); null or 0 shows nothing. */
  badge?: number | null;
}) {
  const isActive = ready && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <li>
      <Link
        href={ready ? href : "#"}
        data-active={isActive ? "true" : undefined}
        data-disabled={ready ? undefined : "true"}
        aria-disabled={!ready}
        aria-current={isActive ? "page" : undefined}
        aria-label={windowName ? `${label} (opens in a new window)` : undefined}
        onClick={(event) => {
          if (!ready) {
            event.preventDefault();
            return;
          }
          if (!windowName) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          openFullScreenWindow(href, windowName);
        }}
        className={cn(
          `
            group/item relative flex items-center gap-2 rounded-md px-2 py-[9px]
            text-xs font-medium tracking-[-0.003em] text-[var(--text-secondary)]
            transition-colors hover:bg-[var(--search-bg)] hover:text-[var(--text-heading)]

            group-data-[state=strip]/drawer:screen-sm:h-[2.125rem]
            group-data-[state=strip]/drawer:screen-sm:w-[2.125rem]
            group-data-[state=strip]/drawer:screen-sm:justify-center
            group-data-[state=strip]/drawer:screen-sm:overflow-visible
            group-data-[state=strip]/drawer:screen-sm:p-0
          `,
          isActive && "bg-[var(--search-bg)] font-semibold text-[var(--sidebar-active)]",
          !ready && "cursor-not-allowed opacity-60 hover:bg-transparent",
        )}
      >
        <span
          className={cn(
            "flex w-[1.125rem] shrink-0 items-center justify-center opacity-60 transition-opacity group-hover/item:opacity-100",
            isActive && "opacity-100",
          )}
        >
          {icon}
        </span>
        {/* In the strip the label becomes a tooltip that slides out to the right on hover. */}
        <span
          className="
            flex-1 leading-[1.3]

            group-data-[state=strip]/drawer:screen-sm:pointer-events-none
            group-data-[state=strip]/drawer:screen-sm:invisible
            group-data-[state=strip]/drawer:screen-sm:absolute
            group-data-[state=strip]/drawer:screen-sm:left-full
            group-data-[state=strip]/drawer:screen-sm:top-1/2
            group-data-[state=strip]/drawer:screen-sm:z-50
            group-data-[state=strip]/drawer:screen-sm:-translate-y-1/2
            group-data-[state=strip]/drawer:screen-sm:translate-x-2
            group-data-[state=strip]/drawer:screen-sm:whitespace-nowrap
            group-data-[state=strip]/drawer:screen-sm:rounded-md
            group-data-[state=strip]/drawer:screen-sm:bg-[var(--accent-solid)]
            group-data-[state=strip]/drawer:screen-sm:px-3
            group-data-[state=strip]/drawer:screen-sm:py-1.5
            group-data-[state=strip]/drawer:screen-sm:font-medium
            group-data-[state=strip]/drawer:screen-sm:text-white
            group-data-[state=strip]/drawer:screen-sm:opacity-0
            group-data-[state=strip]/drawer:screen-sm:shadow-lg
            group-data-[state=strip]/drawer:screen-sm:transition-all
            group-data-[state=strip]/drawer:screen-sm:duration-200
            group-data-[state=strip]/drawer:group-hover/item:screen-sm:visible
            group-data-[state=strip]/drawer:group-hover/item:screen-sm:translate-x-3
            group-data-[state=strip]/drawer:group-hover/item:screen-sm:opacity-100
          "
        >
          {label}
        </span>
        {badge !== null && badge > 0 && (
          <span
            aria-label={`${badge} waiting`}
            className="shrink-0 rounded-full bg-[var(--accent-solid)] px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-white group-data-[state=strip]/drawer:screen-sm:absolute group-data-[state=strip]/drawer:screen-sm:right-0 group-data-[state=strip]/drawer:screen-sm:top-0"
          >
            {badge}
          </span>
        )}
        {!ready && (
          <span className="shrink-0 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[0.59375rem] font-semibold uppercase tracking-[0.04em] text-[var(--text-muted)] group-data-[state=strip]/drawer:screen-sm:hidden">
            Soon
          </span>
        )}
        {windowName && (
          // "Opens in its own window" — the panel's only cue that this entry leaves the workspace.
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0 opacity-50 group-data-[state=strip]/drawer:screen-sm:hidden"
          >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        )}
      </Link>
    </li>
  );
}
