// ==============================================================================
// COMPONENT: ProfilePageSkeleton
// Module: @/features/profile/components/ProfilePageSkeleton
// ==============================================================================

import React from "react";

export function ProfilePageSkeleton() {
  return (
    <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar">
      <div className="px-6 py-8 max-w-5xl mx-auto w-full space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-secondary rounded" />
              <div className="h-4 w-72 bg-secondary/70 rounded" />
            </div>
          </div>
          <div className="pt-4 border-t border-border/80 space-y-2">
            <div className="h-3 w-40 bg-secondary rounded" />
            <div className="h-2 w-full bg-secondary/60 rounded-full" />
          </div>
        </div>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Intent Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="h-5 w-36 bg-secondary rounded" />
            <div className="h-12 w-full bg-secondary/50 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-28 bg-secondary rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-24 bg-secondary rounded-lg" />
                <div className="h-7 w-28 bg-secondary rounded-lg" />
              </div>
            </div>
          </div>

          {/* Preferences Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="h-5 w-44 bg-secondary rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-secondary rounded-lg" />
              <div className="h-8 w-24 bg-secondary rounded-lg" />
            </div>
            <div className="h-10 w-full bg-secondary/40 rounded-lg" />
          </div>

          {/* Skills Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 md:col-span-2">
            <div className="h-5 w-48 bg-secondary rounded" />
            <div className="h-10 w-full bg-secondary/40 rounded-lg" />
            <div className="flex flex-wrap gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-8 w-28 bg-secondary rounded-lg" />
              ))}
            </div>
          </div>

          {/* Background Card Skeleton */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 md:col-span-2">
            <div className="h-5 w-52 bg-secondary rounded" />
            <div className="space-y-3">
              <div className="h-16 w-full bg-secondary/30 rounded-lg" />
              <div className="h-16 w-full bg-secondary/30 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
