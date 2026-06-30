"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Eye, FilePenLine, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminTab } from "../_lib/types";

type AdminSidebarProps = {
  activeTab: AdminTab;
  adminName: string;
  signingOut: boolean;
  onSelectTab: (tab: AdminTab) => void;
  onSignOut: () => void;
};

export function AdminSidebar({
  activeTab,
  adminName,
  signingOut,
  onSelectTab,
  onSignOut,
}: AdminSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar/95">
        <div className="flex min-w-0 items-start justify-between gap-3 p-2 group-data-[collapsible=icon]:justify-center">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm text-sidebar-foreground/60">
              {adminName}
            </p>
            <h1 className="truncate text-xl font-semibold tracking-normal text-sidebar-foreground">
              Survey dashboard
            </h1>
          </div>
          <SidebarTrigger className="mx-auto shrink-0 text-sidebar-foreground" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNavItem
                active={activeTab === "edit"}
                icon={<FilePenLine />}
                label="edit form"
                onClick={() => onSelectTab("edit")}
              />
              <SidebarNavItem
                active={activeTab === "submissions"}
                icon={<Eye />}
                label="view submission"
                onClick={() => onSelectTab("submissions")}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="sign out"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? <Spinner /> : <LogOut />}
            <span>sign out</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function SidebarNavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        isActive={active}
        tooltip={label}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
