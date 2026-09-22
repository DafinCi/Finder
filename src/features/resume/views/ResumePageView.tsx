"use client";

import React, { useEffect } from "react";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { useResumeUpload } from "../hooks/useResumeUpload";
import ResumeDropzone from "../components/ResumeDropzone";
import ResumeAnalysisResult from "@/features/ai-analysis/components/ResumeAnalysisResult";
import ResumeSkeleton from "../skeletons/ResumeSkeleton";

export default function ResumePageView() {
  const {
    step,
    errorMsg,
    analysisResult,
    isChecking,
    resumeDate,
    processResume,
    checkExistingResume,
    resetFlow,
  } = useResumeUpload();

  useEffect(() => {
    checkExistingResume();
  }, [checkExistingResume]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Recently";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(isoString));
    } catch {
      return "Recently";
    }
  };

  // Determine if AI pipeline is running
  const isProcessing =
    step !== "idle" && step !== "success" && step !== "error";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* SECTION 1: Page Header */}
      <header className="py-4 border-b border-border/60">
        <h1 className="text-[28px] md:text-[32px] font-semibold font-heading tracking-tight text-foreground">
          Resume Intelligence
        </h1>
        <p className="text-[15px] text-muted-foreground font-sans mt-1">
          Upload and process your profile data to extract actionable career
          intelligence.
        </p>
      </header>

      {/* LOADING STATE (INITIAL CHECK) */}
      {isChecking && (
        <div className="py-4">
          <ResumeSkeleton />
        </div>
      )}

      {/* STATE: IDLE OR PROCESSING (Embedded inside Dropzone) */}
      {!isChecking && (step === "idle" || isProcessing) && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ResumeDropzone
            onFileUpload={processResume}
            currentStep={step}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* STATE: SUCCESS */}
      {!isChecking && step === "success" && analysisResult && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Active Resume Context Ribbon */}
          <div className="flex items-center justify-between p-4 border border-border bg-card/50 rounded-[6px]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/80 rounded-[6px] text-foreground border border-border">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-medium text-foreground">
                  Current Engine Profile
                </h4>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Synchronized on {formatDate(resumeDate)}
                </p>
              </div>
            </div>
            <button
              onClick={resetFlow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-border bg-background hover:bg-secondary text-[12px] font-medium transition-colors duration-150"
            >
              <Plus className="w-3.5 h-3.5" />
              Reupload
            </button>
          </div>

          {/* AI Result Component Layer */}
          <ResumeAnalysisResult data={analysisResult} />

          {/* Bottom Refresh Action */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={resetFlow}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-card/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-[13px] font-medium rounded-[6px] transition-colors duration-150"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-calibrate System Profile
            </button>
          </div>
        </div>
      )}

      {/* STATE: ERROR */}
      {!isChecking && step === "error" && (
        <div className="p-4 border border-destructive/20 bg-destructive/5 text-destructive rounded-[6px] flex justify-between items-center animate-in fade-in duration-300">
          <span className="text-[13px] font-medium font-sans">
            {errorMsg || "An error occurred during system calculation."}
          </span>
          <button
            onClick={resetFlow}
            className="text-[13px] font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
