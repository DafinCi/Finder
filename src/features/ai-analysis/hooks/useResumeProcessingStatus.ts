"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ResumeProcessing,
  isTerminalResumeProcessingStage,
} from "../types/resume-processing.types";

export interface ResumeProcessingStatusResponse {
  resumeId: string;
  resumeStatus: string;
  hasProcessingState: boolean;
  processing: ResumeProcessing | null;
}

interface UseResumeProcessingStatusOptions {
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Polls the persisted resume-processing stage until it reaches a state that
 * needs the user (needs_review) or a terminal state. The UI shows exactly the
 * stages the backend reported, not a simulated progress bar.
 */
export function useResumeProcessingStatus(
  resumeId?: string | null,
  options?: UseResumeProcessingStatusOptions,
) {
  const enabled = options?.enabled ?? true;
  const intervalMs = options?.intervalMs ?? 1500;

  const [data, setData] = useState<ResumeProcessingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!resumeId) return null;

    const res = await fetch(
      `/api/analyze/status?resumeId=${encodeURIComponent(resumeId)}`,
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to load processing status.");
    }
    const json = (await res.json()) as ResumeProcessingStatusResponse;
    setData(json);
    return json;
  }, [resumeId]);

  useEffect(() => {
    if (!resumeId || !enabled) return;

    let cancelled = false;
    let stopped = false;

    const tick = async () => {
      try {
        setIsLoading(true);
        const json = await fetchStatus();
        if (cancelled || !json) return;

        const stage = json.processing?.stage;
        if (
          stage &&
          (stage === "needs_review" ||
            stage === "awaiting_confirmation" ||
            isTerminalResumeProcessingStage(stage))
        ) {
          stopped = true;
          return;
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      if (!cancelled && !stopped) {
        timerRef.current = setTimeout(tick, intervalMs);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resumeId, enabled, intervalMs, fetchStatus]);

  return {
    data,
    processing: data?.processing ?? null,
    isLoading,
    error,
    refresh: fetchStatus,
  };
}
