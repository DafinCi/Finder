"use client";

import React from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import {
  ResumeProcessing,
  RESUME_PROCESSING_SEQUENCE,
  RESUME_PROCESSING_STAGE_LABELS,
} from "../types/resume-processing.types";

interface ResumeProcessingTimelineProps {
  processing: ResumeProcessing | null;
}

export default function ResumeProcessingTimeline({
  processing,
}: ResumeProcessingTimelineProps) {
  if (!processing) return null;

  const stage = processing.stage;
  const isOutcome =
    stage === "needs_review" || stage === "rejected" || stage === "failed";
  const currentIndex = RESUME_PROCESSING_SEQUENCE.indexOf(stage);

  if (isOutcome) {
    const isError = stage === "failed";
    return (
      <div
        role="status"
        className={`flex items-start gap-2.5 rounded-sm border p-3 text-xs ${
          isError
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        }`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium">
            {RESUME_PROCESSING_STAGE_LABELS[stage]}
          </p>
          {processing.errorMessage && (
            <p className="leading-relaxed">{processing.errorMessage}</p>
          )}
          {processing.classificationReason && !processing.errorMessage && (
            <p className="leading-relaxed">
              {processing.classificationReason}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Resume processing progress"
      className="space-y-1.5 rounded-sm border border-border/70 bg-secondary/30 p-3"
    >
      {RESUME_PROCESSING_SEQUENCE.map((step, index) => {
        const isDone = currentIndex > index;
        const isActive = currentIndex === index;
        return (
          <div key={step} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
                isDone
                  ? "text-emerald-500"
                  : isActive
                    ? "text-primary"
                    : "text-muted-foreground/50"
              }`}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <span
              className={
                isDone || isActive
                  ? "text-foreground"
                  : "text-muted-foreground/70"
              }
            >
              {RESUME_PROCESSING_STAGE_LABELS[step]}
            </span>
          </div>
        );
      })}

      {(processing.documentType || processing.classificationConfidence !== null) && (
        <p className="pt-1 text-[11px] text-muted-foreground">
          {processing.documentType
            ? `Detected: ${processing.documentType}`
            : "Detected document type: pending"}
          {processing.classificationConfidence !== null
            ? ` (${Math.round(processing.classificationConfidence * 100)}% confidence)`
            : ""}
        </p>
      )}
    </div>
  );
}
