"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useOrg } from "@/components/app/org-context";
import { api } from "@/lib/api";

/** Wraps a mutation: shows a toast, refreshes org state, returns [run, pending]. */
export function useAction<A extends unknown[]>(fn: (...args: A) => Promise<unknown>, success?: string | ((r: unknown) => string)) {
  const { refresh } = useOrg();
  const [pending, setPending] = useState(false);
  const run = async (...args: A) => {
    setPending(true);
    try {
      const r = await fn(...args);
      await refresh();
      if (success) toast.success(typeof success === "function" ? success(r) : success);
      return r;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return undefined;
    } finally {
      setPending(false);
    }
  };
  return [run, pending] as const;
}

export function useRunChecks() {
  const { orgId } = useOrg();
  return useAction(
    () => api<{ summary: { counts: Record<string, number> } }>(`/orgs/${orgId}/checks/run`, { method: "POST" }),
    (r) => {
      const c = (r as { summary: { counts: Record<string, number> } }).summary.counts;
      return `Checks complete — ${c.passed} passing, ${c.failed} failing, ${c.warning} warnings`;
    },
  );
}
