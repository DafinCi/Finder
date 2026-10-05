import React from "react";

export default function JobPageSkeleton() {
  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-border/80 bg-sidebar flex items-center justify-between shrink-0 px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-16 bg-secondary rounded-sm animate-pulse" />
          <div className="h-5 w-8 bg-secondary/80 rounded-sm animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-44 bg-secondary/60 rounded-sm hidden md:block animate-pulse" />
          <div className="h-8 w-16 bg-secondary/60 rounded-sm animate-pulse" />
          <div className="h-8 w-8 bg-secondary/60 rounded-sm animate-pulse" />
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-card border border-border rounded-sm p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-secondary rounded-sm shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-secondary rounded-sm" />
                  <div className="h-6 w-24 bg-secondary rounded-sm" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-border bg-card rounded-sm p-5 flex flex-col md:flex-row gap-5 items-start justify-between"
              >
                <div className="space-y-4 flex-1 w-full">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-secondary rounded-sm shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-48 bg-secondary rounded-sm" />
                        <div className="h-5 w-24 bg-secondary/80 rounded-sm" />
                      </div>
                      <div className="h-4 w-32 bg-secondary rounded-sm" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 w-24 bg-secondary rounded-sm" />
                    <div className="h-4 w-24 bg-secondary rounded-sm" />
                  </div>
                  <div className="h-16 bg-secondary/20 rounded-sm w-full" />
                </div>
                <div className="w-full md:w-32 h-10 bg-secondary rounded-sm shrink-0 self-stretch md:self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
