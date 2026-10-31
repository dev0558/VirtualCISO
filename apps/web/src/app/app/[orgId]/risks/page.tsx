"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, ShieldAlert } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { RiskScoreBadge, StatusBadge, riskBand } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAction } from "@/hooks/use-actions";
import { api, fetcher } from "@/lib/api";
import type { Risk } from "@/lib/types";

const CATEGORIES = ["Privileged Access", "Access & Identity", "Infrastructure & Data", "Application & Code", "Governance & Third-Party", "Operational Continuity"];
const BAND_BG: Record<string, string> = {
  critical: "bg-status-critical/15", warning: "bg-status-warning/15", info: "bg-series-1/10", neutral: "bg-muted/60",
};

export default function RisksPage() {
  const { state, can } = useOrg();
  const [editing, setEditing] = useState<Partial<Risk> | null>(null);
  const [cell, setCell] = useState<[number, number] | null>(null);
  const risks = state?.risks ?? [];
  const shown = cell ? risks.filter((r) => r.likelihood === cell[0] && r.impact === cell[1]) : risks;
  return (
    <PageBody>
      <PageHeader
        title="Risk register"
        description="Score = likelihood × impact (1–25). Critical ≥ 15, high ≥ 10. Each risk links to the controls and checks that evidence its treatment."
        actions={can.edit && <Button onClick={() => setEditing({})}><Plus /> Add risk</Button>}
      />
      {risks.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No risks recorded" description="Start from a template or add a risk identified in interviews and check results." action={can.edit && <Button onClick={() => setEditing({})}>Add risk</Button>} />
      ) : (
        <div className="grid gap-4 @5xl/main:grid-cols-[22rem_1fr]">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle>Heat map</CardTitle>
              <CardDescription>Number of open and treated risks per cell. Select a cell to filter.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[1.25rem_repeat(5,1fr)] gap-1">
                {[5, 4, 3, 2, 1].map((l) => (
                  <Row key={l} l={l} risks={risks} cell={cell} setCell={setCell} />
                ))}
                <div />
                {[1, 2, 3, 4, 5].map((i) => <div key={i} className="text-muted-foreground text-center text-xs tabular-nums">{i}</div>)}
              </div>
              <div className="text-muted-foreground mt-2 flex justify-between text-xs"><span>↑ Likelihood</span><span>Impact →</span></div>
              {cell && <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => setCell(null)}>Clear filter</Button>}
            </CardContent>
          </Card>
          <Card className="overflow-hidden py-0 shadow-xs">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-4">Risk</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden lg:table-cell">Treatment</TableHead>
                  <TableHead className="pr-4 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((r) => (
                  <TableRow key={r.id} className={can.edit ? "cursor-pointer" : ""} onClick={() => can.edit && setEditing(r)}>
                    <TableCell className="min-w-56 pl-4 whitespace-normal">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-muted-foreground text-xs">{r.category} · {[...r.linkedControlCodes, ...r.linkedCheckCodes].join(", ") || "no links"}</div>
                    </TableCell>
                    <TableCell><RiskScoreBadge score={r.riskScore} /><div className="text-muted-foreground mt-1 text-xs tabular-nums">L{r.likelihood} × I{r.impact}</div></TableCell>
                    <TableCell className="hidden text-sm md:table-cell">{r.owner || "—"}</TableCell>
                    <TableCell className="hidden w-80 text-sm whitespace-normal lg:table-cell"><Badge variant="secondary" className="mb-1">{r.treatment}</Badge><p className="text-muted-foreground line-clamp-2">{r.treatmentPlan}</p></TableCell>
                    <TableCell className="pr-4 text-right"><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
      {editing && <RiskDialog risk={editing} onClose={() => setEditing(null)} />}
    </PageBody>
  );
}

