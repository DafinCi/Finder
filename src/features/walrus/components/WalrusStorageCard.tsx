"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WalrusStatusState {
  resumeBlobId: string | null;
  resumeFileName: string | null;
  resumeWalrusStatus: string | null;
  snapshotBlobId: string | null;
  snapshotUpdatedAt: string | null;
}

export function WalrusStorageCard() {
  const [data, setData] = useState<WalrusStatusState>({
    resumeBlobId: null,
    resumeFileName: null,
    resumeWalrusStatus: null,
    snapshotBlobId: null,
    snapshotUpdatedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingResume, setIsSyncingResume] = useState(false);
  const [isPublishingSnapshot, setIsPublishingSnapshot] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchWalrusData = async () => {
    try {
      setIsLoading(true);
      const [resumeRes, snapshotRes] = await Promise.all([
        fetch("/api/profile/resume"),
        fetch("/api/profile/snapshot/walrus"),
      ]);

      const resumeJson = resumeRes.ok ? await resumeRes.json() : null;
      const snapshotJson = snapshotRes.ok ? await snapshotRes.json() : null;

      setData({
        resumeBlobId: resumeJson?.resume?.walrus_blob_id || null,
        resumeFileName: resumeJson?.resume?.file_name || null,
        resumeWalrusStatus: resumeJson?.resume?.walrus_status || null,
        snapshotBlobId: snapshotJson?.blobId || null,
        snapshotUpdatedAt: snapshotJson?.updatedAt || null,
      });
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchWalrusData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Blob ID copied to clipboard.");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSyncResume = async () => {
    try {
      setIsSyncingResume(true);
      const res = await fetch("/api/profile/resume/walrus-sync", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to publish resume to Walrus.");
      }
      toast.success("Resume synchronized to Walrus Testnet.");
      await fetchWalrusData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setIsSyncingResume(false);
    }
  };

  const handlePublishSnapshot = async () => {
    try {
      setIsPublishingSnapshot(true);
      const res = await fetch("/api/profile/snapshot/walrus", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create sovereign snapshot.");
      }
      toast.success("Career Passport snapshot published to Walrus.");
      await fetchWalrusData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Snapshot failed.");
    } finally {
      setIsPublishingSnapshot(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-xs text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-heading text-foreground">
              Walrus Decentralized Storage &amp; Memory
            </h3>
            <p className="text-xs text-muted-foreground font-sans">
              Verifiable decentralized storage and sovereign career data on Sui
              Walrus
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-foreground border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Walrus Testnet
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span>Checking Walrus storage state...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section 1: Active Resume Document Blob */}
          <div className="p-3.5 rounded-lg bg-secondary/30 border border-border/70 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Resume Document Blob</span>
              </div>

              {data.resumeBlobId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Stored (50 Epochs)
                </span>
              ) : data.resumeWalrusStatus === "pending" || isSyncingResume ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing to Walrus...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                  Not Synced
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {data.resumeFileName
                ? `Active document: ${data.resumeFileName}`
                : "No resume document connected to this profile."}
            </p>

            {data.resumeBlobId ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/80 border border-border text-[11px]">
                  <span
                    className="font-mono text-foreground font-medium truncate max-w-[220px]"
                    title={data.resumeBlobId}
                  >
                    {data.resumeBlobId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.resumeBlobId!, "resume")}
                    aria-label="Copy resume Blob ID"
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy Blob ID"
                  >
                    {copiedKey === "resume" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[11px] pt-0.5">
                  <a
                    href={`/api/walrus/blob/${data.resumeBlobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Open Walrus PDF</span>
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <a
                    href={`https://walruscan.com/testnet/blob/${data.resumeBlobId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Inspect on Walruscan</span>
                  </a>
                </div>
              </div>
            ) : data.resumeFileName ? (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncResume}
                  disabled={isSyncingResume}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isSyncingResume ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>Publish Resume to Walrus</span>
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Section 2: Sovereign Career Passport Snapshot */}
          <div className="p-3.5 rounded-lg bg-secondary/30 border border-border/70 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <span>Sovereign Career Passport</span>
              </div>

              {data.snapshotBlobId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Anchored (50 Epochs)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                  Not Anchored
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              A standardized, portable JSON snapshot of your verified skills,
              experience, and career targets stored on decentralized Walrus.
            </p>

            {data.snapshotBlobId ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/80 border border-border text-[11px]">
                  <span
                    className="font-mono text-foreground font-medium truncate max-w-[220px]"
                    title={data.snapshotBlobId}
                  >
                    {data.snapshotBlobId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(data.snapshotBlobId!, "snapshot")}
                    aria-label="Copy snapshot Blob ID"
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy Blob ID"
                  >
                    {copiedKey === "snapshot" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${data.snapshotBlobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Raw JSON</span>
                    </a>
                    <span className="text-muted-foreground">•</span>
                    <a
                      href={`https://walruscan.com/testnet/blob/${data.snapshotBlobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Verify on Walruscan</span>
                    </a>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePublishSnapshot}
                    disabled={isPublishingSnapshot}
                    className="h-7 text-[11px] gap-1 px-2.5"
                  >
                    {isPublishingSnapshot ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>Update Snapshot</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePublishSnapshot}
                  disabled={isPublishingSnapshot}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  {isPublishingSnapshot ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Publishing to Walrus...</span>
                    </>
                  ) : (
                    <span>Create Career Passport Snapshot</span>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Section 3: Protocol Architecture Details */}
          <div className="p-3 rounded-lg bg-secondary/15 border border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Decentralized Architecture Specs</span>
            </div>
            <p>
              Stored on Walrus Testnet with 50 epochs storage guarantee (~50
              days lifetime). Blobs use RS2 erasure coding distributed across
              independent Byzantine fault-tolerant storage nodes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
