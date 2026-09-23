"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { jobsApi, FormattedJobMatch } from "../services/jobs.api";
import { fetchUserLatestAnalysis } from "@/features/ai-analysis/services/analysis.service";

export const useJobs = (analysisId: string | null = null) => {
  const [matches, setMatches] = useState<FormattedJobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatchLevel, setSelectedMatchLevel] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let activeAnalysisId = analysisId;
      if (!activeAnalysisId) {
        const latestAnalysis = await fetchUserLatestAnalysis();
        if (latestAnalysis) activeAnalysisId = latestAnalysis.id;
      }
      if (activeAnalysisId) {
        const data = await jobsApi.getJobMatches(activeAnalysisId);
        setMatches(data);
      } else {
        setMatches([]);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("useJobs Fetch Error:", errorObj);
      setError(errorObj.message || "Gagal memuat rekomendasi lowongan kerja.");
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadMatches() {
      try {
        let activeAnalysisId = analysisId;
        if (!activeAnalysisId) {
          const latestAnalysis = await fetchUserLatestAnalysis();
          if (latestAnalysis) {
            activeAnalysisId = latestAnalysis.id;
          }
        }

        if (controller.signal.aborted || cancelled) return;

        if (activeAnalysisId) {
          const data = await jobsApi.getJobMatches(activeAnalysisId);
          if (!cancelled && !controller.signal.aborted) {
            setMatches(data);
          }
        } else {
          if (!cancelled && !controller.signal.aborted) {
            setMatches([]);
          }
        }
      } catch (err: unknown) {
        if (!cancelled && !controller.signal.aborted) {
          const errorObj = err as Error;
          console.error("useJobs Fetch Error:", errorObj);
          setError(
            errorObj.message || "Gagal memuat rekomendasi lowongan kerja.",
          );
        }
      } finally {
        if (!cancelled && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [analysisId]);

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
      const matchesSearch =
        searchQuery === "" ||
        match.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesLevel = true;
      if (selectedMatchLevel !== "all") {
        const score = match.matchScore;
        if (selectedMatchLevel === "excellent") matchesLevel = score >= 90;
        else if (selectedMatchLevel === "strong")
          matchesLevel = score >= 75 && score < 90;
        else if (selectedMatchLevel === "good")
          matchesLevel = score >= 60 && score < 75;
        else if (selectedMatchLevel === "potential") matchesLevel = score < 60;
      }

      const matchesExperience = matchesExperienceLevel(
        match.experienceLevel,
        selectedExperience,
      );

      const matchesLocation =
        selectedLocation === "all" || match.location === selectedLocation;

      return (
        matchesSearch && matchesLevel && matchesExperience && matchesLocation
      );
    });
  }, [
    matches,
    searchQuery,
    selectedMatchLevel,
    selectedExperience,
    selectedLocation,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedMatchLevel !== "all" ||
    selectedExperience !== "all" ||
    selectedLocation !== "all";

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedMatchLevel("all");
    setSelectedExperience("all");
    setSelectedLocation("all");
  }, []);

  const stats = useMemo(() => {
    if (matches.length === 0)
      return { count: 0, totalCount: 0, highest: 0, average: 0 };
    const currentSet = filteredMatches.length > 0 ? filteredMatches : matches;
    const scores = currentSet.map((m) => m.matchScore);
    const highest = Math.max(...scores);
    const average = Math.round(
      scores.reduce((a, b) => a + b, 0) / currentSet.length,
    );
    return {
      count: filteredMatches.length,
      totalCount: matches.length,
      highest: filteredMatches.length > 0 ? highest : 0,
      average: filteredMatches.length > 0 ? average : 0,
    };
  }, [matches, filteredMatches]);

  return {
    matches: filteredMatches,
    allMatches: matches,
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
    refresh: handleRefresh,
  };
};
