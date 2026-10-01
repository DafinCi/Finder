"use client";

import React from "react";
import { useSidebar } from "@/contexts/SidebarContext";

export interface AppHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export default function AppHeader({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: AppHeaderProps) {
  const { collapsed } = useSidebar();

  return (
    <header
      className={`h-16 border-b border-border/80 bg-sidebar flex items-center justify-between shrink-0 select-none z-20 px-4 md:px-6 transition-colors ${
        collapsed ? "pl-14 md:pl-6" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {typeof title === "string" ? (
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate leading-tight">
                {title}
              </h1>
            ) : (
              title
            )}
            {badge}
          </div>
          {subtitle && (
            <span className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {children}
        </div>
      )}
    </header>
  );
}
