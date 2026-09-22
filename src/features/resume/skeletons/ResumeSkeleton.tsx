import React from "react";

export default function ResumeSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Skeleton AI Confidence */}
      <div className="h-20 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />

      {/* Skeleton Header */}
      <div className="border-b border-border pb-4 flex justify-between items-end">
        <div className="space-y-3 w-full">
          <div className="h-8 w-64 bg-muted rounded-[6px] animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded-[6px] animate-pulse" />
        </div>
        <div className="hidden sm:block h-8 w-24 bg-muted rounded-[6px] animate-pulse" />
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left */}
        <div className="md:col-span-2 space-y-6">
          <div className="h-40 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />
          <div className="h-32 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="h-48 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />
          <div className="h-40 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />
          <div className="h-40 w-full rounded-[6px] bg-card/50 border border-border animate-pulse" />
        </div>
      </div>

      {/* Skeleton CTA */}
      <div className="h-24 w-full rounded-[6px] bg-card/50 border border-border animate-pulse mt-8" />
    </div>
  );
}
