"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  ArrowRight,
  MessageSquare,
  Layers,
} from "lucide-react";
import CompanyLogo from "@/components/common/CompanyLogo";
import { MatchedJobItem } from "@/types/chat";

interface JobMatchCarouselProps {
  jobs: MatchedJobItem[];
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

function getScoreBadge(score: number) {
  const isHighMatch = score >= 80;
  const isMediumMatch = score >= 65 && score < 80;

  const badgeColor = isHighMatch
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : isMediumMatch
      ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 font-sans ${badgeColor}`}
    >
      {score} / 100 Match
    </span>
  );
}

function renderPotentialGaps(missingSkills?: string[] | null) {
  if (!missingSkills || missingSkills.length === 0) return null;

  return (
    <div className="space-y-1 pt-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Potential gaps
      </span>
      <div className="flex flex-wrap gap-1">
        {missingSkills.map((skill, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/70 text-muted-foreground border border-border/50"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function JobMatchCarousel({
  jobs,
  onAskAboutJob,
}: JobMatchCarouselProps) {
  if (!jobs || jobs.length === 0) return null;

  const topJob = jobs[0];
  const otherJobs = jobs.slice(1);

  return (
    <div className="w-full my-5 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span>Top Matching Opportunities</span>
        </h4>
        <span className="text-[11px] text-muted-foreground font-sans">
          {jobs.length} Curated Matches
        </span>
      </div>

      {/* 1. Hero Card: Top Recommended Match */}
      {topJob && (
        <div className="rounded-xl border border-primary/25 bg-card/60 p-4 sm:p-5 space-y-3.5 shadow-2xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <CompanyLogo
                src={topJob.logo_url}
                name={topJob.company}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    Top Recommendation
                  </span>
                </div>
                <h5 className="text-base font-semibold text-foreground mt-1">
                  {topJob.title}
                </h5>
                <p className="text-xs text-muted-foreground font-medium">
                  {topJob.company}
                </p>
              </div>
            </div>
            {getScoreBadge(topJob.match_score)}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {topJob.location || "Remote"}
            </span>
            <span>•</span>
            <span>{topJob.job_type || "Full-time"}</span>
            {topJob.salary_range && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-foreground/80 font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  {topJob.salary_range}
                </span>
              </>
            )}
          </div>

          {/* AI Match Reason: Full Natural Auto-Height */}
          {topJob.reason && (
            <div className="p-3 bg-secondary/35 border border-border/50 rounded-lg space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Match Assessment
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                {topJob.reason}
              </p>
            </div>
          )}

          {/* Potential Gaps: Neutral Chips */}
          {renderPotentialGaps(topJob.missing_skills)}

          {/* Action Row */}
          <div className="pt-2.5 border-t border-border/40 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onAskAboutJob?.(topJob.title, topJob.company)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Ask Copilot about this role</span>
            </button>

            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Native Horizontal Scroll Strip: Other Relevant Matches */}
      {otherJobs.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Other Relevant Positions ({otherJobs.length})</span>
            </span>
            <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
              Scroll horizontally to explore →
            </span>
          </div>

          {/* Native CSS Horizontal Scroll (Zero Complex JS) */}
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2.5 pt-0.5 -mx-1 px-1">
            {otherJobs.map((job) => (
              <div
                key={job.id || job.job_id}
                className="w-[285px] sm:w-[315px] shrink-0 snap-start flex flex-col justify-between p-3.5 rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-border transition-all duration-200 shadow-2xs"
              >
                <div className="space-y-2.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <CompanyLogo
                        src={job.logo_url}
                        name={job.company}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-foreground truncate">
                          {job.company}
                        </h5>
                        <p className="text-xs text-primary font-medium truncate">
                          {job.title}
                        </p>
                      </div>
                    </div>
                    {getScoreBadge(job.match_score)}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {job.location || "Remote"}
                    </span>
                    <span>•</span>
                    <span>{job.job_type || "Full-time"}</span>
                    {job.salary_range && (
                      <>
                        <span>•</span>
                        <span className="text-foreground/80 font-medium">
                          {job.salary_range}
                        </span>
                      </>
                    )}
                  </div>

                  {/* AI Reason (Auto-Height, No Clamping) */}
                  {job.reason && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/30 p-2 rounded-lg font-sans">
                      {job.reason}
                    </p>
                  )}

                  {/* Potential Gaps (Neutral Chips) */}
                  {renderPotentialGaps(job.missing_skills)}
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onAskAboutJob?.(job.title, job.company)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-primary" />
                    <span>Ask Copilot</span>
                  </button>

                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
