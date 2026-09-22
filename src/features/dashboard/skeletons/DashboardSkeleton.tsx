import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="flex justify-between items-end pb-6 border-b border-border/60">
        <div className="space-y-3">
          <div className="h-4 w-40 bg-secondary rounded-[6px]" />
          <div className="h-9 w-72 bg-secondary rounded-[6px]" />
        </div>
        <div className="h-8 w-44 bg-secondary rounded-[6px] hidden md:block" />
      </div>

      <div className="h-60 border border-border bg-card/50 rounded-[6px] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4 w-full">
          <div className="h-6 w-32 bg-secondary rounded-[6px]" />
          <div className="h-8 w-80 bg-secondary rounded-[6px]" />
          <div className="h-4 w-full bg-secondary/60 rounded-[6px]" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-44 bg-secondary rounded-[6px]" />
            <div className="h-10 w-40 bg-secondary rounded-[6px]" />
          </div>
        </div>
        <div className="h-40 w-full md:w-48 bg-secondary/50 rounded-[6px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 border border-border bg-card/50 rounded-[6px] p-5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-secondary rounded-[6px]" />
              <div className="h-5 w-5 bg-secondary rounded-[6px]" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-20 bg-secondary rounded-[6px]" />
              <div className="h-4 w-full bg-secondary/60 rounded-[6px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-52 border border-border bg-card/50 rounded-[6px] p-8 space-y-6">
        <div className="h-6 w-48 bg-secondary rounded-[6px]" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-secondary/60 rounded-[6px]" />
          <div className="h-4 w-5/6 bg-secondary/60 rounded-[6px]" />
          <div className="h-4 w-4/6 bg-secondary/60 rounded-[6px]" />
        </div>
      </div>
    </div>
  );
}
