import Link from "next/link";
import { Activity, AlertTriangle, KeyRound, Monitor, Radio, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/dashboard/Card";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { GreetingCard } from "@/components/dashboard/GreetingCard";
import { KPITile } from "@/components/dashboard/KPITile";
import { SampleDataBadge } from "@/components/dashboard/SampleDataBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ActivityTable } from "./ActivityTable";
import { CopyButton } from "./CopyButton";
import { SummaryRow } from "./fields";
import { StepCard } from "./StepCard";
import { formatDate, formatDateTime } from "./format";
import { GOOGLE_CALLS, SAMPLE_ACTIVITY, SAMPLE_DEVICE, SAMPLE_ORG, SAMPLE_PLAN, SAMPLE_TOKENS } from "./sample";

const TILE = { iconBg: "var(--surface-muted)", iconFg: "var(--text-secondary)" } as const;

/** Boss Bridge home: Boss's greeting + KPI tiles + calendar frame, then the setup checklist, activity, plan and organization. */
export function DashboardView({ name, organization }: { name: string; organization: string }) {
  const activeTokens = SAMPLE_TOKENS.filter((t) => t.status === "Active").length;
  const failed = SAMPLE_ACTIVITY.filter((a) => a.status !== "Completed").length;

  return (
    <div className="dashboard-root @container flex flex-col gap-[var(--space-lg)]">
      <h1 className="sr-only">Dashboard</h1>

      <div className="grid grid-cols-1 items-stretch gap-[var(--space-md)] @[72rem]:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="kpi-plain grid min-w-0 grid-cols-2 auto-rows-fr gap-[var(--space-md)] screen-sm:grid-cols-4">
          <div className="min-w-0"><GreetingCard name={name} subtitle={organization} /></div>
          <KPITile title="Device" value={SAMPLE_DEVICE.status} note={SAMPLE_DEVICE.name} status="healthy" icon={<Monitor size={18} />} drillHref="/device" {...TILE} />
          <KPITile title="Device seats" value={`${SAMPLE_DEVICE.seatsUsed} / ${SAMPLE_DEVICE.seatsTotal}`} note="In use" status="neutral" icon={<Monitor size={18} />} drillHref="/device" {...TILE} />
          <KPITile title="Pusher" value="Not set up" note="Credentials not saved" status="warning" icon={<Radio size={18} />} drillHref="/pusher" {...TILE} />
          <KPITile title="API tokens" value={String(activeTokens)} note="Active of 20 allowed" status="info" icon={<KeyRound size={18} />} drillHref="/api-tokens" {...TILE} />
          <KPITile title="Requests" value={String(SAMPLE_ACTIVITY.length)} note="In Activity" status="neutral" icon={<Activity size={18} />} drillHref="/activity" {...TILE} />
          <KPITile title="Failed or timed out" value={String(failed)} note="In Activity" status="critical" icon={<AlertTriangle size={18} />} drillHref="/activity" {...TILE} />
          <KPITile title="Google calls today" value={`${GOOGLE_CALLS.used} / ${GOOGLE_CALLS.limit}`} note="Google not connected" status="neutral" icon={<Sheet size={18} />} drillHref="/integrations" {...TILE} />
        </div>
        <div className="hidden @[72rem]:block">
          <CalendarCard />
        </div>
      </div>

      <Card title="Get started" description="Connect your PC, turn on realtime delivery, then create a token." action={<div className="flex items-center gap-2"><SampleDataBadge /><StatusBadge status="info" label="1 of 3 done" /></div>}>
        <div className="grid grid-cols-1 gap-[var(--space-md)] @[36rem]:grid-cols-2 @[72rem]:grid-cols-4 @[72rem]:gap-x-8">
          <StepCard
            connector step="Step 1" title="Connect your Windows PC" icon={<Monitor size={18} />} status="healthy" statusLabel="Connected"
            rows={[{ label: "Device", value: SAMPLE_DEVICE.name }, { label: "Last seen", value: formatDateTime(SAMPLE_DEVICE.lastSeen) }, { label: "Seats used", value: `${SAMPLE_DEVICE.seatsUsed} of ${SAMPLE_DEVICE.seatsTotal}` }]}
            action={<Link href="/device" className="text-sm font-medium text-[var(--status-info-fg)] hover:underline">Manage device →</Link>}
          />
          <StepCard
            connector step="Step 2" title="Set up realtime delivery" icon={<Radio size={18} />} status="neutral" statusLabel="Not set up"
            rows={[{ label: "Needs", value: "Your Pusher app" }, { label: "Status", value: "Not configured" }]}
            action={<Button asChild variant="outline" className="w-full"><Link href="/pusher">Set up Pusher</Link></Button>}
          />
          <StepCard
            connector step="Step 3" title="Create an API token" icon={<KeyRound size={18} />} status="info" statusLabel={`${activeTokens} active`}
            rows={[{ label: "Needs", value: "A name and companies" }, { label: "Active tokens", value: String(activeTokens) }]}
            action={<Button asChild variant="outline" className="w-full"><Link href="/api-tokens">Create token</Link></Button>}
          />
          <StepCard
            step="Optional" title="Google Sheets" icon={<Sheet size={18} />} status="neutral" statusLabel="Not connected"
            rows={[{ label: "Connect from", value: "Windows app" }, { label: "Calls today", value: `${GOOGLE_CALLS.used} of ${GOOGLE_CALLS.limit}` }]}
            action={<Link href="/integrations" className="text-sm font-medium text-[var(--status-info-fg)] hover:underline">How to connect →</Link>}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 items-stretch gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Recent activity" description="Requests your apps made through Boss Bridge" action={<div className="flex items-center gap-2"><SampleDataBadge /><Button asChild variant="ghost" size="sm"><Link href="/activity">View all</Link></Button></div>}>
          <ActivityTable rows={SAMPLE_ACTIVITY} pageSize={5} />
        </Card>

        <div className="flex min-w-0 flex-col gap-[var(--space-md)]">
          <Card title="Plan" action={<StatusBadge status="warning" label={SAMPLE_PLAN.name} />}>
            <p className="text-2xl font-bold text-[var(--text-heading)]">{SAMPLE_PLAN.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{SAMPLE_PLAN.daysLeft} days left · ends {formatDate(SAMPLE_PLAN.ends)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[["Companies", SAMPLE_PLAN.companies], ["Fin. years", SAMPLE_PLAN.financialYears], ["Devices", SAMPLE_PLAN.devices]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[var(--surface-muted)] px-2 py-2">
                  <p className="text-xs text-[var(--text-muted)]">{label}</p>
                  <p className="text-lg font-bold text-[var(--text-heading)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">
              <Link href="/subscription" className="text-[var(--status-info-fg)] hover:underline">Subscription →</Link>
            </div>
          </Card>

          <Card title="Organization" action={<Button asChild variant="ghost" size="sm"><Link href="/profile">Edit profile</Link></Button>}>
            <SummaryRow label="Name">{SAMPLE_ORG.name}</SummaryRow>
            <SummaryRow label="Owner">{SAMPLE_ORG.owner}</SummaryRow>
            <SummaryRow label="Email"><StatusBadge status="healthy" label="Verified" /></SummaryRow>
            <SummaryRow label="WhatsApp"><StatusBadge status="healthy" label="Verified" /></SummaryRow>
            <div className="mt-3">
              <p className="text-xs text-[var(--text-muted)]">Organization ID</p>
              <div className="mt-1 flex items-center gap-1 rounded-md bg-[var(--surface-muted)] pl-3 pr-1">
                <code className="min-w-0 flex-1 truncate text-xs text-[var(--text-secondary)]">{SAMPLE_ORG.id}</code>
                <CopyButton value={SAMPLE_ORG.id} label="Copy organization ID" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
