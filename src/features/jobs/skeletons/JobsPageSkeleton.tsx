import React from "react";

export default function JobPageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-9 w-64 bg-secondary rounded-[6px]" />
        <div className="h-4 w-96 bg-secondary/80 rounded-[6px]" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-card/50 border border-border rounded-[6px] p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-secondary rounded-[6px] shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-secondary rounded" />
              <div className="h-6 w-24 bg-secondary rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-border bg-card/50 rounded-[6px] p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-10 bg-secondary/50 rounded-[6px]" />
          <div className="w-full md:w-48 h-10 bg-secondary/50 rounded-[6px]" />
        </div>
        <div className="h-8 bg-secondary/30 rounded-[6px] w-3/4 pt-3 border-t border-border/40" />
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-border bg-card/50 rounded-[6px] p-5 flex flex-col md:flex-row gap-5 items-start justify-between"
          >
            <div className="space-y-4 flex-1 w-full">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-secondary rounded-[6px] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-48 bg-secondary rounded" />
                    <div className="h-5 w-24 bg-secondary/80 rounded" />
                  </div>
                  <div className="h-4 w-32 bg-secondary rounded" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-secondary rounded" />
                <div className="h-4 w-24 bg-secondary rounded" />
              </div>
              <div className="h-16 bg-secondary/20 rounded-[6px] w-full" />
            </div>
            <div className="w-full md:w-32 h-10 bg-secondary rounded-[6px] shrink-0 self-stretch md:self-center" />
          </div>
        ))}
      </div>
    </div>
  );
}
