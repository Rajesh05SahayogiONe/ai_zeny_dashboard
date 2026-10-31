"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { NavItem, NavGroup } from "../types/workspace-context";
import { PEOPLE_PAYROLL_DESTINATIONS } from "../constants/people-payroll-destinations";
import { WORKSPACE_ROUTES } from "../routes";
import { Sidebar } from "./Sidebar";
import { ModuleDrawer, type PosDrawerNav } from "./ModuleDrawer";
import { PageTransition } from "./PageTransition";
import { AssistantButton } from "./AssistantButton";
import { AssistantRegion } from "./assistant/AssistantRegion";
import { AppFooter } from "./AppFooter";
import type { AssistantMode, Conversation } from "../types/assistant";

const COLLAPSE_STORAGE_KEY = "boss.workspace.drawerCollapsed";
const ACTIVE_MODULE_STORAGE_KEY = "boss.workspace.activeModule";
/** Just under Setu's `screen-sm` (36rem): where the rail is a bottom tab bar. */
const PHONE_QUERY = "(max-width: 35.9375rem)";

/**
 * The body of Setu's shell: icon rail | (header over drawer + page). Owns the
 * rail ↔ drawer interaction — which module's drawer is open, and whether the
 * drawer is collapsed (a persisted preference, mirroring the reference app's
 * admin.drawer localStorage entry). Split out from WorkspaceShell (a Server
 * Component) because this needs client state; the already-rendered `header`
 * is handed in as a prop so it can stay server-composed.
 */
