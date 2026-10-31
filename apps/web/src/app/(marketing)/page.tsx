import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Check, ClipboardList, FileText, Fingerprint, GitBranch, KeyRound, Lock, Map, Plug, ShieldAlert,
  Sparkles, UserCheck,
} from "lucide-react";

import { DemoForm } from "@/components/marketing/demo-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Plug, title: "Read-only connectors", body: "Microsoft 365 / Entra ID, Google Workspace and GitHub. Least-privilege scopes, credentials encrypted, nothing in your systems is ever changed." },
  { icon: Check, title: "28 automated checks", body: "MFA coverage, admin sprawl, Conditional Access, legacy auth, stale guests, branch protection, secret scanning and more — run daily and on demand." },
  { icon: Fingerprint, title: "Tamper-evident evidence", body: "Every result is stored with a timestamp, sanitized payload and SHA-256 hash, ready for an auditor to verify." },
  { icon: FileText, title: "Policies in an afternoon", body: "Five core policies drafted from vetted templates, your company profile and live evidence. Versioned, cited and approved by a person." },
  { icon: ClipboardList, title: "Questionnaires answered", body: "Upload a CSV or XLSX. Answers come only from your approved policies and check results, each cited, low-confidence answers flagged." },
  { icon: Map, title: "A plan, not just a score", body: "Failing controls and risks become a prioritised 90-day roadmap with owners and dates. Your vCISO keeps it moving." },
];

const STEPS = [
  { n: "01", title: "Connect", body: "Grant read-only access to your identity provider and code host. Takes about ten minutes." },
  { n: "02", title: "See your gaps", body: "Checks map to ISO 27001 Annex A and NIST CSF 2.0 categories. Each failure comes with plain-language fix steps." },
  { n: "03", title: "Close them with a vCISO", body: "A named security lead owns your risk register, roadmap and quarterly board report — alongside many clients, so you pay a fraction of a hire." },
];

const TIERS = [
  { name: "Readiness", for: "Teams starting their first audit", items: ["All three connectors", "Automated checks & evidence store", "Five AI-drafted policies", "Questionnaire autofill", "Auditor read-only access & exports"] },
  { name: "Readiness + vCISO", for: "Companies that need a security leader", featured: true, items: ["Everything in Readiness", "Named vCISO and monthly review", "Risk register & 90-day roadmap", "Quarterly leadership report", "Audit preparation & auditor liaison"] },
  { name: "Partner", for: "Consultancies and MSSPs", items: ["Multi-client portfolio view", "Unlimited client workspaces", "Your vCISOs on the platform", "Per-client isolation by design", "Priority onboarding"] },
];

