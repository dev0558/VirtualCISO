"use client";

import { useState } from "react";
import useSWR from "swr";
import { ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-actions";
import { api, fetcher } from "@/lib/api";
import { ago } from "@/lib/format";
import type { ConnectorType } from "@/lib/types";

interface Meta {
  type: ConnectorType; name: string; read_only_scopes: string[];
  credential_fields: { name: string; label: string; secret: boolean; multiline?: boolean }[];
}

const SETUP: Record<ConnectorType, { summary: string; steps: string[]; docs: string }> = {
  m365: {
    summary: "Register an app in Microsoft Entra ID with read-only Microsoft Graph application permissions.",
    steps: [
      "Entra admin center → App registrations → New registration (single tenant).",
      "API permissions → Microsoft Graph → Application permissions: add the read-only scopes listed, then Grant admin consent.",
      "Certificates & secrets → New client secret. Paste the tenant ID, client ID and secret below.",
    ],
    docs: "https://learn.microsoft.com/graph/auth-v2-service",
  },
  google_workspace: {
    summary: "Create a service account with domain-wide delegation limited to read-only Admin SDK scopes.",
    steps: [
      "Google Cloud console → create a service account and a JSON key; enable the Admin SDK API.",
      "Admin console → Security → API controls → Domain-wide delegation: add the client ID with only the read-only scopes listed.",
      "Paste the JSON key and the email of an admin the service account may impersonate.",
    ],
    docs: "https://developers.google.com/admin-sdk/directory/v1/guides/delegation",
  },
  github: {
    summary: "Create a fine-grained token (or GitHub App) with read-only organisation and repository permissions.",
    steps: [
      "GitHub → Settings → Developer settings → Fine-grained tokens → resource owner: your organisation.",
      "Grant read-only: Members, Administration, Metadata, Code scanning alerts, Secret scanning alerts.",
      "Paste the organisation login and token. An owner-approved token is needed to read 2FA enforcement.",
    ],
    docs: "https://docs.github.com/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens",
  },
};

export default function IntegrationsPage() {
  const { orgId, state, can } = useOrg();
  const { data } = useSWR<{ connectors: Meta[] }>(`/orgs/${orgId}/integrations/catalog`, fetcher);
  const [connecting, setConnecting] = useState<Meta | null>(null);
  const [sample, sampling] = useAction((t: string) => api(`/orgs/${orgId}/integrations/${t}/sample`, { method: "POST" }), "Sample data connected. Run checks to evaluate.");
  const [disconnect] = useAction((t: string) => api(`/orgs/${orgId}/integrations/${t}`, { method: "DELETE" }), "Disconnected and credentials deleted.");

  return (
    <PageBody>
      <PageHeader
        title="Integrations"
        description="Read-only connections. Credentials are encrypted at rest and never shown again; the platform recommends fixes but never changes your systems."
      />
      <div className="grid gap-4 @4xl/main:grid-cols-3">
        {(data?.connectors ?? []).map((c) => {
          const integ = state?.integrations.find((i) => i.type === c.type);
          return (
            <Card key={c.type} className="shadow-xs">
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
                <CardDescription>{SETUP[c.type].summary}</CardDescription>
                <CardAction>{integ ? <StatusBadge status={integ.status} /> : <Badge variant="outline">Not connected</Badge>}</CardAction>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {integ && (
                  <div className="bg-muted/40 space-y-1 rounded-lg border p-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="truncate pl-3 font-mono text-xs">{integ.accountIdentifier}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{integ.mode === "demo" ? "Sample data" : "Live"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last sync</span><span>{ago(integ.lastSyncedAt)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Failing checks</span><span className="tabular-nums">{integ.failingChecks} / {integ.totalChecks}</span></div>
                    {integ.lastError && <p className="text-critical-ink pt-1 text-xs">{integ.lastError}</p>}
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs"><Lock className="size-3" /> Read-only permissions</div>
                  <div className="flex flex-wrap gap-1">
                    {c.read_only_scopes.map((s) => <Badge key={s} variant="secondary" className="font-mono text-[10.5px] font-normal">{s}</Badge>)}
                  </div>
                </div>
              </CardContent>
              {can.edit && (
                <CardFooter className="mt-auto gap-2">
                  <Button size="sm" onClick={() => setConnecting(c)}>{integ?.mode === "live" ? "Update credentials" : integ ? "Connect live account" : "Connect"}</Button>
                  {!integ && <Button size="sm" variant="outline" disabled={sampling} onClick={() => sample(c.type)}>Use sample data</Button>}
                  {integ && <Button size="sm" variant="ghost" className="text-muted-foreground ml-auto" onClick={() => disconnect(c.type)}>Disconnect</Button>}
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
      <Alert>
        <ShieldCheck />
        <AlertDescription>
          Checks run on demand and automatically every day at 02:00 UTC. Raw API responses are reduced to the facts each check needs, identities are masked, and every result is hashed (SHA-256) for integrity.
        </AlertDescription>
      </Alert>
      {connecting && <ConnectDialog meta={connecting} onClose={() => setConnecting(null)} />}
    </PageBody>
  );
}

function ConnectDialog({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  const { orgId, refresh } = useOrg();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const creds = Object.fromEntries(meta.credential_fields.map((x) => [x.name, String(f.get(x.name) ?? "")]));
    setPending(true);
    try {
      await api(`/orgs/${orgId}/integrations/${meta.type}`, { method: "POST", json: { credentials: creds } });
      await refresh();
      toast.success(`${meta.name} connected. Run checks to evaluate.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setPending(false);
    }
  }
  const setup = SETUP[meta.type];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect {meta.name}</DialogTitle>
          <DialogDescription>We validate the credentials before saving. Only read-only access is ever requested.</DialogDescription>
        </DialogHeader>
        <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
          {setup.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <a href={setup.docs} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
          Provider documentation <ExternalLink className="inline size-3" />
        </a>
        <form onSubmit={onSubmit} className="grid gap-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {meta.credential_fields.map((f) => (
            <div key={f.name} className="grid gap-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.multiline ? (
                <Textarea id={f.name} name={f.name} required rows={5} className="font-mono text-xs" spellCheck={false} />
              ) : (
                <Input id={f.name} name={f.name} type={f.secret ? "password" : "text"} required autoComplete="off" spellCheck={false} />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Validating…" : "Validate & connect"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