export function WorkspaceBody({
  items,
  selfServiceGroups,
  posNav,
  header,
  children,
}: {
  items: NavItem[];
  selfServiceGroups: NavGroup[];
  /** POS & Retail Billing's drawer content (permission-filtered, with the waiting-handover badge). */
  posNav?: PosDrawerNav;
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("closed");
  // No assistant service is configured. An empty, disabled shell never invents
  // history or replies; an authenticated service can supply these slots later.
  const conversations: Conversation[] = [];
  const unavailable = () => {};
  const assistantOpen = assistantMode !== "closed";
  const assistantLauncher = useRef<HTMLButtonElement>(null);
  const assistantWasOpen = useRef(false);
  useEffect(() => {
    if (assistantOpen) assistantWasOpen.current = true;
    else if (assistantWasOpen.current) { assistantWasOpen.current = false; assistantLauncher.current?.focus({preventScroll:true}); }
  }, [assistantOpen]);
  const matchesRoute = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const routeModuleKey = posNav?.destinations.some(item => matchesRoute(item.href)) ? "pos-retail-billing"
    : PEOPLE_PAYROLL_DESTINATIONS.some(item => matchesRoute(item.href)) ? "people-payroll"
    : selfServiceGroups.some(group => group.items.some(item => matchesRoute(item.href))) ? "self-service-portal" : null;

  // Restore the collapsed and activeModuleKey preference on mount.
  useEffect(() => {
    try {
      const rawCollapsed = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (rawCollapsed) setCollapsed(JSON.parse(rawCollapsed) === true);

      const rawActive = window.localStorage.getItem(ACTIVE_MODULE_STORAGE_KEY);
      if (rawActive) setActiveModuleKey(JSON.parse(rawActive));
    } catch {
      // Ignore corrupt/stale localStorage payloads.
    }
    setIsMounted(true);
  }, []);

  // Persist it on every change so it survives navigation and refresh.
  useEffect(() => {
    if (!isMounted) return; // don't overwrite with initial state before mount
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed));
      window.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, JSON.stringify(activeModuleKey));
    } catch {
      // Ignore quota / private-mode errors.
    }
  }, [collapsed, activeModuleKey, isMounted]);

  // Landing on the dashboard or any other top-level module that has its own
  // full page (like self-service-portal) closes whatever drawer was open.
  useEffect(() => {
    const isRealPage = items.some(
      (item) => !item.href.startsWith("#") && (item.href === WORKSPACE_ROUTES.dashboard ? pathname === item.href : pathname.startsWith(item.href))
    );
    if (isRealPage) {
      setActiveModuleKey(null);
    }
  }, [pathname, items]);

  // On a phone the drawer is a sheet over the page: once a link in it has been
  // followed it would otherwise stay open on top of the page it led to.
  useEffect(() => {
    if (window.matchMedia?.(PHONE_QUERY).matches) setActiveModuleKey(null);
  }, [pathname]);

  function handleModuleClick(key: string) {
    if (collapsed) {
      setCollapsed(false);
      setActiveModuleKey(key);
      return;
    }
    // Clicking the already-open module's icon again collapses it (toggle).
    // Clearing the active module too, not just the collapsed flag: otherwise
    // the rail icon keeps its open-drawer styling while no drawer is showing.
    if (activeModuleKey === key) {
      setCollapsed(true);
      setActiveModuleKey(null);
    } else {
      setActiveModuleKey(key);
    }
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar items={items} routeModuleKey={routeModuleKey} activeModuleKey={activeModuleKey} onModuleClick={handleModuleClick} />

        {/* The page column stays mounted (so its state survives opening or expanding
            the assistant) and shrinks: flex-grow animates in lockstep with
            AssistantRegion's, so the reveal and retract are symmetric. Opacity fades
            with it so fixed-position header children (the search bar) don't keep
            painting at viewport-centre once the column has zero width. */}
        <div
          className={`flex min-w-0 flex-col overflow-hidden transition-[flex-grow,opacity] duration-300 ease-out ${
            assistantMode === "fullscreen" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          inert={assistantMode === "fullscreen" ? true : undefined}
          style={{ flexGrow: assistantMode === "fullscreen" ? 0 : 1, flexBasis: 0 }}
        >
          {header}

          <div className="relative flex min-h-0 flex-1">
            {/* Order matters: the drawer is absolutely positioned and <main> is
                offset by its width through the `peer-data-[state=…]` rules, so
                the drawer must precede <main> in the DOM. */}
            <ModuleDrawer activeModuleKey={activeModuleKey} collapsed={collapsed} selfServiceGroups={selfServiceGroups} posNav={posNav} />
            {/* overflow-x-auto where Setu has overflow-x-hidden: Setu's pages
                never exceed the viewport, but Boss's data pages can on a phone
                (e.g. Attendance's 480px status legend at 390px), and hidden
                clipped that content with no way to reach it. The dashboard
                never overflows, so it is unaffected. */}
            <main
              className="
                min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto
                pl-3 pr-[var(--page-pad-x)] pb-20 pt-[var(--page-pad-y)]

                screen-sm:pb-[var(--page-pad-y)]
                screen-sm:pl-4
                screen-sm:pr-4
                screen-2xl:pr-4

                peer-data-[state=strip]:screen-sm:ml-[48px]
                peer-data-[state=panel]:screen-sm:ml-[220px]
              "
            >
              {/* No max-width/centering on purpose: the page's left edge tracks the
                  rail and its right edge tracks the header's right-hand icon
                  cluster at every viewport size — see screen-sm:pr-4 /
                  screen-2xl:pr-4, which match the header's margin. */}
              <div className="w-full min-w-0">
                <PageTransition>{children}</PageTransition>
                <AppFooter />
              </div>
            </main>
          </div>
        </div>

        <AssistantRegion
          mode={assistantMode}
          available={false}
          conversations={conversations}
          activeId={null}
          activeConversation={null}
          activeStatus="idle"
          onSelect={unavailable}
          onNewChat={unavailable}
          onSend={unavailable}
          onRegenerate={unavailable}
          onExpand={() => setAssistantMode("fullscreen")}
          onCollapse={() => setAssistantMode("compact")}
          onClose={() => setAssistantMode("closed")}
        />
      </div>

      {!assistantOpen && <AssistantButton buttonRef={assistantLauncher} onClick={() => setAssistantMode("compact")} />}
    </>
  );
}