const FAQ = [
  ["Do you certify us?", "No. SecuraVantage gets you ready and produces the evidence an accredited certification body will ask for. Certification is issued by an independent auditor."],
  ["What access do you need?", "Read-only application permissions only — for example Microsoft Graph User.Read.All and Policy.Read.All, Google Admin SDK read-only scopes, and a read-only GitHub token. We never request write access."],
  ["How is our data protected?", "Each customer's data is isolated with PostgreSQL row-level security and automated cross-tenant tests. Credentials are encrypted at rest. Evidence keeps only the facts a check needs and masks identities."],
  ["Is our data used to train AI?", "No. AI features retrieve only from your own approved policies and check results, cite their sources, and every draft stays a draft until a person approves it."],
  ["Which frameworks are covered?", "ISO/IEC 27001:2022 (a technically verifiable subset of Annex A plus policy-evidenced controls) and NIST CSF 2.0 at category level across all six functions."],
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-16 pb-12 md:px-6 md:pt-24">
          <div className="max-w-3xl space-y-6">
            <Badge variant="outline" className="font-normal">ISO/IEC 27001:2022 · NIST CSF 2.0</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Win the security review. Software gathers the evidence; a vCISO guides every decision.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
              SecuraVantage connects to Microsoft 365, Google Workspace and GitHub, continuously checks your controls, drafts your policies and answers customer questionnaires with cited sources — with a virtual CISO accountable for the plan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild><a href="#demo">Book a demo <ArrowRight /></a></Button>
              <Button size="lg" variant="outline" asChild><Link href="/signup">Start free workspace</Link></Button>
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl border p-2 shadow-sm">
            <Image src="/product/dashboard.png" alt="SecuraVantage dashboard showing ISO 27001 and NIST CSF readiness, failing checks and open risks" width={1440} height={900} priority className="rounded-lg border" />
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3 md:px-6">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-2">
              <div className="text-muted-foreground font-mono text-sm">{s.n}</div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="border-b">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-20 md:px-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">Everything an auditor asks for, kept current</h2>
            <p className="text-muted-foreground">Built for 10–250 person companies that sell to enterprises and have no security team yet.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-background space-y-3 p-6">
                <f.icon className="size-5" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="bg-muted/30 border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-6">
          <div className="space-y-4">
            <Badge variant="outline" className="font-normal"><Sparkles /> AI with guardrails</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Answers your sales team can send — because every one is sourced</h2>
            <p className="text-muted-foreground">
              Questionnaire answers and policy drafts are grounded in your approved policies and the latest check results. Each answer shows its sources and a confidence score; weak ones are flagged for review. Nothing is final until a person approves it.
            </p>
            <ul className="space-y-2 text-sm">
              {["Retrieval only from your own workspace", "Citations on every answer and policy", "Human approval before anything is final", "No training on your data"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="bg-background rounded-xl border p-2 shadow-sm">
            <Image src="/product/questionnaire.png" alt="Questionnaire review with cited sources and confidence scores" width={1440} height={900} className="rounded-lg border" />
          </div>
        </div>
      </section>

      <section id="vciso" className="border-b">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:px-6">
          <div className="bg-muted/40 order-last rounded-xl border p-2 shadow-sm md:order-first">
            <Image src="/product/risks.png" alt="Risk register with likelihood by impact heat map" width={1440} height={900} className="rounded-lg border" />
          </div>
          <div className="space-y-4">
            <Badge variant="outline" className="font-normal"><UserCheck /> The human layer</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">A security leader without the full-time hire</h2>
            <p className="text-muted-foreground">
              Dashboards leave you to interpret the results. Your vCISO maintains the risk register, turns gaps into a 90-day roadmap, liaises with auditors and presents a one-page report to your board every quarter.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[[ShieldAlert, "Risk register"], [Map, "90-day roadmap"], [FileText, "Board report"], [UserCheck, "Audit liaison"]].map(([I, t]) => {
                const Icon = I as typeof Map;
                return <div key={t as string} className="flex items-center gap-2 rounded-lg border p-3"><Icon className="size-4" /> {t as string}</div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="bg-muted/30 border-b">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-20 md:px-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">We hold ourselves to the controls we check</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              [Lock, "Tenant isolation", "PostgreSQL row-level security on every customer table, proven by automated cross-tenant tests."],
              [KeyRound, "Least privilege", "Read-only integration scopes. Credentials encrypted with a managed key and never shown again."],
              [Fingerprint, "Audit trail", "Every sensitive action is logged with who, what and when — visible to your auditors."],
              [GitBranch, "Secure delivery", "Code review, dependency scanning and tests on every change."],
            ].map(([I, t, b]) => {
              const Icon = I as typeof Lock;
              return <div key={t as string} className="space-y-2"><Icon className="size-5" /><h3 className="font-semibold">{t as string}</h3><p className="text-muted-foreground text-sm leading-relaxed">{b as string}</p></div>;
            })}
          </div>
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
              <div key={t.name} className={`flex flex-col rounded-xl border p-6 ${t.featured ? "border-foreground shadow-sm" : ""}`}>
                <div className="flex items-center justify-between"><h3 className="font-semibold">{t.name}</h3>{t.featured && <Badge>Most chosen</Badge>}</div>
                <p className="text-muted-foreground mt-1 text-sm">{t.for}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm">{t.items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{i}</li>)}</ul>
                <Button className="mt-6" variant={t.featured ? "default" : "outline"} asChild><a href="#demo">Talk to us</a></Button>
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
            <h2 className="text-3xl font-semibold tracking-tight">See your own gaps in 30 minutes</h2>
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
