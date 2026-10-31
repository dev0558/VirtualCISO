"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export function DemoForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState("");
  const [pending, setPending] = useState(false);
  if (done) {
    return (
      <Card><CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 className="text-status-good size-8" />
        <div className="font-medium">Thanks — we will be in touch within one business day.</div>
      </CardContent></Card>
    );
  }
  return (
    <Card className="shadow-xs">
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setPending(true); setError(null);
          try {
            await api("/public/leads", { method: "POST", json: { name: f.get("name"), email: f.get("email"), company: f.get("company"), company_size: size, message: f.get("message") || "", website: f.get("website") || "" } });
            setDone(true);
          } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); } finally { setPending(false); }
        }}>
          {error && <Alert variant="destructive" className="sm:col-span-2"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" required autoComplete="name" /></div>
          <div className="grid gap-2"><Label htmlFor="demo-email">Work email</Label><Input id="demo-email" name="email" type="email" required autoComplete="email" /></div>
          <div className="grid gap-2"><Label htmlFor="company">Company</Label><Input id="company" name="company" required autoComplete="organization" /></div>
          <div className="grid gap-2"><Label>Company size</Label>
            <Select value={size} onValueChange={setSize}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["1–10", "11–50", "51–250", "251+"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="message">What is driving this? <span className="text-muted-foreground font-normal">(optional)</span></Label><Textarea id="message" name="message" rows={3} placeholder="e.g. An enterprise prospect sent us a security questionnaire" /></div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <Button type="submit" className="sm:col-span-2" disabled={pending}>{pending ? "Sending…" : "Request a demo"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
