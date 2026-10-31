import { AlertTriangle, CheckCircle2, CircleDashed, CircleDot, Clock, MinusCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "good" | "warning" | "critical" | "neutral" | "info";

const TONE: Record<Tone, string> = {
  good: "border-status-good/30 bg-status-good/10 text-success-ink",
  warning: "border-status-warning/40 bg-status-warning/10 text-warning-ink",
  critical: "border-status-critical/30 bg-status-critical/10 text-critical-ink",
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-series-1/30 bg-series-1/10 text-series-1",
};

const MAP: Record<string, { tone: Tone; label: string; Icon: typeof CheckCircle2 }> = {
  passed: { tone: "good", label: "Passing", Icon: CheckCircle2 },
  failed: { tone: "critical", label: "Failing", Icon: XCircle },
  warning: { tone: "warning", label: "Warning", Icon: AlertTriangle },
  skipped: { tone: "neutral", label: "Skipped", Icon: MinusCircle },
  not_run: { tone: "neutral", label: "Not run", Icon: CircleDashed },
  not_connected: { tone: "neutral", label: "Not connected", Icon: MinusCircle },
  in_progress: { tone: "warning", label: "In progress", Icon: CircleDot },
  manual_verification: { tone: "neutral", label: "Manual", Icon: CircleDashed },
  approved: { tone: "good", label: "Approved", Icon: CheckCircle2 },
  draft: { tone: "neutral", label: "Draft", Icon: CircleDashed },
  under_review: { tone: "info", label: "In review", Icon: Clock },
  not_started: { tone: "neutral", label: "Not started", Icon: CircleDashed },
  superseded: { tone: "neutral", label: "Superseded", Icon: MinusCircle },
  todo: { tone: "neutral", label: "To do", Icon: CircleDashed },
  completed: { tone: "good", label: "Done", Icon: CheckCircle2 },
  upcoming: { tone: "neutral", label: "Upcoming", Icon: Clock },
  overdue: { tone: "critical", label: "Overdue", Icon: AlertTriangle },
  connected: { tone: "good", label: "Connected", Icon: CheckCircle2 },
  error: { tone: "critical", label: "Error", Icon: XCircle },
  Open: { tone: "critical", label: "Open", Icon: CircleDot },
  "In Progress": { tone: "warning", label: "In progress", Icon: CircleDot },
  Treated: { tone: "good", label: "Treated", Icon: CheckCircle2 },
  Accepted: { tone: "neutral", label: "Accepted", Icon: MinusCircle },
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const m = MAP[status] ?? { tone: "neutral" as Tone, label: status, Icon: CircleDashed };
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", TONE[m.tone], className)}>
      <m.Icon className="size-3" aria-hidden />
      {label ?? m.label}
    </Badge>
  );
}

const SEV: Record<string, Tone> = { critical: "critical", high: "warning", medium: "neutral", low: "neutral" };

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", TONE[SEV[severity] ?? "neutral"])}>
      {severity}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone: Tone = priority === "P1" ? "critical" : priority === "P2" ? "warning" : "neutral";
  return (
    <Badge variant="outline" className={cn("font-mono", TONE[tone])}>
      {priority}
    </Badge>
  );
}

export function riskBand(score: number): { tone: Tone; label: string } {
  if (score >= 15) return { tone: "critical", label: "Critical" };
  if (score >= 10) return { tone: "warning", label: "High" };
  if (score >= 5) return { tone: "info", label: "Medium" };
  return { tone: "neutral", label: "Low" };
}

export function RiskScoreBadge({ score }: { score: number }) {
  const b = riskBand(score);
  return (
    <Badge variant="outline" className={cn("tabular-nums", TONE[b.tone])}>
      {score} · {b.label}
    </Badge>
  );
}

export function ConfidenceBadge({ value, needsReview }: { value: number; needsReview: boolean }) {
  const tone: Tone = needsReview ? "warning" : value >= 75 ? "good" : "neutral";
  return (
    <Badge variant="outline" className={cn("tabular-nums", TONE[tone])}>
      {needsReview && <AlertTriangle className="size-3" aria-hidden />}
      {value}% {needsReview ? "· review" : ""}
    </Badge>
  );
}
