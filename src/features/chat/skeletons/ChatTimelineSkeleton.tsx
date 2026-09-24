"use client";

import React from "react";

export default function ChatTimelineSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* 1. Assistant Message Skeleton */}
      <div className="flex gap-3 sm:gap-4 items-start">
        {/* Avatar Placeholder */}
        <div className="w-8 h-8 rounded-lg bg-secondary/80 shrink-0" />

        <div className="space-y-3 flex-1 max-w-[85%]">
          <div className="h-3.5 w-24 bg-secondary/80 rounded" />
          <div className="space-y-2 pt-1">
            <div className="h-4 w-11/12 bg-secondary/60 rounded" />
            <div className="h-4 w-full bg-secondary/50 rounded" />
            <div className="h-4 w-4/5 bg-secondary/40 rounded" />
          </div>
        </div>
      </div>

      {/* 2. User Message Skeleton (Right Aligned) */}
      <div className="flex justify-end">
        <div className="max-w-[75%] space-y-2">
          <div className="p-4 rounded-2xl rounded-tr-sm bg-secondary/50 space-y-2">
            <div className="h-3.5 w-48 bg-secondary/70 rounded" />
            <div className="h-3.5 w-32 bg-secondary/60 rounded" />
          </div>
        </div>
      </div>

      {/* 3. Follow-up Assistant Skeleton */}
      <div className="flex gap-3 sm:gap-4 items-start">
        <div className="w-8 h-8 rounded-lg bg-secondary/80 shrink-0" />

        <div className="space-y-3 flex-1 max-w-[85%]">
          <div className="h-3.5 w-20 bg-secondary/80 rounded" />
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full bg-secondary/60 rounded" />
            <div className="h-4 w-5/6 bg-secondary/50 rounded" />
            <div className="h-4 w-2/3 bg-secondary/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
