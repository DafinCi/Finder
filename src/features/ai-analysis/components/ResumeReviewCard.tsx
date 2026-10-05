"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResumeReviewClassification {
  documentType: string;
  confidence: number;
  reason: string;
}

interface ResumeReviewCardProps {
  classification: ResumeReviewClassification;
  onContinue: () => void;
  onReject: () => void;
  isWorking?: boolean;
}

export default function ResumeReviewCard({
  classification,
  onContinue,
  onReject,
  isWorking = false,
}: ResumeReviewCardProps) {
  const confidence = Math.round(classification.confidence * 100);

  return (
    <div
      role="alert"
      className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            This document doesn&apos;t look like a resume
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We didn&apos;t find the sections we expect in a resume, such as
            work history, education, or skills. Detected type:{" "}
            {classification.documentType} ({confidence}% confidence).
          </p>
          {classification.reason && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {classification.reason}
            </p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            This file isn&apos;t saved to storage or Walrus. If you upload a
            different file, we&apos;ll remove this one.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onContinue}
          disabled={isWorking}
        >
          Continue anyway
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={isWorking}
        >
          Upload a different file
        </Button>
        {isWorking && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Working
          </span>
        )}
      </div>
    </div>
  );
}
