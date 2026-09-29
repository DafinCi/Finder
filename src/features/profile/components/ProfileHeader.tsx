// ==============================================================================
// COMPONENT: ProfileHeader
// Module: @/features/profile/components/ProfileHeader
// ==============================================================================

"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  RotateCcw,
  BriefcaseBusiness,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareerProfile } from "../types/career-profile.types";

interface ProfileHeaderProps {
  user: any;
  profile: CareerProfile | null;
  completenessScore: number;
  isMutating: boolean;
  onRefresh: () => void;
}

export function ProfileHeader({
  user,
  profile,
  completenessScore,
  isMutating,
  onRefresh,
}: ProfileHeaderProps) {
  const userName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "Kandidat");
  const userEmail = user?.email || "";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedUpdated = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Baru dibuat";

  const isOptimal = completenessScore >= 80;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* User Identity info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center font-bold text-lg shadow-inner">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-heading text-foreground tracking-tight">
                {userName}
              </h1>
              {profile?.status === "active" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Profile (v{profile.profileVersion})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Draft Mode (v{profile?.profileVersion || 1})
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>{userEmail}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Terakhir diupdate: {formattedUpdated}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Hub Navigation */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isMutating}
            className="text-xs"
            title="Muat ulang data profil terbaru"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isMutating ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link href="/jobs">
            <Button size="sm" className="text-xs gap-1.5">
              <BriefcaseBusiness className="w-3.5 h-3.5" />
              <span>Jobs Feed</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Completeness & Matching Quality Indicator */}
      <div className="pt-4 border-t border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 max-w-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Kelengkapan Profil Pencocokan
            </span>
            <span className="font-mono font-bold text-primary">
              {completenessScore}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
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

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-medium ${
              isOptimal
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isOptimal
              ? "Presisi Pencocokan: Optimal"
              : "Presisi Pencocokan: Standar"}
          </span>
        </div>
      </div>
    </div>
  );
}
