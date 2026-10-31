"use client";

import Link from "next/link";
import { use, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, CheckCircle2, FileText, Send, Sparkles, TriangleAlert } from "lucide-react";

import { extractReviewNotes, Markdown } from "@/components/app/markdown";
import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-actions";
import { api, fetcher } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";

const PROFILE_LABELS: Record<string, string> = {
  systems: "Systems in scope", data_types: "Data you handle", security_owner: "Security owner",
  executive_sponsor: "Executive sponsor", identity_provider: "Identity provider", offboarding_hours: "Offboarding deadline (hours)",
  access_review_days: "Access review cycle (days)", incident_contact: "Incident contact", backup_frequency: "Backup frequency",
  backup_retention_days: "Backup retention (days)", rpo: "Recovery point objective", rto: "Recovery time objective",
};

export default function PolicyPage({ params }: { params: Promise<{ policyId: string }> }) {
  const { policyId } = use(params);
  const { state, orgId, can } = useOrg();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const policy = state?.policies.find((p) => p.id === policyId);
  const [submit, submitting] = useAction(() => api(`/orgs/${orgId}/policies/${policyId}/submit`, { method: "POST" }), "Submitted for review.");
  const [approve, approving] = useAction(() => api(`/orgs/${orgId}/policies/${policyId}/approve`, { method: "POST" }), "Policy approved and published to the evidence library.");
  const [save, saving] = useAction((content: string) => api(`/orgs/${orgId}/policies/${policyId}`, { method: "PUT", json: { content } }), "Saved as a new draft version.");

  if (!state) return <PageBody><Skeleton className="h-96" /></PageBody>;
  if (!policy) return <PageBody><EmptyState icon={FileText} title="Policy not found" description="It may belong to another organisation." /></PageBody>;
  const { body, notes } = extractReviewNotes(policy.content);
  const pendingApproval = policy.status === "draft" || policy.status === "under_review";

  return (
    <PageBody>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href={`/app/${orgId}/policies`} className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"><ArrowLeft className="size-3.5" /> Policies</Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {policy.title} <span className="text-muted-foreground font-mono text-sm font-normal">{policy.code}</span>
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={policy.status} /> <span className="text-muted-foreground">Version {policy.version}</span>
            {policy.aiGenerated && <Badge variant="outline"><Sparkles /> AI-assisted · {policy.confidence}% confidence</Badge>}
          </div>
        </div>
        {can.edit && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setGenOpen(true)}><Sparkles /> {policy.status === "not_started" ? "Generate draft" : "Regenerate"}</Button>
            {policy.status !== "not_started" && !editing && <Button variant="outline" size="sm" onClick={() => { setDraft(body); setEditing(true); }}>Edit</Button>}
            {policy.status === "draft" && <Button variant="outline" size="sm" disabled={submitting} onClick={() => submit()}><Send /> Submit for review</Button>}
            {pendingApproval && <Button size="sm" disabled={approving} onClick={() => approve()}><CheckCircle2 /> Approve v{policy.version.startsWith("0.") ? "1.0" : policy.version}</Button>}
          </div>
        )}
      </div>

      <div className="grid gap-6 @5xl/main:grid-cols-[1fr_20rem]">
        <Card className="shadow-xs">
          <CardContent className="px-6 md:px-10">
            {policy.status === "not_started" ? (
              <EmptyState icon={Sparkles} title="No draft yet" description="Answer a few questions about your company and we will draft this policy from a vetted template, tailored with your live evidence." action={can.edit ? <Button onClick={() => setGenOpen(true)}>Generate draft</Button> : undefined} />
            ) : editing ? (
              <div className="space-y-3">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={28} className="font-mono text-[13px] leading-6" />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button disabled={saving} onClick={async () => { await save(draft); setEditing(false); }}>Save as new version</Button>
                </div>
              </div>
            ) : (
              <Markdown>{body}</Markdown>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          {pendingApproval && notes.length > 0 && (
            <Alert>
              <TriangleAlert />
              <AlertTitle>Reviewer checklist</AlertTitle>
              <AlertDescription><ul className="list-disc space-y-1 pl-4">{notes.map((n) => <li key={n}>{n}</li>)}</ul></AlertDescription>
            </Alert>
          )}
          <Card className="gap-3 shadow-xs">
            <CardHeader><CardTitle className="text-sm">Sources cited</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {policy.citations.length === 0 && <p className="text-muted-foreground text-sm">None yet.</p>}
              {policy.citations.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="shrink-0 font-mono text-[10.5px] capitalize">{c.type}</Badge>
                  <span><span className="font-mono text-xs">{c.reference}</span> <span className="text-muted-foreground">{c.name !== `Control ${c.reference}` ? c.name : ""}</span></span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="gap-3 shadow-xs">
            <CardHeader><CardTitle className="text-sm">Version history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {policy.versions.map((v) => (
                <div key={v.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <div className="font-medium tabular-nums">v{v.version}</div>
                    <div className="text-muted-foreground text-xs">{v.author} · {fmtDateTime(v.createdAt)}</div>
                    {v.approver && <div className="text-muted-foreground text-xs">Approved by {v.approver}</div>}
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
              {policy.versions.length === 0 && <p className="text-muted-foreground text-sm">No versions yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      {genOpen && <GenerateDialog policyId={policy.id} title={policy.title} onClose={() => setGenOpen(false)} />}
    </PageBody>
  );
}

function GenerateDialog({ policyId, title, onClose }: { policyId: string; title: string; onClose: () => void }) {
  const { orgId } = useOrg();
  const { data } = useSWR<{ defaults: Record<string, string | number | boolean> }>(`/orgs/${orgId}/policies/profile-fields`, fetcher);
  const [gen, pending] = useAction(
    (profile: Record<string, string>) => api(`/orgs/${orgId}/policies/${policyId}/generate`, { method: "POST", json: { profile } }),
    "Draft created. Review the reviewer checklist before approving.",
  );
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const profile: Record<string, string> = {};
    Object.keys(PROFILE_LABELS).forEach((k) => { const v = String(f.get(k) ?? "").trim(); if (v) profile[k] = v; });
    const r = await gen(profile);
    if (r) onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft {title}</DialogTitle>
          <DialogDescription>
            Answers are saved to your company profile and reused for every policy. The draft cites the template, controls and live check results it relies on.
          </DialogDescription>
        </DialogHeader>
        {!data ? <Skeleton className="h-64" /> : (
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {Object.entries(PROFILE_LABELS).map(([k, label]) => (
              <div key={k} className={`grid gap-1.5 ${["systems", "data_types"].includes(k) ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={k}>{label}</Label>
                <Input id={k} name={k} defaultValue={String(data.defaults[k] ?? "")} />
              </div>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={pending}><Sparkles /> {pending ? "Drafting…" : "Generate draft"}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
