import Link from "next/link";
import { Settings } from "lucide-react";
import { WORKSPACE_ROUTES } from "../routes";

export function SetupCentreLink() {
  return (
    <Link href={WORKSPACE_ROUTES.setup} title="Setup Centre" aria-label="Setup Centre"
      className="tap-pop hidden h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--search-bg)] screen-sm:flex">
      <Settings size={18} aria-hidden="true" />
    </Link>
  );
}
