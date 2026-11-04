"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Plug, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";

import { Meter, MetricCard } from "@/components/app/metric-card";
import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody } from "@/components/app/page";
import { SeverityBadge, StatusBadge } from "@/components/app/status";
import { GuideFigure } from "@/components/marketing/guide-figure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CONNECTOR_LABEL, ago, fmtDate } from "@/lib/format";
import type { Control } from "@/lib/types";

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;
const NIST_FUNCTIONS = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"];

export default function Dashboard() {
  const { state, orgId, isLoading } = useOrg();
  if (isLoading || !state) return <DashboardSkeleton />;
  const { scores, checks, risks, milestones, integrations, controls, runHistory } = state;
  const failing = checks.filter((c) => c.status === "failed");
  const attention = checks
    .filter((c) => c.status === "failed" || c.status === "warning")
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  const openRisks = risks.filter((r) => r.status === "Open" || r.status === "In Progress");
  const highRisks = openRisks.filter((r) => r.riskScore >= 15);
  const upcoming = milestones.filter((m) => m.status !== "completed").slice(0, 5);
  const lastRun = checks.map((c) => c.lastRunAt).filter(Boolean).sort().at(-1) ?? null;
  const prev = runHistory.at(-2)?.counts;
  const passDelta = prev ? (runHistory.at(-1)?.counts.passed ?? 0) - (prev.passed ?? 0) : 0;
  const base = `/app/${orgId}`;

  if (integrations.length === 0) {
    return (
      <PageBody>
        <EmptyState
          icon={Plug}
          title="Connect your first system"
          description="Connect Microsoft 365, Google Workspace or GitHub with read-only access. Checks run immediately and daily after that."
          action={<Button asChild><Link href={`${base}/integrations`}>Connect an integration</Link></Button>}
        />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <Card className="flex-row items-end justify-between gap-4 overflow-hidden py-0 shadow-xs">
        <div className="min-w-0 space-y-1 py-5 pl-6">
          <div className="font-semibold">
            {attention.length === 0
              ? "Every automated check is passing."
              : `${attention.length} ${attention.length === 1 ? "check needs" : "checks need"} attention.`}
          </div>
          <p className="text-muted-foreground text-sm">
            {attention[0] ? <>Start with <Link href={`${base}/controls`} className="text-foreground underline underline-offset-4">{attention[0].name}</Link>.</> : "Your next scheduled run keeps this up to date."}
          </p>
        </div>
        <GuideFigure bust className="mr-4 hidden w-40 shrink-0 sm:block" />
      </Card>

      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <MetricCard
          label="ISO 27001:2022 readiness"
          value={`${scores.isoScore}%`}
          badge={<Badge variant="outline" className="tabular-nums">{scores.isoPassed}/{scores.isoTotal} controls</Badge>}
          footer={<Meter value={scores.isoPassed} max={scores.isoTotal} label="ISO controls passing" />}
          sub="Annex A controls in scope"
        />
        <MetricCard
          label="NIST CSF 2.0 readiness"
          value={`${scores.nistScore}%`}
          badge={<Badge variant="outline" className="tabular-nums">{scores.nistPassed}/{scores.nistTotal} categories</Badge>}
          footer={<Meter value={scores.nistPassed} max={scores.nistTotal} color="var(--series-2)" label="NIST categories passing" />}
          sub="Category-level mapping"
        />
        <MetricCard
          label="Failing checks"
          value={failing.length}
          badge={
            passDelta !== 0 ? (
              <Badge variant="outline" className="tabular-nums">
                {passDelta > 0 ? <TrendingUp /> : <TrendingDown />}
                {passDelta > 0 ? "+" : ""}{passDelta} passing
              </Badge>
            ) : undefined
          }
          footer={<span>{failing.filter((c) => c.severity === "critical" || c.severity === "high").length} critical or high severity</span>}
          sub={`Last run ${ago(lastRun)}`}
        />
        <MetricCard
          label="Open risks"
          value={openRisks.length}
          badge={highRisks.length ? <StatusBadge status="failed" label={`${highRisks.length} critical`} /> : undefined}
          footer={<Link href={`${base}/risks`} className="inline-flex items-center gap-1 hover:underline">View risk register <ArrowRight className="size-3.5" /></Link>}
          sub="Likelihood × impact ≥ 15 is critical"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-3">
        <Card className="shadow-xs @5xl/main:col-span-2">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Failing and warning checks, most severe first. Each links to evidence and fix guidance.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild><Link href={`${base}/controls`}>All checks</Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {attention.length === 0 ? (
              <p className="text-muted-foreground px-6 py-8 text-center text-sm">Every automated check is passing.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Check</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attention.slice(0, 8).map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="pl-6 whitespace-normal">
                        <Link href={`${base}/controls?check=${c.code}`} className="font-medium hover:underline">{c.name}</Link>
                        <br />
                        <span className="text-muted-foreground font-mono text-xs">{c.code} · {c.mappedControlCodes.join(", ")}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{CONNECTOR_LABEL[c.connector]}</TableCell>
                      <TableCell><SeverityBadge severity={c.severity} /></TableCell>
                      <TableCell className="pr-6 text-right"><StatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>NIST CSF 2.0 by function</CardTitle>
            <CardDescription>Categories passing per function</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunctionBars controls={controls.filter((c) => c.frameworkCode === "nistcsf")} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-3">
        <Card className="shadow-xs @5xl/main:col-span-2">
          <CardHeader>
            <CardTitle>ISO 27001 Annex A by theme</CardTitle>
            <CardDescription>Controls passing, in progress, failing or awaiting manual evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <IsoBreakdown controls={controls.filter((c) => c.frameworkCode === "iso27001")} />
          </CardContent>
        </Card>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="size-4" /> Upcoming</CardTitle>
            <CardDescription>Audit deadlines and milestones</CardDescription>
            <CardAction><Button variant="ghost" size="sm" asChild><Link href={`${base}/timeline`}>Timeline</Link></Button></CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <p className="text-muted-foreground text-sm">No upcoming milestones.</p>}
            {upcoming.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.title}</div>
                  <div className="text-muted-foreground text-xs">{fmtDate(m.targetDate)} · {m.owner}</div>
                </div>
                {m.isAuditDeadline ? <Badge variant="outline">Audit</Badge> : <StatusBadge status={m.status} />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Read-only connections feeding automated checks</CardDescription>
          <CardAction><Button variant="outline" size="sm" asChild><Link href={`${base}/integrations`}>Manage</Link></Button></CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 @3xl/main:grid-cols-3">
          {integrations.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{CONNECTOR_LABEL[i.type]}</div>
                <div className="text-muted-foreground truncate text-xs">{i.accountIdentifier} · synced {ago(i.lastSyncedAt)}</div>
              </div>
              <div className="text-right text-xs tabular-nums">
                <StatusBadge status={i.status} />
                <div className="text-muted-foreground mt-1">{i.failingChecks} of {i.totalChecks} failing</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {risks.length === 0 && (
        <EmptyState icon={ShieldAlert} title="No risks logged yet" description="Your vCISO will build the risk register from failing controls and interviews." />
      )}
    </PageBody>
  );
}

function FunctionBars({ controls }: { controls: Control[] }) {
  return (
    <>
      {NIST_FUNCTIONS.map((fn) => {
        const rows = controls.filter((c) => c.category === fn);
        const passed = rows.filter((c) => c.status === "passed").length;
        return (
          <Tooltip key={fn}>
            <TooltipTrigger asChild>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span>{fn}</span>
                  <span className="text-muted-foreground tabular-nums">{passed}/{rows.length}</span>
                </div>
                <Meter value={passed} max={rows.length} color="var(--series-2)" label={`${fn} categories passing`} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-64">
              {rows.map((r) => `${r.code} ${r.status.replace("_", " ")}`).join(" · ")}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

const SEGMENTS = [
  { key: "passed", label: "Passing", color: "var(--status-good)" },
  { key: "in_progress", label: "In progress", color: "var(--status-warning)" },
  { key: "failed", label: "Failing", color: "var(--status-critical)" },
  { key: "manual_verification", label: "Manual evidence", color: "var(--muted-foreground)" },
] as const;

function IsoBreakdown({ controls }: { controls: Control[] }) {
  const themes = Array.from(new Set(controls.map((c) => c.category)));
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color, opacity: s.key === "manual_verification" ? 0.35 : 1 }} /> {s.label}
          </span>
        ))}
      </div>
      {themes.map((t) => {
        const rows = controls.filter((c) => c.category === t);
        return (
          <div key={t} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 text-sm">
            <span className="truncate">{t}</span>
            <div className="flex h-3 gap-0.5 overflow-hidden rounded">
              {SEGMENTS.map((s) => {
                const n = rows.filter((c) => c.status === s.key).length;
                if (!n) return null;
                return (
                  <Tooltip key={s.key}>
                    <TooltipTrigger asChild>
                      <div
                        style={{ flexGrow: n, background: s.color, opacity: s.key === "manual_verification" ? 0.35 : 1 }}
                        className="h-full first:rounded-l last:rounded-r"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {s.label}: {rows.filter((c) => c.status === s.key).map((c) => c.code).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <span className="text-muted-foreground text-right tabular-nums">
              {rows.filter((c) => c.status === "passed").length}/{rows.length}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <PageBody>
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </PageBody>
  );
}
