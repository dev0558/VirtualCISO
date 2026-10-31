"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { SeverityBadge, StatusBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAction } from "@/hooks/use-actions";
import { api } from "@/lib/api";
import { CONNECTOR_LABEL, ago, fmtDateTime } from "@/lib/format";
import type { Check, Control } from "@/lib/types";

export default function ControlsPage() {
  return <Suspense><ControlsInner /></Suspense>;
}

function ControlsInner() {
  const { state } = useOrg();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selected = params.get("check");
  const setSelected = (code: string | null) => router.replace(code ? `${pathname}?check=${code}` : pathname, { scroll: false });

  if (!state) return <PageBody><Skeleton className="h-96" /></PageBody>;
  const check = state.checks.find((c) => c.code === selected) ?? null;

  return (
    <PageBody>
      <PageHeader
        title="Controls & checks"
        description="Automated checks run against your connected systems. Each check maps to ISO 27001:2022 Annex A controls and NIST CSF 2.0 categories."
      />
      <Tabs defaultValue="checks" className="gap-4">
        <TabsList>
          <TabsTrigger value="checks">Checks <Badge variant="secondary" className="ml-1 tabular-nums">{state.checks.length}</Badge></TabsTrigger>
          <TabsTrigger value="iso">ISO 27001:2022</TabsTrigger>
          <TabsTrigger value="nist">NIST CSF 2.0</TabsTrigger>
        </TabsList>
        <TabsContent value="checks"><ChecksTable checks={state.checks} onSelect={setSelected} /></TabsContent>
        <TabsContent value="iso"><ControlsTable controls={state.controls.filter((c) => c.frameworkCode === "iso27001")} onSelectCheck={setSelected} /></TabsContent>
        <TabsContent value="nist"><ControlsTable controls={state.controls.filter((c) => c.frameworkCode === "nistcsf")} onSelectCheck={setSelected} /></TabsContent>
      </Tabs>
      <CheckSheet check={check} onClose={() => setSelected(null)} />
    </PageBody>
  );
}

const STATUS_FILTERS = [
  { v: "all", l: "All" }, { v: "failed", l: "Failing" }, { v: "warning", l: "Warning" }, { v: "passed", l: "Passing" }, { v: "other", l: "Not evaluated" },
];

