"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useJobs } from "../hooks/useJobs";
import JobSummary from "../components/JobSummary";
import JobCard from "../components/JobCard";
import RejectReasonModal from "../components/RejectReasonModal";
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
  Bookmark,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  Laptop,
  Brain,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { FormattedJobMatch } from "../services/jobs.api";
import CompanyLogo from "@/components/common/CompanyLogo";

export default function JobsView() {
  const {
    matches,
    allMatches,
    isLoading,
    error,
    requiresOnboarding,
    searchQuery,
    setSearchQuery,
    selectedMatchLevel,
    setSelectedMatchLevel,
    selectedExperience,
    setSelectedExperience,
    selectedLocation,
    setSelectedLocation,
    selectedWorkMode,
    setSelectedWorkMode,
    showSavedOnly,
    setShowSavedOnly,
    uniqueLocations,
    hasActiveFilters,
    resetFilters,
    stats,
    refresh,
    toggleSave,
    rejectJob,
    recordApplyClick,
    recordTelemetry,
  } = useJobs();

  const [selectedJob, setSelectedJob] = useState<FormattedJobMatch | null>(
    null,
  );
  const [rejectingJob, setRejectingJob] = useState<FormattedJobMatch | null>(
    null,
  );

  const triggerElementRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const drawerViewStartTime = useRef<number | null>(null);

  const handleOpenDrawer = (job: FormattedJobMatch) => {
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    drawerViewStartTime.current = Date.now();
    recordTelemetry(job.jobId, "card_click");
    setSelectedJob(job);
  };

  const handleCloseDrawer = useCallback(() => {
    if (selectedJob && drawerViewStartTime.current) {
      const durationMs = Date.now() - drawerViewStartTime.current;
      recordTelemetry(selectedJob.jobId, "drawer_view", durationMs);
    }
    drawerViewStartTime.current = null;
    setSelectedJob(null);
    requestAnimationFrame(() => {
      triggerElementRef.current?.focus();
    });
  }, [selectedJob, recordTelemetry]);

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

  const handleApply = async (job: FormattedJobMatch) => {
    recordApplyClick(job);
    recordTelemetry(job.jobId, "card_click");

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

  const renderWorkModeBadge = (
    mode?: "remote" | "hybrid" | "onsite" | "unknown",
  ) => {
    if (!mode || mode === "unknown") {
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/60 font-medium">
          Work mode unspecified
        </span>
      );
    }
    if (mode === "remote") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slush-mint/10 text-slush-mint border border-slush-mint/25 font-medium">
          <Laptop className="w-3 h-3" />
          <span>Remote</span>
        </span>
      );
    }
    if (mode === "hybrid") {
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/15 text-slush-lavender border border-primary/30 font-medium">
          Hybrid
        </span>
      );
    }
    return (
      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/80 font-medium">
        Onsite
      </span>
    );
  };

  if (isLoading) {
    return <JobsPageSkeleton />;
  }

  return (
    <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-heading text-foreground">
                Job Recommendations
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Finder V2
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Deterministic match scores based on your target role, verified
              skills, and confirmed preferences.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refresh()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Onboarding Call-to-Action Banner */}
        {requiresOnboarding && (
          <div className="border border-primary/30 bg-primary/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Profile Setup Required</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold font-heading text-foreground">
                Personalize Your Recommendation Feed
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Finder V2 matches opportunities against your active Career
                Profile. Complete your 3-step setup to establish your target
                role, skills, and work preferences.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 shadow-sm transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Start Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Error state */}
        {error && !requiresOnboarding && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => refresh()}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary KPI Cards */}
        {!requiresOnboarding && <JobSummary stats={stats} />}

        {/* Main Workspace Feed */}
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="p-4 border border-border/80 bg-card/60 rounded-xl space-y-3.5 shadow-2xs">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by job title or company name..."
                  className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border/80 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Saved Only Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  showSavedOnly
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${showSavedOnly ? "fill-current" : ""}`}
                />
                <span>Saved Only</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" />
                <span>Filters:</span>
              </span>

              {/* Match Level */}
              <select
                value={selectedMatchLevel}
                onChange={(e) => setSelectedMatchLevel(e.target.value)}
                className="bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Match Levels</option>
                <option value="excellent">Excellent (90-100)</option>
                <option value="strong">Strong (75-89)</option>
                <option value="good">Good (60-74)</option>
                <option value="potential">Potential (&lt;60)</option>
              </select>

              {/* Work Mode */}
              <select
                value={selectedWorkMode}
                onChange={(e) => setSelectedWorkMode(e.target.value)}
                className="bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Work Modes</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>

              {/* Experience Level */}
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Experience Levels</option>
                <option value="junior">Junior / Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior / Lead</option>
              </select>

              {/* Location */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-secondary/50 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">All Locations</option>
                {uniqueLocations
                  .filter((loc) => loc !== "all")
                  .map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
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
                  onToggleSave={toggleSave}
                  onReject={(item) => setRejectingJob(item)}
                />
              ))
            ) : allMatches.length > 0 ? (
              <div className="border border-border bg-card/60 rounded-xl p-10 text-center space-y-3.5">
                <p className="text-base font-semibold text-foreground">
                  No jobs match your filters
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Try adjusting your search criteria or resetting filters to see
                  more opportunities.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground border border-border text-xs font-medium hover:bg-secondary/80 transition-colors cursor-pointer mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset all filters</span>
                </button>
              </div>
            ) : requiresOnboarding ? null : (
              <div className="border border-border bg-card/60 rounded-xl p-12 text-center space-y-4">
                <p className="text-base font-semibold text-foreground">
                  No matched jobs yet
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Complete your career profile or start a chat session to begin
                  receiving matched opportunities.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Start a chat</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reject Reason Modal */}
        <RejectReasonModal
          isOpen={rejectingJob !== null}
          jobTitle={rejectingJob?.title || ""}
          companyName={rejectingJob?.companyName || ""}
          onConfirm={(reason) => {
            if (rejectingJob) {
              rejectJob(rejectingJob, reason);
              if (selectedJob?.jobId === rejectingJob.jobId) {
                handleCloseDrawer();
              }
            }
            setRejectingJob(null);
          }}
          onCancel={() => setRejectingJob(null)}
        />

        {/* Detail Drawer (Accessible WAI-ARIA Dialog) */}
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
                  <span>Recommendation Details</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSave(selectedJob)}
                    title={selectedJob.isSaved ? "Saved" : "Save job"}
                    aria-label={selectedJob.isSaved ? "Saved" : "Save job"}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      selectedJob.isSaved
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        selectedJob.isSaved ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectingJob(selectedJob)}
                    title="Not interested"
                    aria-label="Not interested in this role"
                    className="p-2 rounded-xl border border-border/80 text-muted-foreground hover:text-slush-ember hover:border-slush-ember/40 hover:bg-slush-ember/10 transition-colors cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    aria-label="Close job details"
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 custom-scrollbar">
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <CompanyLogo
                      src={selectedJob.companyLogo}
                      name={selectedJob.companyName}
                      size="md"
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/25 px-3 py-1 rounded-full shrink-0">
                            {selectedJob.matchScore} / 100 Match Score
                          </span>
                          {renderWorkModeBadge(selectedJob.workMode)}
                        </div>
                        <h2
                          id="job-drawer-title"
                          className="text-lg font-bold font-heading text-foreground leading-tight"
                        >
                          {selectedJob.title}
                        </h2>
                      </div>
                      <p
                        id="job-drawer-desc"
                        className="text-sm font-medium text-muted-foreground truncate"
                      >
                        {selectedJob.companyName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedJob.location || "Remote"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{selectedJob.experienceLevel || "Mid Level"}</span>
                    </span>
                    {selectedJob.salaryRange && (
                      <span className="flex items-center gap-1 text-slush-mint font-medium">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{selectedJob.salaryRange}</span>
                      </span>
                    )}
                  </div>

                  {/* Remotive Attribution */}
                  {selectedJob.source === "remotive" && (
                    <div className="p-2.5 bg-secondary/40 border border-border/70 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>Source:</span>
                        <span className="font-semibold text-foreground">
                          Remotive
                        </span>
                      </div>
                      {selectedJob.sourceUrl && (
                        <a
                          href={selectedJob.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                        >
                          <span>View original listing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Authoritative Score Breakdown */}
                {selectedJob.scoreBreakdown && (
                  <div className="border border-border/80 bg-secondary/30 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Authoritative Match Breakdown
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-card/80 border border-border/60 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
                          Role Match
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.role_score} / 100
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-card/80 border border-border/60 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
                          Skills
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.capability_score} / 100
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-card/80 border border-border/60 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">
                          Preferences
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.preference_score} / 100
                        </p>
                      </div>
                      {selectedJob.scoreBreakdown.negative_penalty > 0 && (
                        <div className="p-2.5 rounded-xl bg-slush-ember/10 border border-slush-ember/20 space-y-0.5 col-span-3">
                          <p className="text-[10px] text-slush-ember uppercase font-semibold">
                            Negative Preference Penalty
                          </p>
                          <p className="text-xs text-slush-ember">
                            -{selectedJob.scoreBreakdown.negative_penalty}{" "}
                            penalty points deducted from final score.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fit Rationale Box */}
                <div className="border border-border/80 bg-secondary/30 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <span>Why this job fits</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                    {selectedJob.reason}
                  </p>
                </div>

                {/* Skill Gap */}
                {selectedJob.missingSkills &&
                  selectedJob.missingSkills.length > 0 && (
                    <div className="border border-slush-yellow/25 bg-slush-yellow/5 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-semibold text-slush-yellow flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Skills not yet found in profile</span>
                      </h4>
                      <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                        This role mentions{" "}
                        <span className="font-semibold text-foreground">
                          {selectedJob.missingSkills.join(", ")}
                        </span>
                        , but evidence was not found in your current profile.
                        Consider brushing up or highlighting these in your
                        application.
                      </p>
                    </div>
                  )}

                {/* Ask Finder AI Section */}
                <div className="p-3.5 bg-secondary/40 border border-border/70 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Discuss this role with Finder AI
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Ask questions, compare roles, or prepare interview talking
                      points.
                    </p>
                  </div>
                  <Link
                    href={`/?job=${selectedJob.jobId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-secondary text-foreground font-medium text-xs whitespace-nowrap shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    <span>Ask Finder</span>
                  </Link>
                </div>

                {/* Job Details */}
                <div className="space-y-4 pt-3 border-t border-border/60">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold font-heading text-foreground uppercase tracking-wider">
                      Job Description
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line font-sans">
                      {selectedJob.description || "No description available."}
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
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity cursor-pointer shadow-xs"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2.5 border border-border/80 bg-secondary/60 rounded-xl text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
