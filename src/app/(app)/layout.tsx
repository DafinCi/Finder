import React, { ReactNode } from "react";
import AppShell from "@/components/layouts/AppShell";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AgentProvider } from "@/contexts/AgentContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AgentProvider>
        <AppShell>{children}</AppShell>
      </AgentProvider>
    </SidebarProvider>
  );
}
