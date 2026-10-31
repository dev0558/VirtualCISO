"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Building2, Plus } from "lucide-react";

import { useMe } from "@/components/app/me-context";
import { Meter, MetricCard } from "@/components/app/metric-card";
import { StatusBadge } from "@/components/app/status";
import { Logo } from "@/components/marketing/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetcher } from "@/lib/api";
import { ROLE_LABEL, ago } from "@/lib/format";
import type { OrgOverview } from "@/lib/types";

export default function ClientsPage() {
  const { me } = useMe();
  const router = useRouter();
  const { data, error } = useSWR<{ organizations: OrgOverview[] }>("/orgs", fetcher);
  const orgs = data?.organizations ?? [];
  const avg = (k: "isoScore" | "nistScore") => (orgs.length ? Math.round(orgs.reduce((n, o) => n + o.scores[k], 0) / orgs.length) : 0);

  return (
    <div className="bg-muted/30 min-h-svh">
      <header className="bg-background border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo href="/app/clients" />
          <div className="text-muted-foreground text-sm">{me.user.fullName} · vCISO portfolio</div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
            <p className="text-muted-foreground text-sm">Every client you advise, with readiness, open risks and overdue work.</p>
          </div>
          <Button asChild><Link href="/app/new"><Plus /> Onboard client</Link></Button>
        </div>
        {error && <p className="text-destructive text-sm">Could not load clients.</p>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Clients" value={data ? orgs.length : "—"} />
          <MetricCard label="Avg. ISO 27001 readiness" value={data ? `${avg("isoScore")}%` : "—"} />
          <MetricCard label="Avg. NIST CSF readiness" value={data ? `${avg("nistScore")}%` : "—"} />
          <MetricCard label="Overdue tasks" value={data ? orgs.reduce((n, o) => n + o.overdueTasks, 0) : "—"} />
        </div>
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>Select a client to open its workspace.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {!data ? (
              <div className="space-y-2 px-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Client</TableHead>
                    <TableHead className="w-40">ISO 27001</TableHead>
                    <TableHead className="w-40">NIST CSF</TableHead>
                    <TableHead className="text-right">Failing checks</TableHead>
                    <TableHead className="text-right">Open risks</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="pr-6 text-right">Last scan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((o) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(`/app/${o.id}`)}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-md border"><Building2 className="size-4" /></div>
                          <div>
                            <div className="font-medium">{o.name}</div>
                            <div className="text-muted-foreground text-xs">{o.industry} · {ROLE_LABEL[o.role ?? "auditor"]}{o.isDemo ? " · demo" : ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><ScoreCell value={o.scores.isoScore} color="var(--series-1)" /></TableCell>
                      <TableCell><ScoreCell value={o.scores.nistScore} color="var(--series-2)" /></TableCell>
                      <TableCell className="text-right tabular-nums">{o.failingChecks}</TableCell>
                      <TableCell className="text-right">
                        <span className="tabular-nums">{o.openRisks}</span>
                        {o.highRisks > 0 && <Badge variant="outline" className="border-status-critical/30 text-critical-ink ml-2">{o.highRisks} critical</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.overdueTasks > 0 ? <StatusBadge status="overdue" label={`${o.overdueTasks} overdue`} /> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground pr-6 text-right text-sm">{ago(o.lastRunAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ScoreCell({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-sm tabular-nums">{value}%</span>
      <Meter value={value} max={100} color={color} />
    </div>
  );
}
