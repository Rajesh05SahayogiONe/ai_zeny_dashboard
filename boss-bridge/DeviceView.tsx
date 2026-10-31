"use client";

import { useState } from "react";
import { Download, KeyRound, Monitor, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/dashboard/Card";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CopyButton } from "./CopyButton";
import { InfoGrid, Steps } from "./fields";
import { formatDateTime } from "./format";
import { PageHeader } from "./PageHeader";
import { previewOnly } from "./preview";
import { SAMPLE_CODES, SAMPLE_DEVICE, SAMPLE_HISTORY, SAMPLE_ORG, type EnrollmentCode, type HistoryEntry } from "./sample";
import { Timeline } from "./Timeline";

const CODE_COLUMNS: Column<EnrollmentCode>[] = [
  { key: "code", header: "Code", render: (r) => <code className="text-xs">{r.code}</code> },
  { key: "pc", header: "PC name", render: (r) => r.pc },
  { key: "state", header: "State", render: (r) => <StatusBadge status={r.state === "Pending" ? "info" : "neutral"} label={r.state} /> },
  { key: "created", header: "Created", render: (r) => formatDateTime(r.created), sortValue: (r) => r.created },
  { key: "expires", header: "Expires", render: (r) => formatDateTime(r.expires), sortValue: (r) => r.expires },
  { key: "attempts", header: "Attempts", render: (r) => r.attempts, className: "text-right" },
  { key: "action", header: "Action", render: () => "—" },
];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LIFETIME_MS = 15 * 60_000;

function newEnrollmentCode(): string {
  const suffix = Array.from({ length: 12 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  return `bb_enroll_${suffix}`;
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function VideoLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors"
      style={{ background: "var(--status-info-bg)" }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--status-critical-fg)] text-white"><Youtube size={16} /></span>
      <span className="min-w-0 flex-1 text-[var(--text-heading)]">{label}</span>
    </a>
  );
}

/**
 * Device page. Revoke (the device card) and Create code (the Enrollment codes card) are each a working action
 * in this browser only — a single button per action, matched by the "Moving to a new PC?" steps.
 */
export function DeviceView() {
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokedAt, setRevokedAt] = useState<string | null>(null);
  const [codes, setCodes] = useState<EnrollmentCode[]>(SAMPLE_CODES);
  const [history, setHistory] = useState<HistoryEntry[]>(SAMPLE_HISTORY);
  const [issued, setIssued] = useState<{ full: string; expires: string } | null>(null);
  const revoked = revokedAt !== null;
  const seatsUsed = revoked ? 0 : SAMPLE_DEVICE.seatsUsed;

  function revokePc() {
    const at = new Date().toISOString();
    setRevokedAt(at);
    setIssued(null);
    setHistory((h) => [{ id: uid(), title: "PC revoked", detail: `${SAMPLE_DEVICE.name} was revoked`, at, by: SAMPLE_ORG.owner, kind: "device" }, ...h]);
    toast("PC revoked in this preview", { description: "Nothing was saved." });
  }

  function createCode() {
    const full = newEnrollmentCode();
    const now = Date.now();
    const created = new Date(now).toISOString();
    const expires = new Date(now + CODE_LIFETIME_MS).toISOString();
    const shown = `${full.slice(0, 14)}…`;
    setCodes((current) => [
      { id: uid(), code: shown, pc: "—", state: "Pending", created, expires, attempts: 0 },
      ...current.map((c) => (c.state === "Pending" ? { ...c, state: "Expired" as const } : c)),
    ]);
    setHistory((h) => [{ id: uid(), title: "Enrollment code created", detail: `${shown} for a new PC`, at: created, by: SAMPLE_ORG.owner, kind: "code" }, ...h]);
    setIssued({ full, expires });
  }

  return (
    <>
      <PageHeader
        sample
        title="Device"
        status={revoked ? <StatusBadge status="neutral" label="Revoked" /> : <StatusBadge status="healthy" label="Active" />}
        description="The Windows PC that runs Boss Bridge for your organization."
        action={<Button variant="outline" onClick={() => previewOnly("The download")}><Download size={16} />Download for Windows</Button>}
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card
            title="Active PC"
            action={
              <p className="text-xs text-[var(--text-muted)]">
                {revoked ? "0" : "1"} active PC · 0 connected · {revoked ? "0" : "1"} status unknown · Device seats: {seatsUsed} of {SAMPLE_DEVICE.seatsTotal} in use
              </p>
            }
          >
            <div className="rounded-xl border border-[var(--divider)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}><Monitor size={22} /></span>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-heading)]">{SAMPLE_DEVICE.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StatusBadge status={revoked ? "neutral" : "healthy"} label={revoked ? "Revoked" : "Active"} />
                      <StatusBadge status="neutral" label="Pusher not set up" />
                    </div>
                  </div>
                </div>
                <p className="max-w-xs text-sm text-[var(--text-muted)]">{revoked ? "This PC no longer has access." : "Add your Pusher credentials to connect this PC."}</p>
              </div>

              <div className="mt-4">
                <p className="text-xs text-[var(--text-muted)]">Device ID</p>
                <div className="mt-1 flex items-center gap-1 rounded-md bg-[var(--surface-muted)] pl-3 pr-1">
                  <code className="min-w-0 flex-1 truncate py-1.5 text-xs text-[var(--text-secondary)]">{SAMPLE_DEVICE.id}</code>
                  <CopyButton value={SAMPLE_DEVICE.id} label="Copy device ID" />
                </div>
              </div>

              <InfoGrid
                className="mt-4 screen-sm:grid-cols-3"
                items={[
                  { label: "Enrolled", value: formatDateTime(SAMPLE_DEVICE.enrolled) },
                  { label: revoked ? "Revoked" : "Last seen", value: formatDateTime(revokedAt ?? SAMPLE_DEVICE.lastSeen) },
                  { label: "Boss Bridge version", value: SAMPLE_DEVICE.version },
                ]}
              />

              <div className="mt-5 border-t border-[var(--divider)] pt-4">
                <Button variant="outline" disabled={revoked} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setRevokeOpen(true)}>
                  {revoked ? "PC revoked" : "Revoke this PC"}
                </Button>
              </div>
            </div>

            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {revoked ? "The seat is free. Create a code below to enrol the new PC." : "Moving to a different PC? Revoke this one first — a replacement cannot take over while it is still active."}
            </p>
          </Card>

          <Card title="Moving to a new PC?">
            <Steps
              steps={[
                { title: "Revoke this PC", text: "Boss Bridge stops working on it at once.", state: revoked ? "done" : "current" },
                { title: "Create a code for the new PC", text: "Works once, for 15 minutes.", state: !revoked ? "locked" : issued ? "done" : "current" },
                { title: "Enter the code in Boss Bridge", text: "On the new PC; it then takes the seat.", state: issued ? "current" : "locked" },
              ]}
            />
            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--divider)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Video tutorials</p>
              <VideoLink label="Watch device enrollment" href="#" />
              <VideoLink label="Watch connection setup" href="#" />
            </div>
          </Card>
        </div>

        <Card
          title="Enrollment codes"
          description="Each code works once and expires 15 minutes after it is created. Only its first characters are kept."
          action={
            seatsUsed >= SAMPLE_DEVICE.seatsTotal && !revoked ? (
              <p className="text-xs text-[var(--text-muted)]">All device seats are in use. Revoke a PC before adding another.</p>
            ) : (
              <Button size="sm" onClick={createCode}><KeyRound size={14} />{issued ? "Create another code" : "Create code"}</Button>
            )
          }
        >
          <DataTable columns={CODE_COLUMNS} rows={codes} getRowKey={(r) => r.id} textClassName="text-sm" />
          {issued && (
            <div className="mt-3 rounded-lg border border-[var(--divider)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs font-semibold text-[var(--text-heading)]">New code — enter this on the new PC</p>
              <div className="mt-1 flex items-center gap-1">
                <code className="min-w-0 flex-1 break-all text-sm font-semibold text-[var(--text-heading)]">{issued.full}</code>
                <CopyButton value={issued.full} label="Copy enrollment code" />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Valid once, until {formatDateTime(issued.expires)}.</p>
            </div>
          )}
        </Card>

        <Card title="Device history" description="Enrolments, revocations and codes for this organization, newest first.">
          <Timeline
            items={history.map((h) => ({
              id: h.id,
              icon: h.kind === "device" ? <Monitor size={15} /> : <KeyRound size={15} />,
              title: h.title,
              detail: h.detail,
              meta: formatDateTime(h.at),
              by: h.by,
            }))}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        destructive
        title={`Revoke ${SAMPLE_DEVICE.name}?`}
        description="Boss Bridge stops working on this PC at once. You can enrol a replacement afterwards."
        confirmLabel="Revoke PC"
        onConfirm={revokePc}
      />
    </>
  );
}
