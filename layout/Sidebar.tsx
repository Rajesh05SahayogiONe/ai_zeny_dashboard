"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "../types/workspace-context";
import { WORKSPACE_ROUTES } from "../routes";
import { BrandLogo } from "./BrandLogo";
import { APP_NAME } from "../constants/brand";

const INDICATOR_COLOR = "var(--sidebar-active)";

/** A module item with no real page yet (href is the "#<moduleKey>" placeholder
 *  — navConfig.tsx) opens the drawer instead of navigating. */
function opensDrawer(item: NavItem): boolean {
  return Boolean(item.moduleKey) && item.href.startsWith("#");
}

/**
 * The icon rail — Setu's shell structure (fixed bottom tab bar below
 * `screen-sm`, a side rail from `screen-sm` up, an animated active-indicator
 * bar, icon + label per item) carrying Boss's items.
 *
 * Boss has ~19 entries, far more than Setu's 3-7, so the nav column scrolls
 * (scrollbar hidden, as in Setu) and the indicator lives INSIDE the scrolling
 * nav so it travels with the item it marks. This replaces the old "Show
 * more" overflow popover.
 */
export function Sidebar({
  items,
  activeModuleKey,
  routeModuleKey,
  onModuleClick,
}: {
  items: NavItem[];
  activeModuleKey: string | null;
  routeModuleKey?: string | null;
  onModuleClick: (key: string) => void;
}) {
  const pathname = usePathname();
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);

  function isActive(item: NavItem): boolean {
    if (opensDrawer(item)) return item.moduleKey === (activeModuleKey ?? routeModuleKey);
    return item.href === WORKSPACE_ROUTES.dashboard ? pathname === item.href : pathname.startsWith(item.href);
  }

  const activeIndex = items.findIndex(isActive);

  useEffect(() => {
    function measure() {
      const el = iconRefs.current[activeIndex];
      setIndicator(el ? { top: el.offsetTop, height: el.offsetHeight } : null);
    }
    measure();
    // Not every environment has it (jsdom doesn't); the rail still works.
    iconRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, items.length]);

  return (
    <aside
      className="
        fixed inset-x-0 bottom-0 z-40
        flex h-[4rem] w-full
        flex-row items-center justify-around
        gap-1 overflow-x-auto
        bg-[var(--shell-bg)]
        px-1 py-1
        no-scrollbar

        screen-sm:relative
        screen-sm:h-full
        screen-sm:w-[var(--sidebar-w)]
        screen-sm:flex-col
        screen-sm:items-center
        screen-sm:justify-start
        screen-sm:gap-1
        screen-sm:overflow-visible
        screen-sm:px-0
        screen-sm:py-0
      "
      aria-label="Primary navigation"
      // The module drawer's outside-click dismissal skips anything inside this.
      data-workspace-rail=""
    >
      {/* Logo — the header carries it below screen-sm, where the rail is a bottom bar. */}
      <Link
        href={WORKSPACE_ROUTES.dashboard}
        aria-label={`${APP_NAME} dashboard`}
        className="hidden w-full shrink-0 items-center justify-center screen-sm:flex screen-sm:h-[var(--header-h)]"
      >
        <BrandLogo className="h-[2.25rem] w-[2.25rem]" />
      </Link>

      <nav
        className="
          relative
          flex
          w-full
          flex-row
          items-center
          justify-around
          gap-1
          no-scrollbar

          screen-sm:min-h-0
          screen-sm:flex-1
          screen-sm:flex-col
          screen-sm:justify-start
          screen-sm:gap-2.5
          screen-sm:overflow-y-auto
          screen-sm:overflow-x-hidden
          screen-sm:px-1
          screen-sm:pt-1
        "
      >
        {/* Active indicator */}
        {indicator && (
          <span
            aria-hidden="true"
            data-testid="rail-indicator"
            className="hidden screen-sm:block absolute left-0 w-1 rounded-full transition-all duration-300 ease-out"
            style={{ top: indicator.top, height: indicator.height, backgroundColor: INDICATOR_COLOR }}
          />
        )}

        {items.map((item, index) => {
          const active = isActive(item);
          const itemClassName = `
            group
            tap-pop
            flex
            shrink-0
            flex-col
            items-center
            gap-1

            screen-sm:w-full
          `;

          const body = (
            <>
              <span
                ref={(el) => {
                  iconRefs.current[index] = el;
                }}
                className="
                  flex
                  h-8 w-8
                  items-center
                  justify-center
                  rounded-lg
                  transition-all
                  duration-200
                  group-hover:scale-105
                  group-hover:bg-[var(--search-bg)]
                  [&_img]:h-7 [&_img]:w-7
                "
              >
                {item.icon}
              </span>

              {/* Two-line clamp: Boss's module names are longer than Setu's. */}
              <span
                className={`
                  hidden
                  min-h-[1.5rem]
                  w-full
                  overflow-hidden
                  text-center
                  text-[0.6875rem]
                  font-medium
                  leading-[0.875rem]
                  tracking-tight
                  [overflow-wrap:anywhere]
                  [-webkit-box-orient:vertical]
                  [-webkit-line-clamp:2]

                  screen-sm:[display:-webkit-box]

                  ${active ? "font-semibold text-[var(--sidebar-active)]" : "text-[var(--text-muted)]"}
                `}
              >
                {item.label}
              </span>
            </>
          );

          if (opensDrawer(item)) {
            const moduleKey = item.moduleKey;
            return (
              <button
                key={item.href}
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={active}
                onClick={() => moduleKey && onModuleClick(moduleKey)}
                className={itemClassName}
                data-active={active ? "true" : undefined}
              >
                {body}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={itemClassName}
              data-active={active ? "true" : undefined}
            >
              {body}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
