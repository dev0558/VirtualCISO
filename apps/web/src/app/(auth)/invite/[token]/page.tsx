"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import useSWR from "swr";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, fetcher } from "@/lib/api";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const { data, error: loadError } = useSWR<{ email: string; fullName: string }>(`/auth/invite/${token}`, fetcher);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setPending(true);
    try {
      await api("/auth/invite/accept", { method: "POST", json: { token, full_name: f.get("full_name"), password: f.get("password") } });
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept invitation");
    } finally {
      setPending(false);
    }
  }

  if (loadError) {
    return <Alert variant="destructive"><AlertDescription>This invitation is invalid or has expired. Ask for a new link.</AlertDescription></Alert>;
  }
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Join your team</CardTitle>
        <CardDescription>{data ? `Set up your account for ${data.email}` : "Loading invitation…"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={data?.fullName} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
          </div>
          <Button type="submit" disabled={pending || !data}>{pending ? "Joining…" : "Accept invitation"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
