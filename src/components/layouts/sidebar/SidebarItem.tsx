"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

export interface SidebarItemData {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

export default function SidebarItem({
  item,
  collapsed,
}: {
  item: SidebarItemData;
  collapsed: boolean;
}) {
  const pathname = usePathname() || "";
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={`
        relative flex items-center rounded-[6px] px-3 py-2.5 transition-all duration-150 group
        ${collapsed ? "justify-center" : "gap-3"}
        ${
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        }
      `}
    >
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary" />
      )}

      <Icon
        className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"}`}
      />

      {!collapsed && (
        <span className="text-[14px] font-sans leading-none">{item.title}</span>
      )}

      {!collapsed && item.badge && (
        <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-semibold leading-none">
          {item.badge}
        </span>
      )}

      {collapsed && (
        <div className="absolute left-14 scale-0 rounded-md border border-border bg-card/50 px-2 py-1 text-[11px] text-foreground transition-all duration-150 group-hover:scale-100 z-50 whitespace-nowrap shadow-md">
          {item.title}
        </div>
      )}
    </Link>
  );
}
