"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, KeyRound, LogOut, Mail, MessageCircle, Monitor, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ThemeToggle } from "../layout/ThemeToggle";
import { CopyButton } from "./CopyButton";
import { Select } from "./fields";
import { PageHeader } from "./PageHeader";
import { previewOnly } from "./preview";
import { SAMPLE_ORG } from "./sample";

const COUNTRIES = ["India (+91)", "Bangladesh (+880)", "Nepal (+977)", "Sri Lanka (+94)", "Singapore (+65)", "United Arab Emirates (+971)", "United Kingdom (+44)", "United States (+1)"];

const LINKS = [
  { href: "/subscription", label: "Subscription", text: "Plan, limits and dates", icon: <CreditCard size={17} /> },
  { href: "/device", label: "Device", text: "Your Boss Bridge PC", icon: <Monitor size={17} /> },
  { href: "/api-tokens", label: "API tokens", text: "Access for your own systems", icon: <KeyRound size={17} /> },
  { href: "/pusher", label: "Pusher", text: "Realtime delivery", icon: <Radio size={17} /> },
];

function ChangeContactDialog({ kind, onClose }: { kind: "email" | "whatsapp"; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const isEmail = kind === "email";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || !password) return;
    previewOnly(isEmail ? "Sending the verification code" : "Sending the WhatsApp code");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEmail ? "Change login email" : "Change WhatsApp number"}</DialogTitle>
          <DialogDescription>We send a one-time code to the new {isEmail ? "address" : "number"} before the change takes effect.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <FormField id={`${kind}-new`} label={isEmail ? "New email address" : "New WhatsApp number"} required>
            {(a11y) => <Input {...a11y} type={isEmail ? "email" : "tel"} autoComplete="off" value={value} onChange={(event) => setValue(event.target.value)} />}
          </FormField>
          <FormField id={`${kind}-password`} label="Your password" required>
            {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!value.trim() || !password}>Send code</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProfileView() {
  const [orgName, setOrgName] = useState(SAMPLE_ORG.name);
  const [country, setCountry] = useState(SAMPLE_ORG.country);
  const [contact, setContact] = useState(SAMPLE_ORG.owner);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwError, setPwError] = useState<string | undefined>();
  const [dialog, setDialog] = useState<"email" | "whatsapp" | null>(null);
  const dirty = orgName !== SAMPLE_ORG.name || country !== SAMPLE_ORG.country || contact !== SAMPLE_ORG.owner;

  function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!current) return setPwError("Enter your current password.");
    if (next.length < 12) return setPwError("The new password needs at least 12 characters.");
    setPwError(undefined);
    previewOnly("Changing the password");
    setCurrent("");
    setNext("");
  }

  return (
    <>
      <PageHeader sample title="Profile" description="Your organization's details, your contact name, your login email and your password." />

      <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-[var(--space-md)]">
          <Card
            title="Organization and contact details"
            description="Shown in the sidebar for everyone in this organization."
            action={<StatusBadge status="healthy" label="Active" />}
          >
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                previewOnly("Saving the profile");
              }}
            >
              <div className="grid grid-cols-1 gap-4 screen-sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <FormField id="profile-org" label="Organization name" required>
                  {(a11y) => <Input {...a11y} value={orgName} onChange={(event) => setOrgName(event.target.value)} />}
                </FormField>
                <FormField id="profile-country" label="Country" required>
                  {(a11y) => (
                    <Select {...a11y} value={country} onChange={(event) => setCountry(event.target.value)}>
                      {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                    </Select>
                  )}
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-4 screen-sm:grid-cols-2">
                <FormField id="profile-contact" label="Your name" required>
                  {(a11y) => <Input {...a11y} value={contact} onChange={(event) => setContact(event.target.value)} />}
                </FormField>
                <FormField id="profile-org-id" label="Organization ID" description="Read-only.">
                  {(a11y) => (
                    <div className="flex items-center gap-1 rounded-md border border-input bg-[var(--surface-muted)] pr-1">
                      <Input {...a11y} readOnly value={SAMPLE_ORG.id} className="border-0 bg-transparent font-mono text-xs shadow-none" />
                      <CopyButton value={SAMPLE_ORG.id} label="Copy organization ID" />
                    </div>
                  )}
                </FormField>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--divider)] pt-4">
                <Button type="submit" disabled={!dirty}>Save profile</Button>
                <p className="text-xs text-[var(--text-muted)]">Your login email is changed separately, with a code.</p>
              </div>
            </form>
          </Card>

          <Card title="Password" description="Used with your login email to sign in.">
            <form onSubmit={changePassword} className="grid gap-4">
              <div className="grid grid-cols-1 gap-4 screen-sm:grid-cols-2">
                <FormField id="pw-current" label="Current password" required>
                  {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />}
                </FormField>
                <FormField id="pw-new" label="New password" required error={pwError} description="At least 12 characters.">
                  {(a11y) => <Input {...a11y} type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />}
                </FormField>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Change password</Button>
                <p className="text-xs text-[var(--text-muted)]">Your other sessions are signed out when the password changes.</p>
              </div>
            </form>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-[var(--space-md)]">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}><Mail size={17} /></span>
                <div><h2 className="text-sm font-semibold text-[var(--text-heading)]">Email</h2><p className="text-xs text-[var(--text-muted)]">Your login email</p></div>
              </div>
              <StatusBadge status="healthy" label="Verified" />
            </div>
            <p className="mt-3 break-all text-sm font-medium text-[var(--text-heading)]">{SAMPLE_ORG.email}</p>
            <div className="mt-3"><Button variant="outline" size="sm" onClick={() => setDialog("email")}>Change email</Button></div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}><MessageCircle size={17} /></span>
                <div><h2 className="text-sm font-semibold text-[var(--text-heading)]">WhatsApp</h2><p className="text-xs text-[var(--text-muted)]">Your WhatsApp contact number</p></div>
              </div>
              <StatusBadge status="healthy" label="Verified" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--text-heading)]">{SAMPLE_ORG.whatsapp}</p>
            <div className="mt-3"><Button variant="outline" size="sm" onClick={() => setDialog("whatsapp")}>Change WhatsApp number</Button></div>
          </Card>

          <Card title="This device">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--divider)] pb-3">
              <span className="text-sm text-[var(--text-secondary)]">Appearance</span>
              <ThemeToggle />
            </div>
            <div className="pt-3">
              <Button variant="outline" size="sm" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => previewOnly("Signing out")}>
                <LogOut size={15} />Sign out
              </Button>
            </div>
          </Card>

          <Card title="Managed on their own pages">
            <ul className="-mx-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex items-center gap-3 rounded-lg px-1 py-2.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--search-bg)]">
                    <span className="shrink-0 text-[var(--text-muted)]">{link.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[var(--text-heading)]">{link.label}</span><span className="block text-xs text-[var(--text-muted)]">{link.text}</span></span>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {dialog && <ChangeContactDialog key={dialog} kind={dialog} onClose={() => setDialog(null)} />}
    </>
  );
}
