// ==============================================================================
// STEP 1: BACKGROUND & CV ENTRY (OPTIONAL)
// Module: @/features/onboarding/components/Step1BackgroundCv
// ==============================================================================

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingFormState } from "../types/onboarding.types";

interface Step1BackgroundCvProps {
  state: OnboardingFormState;
  onUploadAndAnalyze: (file: File) => Promise<void>;
  onContinueWithoutCv: () => Promise<void>;
  onContinueToStep2: () => void;
  isSaving: boolean;
}

export function Step1BackgroundCv({
  state,
  onUploadAndAnalyze,
  onContinueWithoutCv,
  onContinueToStep2,
  isSaving,
}: Step1BackgroundCvProps) {
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
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold font-heading text-foreground tracking-tight">
          Upload Your Resume (Optional)
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We will extract your background, education, and skills to bootstrap
          your profile. You can also skip this step and configure everything
          manually.
        </p>
      </div>

      {/* Error Alert */}
      {localError && (
        <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/30 flex items-center gap-2.5 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isBusy && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-sm p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5"
            : state.resumeExtracted
              ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
              : "border-border/80 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40"
        } ${isBusy ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isBusy}
        />

        {isBusy ? (
          <div className="space-y-3 py-4 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                {state.isUploadingResume
                  ? "Uploading PDF document..."
                  : "Analyzing resume with AI..."}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Extracting candidate skills, experience, and education evidence
              </p>
            </div>
          </div>
        ) : state.resumeExtracted ? (
          <div className="space-y-3 py-2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                {state.resumeFileName || "Resume Uploaded"}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">
                Successfully parsed &bull; {state.skills.length} skills detected
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2 underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Upload a different resume
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-2 flex flex-col items-center">
            <div className="w-11 h-11 rounded-sm bg-card border border-border flex items-center justify-center text-primary shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Click to browse or drag and drop your resume
              </p>
              <p className="text-[11px] text-muted-foreground">
                PDF format only, maximum 5 MB
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
              Saves 2 minutes of manual input
            </span>
          </div>
        )}
      </div>

      {/* Extracted Summary Preview (when resume is extracted) */}
      {state.resumeExtracted && (
        <div className="rounded-sm border border-border/80 bg-card/60 p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h3 className="text-xs font-semibold font-heading text-foreground">
              Extracted Profile Preview
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">
              Ready for verification in Step 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-sm bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Skills Detected
              </span>
              <p className="font-semibold text-foreground">
                {state.skills.length} Capabilities
              </p>
            </div>
            <div className="p-2.5 rounded-sm bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Education
              </span>
              <p className="font-semibold text-foreground truncate">
                {state.background.education[0]?.degree ||
                  (state.background.education.length > 0
                    ? `${state.background.education.length} Entries`
                    : "None found")}
              </p>
            </div>
            <div className="p-2.5 rounded-sm bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Work History
              </span>
              <p className="font-semibold text-foreground">
                {state.background.experience.length} Positions documented
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/80">
        <Button
          type="button"
          variant="ghost"
          onClick={onContinueWithoutCv}
          disabled={isBusy}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          Continue without CV
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={
            state.resumeExtracted ? onContinueToStep2 : onContinueWithoutCv
          }
          disabled={isBusy}
          className="text-xs"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {state.resumeExtracted
                ? "Continue to Career Goals"
                : "Set Up Manually"}
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
