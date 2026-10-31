"use client";

import { useState } from "react";
import { CircleHelp, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/dashboard/Card";
import { KPITile } from "@/components/dashboard/KPITile";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDate, formatDateTime } from "./format";
import { PageHeader } from "./PageHeader";
import { SAMPLE_TOKENS, type ApiToken } from "./sample";
import { TokenDialogs, type TokenActions, type TokenDialogState, type TokenInput } from "./TokenDialogs";

const TILE = { iconBg: "var(--surface-muted)", iconFg: "var(--text-secondary)" } as const;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function generateToken(): string {
  return `bb_pat_${Array.from({ length: 40 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("")}`;
}
const prefixOf = (token: string) => `${token.slice(0, 11)}…`;
const todayLabel = () => `Today, ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })}`;

interface Revealed { title: string; token: string; note?: string }

/** One-time view of a token's full value, shown right after it is created or rotated. */
function RevealBanner({ revealed, onDone }: { revealed: Revealed; onDone: () => void }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(revealed.token);
      toast.success("Token copied");
    } catch {
      toast.error("Couldn't copy — select the token and copy it by hand");
    }
  }
  return (
    <section className="rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--status-info-bg)] p-[var(--card-pad)]" style={{ boxShadow: "var(--card-shadow)" }} aria-label="New token">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--icon-chip-fg)]"><KeyRound size={18} /></span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--text-heading)]">{revealed.title}</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Copy it now and keep it in your own secret manager. It is shown once and cannot be retrieved later — if you lose it, rotate the token to get a new one.
            {revealed.note && <> {revealed.note}</>}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-stretch gap-3">
        <code className="min-w-0 flex-1 basis-[18rem] break-all rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-heading)]">{revealed.token}</code>
        <Button onClick={copy} className="h-auto"><Copy size={16} />Copy token</Button>
        <Button variant="outline" onClick={onDone} className="h-auto bg-[var(--surface)]">I have saved it</Button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">Use it as: Authorization: Bearer {revealed.token.slice(0, 10)}…</p>
    </section>
  );
}

