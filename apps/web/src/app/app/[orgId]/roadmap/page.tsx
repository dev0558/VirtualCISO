"use client";

import { Map, Wand2 } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { PriorityBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "@/hooks/use-actions";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";

const PHASES = ["Sprint 1 (Days 1-30)", "Sprint 2 (Days 31-60)", "Sprint 3 (Days 61-90)"];

export default function RoadmapPage() {
  const { state, orgId, can } = useOrg();
  const [gen, generating] = useAction(
    () => api<{ created: number }>(`/orgs/${orgId}/roadmap/generate`, { method: "POST" }),
    (r) => `${(r as { created: number }).created} tasks added from failing checks and open risks.`,
  );
  const [setStatus] = useAction((id: string, status: string) => api(`/orgs/${orgId}/tasks/${id}`, { method: "PATCH", json: { status } }));
  const tasks = state?.roadmap ?? [];
  const done = tasks.filter((t) => t.status === "completed").length;
  return (
    <PageBody>
      <PageHeader
        title="90-day roadmap"
        description={`${done} of ${tasks.length} tasks complete. Generated from failing controls (by severity) and open risks (by score); ordered by priority and due date.`}
        actions={can.vciso && <Button onClick={() => gen()} disabled={generating}><Wand2 /> {generating ? "Generating…" : "Generate from gaps"}</Button>}
      />
      {tasks.length === 0 ? (
        <EmptyState icon={Map} title="No roadmap yet" description="Run checks and add risks, then generate a prioritised 90-day plan." />
      ) : (
        <div className="grid gap-4 @5xl/main:grid-cols-3">
          {PHASES.map((ph) => {
            const list = tasks.filter((t) => t.phase === ph);
            return (
              <Card key={ph} className="bg-muted/30 gap-3 shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm">{ph.split(" (")[0]}</CardTitle>
                  <CardDescription>{ph.match(/\((.*)\)/)?.[1]} · {list.filter((t) => t.status === "completed").length}/{list.length} done</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {list.length === 0 && <p className="text-muted-foreground text-sm">No tasks.</p>}
                  {list.map((t) => (
                    <div key={t.id} className="bg-background space-y-2 rounded-lg border p-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm font-medium ${t.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {t.description && <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">{t.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={t.overdue ? "text-critical-ink font-medium" : "text-muted-foreground"}>Due {fmtDate(t.dueDate)}{t.overdue ? " · overdue" : ""}</span>
                        {t.linkedCheckCode && <Badge variant="outline" className="font-mono text-[10.5px] font-normal">{t.linkedCheckCode}</Badge>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground truncate text-xs">{t.owner || "Unassigned"}</span>
                        {can.edit ? (
                          <Select value={t.status} onValueChange={(v) => setStatus(t.id, v)}>
                            <SelectTrigger size="sm" className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="todo">To do</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="completed">Done</SelectItem></SelectContent>
                          </Select>
                        ) : <Badge variant="outline">{t.status.replace("_", " ")}</Badge>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageBody>
  );
}
