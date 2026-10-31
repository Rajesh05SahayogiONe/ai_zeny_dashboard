import { fetchWorkspaceContext } from "../../api/workspace.data";
import { DashboardView } from "@bridge/DashboardView";
import { friendlyName } from "../../utils/friendly-name";

export default async function DashboardRoute() {
  const context = await fetchWorkspaceContext();
  return <DashboardView name={friendlyName(context.user)} organization={context.activeOrganization?.displayName ?? ""} />;
}
