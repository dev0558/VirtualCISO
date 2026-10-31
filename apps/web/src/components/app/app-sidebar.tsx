"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookCheck, Building2, CalendarClock, ChartNoAxesColumn, ChevronsUpDown, ClipboardList, FileCheck2,
  FileDown, FileText, Fingerprint, LayoutDashboard, ListChecks, LogOut, Map, Plug, Plus, Settings, ShieldAlert,
  ShieldCheck, Users,
} from "lucide-react";

import { useOrg } from "@/components/app/org-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { api } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/format";

type Item = { title: string; href: string; icon: React.ComponentType; badge?: number; show?: boolean };

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { orgId, state, me, role } = useOrg();
  const pathname = usePathname();
  const base = `/app/${orgId}`;
  const failing = state?.checks.filter((c) => c.status === "failed").length ?? 0;
  const review = state?.questionnaires.reduce((n, q) => n + q.items.filter((i) => !i.humanApproved).length, 0) ?? 0;

  const groups: { label: string; items: Item[] }[] = [
    { label: "Overview", items: [{ title: "Dashboard", href: base, icon: LayoutDashboard }] },
    {
      label: "Compliance",
      items: [
        { title: "Controls & checks", href: `${base}/controls`, icon: ListChecks, badge: failing },
        { title: "Integrations", href: `${base}/integrations`, icon: Plug },
        { title: "Evidence", href: `${base}/evidence`, icon: Fingerprint },
      ],
    },
    {
      label: "Trust",
      items: [
        { title: "Policies", href: `${base}/policies`, icon: FileText },
        { title: "Questionnaires", href: `${base}/questionnaires`, icon: ClipboardList, badge: review },
      ],
    },
    {
      label: "vCISO",
      items: [
        { title: "Risk register", href: `${base}/risks`, icon: ShieldAlert },
        { title: "90-day roadmap", href: `${base}/roadmap`, icon: Map },
        { title: "Leadership report", href: `${base}/report`, icon: ChartNoAxesColumn },
        { title: "Timeline", href: `${base}/timeline`, icon: CalendarClock },
      ],
    },
    {
      label: "Audit",
      items: [
        { title: "Auditor export", href: `${base}/export`, icon: FileDown },
        { title: "Audit log", href: `${base}/audit-log`, icon: BookCheck },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarMenu>
              {g.items.map((it) => {
                const active = it.href === base ? pathname === base : pathname.startsWith(it.href);
                return (
                  <SidebarMenuItem key={it.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={it.title}>
                      <Link href={it.href}>
                        <it.icon />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!it.badge && <SidebarMenuBadge className="tabular-nums">{it.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {role !== "auditor" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith(`${base}/settings`)} tooltip="Settings">
                <Link href={`${base}/settings`}>
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <NavUser name={me.user.fullName || me.user.email} email={me.user.email} roleLabel={ROLE_LABEL[role]} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function initials(s: string) {
  return s.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function OrgSwitcher() {
  const { me, orgId, state } = useOrg();
  const { isMobile } = useSidebar();
  const router = useRouter();
  const current = me.organizations.find((o) => o.id === orgId);
  const isVciso = me.organizations.some((o) => o.role === "vciso");
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ShieldCheck className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{current?.name ?? state?.organization.name ?? "…"}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {current?.isDemo ? "Demo tenant" : current?.industry || "Organisation"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-64 rounded-lg" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
            {isVciso && (
              <>
                <DropdownMenuItem onClick={() => router.push("/app/clients")} className="gap-2 p-2">
                  <Users className="size-4" /> All clients
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel className="text-muted-foreground text-xs">Organisations</DropdownMenuLabel>
            {me.organizations.map((o, i) => (
              <DropdownMenuItem key={o.id} onClick={() => router.push(`/app/${o.id}`)} className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5" />
                </div>
                <span className="truncate">{o.name}</span>
                {i < 9 && <DropdownMenuShortcut>⌘{i + 1}</DropdownMenuShortcut>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/app/new")} className="gap-2 p-2">
              <Plus className="size-4" /> Add organisation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function NavUser({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const { isMobile } = useSidebar();
  const { orgId } = useOrg();
  const router = useRouter();
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="text-muted-foreground truncate text-xs">{roleLabel}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
          <DropdownMenuLabel className="font-normal">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-muted-foreground text-xs">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/app/${orgId}/settings?tab=security`)}>
            <FileCheck2 /> Security & MFA
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={async () => {
              await api("/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
