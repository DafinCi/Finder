import React from "react";
import AppHeader from "@/components/layouts/AppHeader";

export function ProfilePageSkeleton() {
  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      <AppHeader title="Profile" />

      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto w-full space-y-6 animate-pulse">
          {/* Document Sheet Skeleton */}
          <div className="rounded-sm border border-border bg-card overflow-hidden">
            {/* Banner Skeleton */}
            <div className="h-28 sm:h-36 w-full bg-secondary/50" />

            {/* Profile Info */}
            <div className="px-6 pb-6 pt-0 text-center relative -mt-12 sm:-mt-14 space-y-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary mx-auto border-4 border-card" />
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="h-6 w-36 bg-secondary rounded-sm mx-auto" />
                <div className="h-4 w-48 bg-secondary/70 rounded-sm mx-auto" />
              </div>
            </div>

            {/* Nav Skeleton */}
            <div className="border-y border-border/80 px-6 py-2.5 flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-28 bg-secondary/60 rounded-sm" />
              ))}
            </div>

            {/* Content Sections Skeleton */}
            <div className="divide-y divide-border/60">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 space-y-3">
                  <div className="h-5 w-36 bg-secondary rounded-sm" />
                  <div className="h-4 w-72 bg-secondary/60 rounded-sm" />
                  <div className="h-16 w-full bg-secondary/30 rounded-sm mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
