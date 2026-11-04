"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CHECKS } from "./checks-data";

const SOURCES = [
  { key: "m365", label: "Microsoft 365" },
  { key: "google_workspace", label: "Google Workspace" },
  { key: "github", label: "GitHub" },
] as const;

export function ChecksExplorer() {
  return (
    <Tabs defaultValue="m365" className="gap-4">
      <TabsList className="max-w-full overflow-x-auto">
        {SOURCES.map((s) => (
          <TabsTrigger key={s.key} value={s.key}>
            {s.label} <span className="text-muted-foreground tabular-nums">{CHECKS[s.key].length}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {SOURCES.map((s) => (
        <TabsContent key={s.key} value={s.key}>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="whitespace-normal">Check</TableHead>
                  <TableHead className="hidden md:table-cell">Area</TableHead>
                  <TableHead className="hidden sm:table-cell">Maps to</TableHead>
                  <TableHead className="text-right">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHECKS[s.key].map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="font-medium whitespace-normal">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{c.category}</TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">{c.controls}</TableCell>
                    <TableCell className={`text-right capitalize ${c.severity === "critical" ? "text-destructive font-medium" : "text-muted-foreground"}`}>{c.severity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
