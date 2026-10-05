"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyLogo from "@/components/common/CompanyLogo";
import { jobsApi } from "../services/jobs.api";
import type { MatchedJobItem } from "@/types/chat";

interface JobDetailModalProps {
  jobId: string | null;
  summary?: MatchedJobItem | null;
  onClose: () => void;
  onAskAboutJob?: (jobTitle: string, company: string) => void;
}

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  experience_level?: string | null;
  salary_range?: string | null;
  apply_url?: string | null;
  company_name?: string | null;
  company_logo?: string | null;
}

export default function JobDetailModal({
  jobId,
  summary,
  onClose,
  onAskAboutJob,
}: JobDetailModalProps) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(jobId));
  const [notFound, setNotFound] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [prevJobId, setPrevJobId] = useState(jobId);
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    setDetail(null);
    setNotFound(false);
    setIsLoading(Boolean(jobId));
  }

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    jobsApi
      .getJobDetail(jobId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result as JobDetail);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Job detail fetch failed:", err);
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!jobId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [jobId, handleClose]);

  if (!jobId) return null;

  const title = detail?.title || summary?.title || "Job details";
  const company = detail?.company_name || summary?.company || "Company";
  const matchScore = summary?.match_score ?? 0;
  const requirements = detail?.requirements || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${title}`}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-t-2xl sm:rounded-sm border border-border bg-card shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-start gap-3 min-w-0">
            <CompanyLogo
              src={detail?.company_logo || summary?.logo_url}
              name={company}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {company}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close job details"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading job details
            </div>
          )}

          {!isLoading && notFound && (
            <div className="flex items-start gap-2.5 rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">This job is no longer available</p>
                <p className="leading-relaxed">
                  It may have been closed, removed, or filled. Close this panel
                  and try another role.
                </p>
              </div>
            </div>
          )}

          {!isLoading && detail && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {detail.location || summary?.location || "Location not stated"}
                </span>
                {summary?.job_type && <span>{summary.job_type}</span>}
                {(detail.salary_range || summary?.salary_range) && (
                  <span className="inline-flex items-center gap-1 text-slush-mint font-medium">
                    <DollarSign className="w-3.5 h-3.5" />
                    {detail.salary_range || summary?.salary_range}
                  </span>
                )}
                {matchScore > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    <Briefcase className="w-3 h-3" />
                    {matchScore} / 100 Match
                  </span>
                )}
              </div>

              {summary?.reason && (
                <div className="rounded-sm border border-border/60 bg-secondary/30 p-3 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Match assessment
                  </span>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {summary.reason}
                  </p>
                </div>
              )}

              {summary?.missing_skills && summary.missing_skills.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Potential gaps
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {summary.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/70 text-muted-foreground border border-border/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Role
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {detail.description}
                  </p>
                </div>
              )}

              {requirements.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-foreground">
                    Requirements
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                    {requirements.map((req) => (
                      <li key={req} className="leading-relaxed">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                {detail.apply_url && (
                  <a
                    href={detail.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Apply on company site
                  </a>
                )}
                {onAskAboutJob && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAskAboutJob(title, company);
                      handleClose();
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Ask Finder
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