function Row({ l, risks, cell, setCell }: { l: number; risks: Risk[]; cell: [number, number] | null; setCell: (c: [number, number] | null) => void }) {
  return (
    <>
      <div className="text-muted-foreground flex items-center text-xs tabular-nums">{l}</div>
      {[1, 2, 3, 4, 5].map((i) => {
        const here = risks.filter((r) => r.likelihood === l && r.impact === i);
        const band = riskBand(l * i);
        const active = cell?.[0] === l && cell?.[1] === i;
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button
                onClick={() => here.length && setCell(active ? null : [l, i])}
                className={`flex aspect-square items-center justify-center rounded-md text-sm font-medium tabular-nums ${BAND_BG[band.tone]} ${active ? "ring-foreground ring-2" : ""}`}
                aria-label={`Likelihood ${l}, impact ${i}: ${here.length} risks`}
              >
                {here.length || ""}
              </button>
            </TooltipTrigger>
            <TooltipContent>Score {l * i} · {band.label}{here.length ? ` · ${here.map((r) => r.title).join("; ")}` : ""}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

interface Template { title: string; category: string; likelihood: number; impact: number; treatment: string; treatment_plan: string; controls: string[] }

function RiskDialog({ risk, onClose }: { risk: Partial<Risk>; onClose: () => void }) {
  const { orgId, can } = useOrg();
  const { data: tpl } = useSWR<{ templates: Template[] }>(risk.id ? null : `/orgs/${orgId}/risk-templates`, fetcher);
  const [form, setForm] = useState({
    title: risk.title ?? "", category: risk.category ?? CATEGORIES[1], description: risk.description ?? "",
    likelihood: risk.likelihood ?? 3, impact: risk.impact ?? 3, owner: risk.owner ?? "", treatment: risk.treatment ?? "Mitigate",
    treatment_plan: risk.treatmentPlan ?? "", status: risk.status ?? "Open",
    linked_control_codes: risk.linkedControlCodes ?? [], linked_check_codes: risk.linkedCheckCodes ?? [],
  });
  const [save, saving] = useAction(
    () => api(`/orgs/${orgId}/risks${risk.id ? `/${risk.id}` : ""}`, { method: risk.id ? "PUT" : "POST", json: form }),
    risk.id ? "Risk updated." : "Risk added to the register.",
  );
  const [remove] = useAction(() => api(`/orgs/${orgId}/risks/${risk.id}`, { method: "DELETE" }), "Risk deleted.");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{risk.id ? "Edit risk" : "Add risk"}</DialogTitle>
          <DialogDescription>Score {form.likelihood * form.impact} · {riskBand(form.likelihood * form.impact).label}</DialogDescription>
        </DialogHeader>
        {!risk.id && tpl && (
          <div className="grid gap-2">
            <Label>Start from a template</Label>
            <Select onValueChange={(v) => {
              const t = tpl.templates[+v];
              setForm((f) => ({ ...f, title: t.title, category: t.category, likelihood: t.likelihood, impact: t.impact, treatment: t.treatment, treatment_plan: t.treatment_plan, linked_control_codes: t.controls }));
            }}>
              <SelectTrigger><SelectValue placeholder="Choose a template…" /></SelectTrigger>
              <SelectContent>{tpl.templates.map((t, i) => <SelectItem key={i} value={String(i)}>{t.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="grid gap-2"><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Owner</Label><Input value={form.owner} onChange={(e) => set("owner", e.target.value)} /></div>
          {(["likelihood", "impact"] as const).map((k) => (
            <div key={k} className="grid gap-2"><Label className="capitalize">{k} (1–5)</Label>
              <Select value={String(form[k])} onValueChange={(v) => set(k, +v)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
          ))}
          <div className="grid gap-2"><Label>Treatment</Label>
            <Select value={form.treatment} onValueChange={(v) => set("treatment", v)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["Mitigate", "Accept", "Transfer", "Avoid"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["Open", "In Progress", "Treated", "Accepted"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2 sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid gap-2 sm:col-span-2"><Label>Treatment plan</Label><Textarea rows={3} value={form.treatment_plan} onChange={(e) => set("treatment_plan", e.target.value)} /></div>
          <div className="grid gap-2 sm:col-span-2"><Label>Linked controls (comma-separated)</Label><Input value={form.linked_control_codes.join(", ")} onChange={(e) => set("linked_control_codes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
        </div>
        <DialogFooter className="gap-2">
          {risk.id && can.vciso && <Button variant="ghost" className="text-critical-ink mr-auto" onClick={async () => { await remove(); onClose(); }}>Delete</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || form.title.length < 3} onClick={async () => { const r = await save(); if (r) onClose(); }}>{risk.id ? "Save changes" : "Add risk"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
