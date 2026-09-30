"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, BriefcaseBusiness, User } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar, collapsed } = useSidebar();

  const isHomeActive = pathname === "/c" || pathname === "/";
  const isJobsActive = pathname === "/jobs";
  const isProfileActive = pathname === "/profile";
  const isChatsActive = pathname.startsWith("/c/") || !collapsed;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 border-t border-border/80 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
    >
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto items-center px-1">
        {/* 1. Home / New Chat */}
        <Link
          href="/c"
          aria-current={isHomeActive ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            isHomeActive
              ? "text-slush-lavender font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] leading-none">Home</span>
        </Link>

        {/* 2. Chats / History Drawer Trigger */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed ? "Open chat conversations" : "Close chat conversations"
          }
          aria-expanded={!collapsed}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            isChatsActive
              ? "text-slush-lavender font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] leading-none">Chats</span>
        </button>

        {/* 3. Jobs Recommendation */}
        <Link
          href="/jobs"
          aria-current={isJobsActive ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            isJobsActive
              ? "text-slush-lavender font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BriefcaseBusiness className="w-4 h-4" />
          <span className="text-[10px] leading-none">Jobs</span>
        </Link>

        {/* 4. Career Profile */}
        <Link
          href="/profile"
          aria-current={isProfileActive ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl transition-colors cursor-pointer ${
            isProfileActive
              ? "text-slush-lavender font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px] leading-none">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
