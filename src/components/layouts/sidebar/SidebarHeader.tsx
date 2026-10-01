"use client";

import React from "react";
import Link from "next/link";
import { PanelLeftClose } from "lucide-react";
import Logo from "@/components/common/Logo";
import { useSidebar } from "@/contexts/SidebarContext";

export default function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  const { toggleSidebar } = useSidebar();

  if (collapsed) {
    return null;
  }

  return (
    <div className="h-16 flex items-center justify-between border-b border-border/60 px-4 shrink-0">
      <Link href="/" className="flex items-center gap-2.5 group">
        <Logo size={30} alt="" />
        <div className="flex flex-col leading-none">
          <span className="text-[20px] font-heading font-bold tracking-tight text-foreground">
            Finder
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={toggleSidebar}
        title="Close sidebar"
        aria-label="Close sidebar"
        className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer md:hidden"
      >
        <PanelLeftClose className="w-4 h-4" />
      </button>
    </div>
  );
}
