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
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
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
}

export function ProfileResumeCard({
  resumeId,
  expectedVersion,
  onProfileUpdated,
}: ProfileResumeCardProps) {
  const [metadata, setMetadata] = useState<ResumeMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedBlobId, setCopiedBlobId] = useState(false);
  const [isSyncingWalrus, setIsSyncingWalrus] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadResumeMeta = async () => {
    try {
      setLoadingMeta(true);
      const res = await fetch("/api/profile/resume");
      if (res.ok) {
        const data = await res.json();
        setMetadata(data.resume || null);
      }
    } catch {
      // Fallback: metadata will show clean default
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoadingMeta(true);
        const res = await fetch("/api/profile/resume");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setMetadata(data.resume || null);
          }
        }
      } catch {
        // Fallback
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

  const handleCopyBlobId = (blobId: string) => {
    navigator.clipboard.writeText(blobId);
    setCopiedBlobId(true);
    toast.success("Walrus Blob ID copied to clipboard.");
    setTimeout(() => setCopiedBlobId(false), 2000);
  };

  const handleSyncToWalrus = async () => {
    try {
      setIsSyncingWalrus(true);
      const res = await fetch("/api/profile/resume/walrus-sync", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish to Walrus.");
      }

      toast.success("Resume synchronized to Walrus Testnet.");
      await loadResumeMeta();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error.";
      toast.error(msg);
    } finally {
      setIsSyncingWalrus(false);
    }
  };

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
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-2xs h-full flex flex-col justify-between">
      {/* Header */}
      <div className="space-y-1.5 pb-3 border-b border-border/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Active Resume
            </h2>
          </div>

          {metadata ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Connected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
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
          <div className="p-4 rounded-lg bg-secondary/30 border border-border/60 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Loading document details...</span>
          </div>
        ) : metadata ? (
          <div className="p-3.5 rounded-lg bg-secondary/40 border border-border/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
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

            {/* Walrus Decentralized Storage Status Block */}
            <div className="pt-2.5 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Walrus Decentralized Storage:
                </span>

                {metadata?.walrus_blob_id ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Stored
                  </span>
                ) : metadata?.walrus_status === "pending" || isSyncingWalrus ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSyncToWalrus}
                    disabled={isSyncingWalrus}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Sync to Walrus
                  </button>
                )}
              </div>

              {metadata?.walrus_blob_id && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-md bg-secondary/80 border border-border text-[11px]">
                    <span
                      className="font-mono text-foreground font-medium truncate max-w-[170px]"
                      title={metadata.walrus_blob_id}
                    >
                      {metadata.walrus_blob_id.slice(0, 8)}...
                      {metadata.walrus_blob_id.slice(-6)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBlobId(metadata.walrus_blob_id!)}
                      aria-label="Copy Walrus Blob ID"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy Blob ID"
                    >
                      {copiedBlobId ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] pt-0.5">
                    <a
                      href={`/api/walrus/blob/${metadata.walrus_blob_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Open Walrus PDF</span>
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={`https://walruscan.com/testnet/blob/${metadata.walrus_blob_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Verify on Walruscan</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-secondary/20 border border-dashed border-border/80 text-center space-y-1.5">
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
            className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2.5 animate-in fade-in"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="font-medium text-[11px]">{processingStatus}</span>
          </div>
        )}

        {/* Error Alert */}
        {uploadError && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2"
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
                className="w-full min-h-[44px] h-11 text-xs font-semibold gap-2 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary transition-all"
              >
                <Eye className="w-4 h-4 text-primary" />
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
            } min-h-[44px] h-11 text-xs font-semibold gap-2 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary transition-all`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
          Supported: PDF up to 5 MB. Dual-stored on Cloud &amp; Walrus Testnet.
        </p>
      </div>
    </div>
  );
}
