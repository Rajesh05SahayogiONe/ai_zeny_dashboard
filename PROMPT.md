# Prompt: inject this layout + dark theme + common components into my frontend

> Paste everything below this line into the AI agent working on this product, and give it
> access to this zip's extracted folder.

---

This zip is a trimmed export from another product ("Boss"). It contains **only**: the dark
theme system, design tokens/typography, the brand logo pattern, the app shell layout (header,
sidebar/icon-rail, module drawer, footer area), an assistant ("robot") widget with its open/
close animation, a dashboard/home page, and a set of generic common components (breadcrumbs,
filter bar, dark-mode helpers). Read `README.md` in this zip first — it maps every folder to
what's safe to drop in as-is versus what is Boss-specific and must be replaced.

**Do not copy any Boss data-fetching.** Files like `fetchWorkspaceContext`,
`fetchMyWorkspaceActivity`, `@/lib/auth`, and the `@boss/sdk` types referenced in `layout/` and
`dashboard/` are **not included** on purpose. `types/` has trimmed type-only reference files
(`sdk-me.ts`, `workspace-context.ts`, …) so you can see the *shape* those components expect —
replace the data source with this product's own, keeping props the same where reasonable.

## What to do, in order

1. **Inspect this product first**: framework/router (Next.js App Router vs. pages vs. Vite),
   Tailwind version (v3 vs v4), whether shadcn/ui + Radix is already in use, whether there's a
   CSP with nonces, and how auth/session works. Report mismatches with the source stack
   (Next.js App Router, React 19, Tailwind v4 CSS-first config, shadcn/ui, lucide-react icons,
   sonner toasts, recharts) before changing anything.
2. **Theme first** (`theme/`): port `globals.css` token layers, `layout.tsx`'s font + inline
   `ThemeInitScript` setup, `ThemeProvider`/`ThemeToggle`. Three modes (light/dark/system),
   `localStorage`-only, single `.dark` class on `<html>`, no scoping to the shell root (Radix
   portals and toasts need it to reach `<body>`), inline pre-paint script to avoid a white
   flash, `ThemeProvider` removes `.dark` on unmount. If this product is on Tailwind v3,
   translate `@custom-variant dark (...)` to `darkMode: "class"` and the `@theme inline` block
   to `theme.extend.colors` pointing at the same CSS variable names — keep every variable name
   and value unchanged.
3. **Common components** (`common/`): drop in as-is — they have no Boss dependencies.
4. **Brand** (`brand/`): port `BrandLogo.tsx`'s pattern (`dark:hidden` / `hidden dark:block`,
   no JS, no flash). Swap the actual logo files and `aria-label` for this product's brand;
   keep the mechanism.
5. **Layout shell** (`layout/`): rebuild `WorkspaceShell` → `WorkspaceBody` → `Sidebar` (bottom
   tab bar under `screen-sm`, side rail above) → `WorkspaceHeader` → `ModuleDrawer` → page.
   Replace every `@boss/sdk` import and nav/session helper not included in this zip with this
   product's own equivalent, matching the type shapes in `types/` where practical.
6. **Assistant widget** (`assistant/`): port `AssistantButton` + `AssistantRegion` (+
   `AIChatSidebar`, `AIConversationPanel`, `LoadingDots`) as-is — they're pure UI driven by
   callback props (`onSend`, `onSelect`, `onNewChat`, ...). Wire those callbacks to this
   product's own chat backend.
7. **Dashboard/home page** (`dashboard/`): port `DashboardPage.tsx`'s layout (greeting + KPI
   tiles + calendar in row 1, two chart cards in row 2, modules-at-a-glance, recent activity
   table) and the `components/`/`charts/` widgets as-is. Replace `fetchWorkspaceContext` /
   `fetchMyWorkspaceActivity` with this product's real data. Keep the honesty rule: when a
   metric has no real data source yet, show "—" / an empty state — never fake a number.

## The rule that keeps dark mode from rotting

Never write a hard-coded light Tailwind class alone (`bg-white`, `text-gray-500`,
`border-gray-200`, …). Either use a token/shadcn class (`bg-[var(--surface)]`, `bg-card`,
`text-muted-foreground`) or pair it with its `dark:` counterpart per the mapping in
`common/dark-variants.ts`. Port `common/dark-variants.test.ts` too, pointed at this product's
own source folders, so a forgotten `dark:` fails CI.

## Acceptance checklist (verify in a real browser, report results)

- [ ] Hard reload with "dark" stored: no white flash.
- [ ] "System": OS theme change flips the app live while the page is open.
- [ ] Choice persists across reloads/new tabs; blocked/corrupt `localStorage` falls back to
      "system" without errors.
- [ ] Dialogs, dropdowns, selects, popovers, toasts are dark when the page is dark.
- [ ] Logo swaps with theme; module icons are visible on dark surfaces.
- [ ] Charts, status badges, KPI values, tables are legible in both themes.
- [ ] Shell at phone width: rail becomes a bottom tab bar, drawer opens as a sheet, no
      horizontal scroll.
- [ ] Assistant button/panel open and close with their animation, in both themes.
- [ ] No hydration warnings in the console.

Work in small, reviewable steps (tokens/font → theme machinery → logo → layout shell →
assistant → dashboard). Show a light and dark screenshot after each step.
