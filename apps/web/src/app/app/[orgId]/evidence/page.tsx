"use client";

import { useState } from "react";
import { CheckCircle2, Fingerprint, XCircle } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { StatusBadge } from "@/components/app/status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { CONNECTOR_LABEL, fmtDateTime } from "@/lib/format";

interface Verified { sha256: string; verified: boolean; objectKey: string | null; payload: unknown }

export default function EvidencePage() {
  const { state, orgId } = useOrg();
  const [open, setOpen] = useState<Verified | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const rows = state?.evidenceStore ?? [];
  async function inspect(id: string) {
    setBusy(id);
    try { setOpen(await api<Verified>(`/orgs/${orgId}/evidence/${id}`)); } finally { setBusy(null); }
  }
  return (
    <PageBody>
      <PageHeader
        title="Evidence"
        description="Every check run produces a timestamped, sanitized evidence record with a SHA-256 hash. Verify any record against its stored payload."
      />
      {rows.length === 0 ? (
        <EmptyState icon={Fingerprint} title="No evidence yet" description="Connect an integration and run checks to start collecting evidence." />
      ) : (
        <Card className="overflow-hidden py-0 shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-4">Collected</TableHead>
                <TableHead>Check</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="hidden lg:table-cell">SHA-256</TableHead>
                <TableHead className="pr-4 text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="pl-4 text-sm tabular-nums">{fmtDateTime(e.timestamp)}</TableCell>
                  <TableCell className="whitespace-normal"><div className="font-medium">{e.checkName}</div><div className="text-muted-foreground font-mono text-xs">{e.checkCode}</div></TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{CONNECTOR_LABEL[e.connector]}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-muted-foreground hidden font-mono text-xs lg:table-cell">{e.sha256Hash.slice(0, 16)}…</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button size="sm" variant="ghost" disabled={busy === e.id} onClick={() => inspect(e.id)}>Verify</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {open?.verified ? <CheckCircle2 className="text-status-good size-5" /> : <XCircle className="text-status-critical size-5" />}
              {open?.verified ? "Integrity verified" : "Hash mismatch"}
            </DialogTitle>
            <DialogDescription>
              The SHA-256 of the canonical JSON payload below {open?.verified ? "matches" : "does not match"} the stored hash.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-md p-2 font-mono text-[11px] break-all">{open?.sha256}</div>
          <pre className="bg-muted max-h-80 overflow-auto rounded-md p-3 text-[11px] leading-relaxed">{JSON.stringify(open?.payload, null, 2)}</pre>
          {open?.objectKey && <p className="text-muted-foreground text-xs">Stored object: <span className="font-mono">{open.objectKey}</span></p>}
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}
