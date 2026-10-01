"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingFormState } from "../types/onboarding.types";

interface StepWelcomeChoiceProps {
  state: OnboardingFormState;
  onUploadAndAnalyze: (file: File) => Promise<void>;
  onStartManual: () => void;
  onGoToCvReview: () => void;
  isSaving: boolean;
}

export function StepWelcomeChoice({
  state,
  onUploadAndAnalyze,
  onStartManual,
  onGoToCvReview,
  isSaving,
}: StepWelcomeChoiceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await validateAndProcessFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await validateAndProcessFile(file);
  };

  const validateAndProcessFile = async (file: File) => {
    setLocalError(null);

    if (file.type !== "application/pdf") {
      setLocalError("Please upload a PDF document (.pdf format only).");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setLocalError(
        "Document exceeds the 5 MB limit. Please choose a smaller PDF.",
      );
      return;
    }

    await onUploadAndAnalyze(file);
  };

  const isBusy = state.isUploadingResume || state.isAnalyzingResume || isSaving;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
          Personalize Your Job Matches
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Choose how you would like to set up your profile in under two minutes.
        </p>
      </div>

      {localError && (
        <div
          role="alert"
          className="p-3 rounded-sm bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-2.5 text-destructive text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            className="text-destructive hover:opacity-75 cursor-pointer p-0.5"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2 Equal Sized Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Option A: Resume Upload (Fastest) */}
        <div className="flex flex-col justify-between rounded-sm border border-border bg-secondary/20 p-5 hover:border-border/80 transition-colors space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground">
                Fastest (30 seconds)
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-heading">
                Upload your resume
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Extract your roles, seniority, and skills automatically to
                review instantly.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isBusy}
            />

            {state.resumeExtracted ? (
              <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resume parsed successfully</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {state.resumeFileName || "Uploaded Resume"}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline pt-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replace file
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isBusy && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!isBusy) fileInputRef.current?.click();
                  }
                }}
                className={`border border-dashed rounded-sm p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  isDragOver
                    ? "border-foreground bg-secondary/80"
                    : "border-border/80 hover:border-border bg-secondary/40 hover:bg-secondary/60"
                } ${isBusy ? "opacity-75 pointer-events-none" : ""}`}
              >
                {isBusy ? (
                  <div className="py-2 flex flex-col items-center space-y-2">
                    <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {state.isUploadingResume
                        ? "Uploading PDF document..."
                        : "Reading your resume..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-sm bg-card border border-border flex items-center justify-center text-foreground">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Drop PDF here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF format up to 5 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            {state.resumeExtracted ? (
              <Button
                type="button"
                variant="default"
                onClick={onGoToCvReview}
                disabled={isBusy}
                className="w-full min-h-[44px] text-sm font-semibold justify-center cursor-pointer"
              >
                Review and Find Jobs
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="w-full min-h-[44px] text-sm font-semibold justify-center cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Select Resume PDF
              </Button>
            )}
          </div>
        </div>

        {/* Option B: Manual Setup */}
        <div className="flex flex-col justify-between rounded-sm border border-border bg-secondary/20 p-5 hover:border-border/80 transition-colors space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground">
                3 Questions
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-heading">
                Set up manually
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No resume handy? Answer three quick questions to start matching.
              </p>
            </div>

            <div className="rounded-sm bg-secondary/40 border border-border/70 p-3 sm:p-4 space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-foreground/90 font-medium">
                  Target role &amp; experience level
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-foreground/90 font-medium">
                  Work mode &amp; location preferences
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-card border border-border text-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-foreground/90 font-medium">
                  Core skills &amp; technologies
                </span>
              </div>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={onStartManual}
              disabled={isBusy}
              className="w-full min-h-[44px] text-sm font-semibold justify-center hover:bg-secondary cursor-pointer"
            >
              Start 2-Minute Setup
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
