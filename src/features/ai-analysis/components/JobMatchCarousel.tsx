"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  DollarSign,
  ArrowRight,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import CompanyLogo from "@/components/common/CompanyLogo";
import { MatchedJobItem } from "@/types/chat";

interface JobMatchCarouselProps {
  jobs: MatchedJobItem[];
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

export default function JobMatchCarousel({
  jobs,
  onAskAboutJob,
}: JobMatchCarouselProps) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="w-full my-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span>Top Matching Opportunities</span>
        </h4>
        <span className="text-[11px] text-muted-foreground font-sans">
          {jobs.length} Curated Matches
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {jobs.map((job) => {
          const score = job.match_score;
          const isHighMatch = score >= 80;
          const isMediumMatch = score >= 65 && score < 80;

          const badgeColor = isHighMatch
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : isMediumMatch
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20";

          return (
            <div
              key={job.id || job.job_id}
              className="flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-card/40 hover:bg-card/70 hover:border-border transition-all duration-200 shadow-2xs"
            >
              <div className="space-y-2.5">
                {/* Header: Title & Match Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CompanyLogo
                      src={job.logo_url}
                      name={job.company}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <h5 className="text-sm font-semibold text-foreground line-clamp-1">
                        {job.title}
                      </h5>
                      <p className="text-xs text-primary font-medium mt-0.5 truncate">
                        {job.company}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${badgeColor}`}
                  >
                    {score}% Match
                  </span>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  <span>•</span>
                  <span>{job.job_type || "Full-time"}</span>
                  {job.salary_range && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 text-foreground/80 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {job.salary_range}
                      </span>
                    </>
                  )}
                </div>

                {/* AI Matching Reason */}
                {job.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-secondary/30 p-2 rounded-lg font-sans">
                    {job.reason}
                  </p>
                )}

                {/* Missing Skills Tag */}
                {job.missing_skills && job.missing_skills.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      Skills to level up: {job.missing_skills.join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3.5 mt-2 border-t border-border/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onAskAboutJob?.(job.title, job.company)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Ask Copilot</span>
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
          );
        })}
      </div>
    </div>
  );
}
