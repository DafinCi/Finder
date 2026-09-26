"use client";

import React from "react";
import Link from "next/link";
import { PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export default function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  const { toggleSidebar } = useSidebar();

  if (collapsed) {
    return null;
  }

  return (
    <div className="h-14 flex items-center justify-between border-b border-border/60 px-4 shrink-0">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="p-1.5 bg-primary text-primary-foreground rounded-lg shadow-xs transition-transform group-hover:scale-105"></div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-heading font-bold tracking-tight text-foreground">
            Finder
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest mt-0.5 uppercase font-medium">
            Career Copilot
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={toggleSidebar}
        title="Close sidebar"
        aria-label="Close sidebar"
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  );
}
