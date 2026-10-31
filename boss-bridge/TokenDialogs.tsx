"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioCard } from "@/components/ui/radio-card";
import { Select, Textarea } from "./fields";
import type { ApiToken } from "./sample";

export type TokenDialogState =
  | { type: "create" }
  | { type: "edit" | "rotate" | "revoke"; token: ApiToken }
  | null;

export interface TokenInput { name: string; access: string; expires: string | null }

/** What the dialogs do on confirm; the page owns the token list. */
export interface TokenActions {
  create: (input: TokenInput) => void;
  edit: (id: string, input: TokenInput) => void;
  rotate: (id: string, overlapMinutes: number) => void;
  revoke: (id: string) => void;
}

type Access = "all" | "selected";

function AccessFields({ idPrefix, access, onAccess, codes, onCodes, error }: { idPrefix: string; access: Access; onAccess: (a: Access) => void; codes: string; onCodes: (v: string) => void; error?: string }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Company access</legend>
      <div className="grid grid-cols-1 gap-3 screen-sm:grid-cols-2">
        <RadioCard name={`${idPrefix}-access`} value="all" checked={access === "all"} onChange={() => onAccess("all")} title="All companies" description="Every company on this PC, including ones added later." />
        <RadioCard name={`${idPrefix}-access`} value="selected" checked={access === "selected"} onChange={() => onAccess("selected")} title="Selected companies" description="Only the company codes you list." />
      </div>
      {access === "selected" && (
        <FormField id={`${idPrefix}-codes`} label="Company codes" error={error} description="Separate codes with commas, for example C01, C02.">
          {(a11y) => <Input {...a11y} autoComplete="off" value={codes} onChange={(event) => onCodes(event.target.value)} />}
        </FormField>
      )}
    </fieldset>
  );
}

function DialogShell({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: React.ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--icon-chip-bg)", color: "var(--icon-chip-fg)" }}><KeyRound size={18} /></span>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function CreateOrEdit({ mode, token, actions, onClose }: { mode: "create" | "edit"; token?: ApiToken; actions: TokenActions; onClose: () => void }) {
  const isCreate = mode === "create";
  const [name, setName] = useState(token?.name ?? "");
  const [access, setAccess] = useState<Access>(token && token.access !== "All companies" ? "selected" : "all");
  const [codes, setCodes] = useState(token && token.access !== "All companies" ? token.access : "");
  const [expires, setExpires] = useState(token?.expires ? token.expires.slice(0, 10) : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Give the token a name.");
    const codeList = codes.split(",").map((c) => c.trim()).filter(Boolean);
    if (access === "selected" && codeList.length === 0) return setError("List at least one company code.");
    if (isCreate && !password) return setError("Enter your password to confirm it is you.");
    const input: TokenInput = {
      name: name.trim(),
      access: access === "all" ? "All companies" : codeList.join(", "),
      expires: expires ? `${expires}T00:00:00+05:30` : null,
    };
    if (isCreate) actions.create(input);
    else if (token) actions.edit(token.id, input);
    onClose();
  }

  return (
    <DialogShell
      open
      onClose={onClose}
      title={isCreate ? "Create an API token" : "Edit this token"}
      description={isCreate ? "A token lets an external system call Boss Bridge for this organization." : "Change what the token is called, which companies it reaches, and when it expires."}
    >
      <form onSubmit={submit} className="grid gap-4">
        <FormField id="token-name" label="Name" required error={error && !name.trim() ? error : undefined} description="How you will recognise this integration, for example Nightly export.">
          {(a11y) => <Input {...a11y} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} />}
        </FormField>
        <AccessFields idPrefix="token" access={access} onAccess={setAccess} codes={codes} onCodes={setCodes} error={error && name.trim() && access === "selected" && !codes.trim() ? error : undefined} />
        <div className="grid grid-cols-1 gap-4 screen-sm:grid-cols-2">
          <FormField id="token-expires" label="Expires (optional)" description="Leave empty for no expiry.">
            {(a11y) => <Input {...a11y} type="date" value={expires} onChange={(event) => setExpires(event.target.value)} />}
          </FormField>
          {isCreate && (
            <FormField id="token-password" label="Your password" required error={error && name.trim() && !(access === "selected" && !codes.trim()) ? error : undefined} description="Confirm it is you. This is your portal password, not the token.">
              {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
            </FormField>
          )}
        </div>
        {isCreate && <p className="text-xs text-[var(--text-muted)]">An integration that expires unexpectedly stops without warning.</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isCreate ? "Create token" : "Save changes"}</Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}

function Rotate({ token, actions, onClose }: { token: ApiToken; actions: TokenActions; onClose: () => void }) {
  const [overlap, setOverlap] = useState("15");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) return setError("Enter your password to confirm it is you.");
    actions.rotate(token.id, Number(overlap));
    onClose();
  }

  return (
    <DialogShell open onClose={onClose} title="Rotate this token" description="You get a new token value. The old one keeps working for the overlap you choose, then stops.">
      <form onSubmit={submit} className="grid gap-4">
        <p className="text-sm text-[var(--text-muted)]">Token: <strong className="text-[var(--text-heading)]">{token.name}</strong> <code className="text-xs">{token.prefix}</code></p>
        <FormField id="rotate-overlap" label="Overlap before the old token stops" description="Time to move the new token into your integration before the old one is refused.">
          {(a11y) => (
            <Select {...a11y} value={overlap} onChange={(event) => setOverlap(event.target.value)}>
              <option value="0">No overlap — stop immediately</option>
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
            </Select>
          )}
        </FormField>
        <p className="text-xs text-[var(--text-muted)]">
          {overlap === "0" ? "The current token stops working the moment you rotate." : `The current token stops working ${overlap} minutes after you rotate, whatever happens in between.`}
        </p>
        <FormField id="rotate-password" label="Your password" required error={error}>
          {(a11y) => <Input {...a11y} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />}
        </FormField>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Rotate token</Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}

function Revoke({ token, actions, onClose }: { token: ApiToken; actions: TokenActions; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <ConfirmDialog
      open
      onOpenChange={(next) => !next && onClose()}
      destructive
      title="Revoke this token"
      description={`Anything using “${token.name}” stops working immediately. This cannot be undone.`}
      confirmLabel="Revoke token"
      cancelLabel="Keep it"
      onConfirm={() => actions.revoke(token.id)}
    >
      <FormField id="revoke-reason" label="Reason (optional)" description="Recorded in the audit trail. Leave blank if you prefer.">
        {(a11y) => <Textarea {...a11y} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />}
      </FormField>
    </ConfirmDialog>
  );
}

/** Mounts the one dialog the table's state asks for; each remounts fresh so a form never keeps a previous token's values. */
export function TokenDialogs({ state, actions, onClose }: { state: TokenDialogState; actions: TokenActions; onClose: () => void }) {
  if (!state) return null;
  if (state.type === "create") return <CreateOrEdit key="create" mode="create" actions={actions} onClose={onClose} />;
  if (state.type === "edit") return <CreateOrEdit key={`edit-${state.token.id}`} mode="edit" token={state.token} actions={actions} onClose={onClose} />;
  if (state.type === "rotate") return <Rotate key={`rotate-${state.token.id}`} token={state.token} actions={actions} onClose={onClose} />;
  return <Revoke key={`revoke-${state.token.id}`} token={state.token} actions={actions} onClose={onClose} />;
}
