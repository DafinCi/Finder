"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  BriefcaseBusiness,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/UserAvatar";
import { CareerProfile } from "../types/career-profile.types";

interface ProfileHeaderProps {
  user: any;
  profile: CareerProfile | null;
  completenessScore: number;
  isRefreshing?: boolean;
  isMutating: boolean;
  onRefresh: () => void;
  className?: string;
}

export function ProfileHeader({
  user,
  profile,
  completenessScore,
  isRefreshing = false,
  isMutating,
  onRefresh,
  className = "",
}: ProfileHeaderProps) {
  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Candidate");
  const userEmail = user?.email || "";

  const formattedUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently created";

  const primaryRoleTitle =
    profile?.careerIntent?.target_roles?.find((r) => r.priority === "primary")
      ?.role || profile?.careerIntent?.target_roles?.[0]?.role;

  const isOptimal = completenessScore >= 80;

  return (
    <div className={`relative bg-card overflow-hidden ${className}`}>
      {/* Cover Banner with chat wallpaper pattern */}
      <div className="h-28 sm:h-36 w-full chat-wallpaper bg-background relative border-b border-border/70">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 pointer-events-none" />
      </div>

      {/* Centered Identity Info */}
      <div className="px-6 pb-6 pt-0 flex flex-col items-center text-center -mt-12 sm:-mt-14 relative">
        {/* Centered User Avatar */}
        <div className="relative mb-3">
          <UserAvatar
            name={userName}
            seed={user?.email || userName}
            size="2xl"
            className="ring-4 ring-card shadow-md"
          />
        </div>

        {/* User Name & Status */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
              {userName}
            </h1>
            {profile?.status === "active" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Profile
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Draft Mode
              </span>
            )}
          </div>

          {/* Primary Target Role Title */}
          {primaryRoleTitle && (
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>{primaryRoleTitle}</span>
            </div>
          )}

          {/* Email & Last Updated */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{userEmail}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last updated: {formattedUpdated}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing || isMutating}
            className="text-xs min-h-[44px] sm:min-h-[36px] h-10 sm:h-9 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Reload latest profile data"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>

          <Link href="/jobs">
            <Button
              size="sm"
              className="text-xs min-h-[44px] sm:min-h-[36px] h-10 sm:h-9 gap-1.5 focus-visible:ring-2 focus-visible:ring-primary rounded-sm cursor-pointer"
            >
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              <span>Explore Jobs</span>
            </Button>
          </Link>
        </div>

        {/* Profile Completeness Bar */}
        <div className="w-full max-w-xl mt-6 pt-5 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-1.5 flex-1 w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">
                Profile Completeness
              </span>
              <span className="font-mono font-bold text-primary">
                {completenessScore}%
              </span>
            </div>

            <div className="w-full h-2 rounded-sm bg-secondary/80 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-sm ${
                  isOptimal
                    ? "bg-emerald-500"
                    : completenessScore >= 50
                      ? "bg-primary"
                      : "bg-amber-500"
                }`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs shrink-0 self-start sm:self-center">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isOptimal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-medium ${
                isOptimal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
            >
              {isOptimal ? "Profile Complete" : "Setup in Progress"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
