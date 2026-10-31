"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMe } from "@/components/app/me-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Org } from "@/lib/types";

export default function NewOrgPage() {
  const router = useRouter();
  const { refreshMe } = useMe();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    try {
      const org = await api<Org>("/orgs", { method: "POST", json: { name: f.get("name"), industry: f.get("industry") || "", employee_count: Number(f.get("employees") || 0) } });
      await refreshMe();
      router.push(`/app/${org.id}/integrations`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create organisation");
      setPending(false);
    }
  }
  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add an organisation</CardTitle>
          <CardDescription>Creates a separate, isolated workspace with its own integrations, evidence and policies.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="grid gap-2"><Label htmlFor="name">Company name</Label><Input id="name" name="name" required minLength={2} /></div>
            <div className="grid gap-2"><Label htmlFor="industry">Industry</Label><Input id="industry" name="industry" /></div>
            <div className="grid gap-2"><Label htmlFor="employees">Employees</Label><Input id="employees" name="employees" type="number" min={0} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create workspace"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
