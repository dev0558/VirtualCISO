"use client";

import { createContext, useContext } from "react";
import useSWR, { KeyedMutator } from "swr";

import { fetcher } from "@/lib/api";
import type { Me, OrgState, Role } from "@/lib/types";

interface Ctx {
  orgId: string;
  me: Me;
  role: Role;
  state: OrgState | undefined;
  error: Error | undefined;
  isLoading: boolean;
  refresh: KeyedMutator<OrgState>;
  can: { edit: boolean; vciso: boolean };
}

const OrgContext = createContext<Ctx | null>(null);

export function OrgProvider({ orgId, me, children }: { orgId: string; me: Me; children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<OrgState>(`/orgs/${orgId}/state`, fetcher, {
    revalidateOnFocus: false,
  });
  const role = (me.organizations.find((o) => o.id === orgId)?.role ?? "auditor") as Role;
  return (
    <OrgContext.Provider
      value={{
        orgId, me, role, state: data, error, isLoading, refresh: mutate,
        can: { edit: role !== "auditor", vciso: role === "vciso" },
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}
