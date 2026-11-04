"use client";

import { use } from "react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { useMe } from "@/components/app/me-context";
import { OrgProvider } from "@/components/app/org-context";
import { DemoBanner } from "@/components/app/demo-banner";
import { SiteHeader } from "@/components/app/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function OrgLayout({ children, params }: { children: React.ReactNode; params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const { me } = useMe();
  return (
    <OrgProvider orgId={orgId} me={me}>
      <SidebarProvider
        style={{ "--sidebar-width": "calc(var(--spacing) * 64)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <DemoBanner />
          <SiteHeader />
          <div className="@container/main flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </OrgProvider>
  );
}
