"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchDestinations, type SearchDestination } from "../utils/search-destinations";

/**
 * Setu's header search box and results panel. Where Setu searches its own
 * products/workspaces/incidents, this searches Boss's navigable destinations
 * (the modules and pages in the user's own nav — see buildSearchDestinations),
 * so every result is a page that exists and that the user can open. Not a data
 * search: no records are indexed until the modules that own them exist.
 *
 * Setu's behaviour: results appear from 2 characters, and following one clears
 * the box. Escape also clears it.
 */
export function HeaderSearch({ destinations }: { destinations: SearchDestination[] }) {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const results = useMemo(() => searchDestinations(destinations, query), [destinations, query]);

  return (
    <div className="relative flex min-w-0 flex-1 items-center justify-end px-1 screen-sm:justify-center screen-sm:px-2">
      <button type="button" aria-label="Open product search" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--search-bg)] screen-sm:hidden"><Search size={18} /></button>
      <div
        className={`${mobileOpen ? "fixed inset-x-3 top-3 z-50 flex w-auto" : "relative hidden w-full screen-sm:flex"}
          h-10 min-w-0
          items-center
          gap-2
          rounded-lg
          border
          border-transparent
          bg-[var(--search-bg)]
          px-3

          screen-sm:relative screen-sm:inset-auto screen-sm:z-auto screen-sm:flex screen-sm:w-full screen-sm:max-w-[320px] screen-sm:h-[40px]
          screen-sm:border-[var(--divider)]
        `}
      >
        <span className="shrink-0">
          <Search size={20} className="shrink-0" color="var(--search-placeholder)" />
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {setQuery("");setMobileOpen(false);}
          }}
          placeholder="Search modules and pages..."
          aria-label="Search modules and pages"
          className="
            min-w-0 w-full
            bg-transparent
            text-xs
            text-[var(--text-secondary)]
            outline-none
            placeholder:text-[var(--search-placeholder)]

            screen-sm:text-sm
          "
        />
        {mobileOpen && <button type="button" onClick={() => {setQuery("");setMobileOpen(false);}} aria-label="Close product search" className="shrink-0 rounded px-2 py-1 text-xs screen-sm:hidden">Close</button>}

        {results.length > 0 && (
          <div
            className="
              absolute left-0 top-[calc(100%+0.25rem)] z-50
              w-full overflow-hidden rounded-xl border
              border-[var(--divider)] bg-[var(--surface)] shadow-xl
            "
          >
            <ul className="divide-y divide-[var(--divider)]">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    onClick={() => {setQuery("");setMobileOpen(false);}}
                    className="tap-pop flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[var(--search-bg)]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--text-heading)]">{r.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">{r.sublabel}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-[var(--role-text)]">{r.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