export function ApiTokensView() {
  const [tokens, setTokens] = useState<ApiToken[]>(SAMPLE_TOKENS);
  const [dialog, setDialog] = useState<TokenDialogState>(null);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const active = tokens.filter((t) => t.status === "Active");
  const lastUsed = active.map((t) => t.lastUsed).filter((v): v is string => Boolean(v)).sort().at(-1);
  const expiringSoon = active.filter((t) => t.expires).length;

  const actions: TokenActions = {
    create(input: TokenInput) {
      const token = generateToken();
      const id = uid();
      setTokens((cur) => [{ id, name: input.name, prefix: prefixOf(token), access: input.access, created: new Date().toISOString(), createdLabel: todayLabel(), lastUsed: null, expires: input.expires, status: "Active" }, ...cur]);
      setHighlightId(id);
      setRevealed({ title: `New API token — ${input.name}`, token });
    },
    edit(id, input) {
      setTokens((cur) => cur.map((t) => (t.id === id ? { ...t, name: input.name, access: input.access, expires: input.expires } : t)));
      toast.success("Token updated");
    },
    rotate(id, overlapMinutes) {
      const token = generateToken();
      const name = tokens.find((t) => t.id === id)?.name ?? "token";
      setTokens((cur) => cur.map((t) => (t.id === id ? { ...t, prefix: prefixOf(token) } : t)));
      setHighlightId(id);
      setRevealed({
        title: `Token rotated — ${name}`,
        token,
        note: overlapMinutes === 0 ? "The previous value stopped working immediately." : `The previous value keeps working for ${overlapMinutes} minutes.`,
      });
    },
    revoke(id) {
      setTokens((cur) => cur.map((t) => (t.id === id ? { ...t, status: "Revoked" } : t)));
      setHighlightId((cur) => (cur === id ? null : cur));
      toast("Token revoked", { description: "Anything using it stops working." });
    },
  };

  return (
    <>
      <PageHeader
        sample
        title="API tokens"
        status={<StatusBadge status="healthy" label={`${active.length} active`} />}
        description="Tokens let your own systems call the Boss Bridge API for this organization."
        action={<Button onClick={() => setDialog({ type: "create" })}><KeyRound size={16} />Create token</Button>}
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        {revealed && <RevealBanner revealed={revealed} onDone={() => setRevealed(null)} />}

        <div className="kpi-plain grid grid-cols-2 gap-[var(--space-md)] screen-lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.4fr)]">
          <KPITile title="Active tokens" value={String(active.length)} note="of 20 allowed" status="info" {...TILE} />
          <KPITile title="Last used" value={lastUsed ? formatDate(lastUsed) : "Never"} note={lastUsed ? "Most recent request" : "No token has been used yet"} status="neutral" {...TILE} />
          <KPITile title="Unused for 90 days" value="0" note="None flagged" status="neutral" {...TILE} />
          <KPITile title="Expiring in 30 days" value={String(expiringSoon)} note={expiringSoon ? "Review before they stop" : "None soon"} status={expiringSoon ? "warning" : "neutral"} {...TILE} />
          <div className="col-span-2 screen-lg:col-span-1">
            <Card title="Use a token">
              <pre className="overflow-x-auto rounded-md bg-[var(--accent-solid)] px-3 py-2 text-xs text-white"><code>Authorization: Bearer bb_pat_…</code></pre>
              <p className="mt-2 text-xs text-[var(--text-muted)]">Send it with every request. Keep it in your own secret manager, never in code or URLs.</p>
            </Card>
          </div>
        </div>

        <Card title="Tokens" description="Up to 20 active tokens. Give each integration its own token." action={<span className="text-xs text-[var(--text-muted)]">Newest first</span>}>
          <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider)] bg-[var(--search-bg)]/70 text-xs uppercase tracking-wide text-[var(--role-text)]">
                    {["Name", "Companies", "Status", "Expires", "Last used"].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
                    <th className="px-3 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => {
                    const isActive = t.status === "Active";
                    return (
                      <tr key={t.id} className={`border-b border-[var(--divider)] last:border-b-0 ${t.id === highlightId ? "bg-[var(--status-info-bg)]/60" : ""} ${isActive ? "" : "opacity-70"}`}>
                        <td className="px-3 py-3" style={t.id === highlightId ? { boxShadow: "inset 3px 0 0 var(--accent-solid)" } : undefined}>
                          <p className="font-medium text-[var(--text-heading)]">{t.name}</p>
                          <p className="text-xs text-[var(--text-muted)]"><code>{t.prefix}</code> · created {t.createdLabel ?? formatDate(t.created)}</p>
                        </td>
                        <td className="px-3 py-3"><span className="inline-flex rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">{t.access}</span></td>
                        <td className="px-3 py-3"><StatusBadge status={isActive ? "healthy" : "neutral"} label={t.status} /></td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{t.expires ? formatDate(t.expires) : "No expiry"}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{t.lastUsed ? formatDateTime(t.lastUsed) : "Never"}</td>
                        <td className="px-3 py-3">
                          {isActive ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setDialog({ type: "edit", token: t })}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => setDialog({ type: "rotate", token: t })}>Rotate</Button>
                              <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDialog({ type: "revoke", token: t })}>Revoke</Button>
                            </div>
                          ) : (
                            <p className="text-right text-[var(--text-muted)]">—</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="flex items-start gap-2 border-t border-[var(--divider)] px-3 py-3 text-xs text-[var(--text-muted)]">
              <CircleHelp size={14} className="mt-0.5 shrink-0" />
              A token marked unused for 90 days keeps working; the mark is only a reminder to check it is still needed.
            </p>
          </div>
        </Card>
      </div>

      <TokenDialogs state={dialog} actions={actions} onClose={() => setDialog(null)} />
    </>
  );
}
