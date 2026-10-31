"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR, { KeyedMutator } from "swr";

import { ApiError, fetcher } from "@/lib/api";
import type { Me } from "@/lib/types";

const MeContext = createContext<{ me: Me; refreshMe: KeyedMutator<Me> } | null>(null);

export function MeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, error, mutate } = useSWR<Me>("/auth/me", fetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) router.replace("/login");
  }, [error, router]);
  if (!data) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span className="border-muted-foreground/40 border-t-foreground size-4 animate-spin rounded-full border-2" />
          {error && !(error instanceof ApiError && error.status === 401) ? "Could not reach the server." : "Loading workspace…"}
        </div>
      </div>
    );
  }
  return <MeContext.Provider value={{ me: data, refreshMe: mutate }}>{children}</MeContext.Provider>;
}

export function useMe() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useMe outside MeProvider");
  return ctx;
}
