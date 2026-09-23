"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useJobs } from "../hooks/useJobs";
import JobSummary from "../components/JobSummary";
import JobCard from "../components/JobCard";
import JobsPageSkeleton from "../skeletons/JobsPageSkeleton";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  X,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { FormattedJobMatch } from "../services/jobs.api";

export default function JobsView() {
  const {
    matches,
    allMatches,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedMatchLevel,
    setSelectedMatchLevel,
    selectedExperience,
    setSelectedExperience,
    selectedLocation,
    setSelectedLocation,
    uniqueLocations,
    hasActiveFilters,
    resetFilters,
    stats,
    refresh,
  } = useJobs();

  const [selectedJob, setSelectedJob] = useState<FormattedJobMatch | null>(
    null,
  );
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const handleOpenDrawer = (job: FormattedJobMatch) => {
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    setSelectedJob(job);
  };

  const handleCloseDrawer = useCallback(() => {
    setSelectedJob(null);
    requestAnimationFrame(() => {
      triggerElementRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!selectedJob) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseDrawer();
        return;
      }

      if (e.key === "Tab") {
        const container = drawerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === container
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        drawerRef.current?.focus();
      }
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedJob, handleCloseDrawer]);

  const handleApply = (job: FormattedJobMatch) => {
    const targetUrl = job.applyUrl || job.companyWebsite;
    if (targetUrl) {
      const formattedUrl = targetUrl.startsWith("http")
        ? targetUrl
        : `https://${targetUrl}`;
      toast.success("Opening company application portal...", {
        description: `Redirecting to ${job.companyName || "the employer"} portal.`,
      });
      window.open(formattedUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.info("Application portal link not provided", {
        description:
          "Direct application URL is not specified for this listing. Please check the employer's official website.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex-1 overflow-y-auto bg-background text-foreground py-10 px-4 scrollbar-thin">
        <JobsPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex-1 overflow-y-auto bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/20 bg-destructive/10 rounded-xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-destructive">
              Failed to Load Recommendations
            </h3>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer mx-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 overflow-y-auto bg-background text-foreground pb-20 relative scrollbar-thin">
      <div className="max-w-5xl mx-auto pt-10 pb-8 px-4 space-y-7">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            Recommended Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            AI-driven career opportunities custom-matched to your resume
            profile.
          </p>
        </div>

        {/* Stats summary */}
        <JobSummary stats={stats} />

        {/* Search & Filter Toolbar */}
        <div className="border border-border/80 bg-card/60 backdrop-blur-xs rounded-xl p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/40 border border-border/80 rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedMatchLevel}
                onChange={(e) => setSelectedMatchLevel(e.target.value)}
                className="w-full bg-secondary/40 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="all">All Match Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="strong">Strong (75%-89%)</option>
                <option value="good">Good (60%-74%)</option>
                <option value="potential">Potential (&lt;60%)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="bg-secondary/40 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Experience Levels</option>
              <option value="junior">Junior Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-secondary/40 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer capitalize"
            >
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "all" ? "All Locations" : loc}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] text-primary hover:underline font-medium ml-auto flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Job Cards Stream */}
        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <JobCard
                key={match.matchId}
                match={match}
                onSelect={handleOpenDrawer}
              />
            ))
          ) : allMatches.length > 0 ? (
            <div className="border border-border bg-card/60 rounded-xl p-10 text-center space-y-3.5">
              <p className="text-base font-semibold text-foreground">
                No roles match your active filters
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Try loosening your experience level, match score, or search
                query to see more recommended opportunities.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary text-foreground border border-border text-xs font-medium hover:bg-secondary/80 transition-colors cursor-pointer mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            </div>
          ) : (
            <div className="border border-border bg-card/60 rounded-xl p-12 text-center space-y-4">
              <p className="text-base font-semibold text-foreground">
                No personalized opportunities yet
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Upload your CV in the AI Career Copilot to unlock real-time
                match scores and tailored job recommendations.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Go to Career Copilot</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Solid Detail Drawer (Accessible WAI-ARIA Dialog) */}
      {selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-drawer-title"
          aria-describedby="job-drawer-desc"
          className="relative z-50"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-xs z-40 transition-opacity duration-300"
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />

          <div
            ref={drawerRef}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border z-50 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 focus:outline-none"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-tight">
                <span>AI Deep Matching Analysis</span>
              </div>
              <button
                type="button"
                onClick={handleCloseDrawer}
                aria-label="Close job details"
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 scrollbar-thin">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id="job-drawer-title"
                    className="text-lg font-bold font-heading text-foreground leading-tight"
                  >
                    {selectedJob.title}
                  </h2>
                  <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                    {selectedJob.matchScore}% Match
                  </span>
                </div>
                <p
                  id="job-drawer-desc"
                  className="text-sm font-medium text-muted-foreground"
                >
                  {selectedJob.companyName}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedJob.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {selectedJob.experienceLevel || "Mid Level"}
                  </span>
                </div>
              </div>

              {/* Fit Insights */}
              <div className="border border-border/80 bg-secondary/30 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Why This Job Fits:</span>
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                  {selectedJob.reason}
                </p>
              </div>

              {/* Skill Gap */}
              {selectedJob.missingSkills &&
                selectedJob.missingSkills.length > 0 && (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Identified Skills Gap:</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                      Target requirements mention{" "}
                      <span className="font-semibold text-foreground">
                        {selectedJob.missingSkills.join(", ")}
                      </span>
                      . Preparing these areas will boost your interview
                      readiness.
                    </p>
                  </div>
                )}

              {/* Job Details */}
              <div className="space-y-4 pt-3 border-t border-border/60">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold font-heading text-foreground uppercase tracking-wider">
                    Job Description
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line font-sans">
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-semibold font-heading text-foreground uppercase tracking-wider">
                    Core Requirements
                  </h4>
                  {selectedJob.requirements &&
                  selectedJob.requirements.length > 0 ? (
                    <ul className="space-y-1.5">
                      {selectedJob.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground font-sans">
                      Not specified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-border/80 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => handleApply(selectedJob)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity cursor-pointer shadow-xs"
              >
                <span>Apply Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="px-4 py-2.5 border border-border/80 bg-secondary/60 rounded-lg text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
