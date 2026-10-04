"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Eye,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingService } from "@/features/onboarding/services/onboarding.service";
import { toast } from "sonner";

interface ResumeMetadata {
  id: string;
  file_name: string;
  uploaded_at: string;
  status: string;
  walrus_blob_id?: string | null;
  walrus_status?: "pending" | "stored" | "failed" | null;
}

interface ProfileResumeCardProps {
  resumeId: string | null;
  expectedVersion: number;
  onProfileUpdated: () => Promise<unknown> | void;
  className?: string;
}

export function ProfileResumeCard({
  resumeId,
  expectedVersion,
  onProfileUpdated,
  className = "rounded-sm border border-border bg-card p-5 space-y-4 shadow-2xs h-full flex flex-col justify-between",
}: ProfileResumeCardProps) {
  const [metadata, setMetadata] = useState<ResumeMetadata | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadResumeMeta = async () => {
    try {
      setLoadingMeta(true);
      setMetaError(null);
      const res = await fetch("/api/profile/resume");
      if (!res.ok) {
        throw new Error("Unable to load resume details.");
      }
      const data = await res.json();
      setMetadata(data.resume || null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Unable to load resume details.";
      setMetaError(msg);
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoadingMeta(true);
        setMetaError(null);
        const res = await fetch("/api/profile/resume");
        if (!res.ok) {
          throw new Error("Unable to load resume details.");
        }
        const data = await res.json();
        if (!cancelled) {
          setMetadata(data.resume || null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Unable to load resume details.";
          setMetaError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("Please select a PDF document.");
      toast.error("File must be a PDF document.");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError("File size exceeds 5 MB limit.");
      toast.error("File size exceeds 5 MB limit.");
      return;
    }

    setUploadError(null);
    setIsProcessing(true);
    setProcessingStatus("Uploading resume PDF...");

    try {
      // 1. Upload file
      const uploadRes = await onboardingService.uploadResume(file);
      const newResumeId = uploadRes.resumeId;

      // 2. Extract and analyze via LLM
      setProcessingStatus("Extracting skills and work history...");
      await onboardingService.analyzeResume(newResumeId);

      // 3. Apply proposal to profile
      setProcessingStatus("Updating career profile...");
      const applyRes = await fetch("/api/profile/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: newResumeId,
          expected_version: expectedVersion,
        }),
      });

      if (!applyRes.ok) {
        const errData = await applyRes.json().catch(() => ({}));
        throw new Error(
          errData.error || "Failed to update profile from resume.",
        );
      }

      toast.success("Resume updated and profile synchronized.");
      await onProfileUpdated();
      await loadResumeMeta();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to process resume.";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formattedUploadDate = metadata?.uploaded_at
    ? new Date(metadata.uploaded_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="space-y-1.5 pb-3 border-b border-border/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Active Resume
            </h2>
          </div>

          {metadata ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span>Not Connected</span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Source document used for automated skill and experience extraction.
        </p>
      </div>

      {/* Body Content */}
      <div className="space-y-3 flex-1">
        {loadingMeta ? (
          <div className="p-4 rounded-sm bg-secondary/30 border border-border/60 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span>Loading document details...</span>
          </div>
        ) : metaError ? (
          <div className="p-3.5 rounded-sm bg-destructive/10 border border-destructive/20 space-y-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{metaError}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadResumeMeta()}
              className="text-xs h-8 rounded-sm border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Retry</span>
            </Button>
          </div>
        ) : metadata ? (
          <div className="p-3.5 rounded-sm bg-secondary/40 border border-border/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {metadata?.file_name || "Uploaded Resume Document"}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formattedUploadDate
                      ? `Uploaded ${formattedUploadDate}`
                      : "Active in profile"}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume privacy note: resumes are never published to Walrus */}
            <div className="pt-2.5 border-t border-border/70 text-xs">
              <p className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                This resume stays private in your account. We do not publish it
                to Walrus or any public network.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-sm bg-secondary/20 border border-dashed border-border/80 text-center space-y-1.5">
            <p className="text-xs font-medium text-foreground">
              No resume connected
            </p>
            <p className="text-[11px] text-muted-foreground">
              Upload your PDF resume to automatically refresh your work history
              and extract technical skills.
            </p>
          </div>
        )}

        {/* Processing State Indicator */}
        {isProcessing && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-sm bg-secondary border border-border text-xs text-foreground flex items-center gap-2.5 animate-in fade-in"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />
            <span className="font-medium text-[11px]">{processingStatus}</span>
          </div>
        )}

        {/* Error Alert */}
        {uploadError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-sm bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-medium">{uploadError}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border/60 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
          className="hidden"
          id="profile-resume-upload-input"
        />

        <div className="flex flex-col sm:flex-row gap-2">
          {metadata && (
            <a
              href="/api/profile/resume/view"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[44px] h-11 text-xs font-semibold gap-2 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-muted-foreground transition-all rounded-sm"
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span>View Resume</span>
              </Button>
            </a>
          )}

          <Button
            type="button"
            variant={metadata ? "outline" : "default"}
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className={`${
              metadata ? "flex-1" : "w-full"
            } min-h-[44px] h-11 text-xs font-semibold gap-2 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-muted-foreground transition-all rounded-sm`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span>Processing Resume...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>
                  {metadata ? "Replace Resume" : "Upload Resume (PDF)"}
                </span>
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Supported: PDF up to 5 MB. Stored privately in your account.
        </p>
      </div>
    </div>
  );
}
