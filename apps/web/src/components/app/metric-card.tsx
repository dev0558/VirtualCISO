import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, badge, footer, sub, className }: {
  label: string; value: React.ReactNode; badge?: React.ReactNode; footer?: React.ReactNode; sub?: React.ReactNode; className?: string;
}) {
  return (
    <Card className={cn("@container/card gap-3 shadow-xs", className)}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{value}</CardTitle>
        {badge && <CardAction>{badge}</CardAction>}
      </CardHeader>
      {(footer || sub) && (
        <CardFooter className="flex-col items-start gap-1 text-sm">
          {footer && <div className="line-clamp-1 flex gap-2 font-medium">{footer}</div>}
          {sub && <div className="text-muted-foreground">{sub}</div>}
        </CardFooter>
      )}
    </Card>
  );
}

export function Meter({ value, max, color = "var(--series-1)", label }: { value: number; max: number; color?: string; label?: string }) {
  const pct = max ? Math.round((100 * value) / max) : 0;
  return (
    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
