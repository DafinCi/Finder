"use client";

import React from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileConfirmationCardProps {
  fileName: string;
  onApply: () => void;
  onDismiss: () => void;
  isWorking?: boolean;
}

export default function ProfileConfirmationCard({
  fileName,
  onApply,
  onDismiss,
  isWorking = false,
}: ProfileConfirmationCardProps) {
  return (
    <div
      role="region"
      aria-label="Save resume to career profile"
      className="rounded-sm border border-border bg-secondary/40 p-4 space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <FileText className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Save this resume to your career profile
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Saving {fileName} updates your skills and work history. Preferences
            you already confirmed stay as they are.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onApply}
          disabled={isWorking}
        >
          Save to profile
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          disabled={isWorking}
        >
          Not now
        </Button>
        {isWorking && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving
          </span>
        )}
      </div>
    </div>
  );
}
