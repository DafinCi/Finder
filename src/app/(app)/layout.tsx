import React, { ReactNode } from "react";
import AppShell from "@/components/layouts/AppShell";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShell>{children}</AppShell>
    </SidebarProvider>
  );
}
