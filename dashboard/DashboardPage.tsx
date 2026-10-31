import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Hourglass, Landmark, Package, Percent, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { auditActionLabel } from "@/lib/audit-action-label";
import { Card } from "@/components/dashboard/Card";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { GreetingCard } from "@/components/dashboard/GreetingCard";
import { KPITile } from "@/components/dashboard/KPITile";
import { fetchMyWorkspaceActivity } from "../api/activity.data";
import { fetchWorkspaceContext } from "../api/workspace.data";
import { ModulesAtAGlance } from "../components/ModulesAtAGlance";
import { RecentActivityTable, type RecentActivityRow } from "../components/RecentActivityTable";
import { visibleNavItems } from "../components/navConfig";
import { friendlyName } from "../utils/friendly-name";
import { hasWorkspaceAccess, workspaceLandingPath } from "../utils/workspace-access";

const FINANCIAL_METRICS = [
  {key:"totalSales",title:"Total Sales (FY)",icon:<TrendingUp size={18} />},
  {key:"tradingMargin",title:"Trading Margin (FY)",icon:<Percent size={18} />},
  {key:"cashInBank",title:"Cash in Bank",icon:<Landmark size={18} />},
  {key:"receipts",title:"Receipts (FY)",icon:<Receipt size={18} />},
  {key:"receivables",title:"Receivables",icon:<Hourglass size={18} />},
  {key:"inventoryValue",title:"Inventory Value",icon:<Package size={18} />},
  {key:"salesOrders7d",title:"Sales Orders · 7d",icon:<ShoppingCart size={18} />},
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Real data, wired to the tenant's own audit log (/me/workspace/activity, Super Admin only). */
async function RecentActivity() {
  const { data } = await fetchMyWorkspaceActivity({ page: 1, pageSize: 8 });
  const rows: RecentActivityRow[] = data.map((entry) => ({
    id: entry.id,
    activity: auditActionLabel(entry.action),
    by: entry.actorLabel,
    when: formatTimestamp(entry.createdAt),
    whenIso: entry.createdAt,
  }));
  return <RecentActivityTable rows={rows} />;
}

function ActivitySkeleton() {
  return <p className="text-sm text-[var(--text-muted)]">Loading activity…</p>;
}

const CHART_CARD_CLASS = "min-h-[clamp(10rem,24vh,17rem)]";

/** Identity, navigation and activity are backed by authenticated services.
 * Missing financial/chart providers render unavailable values, never samples
 * or fabricated zeroes. The calendar uses the actual browser date. */
export async function DashboardPage() {
  // Server-side, before anything renders: an employee with no workspace
  // access has nothing on this page that is theirs — they get their own
  // self-service home instead (UI test 2026-10-05). `fetchWorkspaceContext`
  // is request-cached, so this reuses the layout's /me/workspace call.
  const context = await fetchWorkspaceContext();
  if (context && !hasWorkspaceAccess(context)) redirect(workspaceLandingPath(context));

  const user = await getCurrentUser();
  const name = friendlyName(user);
  const navItems = context ? visibleNavItems(context) : [];

  return (
    <div className="dashboard-root @container flex flex-col gap-[var(--space-lg)]">
      <div className="grid grid-cols-1 items-stretch gap-[var(--space-md)] @[72rem]:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="grid min-w-0 grid-cols-2 auto-rows-fr gap-[var(--space-md)] screen-sm:grid-cols-4">
          <div className="min-w-0">
            <GreetingCard name={name} />
          </div>
          {FINANCIAL_METRICS.map(metric => <div key={metric.key} className="min-w-0">
            <KPITile title={metric.title} value="—" note="Not available yet" status="neutral" icon={metric.icon} iconBg="var(--surface-muted)" iconFg="var(--text-secondary)" />
          </div>)}
        </div>
        <div className="hidden @[72rem]:block">
          <CalendarCard />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-[var(--space-md)] screen-sm:grid-cols-2">
        <Card title="Items by category" className={CHART_CARD_CLASS}><p className="text-sm text-[var(--text-muted)]">No inventory summary is available yet.</p></Card>
        <Card title="Revenue vs Expense" className={CHART_CARD_CLASS}><p className="text-sm text-[var(--text-muted)]">No financial summary is available yet.</p></Card>
      </div>

      <ModulesAtAGlance items={navItems} />

      {/* The feed is the workspace Super Admin's alone (the API returns an empty page to
          everyone else), so the card is hidden rather than shown empty. Fail closed when
          the workspace context could not be read. */}
      {context?.user.tenantRole === "SUPER_ADMIN" ? (
        <Card title="Recent activity">
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivity />
          </Suspense>
        </Card>
      ) : null}
    </div>
  );
}
