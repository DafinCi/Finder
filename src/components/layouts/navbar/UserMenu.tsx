"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { user, loading, handleLogout, initials } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-[6px] border border-border bg-accent/20 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Sign In
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none group select-none">
        <div className="w-8 h-8 rounded-[6px] bg-secondary border border-border flex items-center justify-center text-foreground text-[12px] font-bold transition-colors duration-150 group-hover:border-muted-foreground/30">
          {initials}
        </div>

        <div className="hidden md:flex flex-col items-start text-left leading-none">
          <span className="text-[13px] font-medium text-foreground truncate max-w-[120px]">
            {user.user_metadata?.full_name ||
              (user.email ? user.email.split("@")[0] : "User")}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 font-sans">
            Candidate
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48 mt-2 rounded-[6px] border border-border bg-card/50 p-1 shadow-none animate-in fade-in slide-in-from-top-1 duration-100 z-50"
      >
        <DropdownMenuLabel className="px-3 py-2 text-[11px] font-sans font-normal text-muted-foreground truncate">
          {user.email}
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground rounded-md cursor-pointer focus:bg-accent focus:text-foreground transition-colors"
        >
          <UserIcon className="w-4 h-4 shrink-0" />
          My Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/profile?tab=settings")}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground rounded-md cursor-pointer focus:bg-accent focus:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive rounded-md cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
