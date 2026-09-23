"use client";

import React from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarNavigation from "./SidebarNavigation";
import SidebarFooter from "./SidebarFooter";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Sidebar() {
  const { collapsed, closeSidebar } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`
          h-screen flex flex-col bg-sidebar border-r border-border/80 transition-all duration-300 ease-in-out shrink-0
          fixed md:relative inset-y-0 left-0 z-50 md:z-40
          ${
            collapsed
              ? "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:opacity-0 md:overflow-hidden md:pointer-events-none"
              : "translate-x-0 w-[260px] md:w-[260px] shadow-2xl md:shadow-none opacity-100"
          }
        `}
      >
        <div className="w-[260px] h-full flex flex-col overflow-hidden">
          <SidebarHeader collapsed={collapsed} />
          <SidebarNavigation collapsed={collapsed} />
          <SidebarFooter collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
