"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Upload } from "lucide-react";

import { Meter } from "@/components/app/metric-card";
import { useOrg } from "@/components/app/org-context";
import { EmptyState, PageBody, PageHeader } from "@/components/app/page";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Questionnaire } from "@/lib/types";

export default function QuestionnairesPage() {
  const { state, orgId, can } = useOrg();
  const [open, setOpen] = useState(false);
  const qs = state?.questionnaires ?? [];
  return (
    <PageBody>
      <PageHeader
        title="Security questionnaires"
        description="Upload a customer questionnaire (CSV or XLSX). Answers are drafted only from your approved policies and live check results, each with sources and a confidence score."
        actions={can.edit && <Button onClick={() => setOpen(true)}><Upload /> Upload questionnaire</Button>}
      />
      {qs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No questionnaires yet" description="Upload the spreadsheet a prospect sent you. Include a 'question' column; an optional 'category' column is used for grouping." action={can.edit && <Button onClick={() => setOpen(true)}>Upload questionnaire</Button>} />
      ) : (
        <Card className="overflow-hidden py-0 shadow-xs">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-4">Questionnaire</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="w-48">Approved</TableHead>
                <TableHead className="text-right">Needs review</TableHead>
                <TableHead className="pr-4 text-right">Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qs.map((q) => {
                const approved = q.items.filter((i) => i.humanApproved).length;
                return (
                  <TableRow key={q.id}>
                    <TableCell className="pl-4"><Link className="font-medium hover:underline" href={`/app/${orgId}/questionnaires/${q.id}`}>{q.title}</Link><div className="text-muted-foreground text-xs">{q.sourceFilename}</div></TableCell>
                    <TableCell>{q.customerName || "—"}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><span className="w-12 text-sm tabular-nums">{approved}/{q.items.length}</span><Meter value={approved} max={q.items.length} color="var(--status-good)" /></div></TableCell>
                    <TableCell className="text-right tabular-nums">{q.items.filter((i) => i.needsReview && !i.humanApproved).length}</TableCell>
                    <TableCell className="text-muted-foreground pr-4 text-right text-sm">{fmtDate(q.uploadedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      {open && <UploadDialog onClose={() => setOpen(false)} />}
    </PageBody>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const { orgId, refresh } = useOrg();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const q = await api<Questionnaire>(`/orgs/${orgId}/questionnaires`, { method: "POST", body: new FormData(e.currentTarget) });
      await refresh();
      router.push(`/app/${orgId}/questionnaires/${q.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPending(false);
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload questionnaire</DialogTitle>
          <DialogDescription>CSV or XLSX, up to 5 MB and 300 questions. The first sheet is read.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-2"><Label htmlFor="file">File</Label><Input id="file" name="file" type="file" accept=".csv,.xlsx" required /></div>
          <div className="grid gap-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" placeholder="e.g. Vendor security assessment" /></div>
          <div className="grid gap-2"><Label htmlFor="customer_name">Customer</Label><Input id="customer_name" name="customer_name" placeholder="Who sent it?" /></div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
