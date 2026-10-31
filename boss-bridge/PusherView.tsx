"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InfoGrid, Steps, Textarea } from "./fields";
import { PageHeader } from "./PageHeader";
import { previewOnly } from "./preview";

type Creds = { appId: string; cluster: string; key: string; secret: string };
const EMPTY: Creds = { appId: "", cluster: "", key: "", secret: "" };
const FIELD_OF: Record<string, keyof Creds> = { app_id: "appId", key: "key", secret: "secret", cluster: "cluster" };

/** Reads `app_id = "123"` style lines from Pusher's Keys page; runs in the browser only. */
function parsePusherBlock(text: string): Partial<Creds> {
  const out: Partial<Creds> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(app_id|key|secret|cluster)\s*[=:]\s*["']?([^"'\s]+)["']?\s*$/i);
    if (match) out[FIELD_OF[match[1].toLowerCase()]] = match[2];
  }
  return out;
}

export function PusherView() {
  const [creds, setCreds] = useState<Creds>(EMPTY);
  const [pasted, setPasted] = useState("");
  const complete = Object.values(creds).every((v) => v.trim());
  const set = (field: keyof Creds) => (event: React.ChangeEvent<HTMLInputElement>) => setCreds((c) => ({ ...c, [field]: event.target.value }));

  function fillFromPaste() {
    const found = parsePusherBlock(pasted);
    const count = Object.keys(found).length;
    if (!count) {
      toast.error("No Pusher credentials found in that text");
      return;
    }
    setCreds((c) => ({ ...c, ...found }));
    setPasted("");
    toast.success(`Filled ${count} field${count > 1 ? "s" : ""}`);
  }

  return (
    <>
      <PageHeader
        title="Pusher"
        description="Boss Bridge uses your own Pusher account to reach your PC. You own the account, the credentials and the usage limits."
      />

      <div className="flex flex-col gap-[var(--space-md)]">
        <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card title="Current status" description="No Pusher app saved yet">
            <InfoGrid
              items={[
                { label: "Connection", value: <StatusBadge status="neutral" label="Pusher not set up" /> },
                { label: "App secret", value: "Not stored" },
                { label: "Last tested", value: "Never" },
                { label: "Revision", value: "—" },
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--divider)] pt-4">
              <Button variant="outline" disabled><Activity size={16} />Test saved configuration</Button>
              <p className="text-xs text-[var(--text-muted)]">Save credentials before testing.</p>
            </div>
          </Card>
          <Card title="How to set up">
            <Steps
              steps={[
                { title: "Create a Channels app in Pusher", text: "In your own Pusher dashboard." },
                { title: "Copy its Keys", text: "app_id, key, secret and cluster." },
                { title: "Paste here and save", text: "Then test the saved configuration." },
                { title: "Your PC connects", text: "On its next check-in." },
              ]}
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-md)] screen-lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card title="Credentials" description="Create a Channels app in your Pusher dashboard and copy its App ID, key, secret and cluster here. Boss Bridge has no Pusher account of its own to fall back on.">
            <form
              className="mt-2 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (complete) previewOnly("Saving the Pusher credentials");
              }}
            >
              <div className="grid grid-cols-1 gap-4 screen-sm:grid-cols-2">
                <FormField id="pusher-app-id" label="App ID" required description="Digits only, from your Pusher app's Keys page.">
                  {(a11y) => <Input {...a11y} inputMode="numeric" autoComplete="off" value={creds.appId} onChange={set("appId")} />}
                </FormField>
                <FormField id="pusher-cluster" label="Cluster" required description="For example ap2.">
                  {(a11y) => <Input {...a11y} autoComplete="off" placeholder="ap2" value={creds.cluster} onChange={set("cluster")} />}
                </FormField>
                <FormField id="pusher-key" label="Key" required description="Public by Pusher's design; your PC receives it.">
                  {(a11y) => <Input {...a11y} autoComplete="off" placeholder="Your app key" value={creds.key} onChange={set("key")} />}
                </FormField>
                <FormField id="pusher-secret" label="Secret" required description="Required. Stored encrypted and never shown again.">
                  {(a11y) => <Input {...a11y} type="password" autoComplete="new-password" value={creds.secret} onChange={set("secret")} />}
                </FormField>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--divider)] pt-4">
                <Button type="submit" disabled={!complete}>Save and enable</Button>
                <p className="text-xs text-[var(--text-muted)]">After saving, test the configuration from the status card.</p>
              </div>
            </form>
          </Card>

          <Card title="Paste from Pusher" description="Optional. Paste the block from your Pusher app's Keys page (app_id, key, secret, cluster) to fill the credential fields.">
            <div className="grid gap-3">
              <FormField id="pusher-paste" label="Paste Pusher credentials">
                {(a11y) => (
                  <Textarea
                    {...a11y}
                    rows={5}
                    spellCheck={false}
                    className="font-mono text-xs"
                    placeholder={'app_id = "1234567"\nkey = "a1b2c3d4e5f6a7b8c9d0"\nsecret = "••••••••••••••••••••"\ncluster = "ap2"'}
                    value={pasted}
                    onChange={(event) => setPasted(event.target.value)}
                  />
                )}
              </FormField>
              <div>
                <Button type="button" variant="outline" size="sm" disabled={!pasted.trim()} onClick={fillFromPaste}>Fill fields</Button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Read in this browser only; never saved or sent as-is.</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
