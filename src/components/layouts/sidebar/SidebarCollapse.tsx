"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export default function SidebarCollapse() {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-50 invisible group-hover:visible transition-all duration-200">
      <button
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="
          flex h-6 w-6 items-center justify-center 
          rounded-full border border-border 
          bg-background hover:bg-accent
          text-muted-foreground hover:text-foreground 
          shadow-sm transition-all duration-150
          focus:outline-none
        "
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 animate-in fade-in duration-200" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 animate-in fade-in duration-200" />
        )}
      </button>
    </div>
  );
}
