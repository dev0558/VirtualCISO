"use client";

import { CONTACT_HREF, DEMO_MODE } from "@/lib/demo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    try {
      if (step === "password") {
        const r = await api<{ mfaRequired?: boolean }>("/auth/login", {
          method: "POST", json: { email: f.get("email"), password: f.get("password") },
        });
        if (r.mfaRequired) { setStep("mfa"); return; }
      } else {
        await api("/auth/mfa/verify", { method: "POST", json: { code: f.get("code") } });
      }
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{step === "password" ? "Welcome back" : "Two-factor authentication"}</CardTitle>
        <CardDescription>
          {step === "password" ? "Sign in to your compliance workspace" : "Enter the 6-digit code from your authenticator app"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-5">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {step === "password" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
            </>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="code">Authentication code</Label>
              <Input id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" autoFocus required className="text-center font-mono tracking-[0.4em]" />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : step === "password" ? "Sign in" : "Verify"}
          </Button>
          {step === "password" && (
            <p className="text-muted-foreground text-center text-sm">
              {DEMO_MODE ? (
                <>Need demo access? <a href={CONTACT_HREF} className="text-foreground underline underline-offset-4">Get in touch</a></>
              ) : (
                <>New to SecuraVantage? <Link href="/signup" className="text-foreground underline underline-offset-4">Create an account</Link></>
              )}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
