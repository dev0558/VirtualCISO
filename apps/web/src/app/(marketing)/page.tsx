import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { ChecksExplorer } from "@/components/marketing/checks-explorer";
import { DemoForm } from "@/components/marketing/demo-form";
import { GuideFigure } from "@/components/marketing/guide-figure";
import { EvidenceRecord, QuestionnaireAnswers, RoadmapPreview } from "@/components/marketing/product-fragments";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/demo";

const ISO_COVERAGE = [
  ["Organizational", "A.5.1 · A.5.2 · A.5.37"],
  ["Access control", "A.5.15 · A.5.16 · A.5.17 · A.5.18"],
  ["Supplier relationships", "A.5.19 · A.5.20 · A.5.21 · A.5.22"],
  ["Technological", "A.8.2 · A.8.5 · A.8.8 · A.8.9 · A.8.13 · A.8.15 · A.8.16 · A.8.24"],
];

const NIST_COVERAGE = [
  ["Govern", "GV.PO · GV.RR · GV.RM · GV.SC"],
  ["Identify", "ID.AM · ID.RA"],
  ["Protect", "PR.AA · PR.DS · PR.PS"],
  ["Detect", "DE.CM · DE.AE"],
  ["Respond", "RS.MA"],
  ["Recover", "RC.RP"],
];

const ALSO_INCLUDED = [
  ["Fix guidance and tasks", "Every failing check explains the fix in plain language and can be assigned to an owner."],
  ["Auditor access", "Give your auditor a read-only role instead of a shared folder."],
  ["Audit dossier", "Export control status, results, hashes and approved policy versions as PDF or CSV."],
  ["Leadership report", "A one-page quarterly summary, drafted from live data and approved by your vCISO."],
  ["Compliance timeline", "Audit milestones and recurring obligations in one calendar."],
  ["Multi-client view", "Readiness, open risks and overdue work across every client you advise."],
];

const SECURITY = [
  ["Tenant isolation", "PostgreSQL row-level security on every customer table, proven by automated cross-tenant tests."],
  ["Least privilege", "Read-only integration scopes. Credentials are encrypted at rest and never shown again."],
  ["Audit trail", "Every sensitive action is logged with who, what and when, and is visible to your auditors."],
  ["Sign-in", "Multi-factor authentication with TOTP, and separate roles for admins, vCISOs and auditors."],
  ["Secure delivery", "Linting, tests and dependency scanning run on every change."],
];

const TIERS = [
  { name: "Readiness", for: "Teams starting their first audit", items: ["All three connectors", "Automated checks & evidence store", "Five AI-drafted policies", "Questionnaire autofill", "Auditor read-only access & exports"] },
  { name: "Readiness + vCISO", for: "Companies that need a security leader", items: ["Everything in Readiness", "Named vCISO and monthly review", "Risk register & 90-day roadmap", "Quarterly leadership report", "Audit preparation & auditor liaison"] },
  { name: "Partner", for: "Consultancies and MSSPs", items: ["Multi-client portfolio view", "Unlimited client workspaces", "Your vCISOs on the platform", "Per-client isolation by design", "Priority onboarding"] },
];

const FAQ = [
  ["Do you certify us?", "No. SecuraVantage gets you ready and produces the evidence an accredited certification body will ask for. Certification is issued by an independent auditor."],
  ["What access do you need?", "Read-only application permissions only — for example Microsoft Graph User.Read.All and Policy.Read.All, Google Admin SDK read-only scopes, and a read-only GitHub token. We never request write access."],
  ["How is our data protected?", "Each customer's data is isolated with PostgreSQL row-level security and automated cross-tenant tests. Credentials are encrypted at rest. Evidence keeps only the facts a check needs and masks identities."],
  ["Is our data used to train AI?", "No. AI features retrieve only from your own approved policies and check results, cite their sources, and every draft stays a draft until a person approves it."],
  ["Which frameworks are covered?", "ISO/IEC 27001:2022 (a technically verifiable subset of Annex A plus policy-evidenced controls) and NIST CSF 2.0 at category level across all six functions."],
];

