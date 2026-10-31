import { APP_NAME } from "../constants/brand";

/** Slim footer at the end of the page content; tokens only, so it follows light/dark. */
export function AppFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--divider)] py-3 text-xs text-[var(--text-muted)]">
      © {new Date().getFullYear()} {APP_NAME}
    </footer>
  );
}
