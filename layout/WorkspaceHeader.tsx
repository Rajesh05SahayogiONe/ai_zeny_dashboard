"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import { WORKSPACE_ROUTES } from "../routes";
import { APP_NAME } from "../constants/brand";
import type { SearchDestination } from "../utils/search-destinations";
import { BrandLogo } from "./BrandLogo";
import { HeaderIconButton } from "./HeaderIconButton";
import { HeaderSearch } from "./HeaderSearch";
import AppsLauncher from "./AppsLauncher";
import { SetupCentreLink } from "./SetupCentreLink";

type OpenMenu = "create" | "notifications" | "apps" | null;

/** The 9-dot launcher glyph (lucide has no 3x3 dot grid). */
function NineDots() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--text-secondary)" aria-hidden="true">
      {[5, 12, 19].flatMap((cx) => [5, 12, 19].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />))}
    </svg>
  );
}

/** Setu's dropdown panel shell: anchored under the header's right-hand cluster. */
const PANEL_CLASS = `
  absolute
  right-0
  top-[calc(100%+var(--page-pad-y))]
  z-50
  flex
  w-[21rem]
  max-w-[calc(100vw-1.5rem)]
  flex-col
  overflow-hidden
  rounded-xl
  border
  border-[var(--divider)]
  bg-[var(--surface)]
  shadow-xl

  screen-2xl:w-[26rem]
`;

/**
 * The header, on Setu's Header: logo (phones only) · search · right-hand
 * cluster of icon buttons and the organization profile link. Setu's dropdown
 * model is kept for the "+" and bell panels: one menu open at a time, closed
 * by clicking the backdrop behind it (Escape closes it too).
 *
 * The organization switcher is not shown for now; the profile entry carries
 * the organization's name and opens the Profile page directly (the rail has no
 * separate Profile item). "+" and the bell have no backing feature yet, so
 * their panels say so instead of faking content.
 */
export function WorkspaceHeader({
  organizationName,
  searchDestinations,
}: {
  organizationName: string;
  searchDestinations: SearchDestination[];
}) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  function toggle(menu: Exclude<OpenMenu, null>) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  useEffect(() => {
    if (!openMenu) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openMenu]);

  return (
    <header
      className="
        relative z-30 flex shrink-0 items-center
        h-[var(--header-h)]
        gap-2
        bg-[var(--shell-bg)]
        pl-3

        screen-lg:pl-4
        screen-2xl:pl-5

        screen-sm:mr-4
        screen-2xl:mr-4
      "
    >
      {/* Backdrop to close menus */}
      {openMenu && <div data-testid="header-backdrop" className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}

      {/* Logo — the rail carries it from screen-sm up; below that the rail is a
          bottom tab bar with no room for branding, so the header picks it up. */}
      <Link href={WORKSPACE_ROUTES.dashboard} aria-label={`${APP_NAME} dashboard`} className="flex shrink-0 items-center screen-sm:hidden">
        <BrandLogo className="h-[1.75rem] w-[1.75rem]" />
      </Link>

      <HeaderSearch destinations={searchDestinations} />

      {/* Right side actions — h-full so this row's bottom edge matches the header's,
          which the dropdown tops key off to line up with where the page content
          starts below the header. */}
      <div className="relative ml-auto flex h-full shrink-0 items-center gap-1.5 screen-sm:gap-2">
        {/* Create */}
        <div className="hidden h-full items-center screen-sm:flex">
          <HeaderIconButton label="Quick create" expanded={openMenu === "create"} onClick={() => toggle("create")}>
            <Plus color="var(--text-secondary)" size={20} />
          </HeaderIconButton>

          {openMenu === "create" && (
            <div className={PANEL_CLASS}>
              <PanelHeading title="Quick create" />
              <PanelEmpty text="No quick actions available yet." />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="hidden h-full items-center screen-sm:flex">
          <HeaderIconButton label="Notifications" expanded={openMenu === "notifications"} onClick={() => toggle("notifications")}>
            <Bell color="var(--text-secondary)" size={20} />
          </HeaderIconButton>

          {openMenu === "notifications" && (
            <div className={PANEL_CLASS}>
              <PanelHeading title="Notifications" />
              <PanelEmpty text="No notifications yet." />
            </div>
          )}
        </div>

        {/* Apps launcher: favorites on top, every app below. */}
        <div className="hidden h-full items-center screen-sm:flex">
          <HeaderIconButton label="Apps" expanded={openMenu === "apps"} onClick={() => toggle("apps")}>
            <NineDots />
          </HeaderIconButton>

          {openMenu === "apps" && <AppsLauncher onClose={() => setOpenMenu(null)} />}
        </div>

        {/* Setup Centre — Boss's own header item. */}
        <SetupCentreLink />

        {/* Organization profile: a circle with the organization's initials; opens the Profile page. */}
        <OrganizationProfileLink name={organizationName} />
      </div>
    </header>
  );
}

function PanelHeading({ title }: { title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-3.5">
      <p className="text-base font-semibold text-[var(--text-heading)]">{title}</p>
    </div>
  );
}

/** An honest empty state in Setu's panel typography: nothing is backing the panel yet. */
function PanelEmpty({ text }: { text: string }) {
  return <p className="border-t border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">{text}</p>;
}

/** Two-letter mark from the organization's first two words ("Demo Traders Pvt Ltd" -> "DT"). */
function organizationInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase();
}

function OrganizationProfileLink({ name }: { name: string }) {
  const pathname = usePathname();
  const active = pathname === WORKSPACE_ROUTES.profile || pathname.startsWith(`${WORKSPACE_ROUTES.profile}/`);
  return (
    <Link
      href={WORKSPACE_ROUTES.profile}
      title={name}
      aria-label={`Organization profile: ${name}`}
      aria-current={active ? "page" : undefined}
      className={`tap-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-pill-border)] bg-[var(--avatar-bg)] text-xs font-semibold text-[var(--avatar-text)] transition-colors hover:bg-[var(--search-bg)] ${active ? "ring-2 ring-[var(--sidebar-active)]" : ""}`}
    >
      {organizationInitials(name)}
    </Link>
  );
}
