"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface DashboardMetrics {
  careerScore: number;
  totalMatches: number;
  skillsCount: number;
  missingSkillsCount: number;
  topRole: string;
  lastAnalyzed?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  type: string;
  priority: string;
  path: string;
}

export interface DashboardInsight {
  insightText?: string;
  quickActions?: QuickActionItem[];
}

interface MetricsApiResponse {
  hasResume: boolean;
  resumeStatus: "uploaded" | "processing" | "completed" | "failed" | null;
  metrics: DashboardMetrics | null;
}

export const useDashboard = () => {
  const [metricsData, setMetricsData] = useState<MetricsApiResponse | null>(
    null,
  );
  const [insightData, setInsightData] = useState<DashboardInsight | null>(null);

  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const metricsDataRef = useRef<MetricsApiResponse | null>(null);
  const insightDataRef = useRef<DashboardInsight | null>(null);

  useEffect(() => {
    metricsDataRef.current = metricsData;
  }, [metricsData]);

  useEffect(() => {
    insightDataRef.current = insightData;
  }, [insightData]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsMetricsLoading(!metricsDataRef.current);
      const res = await fetch(`/api/dashboard/metrics?t=${Date.now()}`, {
        signal,
      });
      if (!res.ok) throw new Error("Gagal mengambil metrik dashboard.");
      const json = await res.json();
      if (!signal?.aborted) {
        setMetricsData(json);
        setError(null);
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name !== "AbortError") {
        console.error("fetchMetrics Error:", errorObj);
        if (!signal?.aborted)
          setError(errorObj.message || "Gagal memuat dashboard");
      }
    } finally {
      if (!signal?.aborted) setIsMetricsLoading(false);
    }
  }, []);

  const fetchInsight = useCallback(
    async (signal?: AbortSignal, force = false) => {
      try {
        setIsInsightLoading(!insightDataRef.current);
        const baseUrl = force
          ? "/api/dashboard/insight?force=true"
          : "/api/dashboard/insight";
        const res = await fetch(
          `${baseUrl}${force ? "&" : "?"}t=${Date.now()}`,
          {
            signal,
          },
        );
        if (!res.ok) throw new Error("Gagal mengambil analisis AI.");
        const json = await res.json();
        if (!signal?.aborted) setInsightData(json);
      } catch (err: unknown) {
        const errorObj = err as Error;
        if (errorObj.name !== "AbortError")
          console.error("fetchInsight Error:", errorObj);
      } finally {
        if (!signal?.aborted) setIsInsightLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMetrics(controller.signal);
    fetchInsight(controller.signal, false);
    return () => controller.abort();
  }, [fetchMetrics, fetchInsight]);

  useEffect(() => {
    const isProcessing =
      metricsData?.hasResume && metricsData?.resumeStatus === "processing";
    if (isProcessing) {
      pollingTimerRef.current = setTimeout(() => {
        const controller = new AbortController();
        fetchMetrics(controller.signal);
        fetchInsight(controller.signal, false);
      }, 5000);
    }
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, [
    metricsData?.hasResume,
    metricsData?.resumeStatus,
    fetchMetrics,
    fetchInsight,
  ]);

  const handleRefresh = useCallback(async () => {
    if (cooldown > 0) return;

    setIsRefreshing(true);
    const controller = new AbortController();

    await Promise.all([
      fetchMetrics(controller.signal),
      fetchInsight(controller.signal, true),
    ]);

    setIsRefreshing(false);
    setCooldown(60);
  }, [fetchMetrics, fetchInsight, cooldown]);

  return {
    hasResume: metricsData?.hasResume ?? false,
    resumeStatus: metricsData?.resumeStatus ?? null,
    metrics: metricsData?.metrics ?? null,
    insight: insightData ?? null,
    isMetricsLoading,
    isInsightLoading,
    isRefreshing,
    cooldown,
    isLoading: isMetricsLoading && isInsightLoading,
    error,
    refresh: handleRefresh,
  };
};
