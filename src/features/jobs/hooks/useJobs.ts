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

  const fetchMatches = useCallback(
    async (id: string | null, signal?: AbortSignal) => {
      try {
        setIsLoading((prev) => (prev === false ? true : prev));
        setError((prev) => (prev !== null ? null : prev));

        let activeAnalysisId = id;

        if (!activeAnalysisId) {
          const latestAnalysis = await fetchUserLatestAnalysis();
          if (latestAnalysis) {
            activeAnalysisId = latestAnalysis.id;
          }
        }

        if (signal?.aborted) return;

        if (activeAnalysisId) {
          const data = await jobsApi.getJobMatches(activeAnalysisId);
          if (!signal?.aborted) {
            setMatches(data);
          }
        } else {
          if (!signal?.aborted) {
            setMatches([]);
          }
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        console.error("useJobs Fetch Error:", errorObj);
        if (!signal?.aborted) {
          setError(
            errorObj.message || "Gagal memuat rekomendasi lowongan kerja.",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMatches(analysisId, controller.signal);
    return () => {
      controller.abort();
    };
  }, [analysisId, fetchMatches]);

  const uniqueLocations = useMemo(() => {
    const locs = matches.map((m) => m.location).filter(Boolean);
    return ["all", ...new Set(locs)];
  }, [matches]);

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

      const matchesExperience =
        selectedExperience === "all" ||
        match.experienceLevel?.toLowerCase() ===
          selectedExperience.toLowerCase();

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

  const stats = useMemo(() => {
    if (matches.length === 0) return { count: 0, highest: 0, average: 0 };
    const scores = matches.map((m) => m.matchScore);
    const highest = Math.max(...scores);
    const average = Math.round(
      scores.reduce((a, b) => a + b, 0) / matches.length,
    );
    return {
      count: matches.length,
      highest,
      average,
    };
  }, [matches]);

  const handleRefresh = useCallback(() => {
    const controller = new AbortController();
    fetchMatches(analysisId, controller.signal);
  }, [analysisId, fetchMatches]);

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
    stats,
    refresh: handleRefresh,
  };
};
