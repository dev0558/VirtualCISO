"use client";

import { CalendarClock, Flag } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/hooks/use-actions";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";

const CAT_LABEL: Record<string, string> = {
  audit_deadline: "Audit", internal_milestone: "Milestone", policy_governance: "Governance", technical_verification: "Technical",
  audit: "Audit", policy_review: "Policy review", training: "Training",
};

export default function TimelinePage() {
  const { state, orgId, can } = useOrg();
  const [setStatus] = useAction((id: string, status: string) => api(`/orgs/${orgId}/milestones/${id}`, { method: "PATCH", json: { status } }), "Milestone updated.");
  const ms = state?.milestones ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const events = (state?.calendarEvents ?? []).filter((e) => e.date >= today).slice(0, 12);
  return (
    <PageBody>
      <PageHeader title="Timeline" description="Certification milestones, audit deadlines and the recurring compliance calendar." />
      <div className="grid gap-4 @5xl/main:grid-cols-[1fr_22rem]">
        <Card className="shadow-xs">
          <CardHeader><CardTitle>Milestones</CardTitle><CardDescription>Path to the external audit</CardDescription></CardHeader>
          <CardContent>
            {ms.length === 0 ? <EmptyState icon={Flag} title="No milestones" description="Your vCISO will set the certification timeline." /> : (
              <ol className="relative ml-2 border-l">
                {ms.map((m) => (
                  <li key={m.id} className="mb-6 ml-5 last:mb-0">
                    <span className={`absolute -left-[5px] mt-1.5 size-2.5 rounded-full border-2 border-background ${m.status === "completed" ? "bg-status-good" : m.isAuditDeadline ? "bg-foreground" : "bg-muted-foreground/40"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground text-xs tabular-nums">{fmtDate(m.targetDate)}</span>
                      <Badge variant="outline" className="text-[11px] font-normal">{CAT_LABEL[m.category] ?? m.category}</Badge>
                      {m.isAuditDeadline && <Badge className="text-[11px]">Audit deadline</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">{m.title}</div>
                        <p className="text-muted-foreground max-w-2xl text-sm">{m.description}</p>
                        <div className="text-muted-foreground mt-1 text-xs">{m.owner}{m.frameworkRef ? ` · ${m.frameworkRef}` : ""}{m.auditorBody ? ` · ${m.auditorBody}` : ""}</div>
                      </div>
                      {can.edit ? (
                        <Select value={m.status} onValueChange={(v) => setStatus(m.id, v)}>
                          <SelectTrigger size="sm" className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{["upcoming", "in_progress", "completed", "overdue"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <StatusBadge status={m.status} />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-4" /> Compliance calendar</CardTitle><CardDescription>Next recurring obligations</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 && <p className="text-muted-foreground text-sm">Nothing scheduled.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="bg-muted flex w-12 shrink-0 flex-col items-center rounded-md py-1 text-center">
                  <span className="text-muted-foreground text-[10px] uppercase">{new Date(e.date).toLocaleString("en", { month: "short" })}</span>
                  <span className="text-sm font-semibold tabular-nums">{new Date(e.date).getDate()}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.title}</div>
                  <div className="text-muted-foreground text-xs">{CAT_LABEL[e.category]} · {e.recurrence} · {e.owner}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageBody>
  );
}
