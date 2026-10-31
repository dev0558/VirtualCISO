"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMe } from "@/components/app/me-context";

export default function AppIndex() {
  const { me } = useMe();
  const router = useRouter();
  useEffect(() => {
    const vciso = me.organizations.some((o) => o.role === "vciso");
    if (vciso && me.organizations.length > 1) router.replace("/app/clients");
    else if (me.organizations[0]) router.replace(`/app/${me.organizations[0].id}`);
  }, [me, router]);
  return null;
}
