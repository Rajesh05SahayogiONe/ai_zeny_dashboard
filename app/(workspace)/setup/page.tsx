import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@bridge/PageHeader";

export default function SetupRoute() {
  return (
    <>
      <PageHeader title="Setup Centre" description="Organization, branches and roles will be managed here." />
      <EmptyState title="Nothing to set up yet" description="The Setup Centre is not part of this UI preview." />
    </>
  );
}
