"use client";

import React, { ReactNode } from "react";
import Sidebar from "./sidebar/Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { PanelLeftOpen } from "lucide-react";

export default function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />

      <main className="flex-1 h-screen flex flex-col overflow-hidden p-0 w-full relative">
        {/* Floating Open Sidebar Button when collapsed */}
        {collapsed && (
          <div className="absolute top-2.5 left-3 z-50 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Open sidebar"
              className="p-2 rounded-lg bg-card/90 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-xs backdrop-blur-sm transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
