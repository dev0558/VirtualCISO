"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate } from "@/lib/format";

export default function PoliciesPage() {
  const { state, orgId } = useOrg();
  if (!state) return <PageBody><Skeleton className="h-80" /></PageBody>;
  const approved = state.policies.filter((p) => p.approvedVersion).length;
  return (
    <PageBody>
      <PageHeader
        title="Policies"
        description={`${approved} of ${state.policies.length} core policies approved. Drafts are generated from your company profile and live evidence, cited, and never final until a person approves them.`}
      />
      <Card className="overflow-hidden py-0 shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-24 pl-4">Code</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead className="hidden lg:table-cell">Controls</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden pr-4 text-right md:table-cell">Approved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.policies.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-mono text-sm">{p.code}</TableCell>
                <TableCell className="whitespace-normal">
                  <Link href={`/app/${orgId}/policies/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                  <div className="text-muted-foreground max-w-lg text-sm">{p.description}</div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex max-w-56 flex-wrap gap-1">{p.mappedControls.map((c) => <Badge key={c} variant="outline" className="font-mono text-[11px] font-normal">{c}</Badge>)}</div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {p.version}
                  {p.aiGenerated && <Sparkles className="text-muted-foreground ml-1 inline size-3.5" aria-label="AI-assisted draft" />}
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-muted-foreground hidden pr-4 text-right text-sm md:table-cell">
                  {p.approvedVersion ? <>v{p.approvedVersion} · {fmtDate(p.approvedAt)}</> : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageBody>
  );
}
