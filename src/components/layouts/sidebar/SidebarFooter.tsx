"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import UserAvatar from "@/components/ui/UserAvatar";

export default function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { user, handleLogout } = useAuth();

  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "User");

  const isSettingsActive = pathname === "/settings";

  return (
    <div className="p-3 border-t border-border mt-auto">
      {!collapsed ? (
        <div className="flex items-center justify-between gap-2">
          {/* Entire user profile area triggers navigation to /settings */}
          <Link
            href="/settings"
            className={`flex items-center gap-2.5 flex-1 min-w-0 p-1.5 -ml-1 rounded-lg transition-colors cursor-pointer ${
              isSettingsActive
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            }`}
            title="Settings"
          >
            <UserAvatar
              name={userName}
              seed={user?.email || userName}
              size="sm"
              className="shrink-0 ring-1 ring-border/80"
            />
            <div className="flex flex-col leading-tight truncate flex-1 min-w-0">
              <span className="text-[13px] font-medium text-foreground truncate">
                {userName}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                Settings
              </span>
            </div>
          </Link>

          {/* Logout button triggers sign out only */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Sign Out"
            className="p-1.5 rounded-sm border border-border bg-card/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/settings"
            className={`p-1.5 rounded-sm border transition-all cursor-pointer ${
              isSettingsActive
                ? "bg-secondary text-foreground border-border-strong"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border"
            }`}
            title="Settings"
          >
            <UserAvatar
              name={userName}
              seed={user?.email || userName}
              size="xs"
              className="shrink-0"
            />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Sign Out"
            className="p-2 rounded-sm border border-border bg-card/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
