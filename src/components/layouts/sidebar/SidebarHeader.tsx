"use client";

import React from "react";
import Link from "next/link";
import { Terminal } from "lucide-react";

export default function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`h-[72px] flex items-center border-b border-border px-6 ${collapsed ? "justify-center" : "justify-start gap-3"}`}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="p-1.5 bg-primary text-primary-foreground rounded-[6px]">
          <Terminal className="w-4 h-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-heading font-bold tracking-tight text-foreground">
              Finder
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest mt-0.5 uppercase">
              Intelligence
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}
