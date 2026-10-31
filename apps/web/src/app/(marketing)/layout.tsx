import Link from "next/link";

import { Logo } from "@/components/marketing/logo";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
          <Logo />
          <nav className="text-muted-foreground hidden items-center gap-5 text-sm md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#vciso" className="hover:text-foreground">vCISO</a>
            <a href="#security" className="hover:text-foreground">Security</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign in</Link></Button>
            <Button size="sm" asChild><a href="#demo">Book a demo</a></Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm md:flex-row md:items-start md:justify-between md:px-6">
          <div className="space-y-2">
            <Logo />
            <p className="max-w-sm text-xs leading-relaxed">
              Readiness tooling and advisory for ISO/IEC 27001:2022 and NIST CSF 2.0. SecuraVantage does not issue certifications and does not guarantee audit outcomes.
            </p>
          </div>
          <div className="flex gap-10 text-sm">
            <div className="space-y-2"><div className="text-foreground font-medium">Product</div><a className="block" href="#product">Automated checks</a><a className="block" href="#trust">Policies & questionnaires</a><a className="block" href="#vciso">vCISO workspace</a></div>
            <div className="space-y-2"><div className="text-foreground font-medium">Company</div><a className="block" href="#security">Security</a><a className="block" href="#demo">Contact</a><Link className="block" href="/login">Sign in</Link></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
