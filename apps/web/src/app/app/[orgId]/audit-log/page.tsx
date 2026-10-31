"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABEL, fmtDateTime } from "@/lib/format";

export default function AuditLogPage() {
  const { state } = useOrg();
  const [q, setQ] = useState("");
  const rows = useMemo(() => (state?.auditLogs ?? []).filter((a) => !q || `${a.actor} ${a.action} ${a.resource} ${a.details}`.toLowerCase().includes(q.toLowerCase())), [state, q]);
  return (
    <PageBody>
      <PageHeader title="Audit log" description="Every sensitive action — who, what, when — for this organisation. Retained for evidence of control operation." />
      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
        <Input className="pl-8" placeholder="Filter by person, action or resource…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="overflow-hidden py-0 shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow><TableHead className="pl-4">When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead className="hidden md:table-cell">Details</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground h-20 text-center">No entries.</TableCell></TableRow>}
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-muted-foreground pl-4 text-sm whitespace-nowrap tabular-nums">{fmtDateTime(a.timestamp)}</TableCell>
                <TableCell className="text-sm"><div>{a.actor}</div><div className="text-muted-foreground text-xs">{ROLE_LABEL[a.role] ?? a.role}</div></TableCell>
                <TableCell className="whitespace-normal"><Badge variant="outline" className="font-mono text-[11px] font-normal">{a.action}</Badge><div className="mt-1 text-sm">{a.resource}</div></TableCell>
                <TableCell className="text-muted-foreground hidden max-w-md text-sm whitespace-normal md:table-cell">{a.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageBody>
  );
}
