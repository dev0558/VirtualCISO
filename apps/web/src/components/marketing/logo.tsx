import Link from "next/link";

import { cn } from "@/lib/utils";

/** SecuraVantage mark: a split "V". Inherits colour from the surrounding text. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("size-5 shrink-0", className)}>
      <path d="M2 4h5.6L15 20H9.4z" />
      <path d="M16.4 4H22l-6.3 13.62-2.8-6.05z" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <LogoMark />
      SecuraVantage
    </Link>
  );
}
