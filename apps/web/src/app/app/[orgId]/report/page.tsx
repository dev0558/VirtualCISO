"use client";

import { useState } from "react";
import { CheckCircle2, Download, Pencil, Sparkles } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/hooks/use-actions";
import { api, downloadUrl } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { Report } from "@/lib/types";

export default function ReportPage() {
  const { state, orgId, can } = useOrg();
  const r = state?.leadershipReport;
  const [editing, setEditing] = useState(false);
  const [gen, generating] = useAction(() => api(`/orgs/${orgId}/reports/generate`, { method: "POST", json: {} }), "New draft generated from current posture, risks and roadmap.");
  const [approve, approving] = useAction(() => api(`/orgs/${orgId}/reports/${r?.id}/approve`, { method: "POST" }), "Report approved.");
  if (!state) return <PageBody><Skeleton className="h-96" /></PageBody>;
  return (
    <PageBody className="max-w-5xl">
      <PageHeader
        title="Leadership report"
        description="A one-page quarterly summary for the board: posture, top risks, progress and the next 90 days. Drafted from live data; the vCISO reviews and approves."
        actions={<>
          {r && <Button variant="outline" asChild><a href={downloadUrl(`/orgs/${orgId}/reports/${r.id}/pdf`)}><Download /> PDF</a></Button>}
          {can.vciso && <Button variant="outline" disabled={generating} onClick={() => gen()}><Sparkles /> {generating ? "Drafting…" : "New draft"}</Button>}
          {can.vciso && r?.status === "draft" && !editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>}
          {can.vciso && r?.status === "draft" && <Button disabled={approving} onClick={() => approve()}><CheckCircle2 /> Approve</Button>}
        </>}
      />
      {!r ? (
        <EmptyState icon={Sparkles} title="No report yet" description="Generate a draft once checks have run and the risk register has entries." />
      ) : editing ? (
        <ReportEditor report={r} onDone={() => setEditing(false)} />
      ) : (
        <Card className="shadow-xs">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={r.status} />
              {r.aiGenerated && <Badge variant="outline"><Sparkles /> AI-assisted draft</Badge>}
              <span className="text-muted-foreground text-sm">{r.quarter} · {r.vCISOAuthor} · {fmtDateTime(r.generatedAt)}</span>
            </div>
            <CardTitle className="text-2xl">{state.organization.name} — {r.quarter} security report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[["ISO 27001", `${r.compliancePosture.isoScore}%`], ["NIST CSF 2.0", `${r.compliancePosture.nistScore}%`], ["Checks passing", `${r.compliancePosture.passingChecks}/${r.compliancePosture.totalChecks}`], ["Critical/high gaps", r.compliancePosture.criticalGaps]].map(([l, v]) => (
                <div key={String(l)} className="rounded-lg border p-3"><div className="text-muted-foreground text-xs">{l}</div><div className="text-xl font-semibold tabular-nums">{v}</div></div>
              ))}
            </div>
            <Section title="Executive summary"><p className="leading-7">{r.executiveSummary}</p></Section>
            <Section title="Top risks"><List items={r.topRisksSummary} /></Section>
            <Section title="Progress this quarter"><List items={r.quarterlyMilestones} /></Section>
            <Section title="Next 90 days"><List items={r.next90DaysPlan} /></Section>
            {r.vCISONotes && <Section title="vCISO notes"><p className="leading-7">{r.vCISONotes}</p></Section>}
            <Separator />
            <p className="text-muted-foreground text-xs">
              {r.approvedBy ? `Approved by ${r.approvedBy} on ${fmtDateTime(r.approvedAt)}. ` : "Draft — not yet approved. "}
              Bracketed codes reference checks, risks (R-n) and roadmap tasks (T-n). Readiness guidance only.
            </p>
          </CardContent>
        </Card>
      )}
    </PageBody>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2"><h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h2>{children}</section>;
}
function List({ items }: { items: string[] }) {
  return items.length ? <ul className="list-disc space-y-1.5 pl-5 leading-7">{items.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="text-muted-foreground text-sm">Nothing to report.</p>;
}

function ReportEditor({ report, onDone }: { report: Report; onDone: () => void }) {
  const { orgId } = useOrg();
  const [f, setF] = useState({
    executiveSummary: report.executiveSummary, topRisksSummary: report.topRisksSummary.join("\n"),
    quarterlyMilestones: report.quarterlyMilestones.join("\n"), next90DaysPlan: report.next90DaysPlan.join("\n"), vCISONotes: report.vCISONotes,
  });
  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
  const [save, saving] = useAction(() => api(`/orgs/${orgId}/reports/${report.id}`, {
    method: "PUT", json: { ...f, topRisksSummary: lines(f.topRisksSummary), quarterlyMilestones: lines(f.quarterlyMilestones), next90DaysPlan: lines(f.next90DaysPlan) },
  }), "Report saved.");
  const field = (k: keyof typeof f, label: string, rows: number) => (
    <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label><Textarea rows={rows} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <Card className="shadow-xs">
      <CardContent className="space-y-4">
        {field("executiveSummary", "Executive summary", 5)}
        {field("topRisksSummary", "Top risks (one per line)", 4)}
        {field("quarterlyMilestones", "Progress this quarter (one per line)", 4)}
        {field("next90DaysPlan", "Next 90 days (one per line)", 5)}
        {field("vCISONotes", "vCISO notes", 3)}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onDone}>Cancel</Button><Button disabled={saving} onClick={async () => { await save(); onDone(); }}>Save draft</Button></div>
      </CardContent>
    </Card>
  );
}
