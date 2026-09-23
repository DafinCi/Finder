"use client";

import React from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarFooter from "./SidebarFooter";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`
        relative h-screen flex flex-col bg-sidebar border-r border-border/80 transition-all duration-300 ease-in-out z-40 shrink-0
        ${collapsed ? "w-0 border-r-0 opacity-0 overflow-hidden pointer-events-none" : "w-[260px] opacity-100"}
      `}
    >
      <div className="w-[260px] h-full flex flex-col overflow-hidden">
        <SidebarHeader collapsed={collapsed} />
        <SidebarNavigation collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </div>
    </aside>
  );
}
