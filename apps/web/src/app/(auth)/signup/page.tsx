"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api("/auth/signup", {
        method: "POST",
        json: {
          full_name: f.get("full_name"), email: f.get("email"), password: f.get("password"),
          company: f.get("company"), industry: f.get("industry") || "", employee_count: Number(f.get("employee_count") || 0),
        },
      });
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Start your readiness programme</CardTitle>
        <CardDescription>Free workspace. Connect read-only, see results in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" autoComplete="organization" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employee_count">Employees</Label>
              <Input id="employee_count" name="employee_count" type="number" min={1} inputMode="numeric" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="industry" name="industry" placeholder="e.g. B2B SaaS, fintech, healthtech" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
            <p className="text-muted-foreground text-xs">At least 12 characters. You can add an authenticator app after signing in.</p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating workspace…" : "Create workspace"}</Button>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account? <Link href="/login" className="text-foreground underline underline-offset-4">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