function Coverage({ title, summary, rows }: { title: string; summary: string; rows: string[][] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-muted-foreground text-sm">{summary}</span>
      </div>
      <dl className="divide-y">
        {rows.map(([group, codes]) => (
          <div key={group} className="grid gap-1 py-3 text-sm sm:grid-cols-[11rem_1fr]">
            <dt className="font-medium">{group}</dt>
            <dd className="text-muted-foreground font-mono text-xs leading-5">{codes}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DefinitionGrid({ items }: { items: string[][] }) {
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([term, body]) => (
        <div key={term} className="border-t pt-4 text-sm">
          <dt className="font-semibold">{term}</dt>
          <dd className="text-muted-foreground mt-1.5 leading-relaxed">{body}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Home() {
  return (
    <>
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 pt-12 md:px-6 md:pt-16">
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="max-w-2xl space-y-6 lg:pb-14">
              <p className="text-muted-foreground font-mono text-xs">ISO/IEC 27001:2022 · NIST CSF 2.0</p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                Win the security review.
              </h1>
              <p className="text-muted-foreground text-lg text-pretty">
                SecuraVantage checks Microsoft 365, Google Workspace and GitHub, drafts your policies and answers customer questionnaires with cited sources. A virtual CISO owns the plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild><a href="#demo">Book a demo <ArrowRight /></a></Button>
                <Button size="lg" variant="outline" asChild><Link href={DEMO_MODE ? "/login" : "/signup"}>{DEMO_MODE ? "Sign in to the demo" : "Start free workspace"}</Link></Button>
              </div>
            </div>
            {/* The figure stands on the top edge of the product frame below. */}
            <GuideFigure className="mx-auto w-full max-w-72 lg:max-w-none" />
          </div>
          <div className="overflow-hidden rounded-t-xl border border-b-0">
            <Image src="/product/dashboard.png" alt="SecuraVantage dashboard showing ISO 27001 and NIST CSF readiness, failing checks and open risks" width={1440} height={900} priority className="-mb-[12%]" />
          </div>
        </div>
      </section>

      <section id="product" className="border-b">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-20 md:px-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">28 checks on the systems you already run</h2>
            <p className="text-muted-foreground">Connections are read-only and use least-privilege scopes, so nothing in your systems is ever changed. Checks run daily and on demand.</p>
          </div>
          <ChecksExplorer />
        </div>
      </section>

      <section id="trust" className="border-b">
        <div className="mx-auto max-w-6xl space-y-20 px-4 py-20 md:px-6">
          <div className="grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Evidence an auditor can verify</h2>
              <p className="text-muted-foreground">Every result is stored with a timestamp, the facts the check needed and a SHA-256 hash. Identities are masked before anything is saved.</p>
            </div>
            <EvidenceRecord />
          </div>
          <div className="grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">Answers with their sources attached</h2>
              <p className="text-muted-foreground">Upload a CSV or XLSX questionnaire. Answers come only from your approved policies and check results. Weak ones are flagged, and nothing is final until a person approves it.</p>
            </div>
            <QuestionnaireAnswers />
          </div>
        </div>
      </section>

      <section id="vciso" className="border-b">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-20 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">A security leader without the full-time hire</h2>
            <p className="text-muted-foreground">Your vCISO maintains the risk register, turns failing controls and risks into a 90-day plan with owners and dates, works with your auditors and reports to your board each quarter.</p>
          </div>
          <RoadmapPreview />
        </div>
      </section>

      <section id="coverage" className="border-b">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-20 md:px-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">What is in scope</h2>
            <p className="text-muted-foreground">A technically verifiable subset of Annex A, plus NIST CSF 2.0 at category level. Certification is issued by an independent auditor, not by us.</p>
          </div>
          <div className="grid gap-10 md:grid-cols-2">
            <Coverage title="ISO/IEC 27001:2022" summary="19 Annex A controls" rows={ISO_COVERAGE} />
            <Coverage title="NIST CSF 2.0" summary="13 categories, 6 functions" rows={NIST_COVERAGE} />
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-20 md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Also included</h2>
          <DefinitionGrid items={ALSO_INCLUDED} />
        </div>
      </section>

      <section id="security" className="border-b">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-20 md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">We hold ourselves to the controls we check</h2>
          <DefinitionGrid items={SECURITY} />
        </div>
      </section>

      <section id="pricing" className="border-b">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-20 md:px-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">Plans</h2>
            <p className="text-muted-foreground">Priced by company size and scope. Book a demo for a quote.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-xl border p-6">
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{t.for}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">{t.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{i}</li>)}</ul>
                <Button className="mt-6" variant="outline" asChild><a href="#demo">Talk to us</a></Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[18rem_1fr] md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <dl className="divide-y">
            {FAQ.map(([q, a]) => (
              <div key={q} className="py-5 first:pt-0"><dt className="font-medium">{q}</dt><dd className="text-muted-foreground mt-2 text-sm leading-relaxed">{a}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section id="demo">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:px-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">See your own gaps in a live demo</h2>
            <p className="text-muted-foreground">
              We will connect to a test tenant (or use our sample company), walk through live checks, generate a policy and autofill a questionnaire from your last security review.
            </p>
          </div>
          <DemoForm />
        </div>
      </section>
    </>
  );
}
