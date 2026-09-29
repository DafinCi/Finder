"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { jobsApi, FormattedJobMatch } from "../services/jobs.api";
import { fetchUserLatestAnalysis } from "@/features/ai-analysis/services/analysis.service";
import {
  FeedbackReason,
  InteractionType,
} from "@/features/feedback/schemas/feedback.schema";
import { toast } from "sonner";

export const useJobs = (analysisId: string | null = null) => {
  const [matches, setMatches] = useState<FormattedJobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatchLevel, setSelectedMatchLevel] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedWorkMode, setSelectedWorkMode] = useState("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Attempt V2 Recommendations first
      const v2Result = await jobsApi.getV2Recommendations(25).catch((err) => {
        console.warn(
          "V2 recommendations fetch warning, checking legacy fallback:",
          err,
        );
        return null;
      });

      if (v2Result) {
        if (v2Result.requiresOnboarding) {
          setRequiresOnboarding(true);
          setMatches([]);
          return;
        }
        setRequiresOnboarding(false);
        setMatches(v2Result.recommendations);
        return;
      }

      // Fallback: Legacy Analysis Job Matches (if analysisId or latest analysis exists)
      let activeAnalysisId = analysisId;
      if (!activeAnalysisId) {
        const latestAnalysis = await fetchUserLatestAnalysis().catch(
          () => null,
        );
        if (latestAnalysis) activeAnalysisId = latestAnalysis.id;
      }

      if (activeAnalysisId) {
        const legacyData = await jobsApi.getJobMatches(activeAnalysisId);
        setMatches(legacyData);
      } else {
        setMatches([]);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("useJobs Refresh Error:", errorObj);
      setError(errorObj.message || "Couldn't load job recommendations.");
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const v2Result = await jobsApi.getV2Recommendations(25).catch((err) => {
          console.warn(
            "V2 recommendations fetch warning, checking legacy fallback:",
            err,
          );
          return null;
        });

        if (cancelled) return;

        if (v2Result) {
          if (v2Result.requiresOnboarding) {
            setRequiresOnboarding(true);
            setMatches([]);
            return;
          }
          setRequiresOnboarding(false);
          setMatches(v2Result.recommendations);
          return;
        }

        let activeAnalysisId = analysisId;
        if (!activeAnalysisId) {
          const latestAnalysis = await fetchUserLatestAnalysis().catch(
            () => null,
          );
          if (latestAnalysis) activeAnalysisId = latestAnalysis.id;
        }

        if (cancelled) return;

        if (activeAnalysisId) {
          const legacyData = await jobsApi.getJobMatches(activeAnalysisId);
          if (!cancelled) setMatches(legacyData);
        } else {
          if (!cancelled) setMatches([]);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const errorObj = err as Error;
          console.error("useJobs Fetch Error:", errorObj);
          setError(errorObj.message || "Couldn't load job recommendations.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  // Save / Bookmark Toggle
  const toggleSave = useCallback(async (match: FormattedJobMatch) => {
    const previousState = match.isSaved;
    const nextState = !previousState;

    // Optimistic update
    setMatches((current) =>
      current.map((item) =>
        item.jobId === match.jobId ? { ...item, isSaved: nextState } : item,
      ),
    );

    try {
      if (nextState) {
        await jobsApi.saveJob(match.jobId);
        toast.success("Job saved to your bookmarks");
      } else {
        await jobsApi.unsaveJob(match.jobId);
        toast.info("Job removed from bookmarks");
      }
    } catch (err) {
      console.error("Error toggling save:", err);
      // Rollback
      setMatches((current) =>
        current.map((item) =>
          item.jobId === match.jobId
            ? { ...item, isSaved: previousState }
            : item,
        ),
      );
      toast.error("Failed to update bookmark status");
    }
  }, []);

  // Reject / Not Interested
  const rejectJob = useCallback(
    async (match: FormattedJobMatch, reason?: FeedbackReason) => {
      const previousMatches = matches;

      // Optimistic update: filter out immediately
      setMatches((current) =>
        current.filter((item) => item.jobId !== match.jobId),
      );

      try {
        await jobsApi.rejectJob(match.jobId, reason);
        toast.info("Job excluded from future recommendations");
      } catch (err) {
        console.error("Error rejecting job:", err);
        // Rollback
        setMatches(previousMatches);
        toast.error("Failed to exclude job. Please try again.");
      }
    },
    [matches],
  );

  // External Apply Click
  const recordApplyClick = useCallback(async (match: FormattedJobMatch) => {
    await jobsApi.recordApplyClick(match.jobId);
  }, []);

  // Telemetry recording
  const recordTelemetry = useCallback(
    async (
      jobId: string,
      interactionType: InteractionType,
      durationMs?: number,
    ) => {
      await jobsApi.recordTelemetry(jobId, interactionType, durationMs);
    },
    [],
  );

  const uniqueLocations = useMemo(() => {
    const locs = matches.map((m) => m.location).filter(Boolean);
    return ["all", ...new Set(locs)];
  }, [matches]);

  function matchesExperienceLevel(
    jobLevel: string | undefined | null,
    filterLevel: string,
  ): boolean {
    if (filterLevel === "all") return true;
    if (!jobLevel) return true;
    const norm = jobLevel.toLowerCase();

    if (filterLevel === "junior") {
      return (
        norm.includes("junior") ||
        norm.includes("entry") ||
        norm.includes("intern") ||
        norm.includes("graduate") ||
        norm.includes("0-") ||
        norm.includes("1-")
      );
    }

    if (filterLevel === "mid") {
      return (
        norm.includes("mid") ||
        norm.includes("intermediate") ||
        norm.includes("2-") ||
        norm.includes("3-") ||
        norm.includes("associate")
      );
    }

    if (filterLevel === "senior") {
      return (
        norm.includes("senior") ||
        norm.includes("lead") ||
        norm.includes("principal") ||
        norm.includes("staff") ||
        norm.includes("head") ||
        norm.includes("director") ||
        norm.includes("5+") ||
        norm.includes("7+")
      );
    }

    return norm.includes(filterLevel.toLowerCase());
  }

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (showSavedOnly && !match.isSaved) return false;

      const matchesSearch =
        searchQuery === "" ||
        match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.companyName?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedMatchLevel !== "all") {
        const score = match.matchScore;
        if (selectedMatchLevel === "excellent" && score < 90) return false;
        if (selectedMatchLevel === "strong" && (score < 75 || score >= 90))
          return false;
        if (selectedMatchLevel === "good" && (score < 60 || score >= 75))
          return false;
        if (selectedMatchLevel === "potential" && score >= 60) return false;
      }

      if (!matchesExperienceLevel(match.experienceLevel, selectedExperience)) {
        return false;
      }

      if (selectedLocation !== "all" && match.location !== selectedLocation) {
        return false;
      }

      if (selectedWorkMode !== "all") {
        if (selectedWorkMode === "remote" && match.workMode !== "remote")
          return false;
        if (selectedWorkMode === "hybrid" && match.workMode !== "hybrid")
          return false;
        if (selectedWorkMode === "onsite" && match.workMode !== "onsite")
          return false;
      }

      return true;
    });
  }, [
    matches,
    showSavedOnly,
    searchQuery,
    selectedMatchLevel,
    selectedExperience,
    selectedLocation,
    selectedWorkMode,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedMatchLevel !== "all" ||
    selectedExperience !== "all" ||
    selectedLocation !== "all" ||
    selectedWorkMode !== "all" ||
    showSavedOnly;

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedMatchLevel("all");
    setSelectedExperience("all");
    setSelectedLocation("all");
    setSelectedWorkMode("all");
    setShowSavedOnly(false);
  }, []);

  const stats = useMemo(() => {
    if (matches.length === 0 || filteredMatches.length === 0) {
      return {
        count: filteredMatches.length,
        totalCount: matches.length,
        highest: null,
        average: null,
      };
    }

    const scores = filteredMatches.map((m) => m.matchScore);
    const highest = Math.max(...scores);
    const average = Math.round(
      scores.reduce((a, b) => a + b, 0) / filteredMatches.length,
    );
    return {
      count: filteredMatches.length,
      totalCount: matches.length,
      highest,
      average,
    };
  }, [matches, filteredMatches]);

  return {
    matches: filteredMatches,
    allMatches: matches,
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
    refresh: handleRefresh,
    toggleSave,
    rejectJob,
    recordApplyClick,
    recordTelemetry,
  };
};
