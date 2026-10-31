"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Play, Search } from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRunChecks } from "@/hooks/use-actions";

const TITLES: Record<string, string> = {
  "": "Dashboard", controls: "Controls & checks", integrations: "Integrations", evidence: "Evidence",
  policies: "Policies", questionnaires: "Questionnaires", risks: "Risk register", roadmap: "90-day roadmap",
  report: "Leadership report", timeline: "Timeline", export: "Auditor export", "audit-log": "Audit log", settings: "Settings",
};

export function SiteHeader() {
  const { orgId, state, can, role } = useOrg();
  const pathname = usePathname();
  const seg = pathname.replace(`/app/${orgId}`, "").split("/")[1] ?? "";
  const [run, running] = useRunChecks();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(`/app/${orgId}${href}`);
  };

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-sm font-medium">{TITLES[seg] ?? "Workspace"}</h1>
        {state?.organization.isDemo && (
          <Badge variant="outline" className="ml-1 hidden text-xs font-normal sm:inline-flex">Demo data</Badge>
        )}
        {role === "auditor" && (
          <Badge variant="outline" className="ml-1 text-xs font-normal">Read-only</Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-muted-foreground hidden w-56 justify-start gap-2 font-normal md:flex" onClick={() => setOpen(true)}>
            <Search className="size-3.5" /> Search…
            <kbd className="bg-muted ml-auto rounded px-1.5 font-mono text-[10px]">⌘K</kbd>
          </Button>
          {can.edit && (
            <Button size="sm" onClick={() => run()} disabled={running}>
              <Play className={running ? "animate-pulse" : ""} />
              {running ? "Running checks…" : "Run checks"}
            </Button>
          )}
        </div>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search checks, controls, policies, risks…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Go to">
            {Object.entries(TITLES).map(([k, v]) => (
              <CommandItem key={k} onSelect={() => go(k ? `/${k}` : "")}>{v}</CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Checks">
            {state?.checks.map((c) => (
              <CommandItem key={c.code} value={`${c.code} ${c.name}`} onSelect={() => go(`/controls?check=${c.code}`)}>
                <span className="text-muted-foreground font-mono text-xs">{c.code}</span> {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Policies">
            {state?.policies.map((p) => (
              <CommandItem key={p.id} value={`${p.code} ${p.title}`} onSelect={() => go(`/policies/${p.id}`)}>
                <span className="text-muted-foreground font-mono text-xs">{p.code}</span> {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Risks">
            {state?.risks.map((r) => (
              <CommandItem key={r.id} value={`risk ${r.title}`} onSelect={() => go(`/risks`)}>{r.title}</CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
