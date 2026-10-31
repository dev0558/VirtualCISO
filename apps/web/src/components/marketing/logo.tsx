import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
        <ShieldCheck className="size-4" />
      </span>
      SecuraVantage
    </Link>
  );
}
