import { Badge } from "@/components/ui/badge";

/* Readable pieces of the real product surfaces. All sample content is fictional. */

function Frame({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border">
      <div className="bg-muted/40 flex items-center justify-between gap-4 border-b px-4 py-2.5 text-xs">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground font-mono">{meta}</span>
      </div>
      {children}
    </div>
  );
}

/* Same shape as services/engine.py; the hash is the real canonical_hash of this record. */
const EVIDENCE = {
  "organization_id": "3f6c1a52-8e0b-4d17-9a44-0c2b7e91d6a3",
  "check": "M365-MFA-01",
  "status": "warning",
  "collected_at": "2026-10-28T02:00:04+00:00",
  "observed": {
    "facts": {
      "m365.users_enabled": 52,
      "m365.mfa_registered_pct": 96.2,
      "m365.users_without_mfa": [
        "j***@northwind.example",
        "p***@northwind.example"
      ]
    },
    "connector": "m365",
    "mode": "demo",
    "account": "northwind.example",
    "rule": {
      "fact": "m365.mfa_registered_pct",
      "op": "gte",
      "value": 100
    },
    "collector_warnings": []
  }
};
const EVIDENCE_SHA256 = "1a113f2ae218da70faad8fd890c479686294b7a21eff45898ac1cabce8c1871f";

export function EvidenceRecord() {
  return (
    <Frame title="Evidence record" meta="M365-MFA-01">
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">{JSON.stringify({ ...EVIDENCE, sha256: EVIDENCE_SHA256 }, null, 2)}</pre>
    </Frame>
  );
}

const ANSWERS = [
  {
    q: "Do you enforce multi-factor authentication (MFA) for all users and administrators?",
    a: "Partly. MFA is required by the Access Control Policy, and the latest check shows 96.2% of active users registered. Two accounts are being remediated.",
    sources: ["Access Control Policy v2", "Check M365-MFA-01"],
    confidence: 88,
  },
  {
    q: "How often do you review user and privileged access rights?",
    a: "Reviews are required by policy, but no completed review record was found. This point needs confirmation.",
    sources: ["Access Control Policy v2"],
    confidence: 52,
  },
];

export function QuestionnaireAnswers() {
  return (
    <Frame title="Questionnaire review" meta="draft">
      <div className="divide-y">
        {ANSWERS.map((x) => (
          <div key={x.q} className="space-y-2 p-4 text-sm">
            <div className="font-medium">{x.q}</div>
            <p className="text-muted-foreground leading-relaxed">{x.a}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {x.sources.map((s) => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}
              <span className={`ml-auto text-xs tabular-nums ${x.confidence < 75 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {x.confidence}% confidence{x.confidence < 75 ? " · needs review" : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

const ROADMAP = [
  { item: "Enrol the remaining accounts in MFA", from: "M365-MFA-01", owner: "IT lead", due: "Day 14" },
  { item: "Require review on default branches", from: "A.8.9", owner: "Engineering lead", due: "Day 30" },
  { item: "Approve the incident response policy", from: "RS.MA", owner: "COO", due: "Day 45" },
  { item: "Run the first access review", from: "A.5.18", owner: "IT lead", due: "Day 60" },
  { item: "Test backup restoration", from: "A.8.13", owner: "Engineering lead", due: "Day 90" },
];

export function RoadmapPreview() {
  return (
    <Frame title="90-day roadmap" meta="sample">
      <div className="divide-y text-sm">
        {ROADMAP.map((r) => (
          <div key={r.item} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-0.5 px-4 py-3">
            <span className="font-medium">{r.item}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{r.due}</span>
            <span className="text-muted-foreground text-xs">{r.owner} · <span className="font-mono">{r.from}</span></span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
