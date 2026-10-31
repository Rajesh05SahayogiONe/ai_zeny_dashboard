import type { ReactNode } from "react";
import { WorkspaceShell } from "../../layout/WorkspaceShell";
import { fetchWorkspaceContext } from "../../api/workspace.data";

export const dynamic = "force-dynamic";

/** Every Boss Bridge page lives under this group so the Boss shell (rail, header, assistant, footer) is shared. */
export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const context = await fetchWorkspaceContext();
  return (
    <WorkspaceShell context={context} hasLinkedEmployee={false}>
      {children}
    </WorkspaceShell>
  );
}
