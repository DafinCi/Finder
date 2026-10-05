"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WalrusStatusState {
  resumeFileName: string | null;
  snapshotBlobId: string | null;
  snapshotUpdatedAt: string | null;
  network: string;
  writeConfigured: boolean;
}

const INCLUDED_FIELDS = [
  "Skills",
  "Target roles",
  "Employment types",
  "Career level",
];

const EXCLUDED_FIELDS = [
  "Name and contact details",
  "Education and employers",
  "Salary and location",
  "Account and wallet identifiers",
];

export function WalrusStorageCard() {
  const [data, setData] = useState<WalrusStatusState>({
    resumeFileName: null,
    snapshotBlobId: null,
    snapshotUpdatedAt: null,
    network: "mainnet",
    writeConfigured: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishingSnapshot, setIsPublishingSnapshot] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadWalrusData = useCallback(async (): Promise<WalrusStatusState> => {
    const [resumeRes, snapshotRes] = await Promise.all([
      fetch("/api/profile/resume"),
      fetch("/api/profile/snapshot/walrus"),
    ]);

    const resumeJson = resumeRes.ok ? await resumeRes.json() : null;
    const snapshotJson = snapshotRes.ok ? await snapshotRes.json() : null;

    return {
      resumeFileName: resumeJson?.resume?.file_name || null,
      snapshotBlobId: snapshotJson?.blobId || null,
      snapshotUpdatedAt: snapshotJson?.updatedAt || null,
      network: snapshotJson?.network || "mainnet",
      writeConfigured: Boolean(snapshotJson?.writeConfigured),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadWalrusData()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        // Keep the last known state; the card shows an explanatory empty state.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadWalrusData]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedKey(key);
        toast.success("Blob ID copied to clipboard.");
        setTimeout(() => setCopiedKey(null), 2000);
      })
      .catch(() => toast.error("Could not copy the Blob ID."));
  };

  const handlePublishSnapshot = async () => {
    setIsPublishingSnapshot(true);
    try {
      const res = await fetch("/api/profile/snapshot/walrus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPublic: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to publish the passport.");
      }
      toast.success("Public passport published to Walrus.", {
        description: "Only the minimized profile fields were published.",
      });
      setShowPublishConfirm(false);
      loadWalrusData()
        .then(setData)
        .catch(() => {
          // Best effort: the published blob loads on the next card open.
        });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setIsPublishingSnapshot(false);
    }
  };

  const networkLabel =
    data.network === "mainnet" ? "Walrus Mainnet" : `Walrus ${data.network}`;

  return (
    <div className="rounded-sm border border-border bg-card p-5 space-y-5 shadow-xs text-foreground">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-sm bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-heading text-foreground">
              Walrus Storage &amp; Memory
            </h3>
            <p className="text-xs text-muted-foreground font-sans">
              Career memories live on Walrus. Resumes stay private.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-foreground border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {networkLabel}
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span>Checking storage state</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resume privacy */}
          <div className="p-3.5 rounded-sm bg-secondary/30 border border-border/70 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span>Resume document</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {data.resumeFileName
                ? `${data.resumeFileName} stays private in your account. We never publish your resume to Walrus or any public network.`
                : "No resume connected yet. When you upload one, it stays private in your account."}
            </p>
          </div>

          {/* Public passport */}
          <div className="p-3.5 rounded-sm bg-secondary/30 border border-border/70 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Public career passport</span>
              </div>
              {data.snapshotBlobId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                  Not published
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Optionally publish a minimized profile you can share. It contains
              only skills, target roles, employment types, and career level.
            </p>

            {data.snapshotBlobId && (
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
                    aria-label="Copy passport Blob ID"
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
                <a
                  href={data.snapshotBlobId ? `https://walruscan.com/${data.network}/blob/${data.snapshotBlobId}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Inspect on Walruscan
                </a>
              </div>
            )}

            {showPublishConfirm ? (
              <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-foreground">
                  Publish this public passport?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground block">
                      Included
                    </span>
                    <ul className="text-muted-foreground space-y-0.5 list-disc pl-3">
                      {INCLUDED_FIELDS.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground block">
                      Not included
                    </span>
                    <ul className="text-muted-foreground space-y-0.5 list-disc pl-3">
                      {EXCLUDED_FIELDS.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Walrus blobs are public. Anyone with the link can read this
                  passport, and deletion is not guaranteed.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePublishSnapshot}
                    disabled={isPublishingSnapshot}
                  >
                    {isPublishingSnapshot
                      ? "Publishing..."
                      : "Publish public passport"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPublishConfirm(false)}
                    disabled={isPublishingSnapshot}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-1 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={!data.writeConfigured}
                  className="h-8 text-xs font-semibold gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {data.snapshotBlobId
                      ? "Update public passport"
                      : "Create public passport"}
                  </span>
                </Button>
                {!data.writeConfigured && (
                  <p className="flex items-start gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    Public archival is not configured for this deployment. Ask
                    the operator to set WALRUS_PUBLISHER_URL.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Architecture */}
          <div className="p-3 rounded-sm bg-secondary/15 border border-border/50 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span>How this works</span>
            </div>
            <p>
              Career memories are stored on Walrus through MemWal and power your
              chat personalization. The public passport is published only when
              you confirm, and only with the minimized fields above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
