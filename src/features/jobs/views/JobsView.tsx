"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
  ArrowLeft,
  Laptop,
  Brain,
  DollarSign,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { jobsApi, FormattedJobMatch } from "../services/jobs.api";
import CompanyLogo from "@/components/common/CompanyLogo";
import { useSidebar } from "@/contexts/SidebarContext";

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
    isRefreshing,
    refresh,
    toggleSave,
    rejectJob,
    recordApplyClick,
    recordTelemetry,
  } = useJobs();

  const router = useRouter();
  const searchParams = useSearchParams();
  const paramJobId = searchParams
    ? searchParams.get("jobId") || searchParams.get("job")
    : null;

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [directJob, setDirectJob] = useState<FormattedJobMatch | null>(null);
  const [consumedJobParam, setConsumedJobParam] = useState<string | null>(null);

  if (paramJobId && paramJobId !== consumedJobParam) {
    setConsumedJobParam(paramJobId);
    setSelectedJobId(paramJobId);
  }

  useEffect(() => {
    if (!selectedJobId) return;

    const foundInPool = allMatches.find((j) => j.jobId === selectedJobId);
    if (foundInPool) {
      return;
    }

    let cancelled = false;
    jobsApi
      .getJobDetail(selectedJobId)
      .then((detail) => {
        if (cancelled || !detail) return;
        const formatted: FormattedJobMatch = {
          matchId: detail.id,
          jobId: detail.id,
          matchScore: 0,
          reason: "Directly viewed job opportunity.",
          missingSkills: [],
          title: detail.title,
          description: detail.description || "",
          requirements: Array.isArray(detail.requirements)
            ? detail.requirements
            : [],
          location: detail.location || "Location not specified",
          workMode: detail.location?.toLowerCase().includes("remote")
            ? "remote"
            : "unknown",
          experienceLevel: detail.experience_level || "Not specified",
          salaryRange: (detail as any).salary_range || null,
          companyName: detail.company_name,
          companyLogo: detail.company_logo,
          companyWebsite: (detail as any).company_website || null,
          applyUrl: detail.apply_url || null,
          sourceUrl: detail.source_url || null,
          source: detail.source || "manual",
          isSaved: false,
          postedAt: (detail as any).posted_at || null,
        };
        setDirectJob(formatted);
      })
      .catch((err) => {
        console.warn("Direct job fetch failed for ID:", selectedJobId, err);
        if (!cancelled) {
          toast.error("This job is no longer available", {
            description:
              "It may have been closed or removed. Try another role.",
          });
          setSelectedJobId(null);
          if (paramJobId) {
            router.replace("/jobs");
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJobId, allMatches, paramJobId, router]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    const found = allMatches.find((j) => j.jobId === selectedJobId);
    if (found) return found;
    if (directJob && directJob.jobId === selectedJobId) return directJob;
    return null;
  }, [allMatches, selectedJobId, directJob]);
  const [rejectingJob, setRejectingJob] = useState<FormattedJobMatch | null>(
    null,
  );
  const { collapsed } = useSidebar();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedExperience !== "all") count += 1;
    if (selectedLocation !== "all") count += 1;
    if (selectedMatchLevel !== "all") count += 1;
    if (selectedWorkMode !== "all") count += 1;
    if (showSavedOnly) count += 1;
    return count;
  }, [
    selectedExperience,
    selectedLocation,
    selectedMatchLevel,
    selectedWorkMode,
    showSavedOnly,
  ]);

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (searchQuery.trim()) {
      chips.push({
        id: "search",
        label: `"${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(""),
      });
    }
    if (showSavedOnly) {
      chips.push({
        id: "saved",
        label: "Saved Only",
        onRemove: () => setShowSavedOnly(false),
      });
    }
    if (selectedMatchLevel !== "all") {
      const matchMap: Record<string, string> = {
        excellent: "Match 90-100%",
        strong: "Match 75-89%",
        good: "Match 60-74%",
        potential: "Match <60%",
      };
      chips.push({
        id: "match",
        label: matchMap[selectedMatchLevel] || selectedMatchLevel,
        onRemove: () => setSelectedMatchLevel("all"),
      });
    }
    if (selectedWorkMode !== "all") {
      const modeMap: Record<string, string> = {
        remote: "Remote",
        hybrid: "Hybrid",
        onsite: "Onsite",
      };
      chips.push({
        id: "workMode",
        label: modeMap[selectedWorkMode] || selectedWorkMode,
        onRemove: () => setSelectedWorkMode("all"),
      });
    }
    if (selectedExperience !== "all") {
      const expMap: Record<string, string> = {
        junior: "Junior / Entry",
        mid: "Mid Level",
        senior: "Senior / Lead",
        unspecified: "Level not specified",
      };
      chips.push({
        id: "exp",
        label: expMap[selectedExperience] || selectedExperience,
        onRemove: () => setSelectedExperience("all"),
      });
    }
    if (selectedLocation !== "all") {
      chips.push({
        id: "location",
        label: selectedLocation,
        onRemove: () => setSelectedLocation("all"),
      });
    }
    return chips;
  }, [
    searchQuery,
    showSavedOnly,
    selectedMatchLevel,
    selectedWorkMode,
    selectedExperience,
    selectedLocation,
    setSearchQuery,
    setShowSavedOnly,
    setSelectedMatchLevel,
    setSelectedWorkMode,
    setSelectedExperience,
    setSelectedLocation,
  ]);

  const triggerElementRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const drawerViewStartTime = useRef<number | null>(null);

  const handleOpenDrawer = (job: FormattedJobMatch) => {
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    drawerViewStartTime.current = Date.now();
    recordTelemetry(job.jobId, "card_click");
    setSelectedJobId(job.jobId);
  };

  const handleCloseDrawer = useCallback(() => {
    if (selectedJob && drawerViewStartTime.current) {
      const durationMs = Date.now() - drawerViewStartTime.current;
      recordTelemetry(selectedJob.jobId, "drawer_view", durationMs);
    }
    drawerViewStartTime.current = null;
    setSelectedJobId(null);
    if (paramJobId) {
      setConsumedJobParam(paramJobId);
      router.replace("/jobs");
    }
    requestAnimationFrame(() => {
      triggerElementRef.current?.focus();
    });
  }, [selectedJob, recordTelemetry, paramJobId, router]);

  useEffect(() => {
    if (!selectedJob) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is active on top of drawer, let modal handle keys exclusively
      if (rejectingJob !== null) return;

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
  }, [selectedJob, rejectingJob, handleCloseDrawer]);

  const handleApply = async (job: FormattedJobMatch) => {
    recordApplyClick(job);
    recordTelemetry(job.jobId, "card_click");

    const targetUrl = job.applyUrl || job.sourceUrl || job.companyWebsite;
    if (targetUrl) {
      const formattedUrl = targetUrl.startsWith("http")
        ? targetUrl
        : `https://${targetUrl}`;
      toast.success("Opening application portal...", {
        description: `Redirecting to ${job.companyName || "the employer"} listing.`,
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
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/80 font-medium">
          Hybrid
        </span>
      );
    }
    return (
      <span className="text-xs px-2.5 py-0.5 rounded-sm bg-secondary text-muted-foreground border border-border/80 font-medium">
        Onsite
      </span>
    );
  };

  if (isLoading && allMatches.length === 0) {
    return <JobsPageSkeleton />;
  }

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      {/* Top Single-Row Compact Header */}
      <header
        className={`h-16 border-b border-border/80 bg-sidebar flex items-center justify-between shrink-0 select-none z-20 px-4 md:px-6 transition-colors ${
          collapsed ? "pl-14 md:pl-6" : ""
        }`}
      >
        {isMobileSearchOpen ? (
          <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Close search"
              className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs or company..."
                aria-label="Search jobs"
                className="w-full pl-9 pr-8 py-1.5 bg-secondary/80 border border-border/80 rounded-sm text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/40 focus:border-border-strong"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate leading-tight">
                Jobs
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
              {/* Desktop Search */}
              <div className="relative hidden md:block w-44 lg:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  aria-label="Search jobs"
                  className="w-full pl-8 pr-7 py-1.5 bg-secondary/60 border border-border/80 rounded-sm text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/40 focus:border-border-strong transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                aria-label="Open search"
                className="md:hidden p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFiltersModal(true)}
                aria-label="Filter jobs"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer border ${
                  hasActiveFilters
                    ? "bg-secondary text-foreground border-border-strong font-semibold"
                    : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Refresh Feed Button */}
              <button
                type="button"
                disabled={isRefreshing}
                onClick={() => refresh()}
                aria-label="Refresh feed"
                title="Refresh feed"
                className="flex p-2 sm:px-2.5 sm:py-1.5 rounded-sm bg-secondary/60 border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden lg:inline ml-1.5">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Scrollable Body */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
          {/* Onboarding Call-to-Action Banner */}
          {requiresOnboarding && (
            <div className="border border-border bg-secondary/30 rounded-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-secondary border border-border text-muted-foreground text-xs font-semibold">
                  <span>Profile Setup Required</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold font-heading text-foreground">
                  Personalize Your Recommendation Feed
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Finder matches opportunities against your active Career
                  Profile. Complete your setup to establish your target role,
                  skills, and work preferences.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:opacity-90 shadow-sm transition-all whitespace-nowrap cursor-pointer"
              >
                <span>Start Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Error state on refresh (when existing items are present) */}
          {error && allMatches.length > 0 && !requiresOnboarding && (
            <div className="p-4 rounded-sm border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
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

          {/* Active Filters Dismissible Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1 font-medium">
                Active filters:
              </span>
              {activeChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-secondary border border-border/80 text-[11px] text-foreground font-medium"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove filter ${chip.label}`}
                    className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline font-medium ml-1 cursor-pointer"
              >
                Reset all
              </button>
            </div>
          )}

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
              <div className="border border-border bg-card rounded-sm p-10 text-center space-y-3.5">
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
                  aria-label="Reset all filters"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-secondary text-foreground border border-border text-xs font-medium hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground transition-colors cursor-pointer mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset all filters</span>
                </button>
              </div>
            ) : error ? (
              <div className="border border-destructive/30 bg-destructive/10 rounded-sm p-10 text-center space-y-3.5">
                <div className="inline-flex items-center justify-center p-3 rounded-sm bg-destructive/10 text-destructive mb-1">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  Unable to load job recommendations
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => refresh()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer mx-auto shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : requiresOnboarding ? null : (
              <div className="border border-border bg-card rounded-sm p-12 text-center space-y-4">
                <p className="text-base font-semibold text-foreground">
                  No matched jobs yet
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Complete your career profile or start a chat session to begin
                  receiving matched opportunities.
                </p>
                <Link
                  href="/c"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
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
                <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs tracking-tight">
                  <span>Recommendation Details</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleSave(selectedJob)}
                    title={selectedJob.isSaved ? "Saved" : "Save job"}
                    aria-label={selectedJob.isSaved ? "Saved" : "Save job"}
                    className={`p-2 rounded-sm border transition-colors cursor-pointer ${
                      selectedJob.isSaved
                        ? "bg-secondary border-border-strong text-foreground"
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
                    className="p-2 rounded-sm border border-border/80 text-muted-foreground hover:text-slush-ember hover:border-slush-ember/40 hover:bg-slush-ember/10 transition-colors cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    aria-label="Close job details"
                    className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-secondary text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground transition-colors cursor-pointer ml-1"
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
                          {selectedJob.matchScore > 0 ? (
                            <span className="text-xs font-bold text-foreground bg-secondary border border-border-strong px-2.5 py-0.5 rounded-sm shrink-0">
                              {selectedJob.matchScore} / 100 Match Score
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground bg-secondary border border-border px-2.5 py-0.5 rounded-sm shrink-0">
                              Not scored for you yet
                            </span>
                          )}
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
                      <span>
                        {selectedJob.location || "Location not specified"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>
                        {selectedJob.experienceLevel || "Level not specified"}
                      </span>
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
                    <div className="p-2.5 bg-secondary/40 border border-border/70 rounded-sm flex items-center justify-between text-xs text-muted-foreground">
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
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs"
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
                  <div className="border border-border/80 bg-secondary/30 rounded-sm p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Authoritative Match Breakdown
                    </h4>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-sm bg-card border border-border/60 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Role Match
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.role_score} / 100
                        </p>
                      </div>
                      <div className="p-2.5 rounded-sm bg-card border border-border/60 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Skills
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.capability_score} / 100
                        </p>
                      </div>
                      <div className="p-2.5 rounded-sm bg-card border border-border/60 space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-medium">
                          Preferences
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {selectedJob.scoreBreakdown.preference_score} / 100
                        </p>
                      </div>
                      {selectedJob.scoreBreakdown.negative_penalty > 0 && (
                        <div className="p-2.5 rounded-sm bg-slush-ember/10 border border-slush-ember/20 space-y-0.5 col-span-3">
                          <p className="text-xs text-slush-ember uppercase font-semibold">
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
                <div className="border border-border/80 bg-secondary/30 rounded-sm p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Why this job fits</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                    {selectedJob.reason}
                  </p>
                </div>

                {/* Skill Gap */}
                {selectedJob.missingSkills &&
                  selectedJob.missingSkills.length > 0 && (
                    <div className="border border-slush-yellow/25 bg-slush-yellow/5 rounded-sm p-4 space-y-2">
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
                <div className="p-3.5 bg-secondary/40 border border-border/70 rounded-sm flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Discuss this role with Finder AI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ask questions, compare roles, or prepare interview talking
                      points.
                    </p>
                  </div>
                  <Link
                    href={`/c?job=${selectedJob.jobId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-card border border-border hover:bg-secondary text-foreground font-medium text-xs whitespace-nowrap shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
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
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
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
                {(() => {
                  const targetUrl =
                    selectedJob.applyUrl ||
                    selectedJob.sourceUrl ||
                    selectedJob.companyWebsite;
                  const hasUrl = Boolean(targetUrl);
                  const isDirectApply = Boolean(selectedJob.applyUrl);

                  return (
                    <button
                      type="button"
                      disabled={!hasUrl}
                      onClick={() => handleApply(selectedJob)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity shadow-xs ${
                        hasUrl
                          ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                          : "bg-secondary text-muted-foreground border border-border/60 cursor-not-allowed opacity-75"
                      }`}
                    >
                      <span>
                        {hasUrl
                          ? isDirectApply
                            ? "Apply Now"
                            : "View Source Listing"
                          : "Application link unavailable"}
                      </span>
                      {hasUrl && <ExternalLink className="w-3.5 h-3.5" />}
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2.5 border border-border/80 bg-secondary/60 rounded-sm text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal Dialog */}
        {showFiltersModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setShowFiltersModal(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-sm shadow-2xl p-5 space-y-4 z-50 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <h3
                    id="filter-dialog-title"
                    className="text-sm font-bold font-heading text-foreground"
                  >
                    Filter Jobs
                  </h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-foreground text-background">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  aria-label="Close filter modal"
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Filters */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={showSavedOnly}
                    onClick={() => setShowSavedOnly((prev) => !prev)}
                    className={`h-8 px-3 rounded-sm text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      showSavedOnly
                        ? "bg-secondary text-foreground border-border-strong font-semibold"
                        : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${showSavedOnly ? "fill-current" : ""}`}
                    />
                    <span>Saved Only</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={selectedWorkMode === "remote"}
                    onClick={() =>
                      setSelectedWorkMode((prev) =>
                        prev === "remote" ? "all" : "remote",
                      )
                    }
                    className={`h-8 px-3 rounded-sm text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedWorkMode === "remote"
                        ? "bg-secondary text-foreground border-border-strong font-semibold"
                        : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Remote Only</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={
                      selectedMatchLevel === "strong" ||
                      selectedMatchLevel === "excellent"
                    }
                    onClick={() => {
                      setSelectedMatchLevel((prev) =>
                        prev === "strong" || prev === "excellent"
                          ? "all"
                          : "strong",
                      );
                    }}
                    className={`h-8 px-3 rounded-sm text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedMatchLevel === "strong" ||
                      selectedMatchLevel === "excellent"
                        ? "bg-secondary text-foreground border-border-strong font-semibold"
                        : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>Top Match (75%+)</span>
                  </button>
                </div>
              </div>

              {/* Dropdown Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                {/* Match Level */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Match Score
                  </label>
                  <select
                    value={selectedMatchLevel}
                    onChange={(e) => setSelectedMatchLevel(e.target.value)}
                    aria-label="Filter by match level"
                    className="w-full bg-secondary/50 border border-border/80 rounded-sm px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground cursor-pointer"
                  >
                    <option value="all">All Match Levels</option>
                    <option value="excellent">Excellent (90-100)</option>
                    <option value="strong">Strong (75-89)</option>
                    <option value="good">Good (60-74)</option>
                    <option value="potential">Potential (&lt;60)</option>
                  </select>
                </div>

                {/* Work Mode */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Work Mode
                  </label>
                  <select
                    value={selectedWorkMode}
                    onChange={(e) => setSelectedWorkMode(e.target.value)}
                    aria-label="Filter by work mode"
                    className="w-full bg-secondary/50 border border-border/80 rounded-sm px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground cursor-pointer"
                  >
                    <option value="all">All Work Modes</option>
                    <option value="remote">Remote Only</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience Level
                  </label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    aria-label="Filter by experience level"
                    className="w-full bg-secondary/50 border border-border/80 rounded-sm px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground cursor-pointer"
                  >
                    <option value="all">All Experience Levels</option>
                    <option value="junior">Junior / Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior / Lead</option>
                    <option value="unspecified">Level not specified</option>
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    aria-label="Filter by location"
                    className="w-full bg-secondary/50 border border-border/80 rounded-sm px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground cursor-pointer truncate"
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
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/80">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground underline font-medium cursor-pointer"
                  >
                    Reset all filters
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => setShowFiltersModal(false)}
                  className="px-4 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  View {matches.length} {matches.length === 1 ? "Job" : "Jobs"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
