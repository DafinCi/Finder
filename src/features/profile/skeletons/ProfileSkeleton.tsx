import React from "react";

// 1. Hero Skeleton
export function ProfileHeroSkeleton() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-pulse">
      <div className="flex items-center gap-5 w-full">
        {/* Avatar Placeholder */}
        <div className="w-20 h-20 rounded-xl bg-secondary/80 shrink-0" />

        <div className="space-y-3 w-full max-w-md">
          <div className="flex items-center gap-3">
            {/* Name */}
            <div className="h-8 w-48 bg-secondary/80 rounded-[6px]" />
            {/* Badge */}
            <div className="h-5 w-24 bg-emerald-500/10 rounded-full" />
          </div>
          {/* Title */}
          <div className="h-5 w-36 bg-secondary/80 rounded-[6px]" />
          {/* Metadata */}
          <div className="flex gap-4 pt-1">
            <div className="h-4 w-28 bg-secondary/50 rounded" />
            <div className="h-4 w-32 bg-secondary/50 rounded" />
          </div>
        </div>
      </div>
      {/* Share Button */}
      <div className="h-10 w-full md:w-32 bg-secondary/80 rounded-[6px] shrink-0" />
    </div>
  );
}

// 2. Stats Grid Skeleton
export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border border-border/60 bg-secondary/10 rounded-xl animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2 py-1">
          <div className="h-3 w-16 md:w-24 bg-secondary/50 rounded mx-auto md:mx-0" />
          <div className="h-7 w-12 md:w-20 bg-secondary/80 rounded mx-auto md:mx-0" />
        </div>
      ))}
    </div>
  );
}

// 3. Section Text Skeleton (Summary)
export function CareerSummarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <div className="h-6 w-40 bg-secondary/80 rounded-[6px]" />
        <div className="h-4 w-20 bg-secondary/50 rounded" />
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-full bg-secondary/60 rounded" />
        <div className="h-4 w-11/12 bg-secondary/60 rounded" />
        <div className="h-4 w-4/5 bg-secondary/60 rounded" />
      </div>
    </div>
  );
}

// 4. Skills Block Skeleton
export function SkillSectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="border-b border-border pb-3">
        <div className="h-6 w-48 bg-secondary/80 rounded-[6px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Core Tech Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-secondary/70 rounded" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-primary/10 rounded-[6px]" />
            ))}
          </div>
        </div>
        {/* Supporting Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-36 bg-secondary/70 rounded" />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-secondary/80 rounded-[6px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Experience List Skeleton
export function ExperienceSectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="border-b border-border pb-3">
        <div className="h-6 w-44 bg-secondary/80 rounded-[6px]" />
      </div>
      <div className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-secondary/80 rounded" />
                <div className="h-4 w-28 bg-secondary/60 rounded" />
              </div>
              <div className="h-4 w-24 bg-secondary/50 rounded" />
            </div>
            <div className="space-y-2 pl-4">
              <div className="h-3.5 w-full bg-secondary/50 rounded" />
              <div className="h-3.5 w-11/12 bg-secondary/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Resume Card Skeleton
export function ResumeCardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="border-b border-border pb-3">
        <div className="h-6 w-44 bg-secondary/80 rounded-[6px]" />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border border-border/70 bg-secondary/10 rounded-xl">
        <div className="flex items-center gap-3.5 w-full">
          <div className="w-11 h-11 rounded-[6px] bg-secondary/80 shrink-0" />
          <div className="space-y-2 w-full max-w-xs">
            <div className="h-4 w-32 bg-secondary/80 rounded" />
            <div className="h-3.5 w-24 bg-secondary/50 rounded" />
          </div>
        </div>
        <div className="h-10 w-full md:w-36 bg-secondary/85 rounded-[6px] mt-4 md:mt-0 shrink-0" />
      </div>
    </div>
  );
}

// Master Orchestrator for full page loading
export default function ProfileSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <ProfileHeroSkeleton />
      <ProfileStatsSkeleton />
      <hr className="border-border/60" />
      <CareerSummarySkeleton />
      <SkillSectionSkeleton />
      <ExperienceSectionSkeleton />
      <ResumeCardSkeleton />
    </div>
  );
}