function ChecksTable({ checks, onSelect }: { checks: Check[]; onSelect: (c: string) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [connector, setConnector] = useState("all");
  const rows = useMemo(() => checks.filter((c) => {
    if (status === "other" ? !["skipped", "not_run", "not_connected"].includes(c.status) : status !== "all" && c.status !== status) return false;
    if (connector !== "all" && c.connector !== connector) return false;
    const s = q.toLowerCase();
    return !s || `${c.code} ${c.name} ${c.category} ${c.mappedControlCodes.join(" ")}`.toLowerCase().includes(s);
  }), [checks, q, status, connector]);
  const count = (v: string) => (v === "all" ? checks.length : v === "other" ? checks.filter((c) => ["skipped", "not_run", "not_connected"].includes(c.status)).length : checks.filter((c) => c.status === v).length);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, code or control…" className="pl-8" />
        </div>
        <ToggleGroup type="single" value={status} onValueChange={(v) => v && setStatus(v)} variant="outline" size="sm">
          {STATUS_FILTERS.map((f) => (
            <ToggleGroupItem key={f.v} value={f.v} className="gap-1.5 px-3">
              {f.l} <span className="text-muted-foreground tabular-nums">{count(f.v)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Select value={connector} onValueChange={setConnector}>
          <SelectTrigger size="sm" className="lg:ml-auto lg:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {Object.entries(CONNECTOR_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden py-0 shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-4">Check</TableHead>
              <TableHead className="hidden lg:table-cell">Controls</TableHead>
              <TableHead className="hidden md:table-cell">Source</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden pr-4 text-right xl:table-cell">Last run</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground h-24 text-center">No checks match these filters.</TableCell></TableRow>
            )}
            {rows.map((c) => (
              <TableRow key={c.code} className="cursor-pointer" onClick={() => onSelect(c.code)}>
                <TableCell className="pl-4 whitespace-normal">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-muted-foreground font-mono text-xs">{c.code}</div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {c.mappedControlCodes.map((m) => <Badge key={m} variant="outline" className="font-mono text-[11px] font-normal">{m}</Badge>)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{CONNECTOR_LABEL[c.connector]}</TableCell>
                <TableCell><SeverityBadge severity={c.severity} /></TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-muted-foreground hidden pr-4 text-right text-sm xl:table-cell">{ago(c.lastRunAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ControlsTable({ controls, onSelectCheck }: { controls: Control[]; onSelectCheck: (c: string) => void }) {
  return (
    <Card className="overflow-hidden py-0 shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-24 pl-4">Control</TableHead>
            <TableHead>Requirement</TableHead>
            <TableHead className="hidden md:table-cell">Evidence</TableHead>
            <TableHead className="pr-4 text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="pl-4 align-top font-mono text-sm font-medium">{c.code}</TableCell>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{c.title}</div>
                <div className="text-muted-foreground max-w-xl text-sm">{c.description}</div>
              </TableCell>
              <TableCell className="hidden align-top md:table-cell">
                <div className="flex max-w-72 flex-wrap gap-1">
                  {c.applicableChecks.map((k) => (
                    <button key={k} onClick={() => onSelectCheck(k)} className="hover:bg-muted rounded border px-1.5 py-0.5 font-mono text-[11px]">{k}</button>
                  ))}
                  {c.policies.map((p) => <Badge key={p} variant="secondary" className="font-mono text-[11px]">{p}</Badge>)}
                  {!c.applicableChecks.length && !c.policies.length && <span className="text-muted-foreground text-xs">Upload or link evidence manually</span>}
                </div>
              </TableCell>
              <TableCell className="pr-4 text-right align-top"><StatusBadge status={c.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function fmtVal(v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (v === null || v === undefined) return "not available";
  return String(v);
}

function CheckSheet({ check, onClose }: { check: Check | null; onClose: () => void }) {
  const { orgId, can, state } = useOrg();
  const [verify, verifying] = useAction(
    (code: string) => api(`/orgs/${orgId}/checks/${code}/verify`, { method: "POST" }),
    "Check re-run. Evidence recorded.",
  );
  const evidence = check ? state?.evidenceStore.filter((e) => e.checkCode === check.code).slice(0, 5) ?? [] : [];
  return (
    <Sheet open={!!check} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {check && (
          <>
            <SheetHeader className="gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={check.status} />
                <SeverityBadge severity={check.severity} />
                <span className="text-muted-foreground font-mono text-xs">{check.code}</span>
              </div>
              <SheetTitle className="text-lg">{check.name}</SheetTitle>
              <SheetDescription>{check.description}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Observed</h3>
                <div className="rounded-lg border">
                  {Object.keys(check.observed).length === 0 && <p className="text-muted-foreground p-3 text-sm">No evidence collected yet.</p>}
                  {Object.entries(check.observed).map(([k, v], i) => (
                    <div key={k} className={`grid grid-cols-[11rem_1fr] gap-3 px-3 py-2 text-sm ${i ? "border-t" : ""}`}>
                      <span className="text-muted-foreground">{k.split(".").slice(1).join(".").replaceAll("_", " ")}</span>
                      <span className="font-mono text-xs break-words tabular-nums">{fmtVal(v)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Source: {CONNECTOR_LABEL[check.connector]} · last run {fmtDateTime(check.lastRunAt)}. Identities are masked in evidence.
                </p>
              </section>
              {(check.status === "failed" || check.status === "warning") && (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">How to fix</h3>
                  <p className="bg-muted/50 rounded-lg border p-3 text-sm leading-relaxed">{check.remediationGuidance}</p>
                  {can.edit && (
                    <Button size="sm" variant="outline" disabled={verifying} onClick={() => verify(check.code)}>
                      <RefreshCw className={verifying ? "animate-spin" : ""} /> {verifying ? "Re-checking…" : "I've fixed this — verify now"}
                    </Button>
                  )}
                  {state?.organization.isDemo && <p className="text-muted-foreground text-xs">Demo tenant: verification simulates the fix being applied.</p>}
                </section>
              )}
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Maps to</h3>
                <div className="flex flex-wrap gap-1.5">
                  {check.mappedControlCodes.map((m) => {
                    const ctl = state?.controls.find((c) => c.code === m);
                    return <Badge key={m} variant="outline" className="font-normal"><span className="font-mono">{m}</span>{ctl && <span className="text-muted-foreground">· {ctl.title}</span>}</Badge>;
                  })}
                </div>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-medium">Evidence history</h3>
                <div className="space-y-2">
                  {evidence.length === 0 && <p className="text-muted-foreground text-sm">No evidence yet.</p>}
                  {evidence.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                      <div className="min-w-0">
                        <div className="text-sm">{fmtDateTime(e.timestamp)}</div>
                        <div className="text-muted-foreground truncate font-mono text-[11px]">sha256 {e.sha256Hash}</div>
                      </div>
                      <StatusBadge status={e.status} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
