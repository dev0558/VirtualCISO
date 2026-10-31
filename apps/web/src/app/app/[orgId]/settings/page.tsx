"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { Copy, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useMe } from "@/components/app/me-context";
import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAction } from "@/hooks/use-actions";
import { api, fetcher } from "@/lib/api";
import { ROLE_LABEL, ago } from "@/lib/format";

export default function SettingsPage() {
  return <Suspense><Settings /></Suspense>;
}

function Settings() {
  const params = useSearchParams();
  return (
    <PageBody className="max-w-4xl">
      <PageHeader title="Settings" />
      <Tabs defaultValue={params.get("tab") ?? "organisation"} className="gap-4">
        <TabsList><TabsTrigger value="organisation">Organisation</TabsTrigger><TabsTrigger value="team">Team</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger></TabsList>
        <TabsContent value="organisation"><OrgSettings /></TabsContent>
        <TabsContent value="team"><Team /></TabsContent>
        <TabsContent value="security"><Security /></TabsContent>
      </Tabs>
    </PageBody>
  );
}

function OrgSettings() {
  const { state, orgId, can } = useOrg();
  const { refreshMe } = useMe();
  const [save, saving] = useAction((body: Record<string, unknown>) => api(`/orgs/${orgId}`, { method: "PATCH", json: body }), "Organisation updated.");
  if (!state) return null;
  const o = state.organization;
  return (
    <Card className="shadow-xs">
      <form onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await save({ name: f.get("name"), industry: f.get("industry"), employee_count: Number(f.get("employees") || 0), vciso_lead: f.get("vciso") });
        await refreshMe();
      }}>
        <CardHeader><CardTitle>Organisation profile</CardTitle><CardDescription>Used in policies, reports and exports.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={o.name} disabled={!can.edit} /></div>
          <div className="grid gap-2"><Label htmlFor="industry">Industry</Label><Input id="industry" name="industry" defaultValue={o.industry} disabled={!can.edit} /></div>
          <div className="grid gap-2"><Label htmlFor="employees">Employees</Label><Input id="employees" name="employees" type="number" defaultValue={o.employeeCount} disabled={!can.edit} /></div>
          <div className="grid gap-2"><Label htmlFor="vciso">vCISO lead</Label><Input id="vciso" name="vciso" defaultValue={o.vcisoLead} disabled={!can.edit} /></div>
        </CardContent>
        {can.edit && <CardFooter className="justify-end border-t pt-4"><Button type="submit" disabled={saving}>Save</Button></CardFooter>}
      </form>
    </Card>
  );
}

interface Member { id: string; email: string; fullName: string; role: string; mfaEnabled: boolean; pending: boolean; lastLoginAt: string | null }

function Team() {
  const { orgId, can, me } = useOrg();
  const { data, mutate } = useSWR<{ members: Member[] }>(`/orgs/${orgId}/members`, fetcher);
  const [role, setRole] = useState("client_admin");
  const [link, setLink] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setPending(true);
    try {
      const r = await api<{ inviteUrl: string | null }>(`/orgs/${orgId}/members`, { method: "POST", json: { email: f.get("email"), full_name: f.get("full_name") || "", role } });
      setLink(r.inviteUrl);
      toast.success(r.inviteUrl ? "Invitation created. Share the link below." : "Existing user added to this organisation.");
      form.reset();
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally { setPending(false); }
  }
  return (
    <div className="space-y-4">
      {can.edit && (
        <Card className="shadow-xs">
          <CardHeader><CardTitle>Invite a teammate</CardTitle><CardDescription>Auditors get read-only access to controls, evidence and exports.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
              <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
              <div className="grid gap-2"><Label htmlFor="full_name">Name</Label><Input id="full_name" name="full_name" /></div>
              <div className="grid gap-2"><Label>Role</Label>
                <Select value={role} onValueChange={setRole}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="client_admin">Client admin</SelectItem><SelectItem value="auditor">Auditor (read-only)</SelectItem><SelectItem value="vciso">vCISO</SelectItem></SelectContent></Select></div>
              <Button type="submit" disabled={pending}><UserPlus /> Invite</Button>
            </form>
            {link && (
              <Alert className="mt-4"><AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="font-mono text-xs break-all">{link}</span>
                <Button size="sm" variant="outline" className="shrink-0 sm:ml-auto" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}><Copy /> Copy</Button>
              </AlertDescription></Alert>
            )}
          </CardContent>
        </Card>
      )}
      <Card className="overflow-hidden py-0 shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50"><TableRow><TableHead className="pl-4">Member</TableHead><TableHead>Role</TableHead><TableHead>MFA</TableHead><TableHead className="pr-4 text-right">Last sign-in</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="pl-4"><div className="font-medium">{m.fullName || m.email}{m.email === me.user.email && <span className="text-muted-foreground"> (you)</span>}</div><div className="text-muted-foreground text-xs">{m.email}</div></TableCell>
                <TableCell><Badge variant="outline">{ROLE_LABEL[m.role]}</Badge>{m.pending && <Badge variant="secondary" className="ml-1">Invited</Badge>}</TableCell>
                <TableCell>{m.mfaEnabled ? <StatusBadge status="passed" label="On" /> : <StatusBadge status="warning" label="Off" />}</TableCell>
                <TableCell className="text-muted-foreground pr-4 text-right text-sm">{m.pending ? "—" : ago(m.lastLoginAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Security() {
  const { me, refreshMe } = useMe();
  const [setup, setSetup] = useState<{ secret: string; qrSvgDataUri: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  if (me.user.mfaEnabled) {
    return <Card className="shadow-xs"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="text-status-good size-5" /> Two-factor authentication is on</CardTitle><CardDescription>You will be asked for a code from your authenticator app each time you sign in.</CardDescription></CardHeader></Card>;
  }
  return (
    <Card className="shadow-xs">
      <CardHeader><CardTitle>Two-factor authentication</CardTitle><CardDescription>Protect your account with an authenticator app (TOTP). Strongly recommended for every role.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {!setup ? (
          <Button disabled={busy} onClick={async () => { setBusy(true); try { setSetup(await api("/auth/mfa/setup", { method: "POST" })); } finally { setBusy(false); } }}>Set up authenticator app</Button>
        ) : (
          <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrSvgDataUri} alt="QR code for authenticator app" className="size-48 rounded-lg border bg-white p-2" />
            <div className="space-y-3">
              <p className="text-sm">Scan the QR code with Google Authenticator, 1Password, Authy or Microsoft Authenticator, then enter the 6-digit code.</p>
              <p className="text-muted-foreground text-xs">Can&apos;t scan? Enter this key: <span className="font-mono">{setup.secret}</span></p>
              <form className="flex gap-2" onSubmit={async (e) => {
                e.preventDefault(); setBusy(true);
                try { await api("/auth/mfa/enable", { method: "POST", json: { code } }); toast.success("Two-factor authentication enabled."); await refreshMe(); }
                catch (err) { toast.error(err instanceof Error ? err.message : "Invalid code"); } finally { setBusy(false); }
              }}>
                <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="123456" className="w-32 font-mono tracking-widest" />
                <Button type="submit" disabled={busy || code.length !== 6}>Verify & enable</Button>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
