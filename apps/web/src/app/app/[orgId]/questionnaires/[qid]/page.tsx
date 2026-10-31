"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ArrowLeft, Check, Download, Pencil, Sparkles } from "lucide-react";

import { Meter } from "@/components/app/metric-card";
import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody } from "@/components/app/page";
import { ConfidenceBadge, StatusBadge } from "@/components/app/status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAction } from "@/hooks/use-actions";
import { api, downloadUrl } from "@/lib/api";
import type { AnswerItem } from "@/lib/types";

export default function QuestionnaireDetail({ params }: { params: Promise<{ qid: string }> }) {
  const { qid } = use(params);
  const { state, orgId, can } = useOrg();
  const [filter, setFilter] = useState("review");
  const q = state?.questionnaires.find((x) => x.id === qid);
  const [autofill, filling] = useAction(
    () => api<{ stats: { answered: number; flagged: number } }>(`/orgs/${orgId}/questionnaires/${qid}/autofill`, { method: "POST" }),
    (r) => { const s = (r as { stats: { answered: number; flagged: number } }).stats; return `${s.answered} answers drafted, ${s.flagged} flagged for review.`; },
  );
  const items = useMemo(() => {
    if (!q) return [];
    if (filter === "review") return q.items.filter((i) => !i.humanApproved);
    if (filter === "approved") return q.items.filter((i) => i.humanApproved);
    return q.items;
  }, [q, filter]);

  if (!state) return <PageBody><Skeleton className="h-96" /></PageBody>;
  if (!q) return <PageBody><EmptyState icon={Sparkles} title="Questionnaire not found" description="It may have been deleted." /></PageBody>;
  const approved = q.items.filter((i) => i.humanApproved).length;
  const flagged = q.items.filter((i) => i.needsReview && !i.humanApproved).length;
  const unanswered = q.items.filter((i) => !i.suggestedAnswer).length;

  return (
    <PageBody>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <Link href={`/app/${orgId}/questionnaires`} className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"><ArrowLeft className="size-3.5" /> Questionnaires</Link>
          <h1 className="text-xl font-semibold tracking-tight">{q.title}</h1>
          <p className="text-muted-foreground text-sm">{q.customerName || "No customer set"} · {q.items.length} questions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><a href={downloadUrl(`/orgs/${orgId}/questionnaires/${qid}/export.csv`)}><Download /> Export CSV</a></Button>
          {can.edit && <Button disabled={filling} onClick={() => autofill()}><Sparkles className={filling ? "animate-pulse" : ""} /> {filling ? "Drafting answers…" : unanswered ? "Autofill answers" : "Redraft unapproved"}</Button>}
        </div>
      </div>
      <Card className="shadow-xs">
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><div className="text-muted-foreground text-sm">Approved</div><div className="text-2xl font-semibold tabular-nums">{approved}/{q.items.length}</div><Meter value={approved} max={q.items.length} color="var(--status-good)" /></div>
          <div className="space-y-2"><div className="text-muted-foreground text-sm">Flagged for review</div><div className="text-2xl font-semibold tabular-nums">{flagged}</div><p className="text-muted-foreground text-xs">Low confidence or no supporting source</p></div>
          <div className="space-y-2"><div className="text-muted-foreground text-sm">Unanswered</div><div className="text-2xl font-semibold tabular-nums">{unanswered}</div><p className="text-muted-foreground text-xs">Run autofill to draft answers</p></div>
        </CardContent>
      </Card>
      <Alert><Sparkles /><AlertDescription>Answers are drafts. They are generated only from this organisation&apos;s approved policies and latest check results, and nothing is marked final until a person approves it.</AlertDescription></Alert>
      <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)} variant="outline" size="sm" className="self-start">
        <ToggleGroupItem value="review" className="px-3">To review <span className="text-muted-foreground ml-1 tabular-nums">{q.items.length - approved}</span></ToggleGroupItem>
        <ToggleGroupItem value="approved" className="px-3">Approved <span className="text-muted-foreground ml-1 tabular-nums">{approved}</span></ToggleGroupItem>
        <ToggleGroupItem value="all" className="px-3">All</ToggleGroupItem>
      </ToggleGroup>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted-foreground py-8 text-center text-sm">Nothing here.</p>}
        {items.map((i) => <AnswerCard key={i.id} item={i} qid={qid} />)}
      </div>
    </PageBody>
  );
}

function AnswerCard({ item, qid }: { item: AnswerItem; qid: string }) {
  const { orgId, can } = useOrg();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.suggestedAnswer);
  const [notes, setNotes] = useState("");
  const [save, saving] = useAction((answer: string) => api(`/orgs/${orgId}/questionnaires/${qid}/answers/${item.id}`, { method: "PUT", json: { answer } }), "Answer updated.");
  const [approve, approving] = useAction(() => api(`/orgs/${orgId}/questionnaires/${qid}/answers/${item.id}/approve`, { method: "POST", json: { notes } }), `Question ${item.questionNumber} approved.`);
  return (
    <Card className="gap-3 py-4 shadow-xs">
      <CardContent className="space-y-3 px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="text-muted-foreground text-xs"><span className="font-mono">Q{item.questionNumber}</span> · {item.category}</div>
            <div className="font-medium">{item.question}</div>
          </div>
          <div className="flex items-center gap-2">
            {item.suggestedAnswer && <ConfidenceBadge value={item.confidenceScore} needsReview={item.needsReview && !item.humanApproved} />}
            {item.humanApproved && <StatusBadge status="approved" />}
          </div>
        </div>
        {editing ? (
          <div className="space-y-2">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button size="sm" disabled={saving} onClick={async () => { await save(text); setEditing(false); }}>Save</Button></div>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed ${item.suggestedAnswer ? "" : "text-muted-foreground italic"}`}>{item.suggestedAnswer || "Not answered yet."}</p>
        )}
        {item.citedSources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Sources</span>
            {item.citedSources.map((s, n) => <Badge key={n} variant="outline" className="font-normal"><span className="font-mono text-[11px]">{s.reference}</span><span className="text-muted-foreground max-w-56 truncate">{s.name}</span></Badge>)}
          </div>
        )}
        {item.humanApproved && <p className="text-muted-foreground text-xs">Approved by {item.approvedBy}{item.humanReviewNotes ? ` — “${item.humanReviewNotes}”` : ""}</p>}
        {can.edit && !item.humanApproved && item.suggestedAnswer && !editing && (
          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer note (optional)" className="h-8 sm:max-w-sm" />
            <div className="flex gap-2 sm:ml-auto">
              <Button size="sm" variant="ghost" onClick={() => { setText(item.suggestedAnswer); setEditing(true); }}><Pencil /> Edit</Button>
              <Button size="sm" disabled={approving} onClick={() => approve()}><Check /> Approve</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
