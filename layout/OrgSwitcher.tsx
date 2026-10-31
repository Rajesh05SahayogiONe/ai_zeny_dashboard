"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import type { FinancialYearRecord, WorkspaceBranch, WorkspaceOrganization } from "@boss/sdk";
import { useSingleFlightTransition } from "@/lib/use-single-flight-transition";
import { setActiveOrganizationAction } from "../api/active-org.actions";
import { setBranchAction } from "../api/branch.actions";
import { setFinancialYearAction } from "../api/financial-year.actions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-04-01" to "Apr 2026"; the API's own dates, never recomputed here. */
function monthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${year}`;
}
const BADGE = "shrink-0 rounded-full bg-[var(--search-bg)] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[var(--text-muted)]";
const ROW = "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2.5 text-left text-sm hover:bg-[var(--search-bg)] focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60";

/**
 * The header's ONE connected context control: organization, financial year and branch. The button names the organization and,
 * on its second line, the viewing year and branch ("FY 2026-27 · All branches"); the menu lists the organizations, then the
 * active organization's real financial years, then its branches. Choices come only from the authenticated workspace context;
 * year and branch are view preferences (cookies) the server re-validates on every use, and the API revalidates membership
 * after an organization switch.
 */
export function OrgSwitcher({ organizations, activeOrganizationId, onOpen, workspaceName, closeRequested = false, financialYears = [], activeFinancialYearStart, branches = [], canViewBranches = false, branchesSetupHref, activeBranchId = null }: {
  organizations: WorkspaceOrganization[];
  /** The active organization's real years (from the API); the Financial year section is hidden when empty. */
  financialYears?: FinancialYearRecord[];
  activeFinancialYearStart?: number;
  /** Active branches the member may list. With none, the Branch section is hidden unless `canViewBranches`. */
  branches?: WorkspaceBranch[];
  /** The member holds the Branch read key organization-wide, so an empty list means the organization has no branches yet. */
  canViewBranches?: boolean;
  /** Link to the Setup Centre's Branches page; given only when the member can open it. */
  branchesSetupHref?: string;
  /** Null means "All branches". */
  activeBranchId?: string | null;
  activeOrganizationId: string;
  onOpen?: () => void;
  workspaceName?: string;
  closeRequested?: boolean;
}) {
  // The workspace's own name ("AV"), not the word "Workspace" — that is only the fallback for a context without one.
  const workspaceLabel = workspaceName?.trim() || "Workspace";
  const router = useRouter();
  const [pending, startTransition] = useSingleFlightTransition();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [yearOpen, setYearOpen] = useState(false);
  const [yearQuery, setYearQuery] = useState("");
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  // The trigger is disabled while a save is pending and a disabled button cannot take focus, so focus returns once it clears.
  const [refocus, setRefocus] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const id = useId();
  const active = organizations.find((o) => o.id === activeOrganizationId);
  const choices = organizations.filter(o => o.displayName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => Number(b.id === activeOrganizationId) - Number(a.id === activeOrganizationId) || a.displayName.localeCompare(b.displayName));
  const currentYear = financialYears.find((year) => year.isCurrent)?.startYear;
  const yearChoices = [...financialYears].sort((a, b) => b.startYear - a.startYear).filter((year) => year.label.includes(yearQuery.trim()));
  const activeYear = financialYears.find((year) => year.startYear === activeFinancialYearStart);
  const showYears = financialYears.length > 0 && activeFinancialYearStart !== undefined;
  const activeBranch = branches.find((branch) => branch.id === activeBranchId);
  const showBranches = branches.length > 0;
  const showNoBranches = !showBranches && canViewBranches;
  const branchChoices = branches.filter((branch) => branch.name.toLocaleLowerCase().includes(branchQuery.trim().toLocaleLowerCase()));
  // "FY 2026-27 · All branches": the branch part only when the member can see branches at all.
  const subline = [showYears ? `FY ${activeYear?.label ?? activeFinancialYearStart}` : null, showBranches ? (activeBranch?.name ?? "All branches") : null].filter(Boolean).join(" · ");
  useEffect(() => { if (refocus && !pending) { trigger.current?.focus(); setRefocus(false); } }, [refocus, pending]);
  useEffect(() => { if (closeRequested) setOpen(false); }, [closeRequested]);
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keyboard); };
  }, [open]);
  function switchTo(next: string) {
    if (next === activeOrganizationId) { setOpen(false); trigger.current?.focus(); return; }
    startTransition(async () => {
      try { await setActiveOrganizationAction(next); setOpen(false); setRefocus(true); router.refresh(); }
      catch { setError("Could not switch organization. Please try again."); }
    });
  }
  /** Saves a view preference (a Server Action that sets a cookie), then closes and refreshes so every server component re-renders with it. */
  function savePreference(save: () => Promise<void>, failure: string) {
    setError(null);
    startTransition(async () => {
      try { await save(); setOpen(false); setRefocus(true); router.refresh(); }
      catch { setError(failure); }
    });
  }
  function switchYear(start: number) {
    if (start === activeFinancialYearStart) { setYearOpen(false); return; }
    savePreference(() => setFinancialYearAction(activeOrganizationId, start), "Could not change financial year. Please try again.");
  }
  function switchBranch(branchId: string | null) {
    if (branchId === (activeBranch?.id ?? null)) { setBranchOpen(false); return; }
    savePreference(() => setBranchAction(activeOrganizationId, branchId), "Could not change branch. Please try again.");
  }
  return (
    <div ref={root} className="relative min-w-0">
      <button ref={trigger} type="button" title="Switch organization" aria-label={`Organization: ${active?.displayName ?? "Select organization"}`} aria-expanded={open} aria-controls={id} disabled={pending}
        onClick={() => { if (!open) onOpen?.(); setOpen(!open); setQuery(""); setYearOpen(false); setYearQuery(""); setBranchOpen(false); setBranchQuery(""); setError(null); }}
        className="flex h-[40px] w-full min-w-0 items-center gap-2 rounded-md border border-[var(--workspace-pill-border)] bg-[var(--surface)] px-2 py-1 text-left text-[var(--text-heading)] hover:bg-[var(--search-bg)] disabled:opacity-60">
        <Building2 size={16} className="shrink-0" aria-hidden="true" />
        <span className="grid min-w-0 flex-1 gap-0.5"><span className="flex min-w-0 items-center gap-1.5"><small className="max-w-[45%] truncate text-[11px] leading-[14px] text-[var(--text-muted)]" title={`Workspace: ${workspaceLabel}`}>{workspaceLabel}</small><span aria-hidden="true" className="text-xs leading-[14px] text-[var(--text-muted)]">/</span><strong className="min-w-0 flex-1 truncate text-xs font-medium leading-[14px]" title={active?.displayName}>{pending ? "Switching…" : active?.displayName ?? "Select organization"}</strong></span>{subline && <span className="block min-w-0 truncate text-[10px] leading-[12px] text-[var(--text-muted)]" data-testid="context-subline">{subline}</span>}</span>
        <ChevronDown size={14} className="shrink-0" aria-hidden="true" />
      </button>
      {open && <div id={id} className="workspace-context-menu absolute left-0 top-[calc(100%+0.5rem)] z-[150] w-[20rem] max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-lg border border-[var(--divider)] bg-[var(--surface)] p-3 text-[var(--text-heading)] shadow-xl" aria-label="Choose organization" role="region">
        <div className="mb-3 border-b border-[var(--divider)] pb-3"><p className="text-[0.625rem] uppercase tracking-wide text-[var(--text-muted)]">Workspace</p><p className="break-words text-sm font-medium">{workspaceLabel}</p></div><p className="mb-2 text-xs text-[var(--text-muted)]">Organizations <span>{organizations.length}</span></p>
        <label className="mb-2 flex items-center gap-2 rounded-md border border-[var(--divider)] bg-[var(--search-bg)] px-2.5"><Search size={14} aria-hidden="true" /><input ref={search} aria-label="Find organization" placeholder="Find organization…" value={query} onChange={e => setQuery(e.target.value)} className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        <div className="max-h-[min(12rem,30dvh)] overflow-y-auto" role="group" aria-label="Available organizations">
          {choices.map(org => <button key={org.id} type="button" disabled={pending} aria-pressed={org.id === activeOrganizationId} onClick={() => switchTo(org.id)} className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2.5 text-left text-sm hover:bg-[var(--search-bg)] focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"><span className="min-w-0 break-words">{org.displayName}</span>{org.id === activeOrganizationId && <Check size={16} aria-label="Current organization" className="shrink-0" />}</button>)}
          {!choices.length && <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No matching organizations.</p>}
        </div>
        {showYears && <section className="mt-3 border-t border-[var(--divider)] pt-3" aria-label="Financial year">
          <button type="button" disabled={pending} aria-expanded={yearOpen} onClick={() => { setYearOpen(!yearOpen); setYearQuery(""); }} className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-[var(--search-bg)] focus-visible:outline-2 focus-visible:outline-ring">
            <span>Financial year</span><strong className="ml-auto font-medium">{activeYear?.label ?? activeFinancialYearStart}</strong><ChevronRight size={14} aria-hidden="true" className={`shrink-0 ${yearOpen ? "rotate-90" : ""}`} />
          </button>
          {yearOpen && <div className="mt-2">
            {financialYears.length > 12 && <input type="search" aria-label="Find financial year" placeholder="Find year…" value={yearQuery} onChange={(event) => setYearQuery(event.target.value)} className="mb-2 h-9 w-full rounded-md border border-[var(--divider)] bg-[var(--search-bg)] px-3 text-sm" />}
            <div className="max-h-40 overflow-y-auto" role="group" aria-label="Available financial years">
              {yearChoices.map((year) => <button type="button" key={year.startYear} disabled={pending} aria-pressed={year.startYear === activeFinancialYearStart} onClick={() => switchYear(year.startYear)} className={ROW}>
                <span className="grid min-w-0"><span className="flex min-w-0 items-center gap-2"><span>{year.label}</span>{year.isCurrent ? <span className={BADGE}>Current</span> : currentYear !== undefined && year.startYear > currentYear ? <span className={BADGE}>Upcoming</span> : null}</span><span className="text-[11px] text-[var(--text-muted)]">{monthYear(year.startDate)} to {monthYear(year.endDate)}</span></span>
                {year.startYear === activeFinancialYearStart && <Check size={14} aria-label="Selected financial year" className="shrink-0" />}
              </button>)}
              {!yearChoices.length && <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No matching financial years.</p>}
            </div>
          </div>}
        </section>}
        {showBranches && <section className="mt-3 border-t border-[var(--divider)] pt-3" aria-label="Branch">
          <button type="button" disabled={pending} aria-expanded={branchOpen} onClick={() => { setBranchOpen(!branchOpen); setBranchQuery(""); }} className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-[var(--search-bg)] focus-visible:outline-2 focus-visible:outline-ring">
            <span>Branch</span><strong className="ml-auto min-w-0 truncate font-medium">{activeBranch?.name ?? "All branches"}</strong><ChevronRight size={14} aria-hidden="true" className={`shrink-0 ${branchOpen ? "rotate-90" : ""}`} />
          </button>
          {branchOpen && <div className="mt-2">
            {branches.length > 8 && <input type="search" aria-label="Find branch" placeholder="Find branch…" value={branchQuery} onChange={(event) => setBranchQuery(event.target.value)} className="mb-2 h-9 w-full rounded-md border border-[var(--divider)] bg-[var(--search-bg)] px-3 text-sm" />}
            <div className="max-h-40 overflow-y-auto" role="group" aria-label="Available branches">
              {!branchQuery.trim() && <button type="button" disabled={pending} aria-pressed={!activeBranch} onClick={() => switchBranch(null)} className={ROW}><span>All branches</span>{!activeBranch && <Check size={14} aria-label="Selected branch" className="shrink-0" />}</button>}
              {branchChoices.map((branch) => <button type="button" key={branch.id} disabled={pending} aria-pressed={branch.id === activeBranch?.id} onClick={() => switchBranch(branch.id)} className={ROW}>
                <span className="grid min-w-0"><span className="flex min-w-0 items-center gap-2"><span className="min-w-0 break-words">{branch.name}</span>{branch.isHeadOffice && <span className={BADGE}>Head office</span>}</span>{branch.code && <span className="text-[11px] text-[var(--text-muted)]">{branch.code}</span>}</span>
                {branch.id === activeBranch?.id && <Check size={14} aria-label="Selected branch" className="shrink-0" />}
              </button>)}
              {!branchChoices.length && <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No matching branches.</p>}
            </div>
          </div>}
        </section>}
        {showNoBranches && <section className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--divider)] pt-3 text-sm text-[var(--text-muted)]" aria-label="Branch" data-testid="no-branches">
          <span aria-disabled="true">No branches yet</span>
          {branchesSetupHref && <Link href={branchesSetupHref} onClick={() => setOpen(false)} className="shrink-0 rounded text-xs font-medium text-[var(--text-heading)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring">Add</Link>}
        </section>}
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>}
    </div>
  );
}
