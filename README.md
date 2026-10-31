# Boss layout + common-components extract

A focused subset of `host-dashboards-kit`: just the shell layout, the assistant ("robot")
widget, the dashboard/home page, the generic common components, and the dark theme system.
No Boss data layer, no administration console, no tenant/org management screens.

Open this zip in your next Next.js project and hand `PROMPT.md` (in this zip) to Claude —
it tells Claude exactly what to inject and what to replace.

## Folders

| Folder | What's in it | Boss-specific — replace before/while using |
|---|---|---|
| `theme/` | `globals.css`, `reference-table.css`, `layout.tsx`, `ThemeProvider/ThemeToggle/ThemeInitScript`, `theme.ts`, Inter font | Nothing — this is data-free, drop in as-is |
| `common/ui/` | shadcn primitives: `breadcrumbs`, `button`, `badge`, `card`, `checkbox`, `confirm-dialog`, `dialog`, `dropdown-menu`, `form-field`, `input`, `label`, `radio-card`, `radio-pill`, `table` | Nothing — generic, drop in as-is |
| `common/` (root) | `filter-bar.tsx`, `breadcrumbs.ts`, `utils.ts` (`cn()`), `dark-variants.ts` (+test), `user-display.ts`, `open-window.ts`, `use-single-flight-transition.ts` | Nothing — generic helpers, drop in as-is |
| `brand/` | Logos (`icons/brand/`), module/shell icons (`icons/modules/`, `icons/*.svg`), `robot-icon.svg`, `bot-icon.svg`, `icon.svg` | Swap the logo files + `BrandLogo.tsx`'s `aria-label` for your own brand. Everything else (module icons, robot icon) is fine as-is |
| `layout/` | `WorkspaceShell` → `WorkspaceBody` → `Sidebar` (icon rail / bottom tab bar) + `ModuleDrawer` + `WorkspaceHeader` (`HeaderSearch`, `OrgSwitcher`, `HeaderIconButton`, `BrandLogo`) + `PageTransition` + `navConfig.tsx` | **Yes.** These import `@boss/sdk` types (`WorkspaceContext`, `WorkspaceBranch`, …) and Boss routing/nav helpers that aren't in this zip on purpose. Replace every such import with your own data/session/nav source. `navConfig.tsx` is a *template* — swap its module list for yours |
| `assistant/` | `AssistantButton`, `assistant/AssistantRegion` + `AIChatSidebar` + `AIConversationPanel` + `LoadingDots`, `assistant.ts` (types) | **Yes.** It's wired to `onSend/onSelect/...` callbacks — plug those into your own chat backend (or Claude API) |
| `dashboard/` | `DashboardPage.tsx` (home page), `ModulesAtAGlance`, `RecentActivityTable`, `RevenueVsExpenseCard`, `ItemsByCategoryCard`, `components/` (`Card`, `KPITile`, `GreetingCard`, `CalendarCard`, `DataTable`, `DrillLink`, `EmptyState`, `StatusBadge`, `SampleDataBadge`), `charts/` (`AreaTrendChart`, `DonutChart`), `dashboard-mock/` sample data | **Yes.** `DashboardPage.tsx` calls `fetchMyWorkspaceActivity` / `fetchWorkspaceContext` (not included) and `@/lib/auth`. Replace with your own data fetching; keep the `Card`/`KPITile`/chart components as-is |
| `types/` | Trimmed reference types only: `sdk-me.ts` (`MeView`), `sdk-index.ts`, `sdk-financial-years.ts`, `sdk-organizations.ts`, `workspace-context.ts` | Read-only reference — shows the shape `WorkspaceShell`/`WorkspaceHeader`/`DashboardPage` expect, so you know what your own data layer must return |

## The one rule that keeps dark mode from rotting

Never ship a hard-coded light Tailwind class alone (`bg-white`, `text-gray-500`, …). Either
use a token (`bg-[var(--surface)]`, or a shadcn class like `bg-card`), or pair it with a
`dark:` class per `common/dark-variants.ts`'s mapping. Its test sweeps your source folders and
fails CI if a `dark:` pairing is missing — point `WORKSPACE_ROOTS` in
`common/dark-variants.test.ts` at your own folders.

## Acceptance checklist (same as the full kit)

- Hard reload with "dark" stored → no white flash.
- "System" mode follows a live OS theme change.
- Dialogs/dropdowns/toasts are dark when the page is dark (`.dark` is NOT scoped to the shell
  root on purpose — Radix portals and sonner render under `<body>`).
- Logo and module icons stay legible in both themes.
- Phone width: rail → bottom tab bar, drawer → sheet, no horizontal scroll.
- No hydration warnings.
