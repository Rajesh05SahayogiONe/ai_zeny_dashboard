import Link from "next/link";
import { Archive, FolderPlus, Lock, Sheet } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProgressBar } from "./fields";
import { PageHeader } from "./PageHeader";
import { GOOGLE_CALLS } from "./sample";

const STEPS = [
  { title: "Open Boss Bridge on your PC", text: "The Windows app, signed in to this organization.", link: true },
  { title: "Google Sheets → Sign in to Google", text: "Google's page opens in the PC's browser. Allow every permission." },
  { title: "Confirm the account on the PC", text: "Then this page shows the account and the Sheets, Drive and Backups tabs." },
];

const CAPABILITIES = [
  { icon: <Sheet size={18} />, title: "Check and preview sheets", tab: "Sheets tab", text: "Paste a Google Sheet link, pick a worksheet and a range, and view it." },
  { icon: <FolderPlus size={18} />, title: "Create sheets and folders", tab: "Sheets and Drive tabs", text: "New spreadsheets and folders in the connected Google account." },
  { icon: <Archive size={18} />, title: "See your PC's backups", tab: "Backups tab", text: "Settings backups the PC saved to Google Drive, opened in Drive." },
];

export function IntegrationsView() {
  const pct = Math.round((GOOGLE_CALLS.used / GOOGLE_CALLS.limit) * 100);
  return (
    <>
      <PageHeader
        title="Integrations"
        status={<StatusBadge status="neutral" label="Not connected" />}
        description="Google Sheets and Google Drive, through the Google account connected from the Boss Bridge Windows app."
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}><Sheet size={20} /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-heading)]">Google Sheets and Drive</h2>
              </div>
              <p className="text-sm text-[var(--text-muted)]">No Google account is connected to this organization.</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-heading)]">Connect from the Boss Bridge Windows app: Google Sheets → Sign in to Google.</strong>{" "}
            The portal never starts a Google sign-in.
          </p>

          <ol className="mt-3 grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-[var(--divider)] p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--divider)] text-xs font-semibold text-[var(--text-secondary)]">{index + 1}</span>
                  <p className="text-sm font-semibold text-[var(--text-heading)]">{step.title}</p>
                </div>
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                  {step.text}{" "}
                  {step.link && <Link href="/device" className="font-medium text-[var(--status-info-fg)] hover:underline">See your PC</Link>}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[var(--text-muted)]">Google calls from the portal today: <strong className="text-[var(--text-heading)]">{GOOGLE_CALLS.used} of {GOOGLE_CALLS.limit}</strong></span>
            <div className="min-w-[8rem] flex-1"><ProgressBar pct={pct} label="Google calls used today" /></div>
          </div>
        </Card>

        <Card title="What the portal can do once Google is connected">
          <ul className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <li key={item.title} className="flex gap-3 rounded-xl border border-[var(--divider)] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}>{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-heading)]">{item.title}</p>
                  <p className="text-xs font-medium text-[var(--status-info-fg)]">{item.tab}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <Lock size={13} className="mt-0.5 shrink-0" />
            The portal can view Google Sheets and Drive files and create new ones. It does not edit, rename, move, share or delete files that already exist.
          </p>
        </Card>
      </div>
    </>
  );
}
