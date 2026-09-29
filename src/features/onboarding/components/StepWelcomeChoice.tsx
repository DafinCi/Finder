"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
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
    <div className="space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Let us find the right jobs for you
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Choose how you would like to set up your profile. Both options get you
          to matching jobs in under two minutes.
        </p>
      </div>

      {localError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-between gap-2.5 text-destructive text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            className="text-destructive hover:opacity-75 cursor-pointer p-0.5 rounded-xs focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Option A: Resume Upload (Fastest) */}
        <div className="flex flex-col justify-between rounded-xl border border-primary/30 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3.5 h-3.5" />
                Fastest (30 seconds)
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">
                Upload your resume
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We will automatically extract your roles, seniority, and skills
                so you can review them and start searching immediately.
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
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resume parsed successfully</span>
                </div>
                <p className="text-xs font-semibold text-foreground truncate">
                  {state.resumeFileName || "Uploaded Resume"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.skills.length} skills ready for review
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline pt-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  Upload a different file
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
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isDragOver
                    ? "border-primary bg-primary/10"
                    : "border-border/80 hover:border-primary/50 bg-secondary/30 hover:bg-secondary/50"
                } ${isBusy ? "opacity-75 pointer-events-none" : ""}`}
              >
                {isBusy ? (
                  <div className="py-2 flex flex-col items-center space-y-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-xs font-medium text-foreground">
                      {state.isUploadingResume
                        ? "Uploading PDF document..."
                        : "Reading your resume..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-primary">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        Drop your PDF here or click to browse
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        PDF format up to 5 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="pt-6">
            {state.resumeExtracted ? (
              <Button
                type="button"
                variant="default"
                onClick={onGoToCvReview}
                disabled={isBusy}
                className="w-full min-h-[44px] text-sm font-semibold justify-center"
              >
                Review and Find Jobs
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="w-full min-h-[44px] text-sm font-semibold justify-center"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Select Resume PDF
              </Button>
            )}
          </div>
        </div>

        {/* Option B: Manual Setup */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm hover:border-border/80 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                3 Questions
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">
                Set up manually
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No resume on hand? Answer three quick questions about your
                target role, work mode, and skills.
              </p>
            </div>

            <div className="rounded-lg bg-secondary/30 border border-border/70 p-4 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Target role and experience level</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Work mode and location preferences</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Top skills and technologies</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onStartManual}
              disabled={isBusy}
              className="w-full min-h-[44px] text-sm font-semibold justify-center hover:bg-secondary"
            >
              Start 2-Minute Setup
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
