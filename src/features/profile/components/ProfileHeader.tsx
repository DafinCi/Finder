"use client";

import React from "react";
import Link from "next/link";
import { Clock, RotateCcw, BriefcaseBusiness, Briefcase } from "lucide-react";
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

  const isComplete = completenessScore >= 100;

  return (
    <div className={`relative bg-card overflow-hidden ${className}`}>
      {/* Cover Banner with chat wallpaper pattern */}
      <div className="h-24 sm:h-32 w-full chat-wallpaper bg-background relative border-b border-border/70">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80 pointer-events-none" />
      </div>

      <div className="px-4 sm:px-6 pb-5 sm:pb-6">
        {/* Identity and actions */}
        <div className="relative -mt-10 sm:-mt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-1 min-w-0 items-end gap-3 sm:gap-4">
            <UserAvatar
              name={userName}
              seed={user?.email || userName}
              size="2xl"
              className="ring-4 ring-card shadow-md"
            />

            <div className="min-w-0 space-y-1 pb-1">
              <h1 className="text-lg sm:text-xl font-bold font-heading text-foreground">
                {userName}
              </h1>

              {primaryRoleTitle && (
                <p className="text-sm font-semibold text-foreground break-words">
                  {primaryRoleTitle}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {userEmail && <span className="break-all">{userEmail}</span>}
                {profile?.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active Profile
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Draft Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Link href="/jobs" className="flex-1 sm:flex-none">
              <Button
                size="sm"
                className="w-full min-h-[44px] h-11 sm:h-9 gap-1.5 focus-visible:ring-2 focus-visible:ring-muted-foreground rounded-sm cursor-pointer"
              >
                <BriefcaseBusiness className="w-3.5 h-3.5" />
                <span>Explore Jobs</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing || isMutating}
              className="min-h-[44px] h-11 sm:min-h-[36px] sm:h-9 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-muted-foreground rounded-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title="Reload latest profile data"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="mt-5 pt-4 border-t border-border/80 space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-foreground">
              Profile Completeness
            </span>
            <span className="font-mono font-bold text-foreground">
              {completenessScore}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Profile completeness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completenessScore}
            className="w-full h-2 rounded-sm bg-secondary/80 overflow-hidden"
          >
            <div
              className={`h-full transition-all duration-500 rounded-sm ${
                isComplete ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
              style={{ width: `${completenessScore}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
            <span>
              Based on your career goals, skills, preferences, and background.
            </span>
            <span className="inline-flex items-center gap-1.5 sm:shrink-0">
              <Clock className="w-3 h-3" />
              Last updated: {formattedUpdated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
