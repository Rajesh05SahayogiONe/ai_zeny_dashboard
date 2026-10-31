import { CalendarClock, Check, Lock } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InfoGrid, ProgressBar } from "./fields";
import { formatDate } from "./format";
import { PageHeader } from "./PageHeader";
import { PreviewButton } from "./PreviewButton";
import { SAMPLE_PLAN, SUBSCRIPTION_STATUS_HELP } from "./sample";

const HISTORY = [
  { plan: "Trial", change: "Trial", status: "Active", term: `${formatDate(SAMPLE_PLAN.started)} → ${formatDate(SAMPLE_PLAN.ends)}`, companies: SAMPLE_PLAN.companies, devices: SAMPLE_PLAN.devices, amount: SAMPLE_PLAN.amount, current: true },
];

export function SubscriptionView() {
  return (
    <>
      <PageHeader
        sample
        title="Subscription"
        description="What your organization is entitled to today, and the full record of how it changed."
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--status-warning-bg)] p-3 text-[var(--status-warning-fg)]" role="status">
          <CalendarClock size={18} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Your trial ends in {SAMPLE_PLAN.daysLeft} days, on {formatDate(SAMPLE_PLAN.ends)}</p>
            <p className="text-xs">To keep relay requests and device enrolment working after that, ask the Boss Bridge team to activate a plan.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text-heading)]">Trial plan</h2>
                  <StatusBadge status="healthy" label="Active" />
                </div>
                <p className="text-sm text-[var(--text-muted)]">Your subscription is active.</p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Trial · since {formatDate(SAMPLE_PLAN.started)}</p>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Term</span>
                <span className="font-semibold text-[var(--status-warning-fg)]">{SAMPLE_PLAN.daysLeft} days left</span>
              </div>
              <ProgressBar pct={SAMPLE_PLAN.elapsedPct} label="Term elapsed" />
              <div className="mt-1 flex justify-between text-xs text-[var(--text-muted)]">
                <span>Started {formatDate(SAMPLE_PLAN.started)}</span>
                <span>Ends {formatDate(SAMPLE_PLAN.ends)}</span>
              </div>
            </div>

            <InfoGrid
              className="mt-5"
              items={[
                { label: "Companies", value: <>{SAMPLE_PLAN.companies} <span className="font-normal text-[var(--text-muted)]">plan limit</span></> },
                { label: "Financial years", value: <>{SAMPLE_PLAN.financialYears} <span className="font-normal text-[var(--text-muted)]">plan limit</span></> },
                { label: "Enrolled devices", value: <>{SAMPLE_PLAN.devices} <span className="font-normal text-[var(--text-muted)]">plan limit</span></> },
                { label: "Amount", value: <>{SAMPLE_PLAN.amount} <span className="font-normal text-[var(--text-muted)]">free trial</span></> },
              ]}
            />

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--divider)] pt-4">
              <span className="text-xs text-[var(--text-muted)]">Included</span>
              {SAMPLE_PLAN.included.map((feature) => (
                <StatusBadge key={feature.label} status={feature.on ? "healthy" : "neutral"} label={`${feature.label}: ${feature.on ? "included" : "not included"}`} />
              ))}
            </div>
          </Card>

          <Card title="Need a change?">
            <p className="text-sm text-[var(--text-muted)]">To change your plan, quantities or dates, contact the Boss Bridge team. Plans are activated for you — there is no checkout here.</p>
            <ul className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
              {[`Activate a plan before ${formatDate(SAMPLE_PLAN.ends)}`, "More companies or financial years", "Another PC (device seat)"].map((line) => (
                <li key={line} className="flex items-center gap-2"><Check size={15} className="shrink-0 text-[var(--status-healthy-fg)]" />{line}</li>
              ))}
            </ul>
            <div className="mt-4"><PreviewButton action="Contacting the Boss Bridge team" className="w-full">Contact us</PreviewButton></div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">An ended or suspended plan blocks relay requests and device enrolment. Sign-in always stays open.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card title="History" description="1 record · newest first">
            <div className="overflow-x-auto rounded-[var(--card-radius)] border border-[var(--card-border)]">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider)] bg-[var(--search-bg)]/70 text-xs text-[var(--role-text)]">
                    {["Plan", "Change", "Status", "Term", "Companies", "Devices", "Amount"].map((h) => <th key={h} className="px-2.5 py-1.5 font-semibold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((row) => (
                    <tr key={row.plan} className={row.current ? "bg-[var(--status-info-bg)]/40" : ""}>
                      <td className="px-2.5 py-2"><span className="font-medium text-[var(--text-heading)]">{row.plan}</span><span className="block text-xs text-[var(--text-muted)]">Current</span></td>
                      <td className="px-2.5 py-2">{row.change}</td>
                      <td className="px-2.5 py-2"><StatusBadge status="healthy" label={row.status} /></td>
                      <td className="px-2.5 py-2">{row.term}</td>
                      <td className="px-2.5 py-2">{row.companies}</td>
                      <td className="px-2.5 py-2">{row.devices}</td>
                      <td className="px-2.5 py-2">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 flex items-start gap-2 text-xs text-[var(--text-muted)]"><Lock size={13} className="mt-0.5 shrink-0" />Each row is a frozen record of what you bought. A later price change never alters a subscription that is already active.</p>
          </Card>

          <Card title="Changes" description="from your record">
            <ul className="grid gap-3">
              <li className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-solid)]" /><div><p className="text-sm font-semibold text-[var(--text-heading)]">Trial started</p><p className="text-xs text-[var(--text-muted)]">{SAMPLE_PLAN.companies} companies · {SAMPLE_PLAN.devices} device</p></div></div>
                <span className="text-xs text-[var(--text-muted)]">{formatDate(SAMPLE_PLAN.started)}</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card title="What each status means">
          <dl className="grid grid-cols-1 gap-3 screen-lg:grid-cols-2">
            {SUBSCRIPTION_STATUS_HELP.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-28 shrink-0"><StatusBadge status={item.status} label={item.label} /></div>
                <dd className="text-sm text-[var(--text-secondary)]">{item.text}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
