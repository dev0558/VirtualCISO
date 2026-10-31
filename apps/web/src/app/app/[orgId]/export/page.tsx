"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Meter } from "@/components/app/metric-card";
import { useOrg } from "@/components/app/org-context";
import { PageBody, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadUrl } from "@/lib/api";

export default function ExportPage() {
  const { state, orgId } = useOrg();
  const fw = [
    { code: "iso27001", name: "ISO/IEC 27001:2022", score: state?.scores.isoScore ?? 0, p: state?.scores.isoPassed ?? 0, t: state?.scores.isoTotal ?? 0, color: "var(--series-1)" },
    { code: "nistcsf", name: "NIST CSF 2.0", score: state?.scores.nistScore ?? 0, p: state?.scores.nistPassed ?? 0, t: state?.scores.nistTotal ?? 0, color: "var(--series-2)" },
  ];
  return (
    <PageBody className="max-w-5xl">
      <PageHeader title="Auditor export" description="One-click evidence dossier per framework: control status, mapped checks, latest results, collection timestamps and SHA-256 hashes. Every export is recorded in the audit log." />
      <div className="grid gap-4 md:grid-cols-2">
        {fw.map((f) => (
          <Card key={f.code} className="shadow-xs">
            <CardHeader>
              <CardTitle>{f.name}</CardTitle>
              <CardDescription>{f.p} of {f.t} controls passing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-semibold tabular-nums">{f.score}%</div>
              <Meter value={f.p} max={f.t} color={f.color} label={`${f.name} passing`} />
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild><a href={downloadUrl(`/orgs/${orgId}/export?framework=${f.code}&format=pdf`)}><FileText /> PDF dossier</a></Button>
              <Button variant="outline" asChild><a href={downloadUrl(`/orgs/${orgId}/export?framework=${f.code}&format=csv`)}><FileSpreadsheet /> CSV</a></Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Card className="shadow-xs">
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="size-4" /> What auditors receive</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground grid gap-2 text-sm md:grid-cols-2">
          <p>Status for every in-scope control, with the evidence source: automated check, approved policy, or manual.</p>
          <p>Each automated result with its collection time and a hash that can be re-verified against the stored evidence object.</p>
          <p>References to approved policy versions and approvers.</p>
          <p>A clear statement that the dossier supports readiness and is not a certification.</p>
        </CardContent>
      </Card>
    </PageBody>
  );
}
