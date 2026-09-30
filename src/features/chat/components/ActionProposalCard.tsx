"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Check, X, Loader2 } from "lucide-react";
import { ActionProposalData } from "@/types/chat";
import { profileClientService } from "@/features/profile/services/profile-client.service";
import {
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
} from "@/features/profile/types/career-profile.types";
import { toast } from "sonner";

interface ActionProposalCardProps {
  proposal: ActionProposalData;
  messageId?: string;
}

export default function ActionProposalCard({
  proposal,
  messageId,
}: ActionProposalCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(proposal.status === "applied");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const { proposedChanges, summary } = proposal;
  const hasWorkMode = Boolean(
    proposedChanges.workMode && proposedChanges.workMode.length > 0,
  );
  const hasRoles = Boolean(
    proposedChanges.targetRoles && proposedChanges.targetRoles.length > 0,
  );
  const hasLevel = Boolean(proposedChanges.targetLevel);

  const handleApply = async () => {
    try {
      setIsApplying(true);

      const loadedProfile = await profileClientService.getProfile();
      if (!loadedProfile) {
        throw new Error("Career profile not found. Please complete profile setup first.");
      }

      let currentProfile = loadedProfile;
      let currentVersion = currentProfile.profileVersion;

      if (hasWorkMode && proposedChanges.workMode) {
        currentProfile = await profileClientService.updatePreferences(
          {
            ...currentProfile.preferences,
            work_modes: proposedChanges.workMode,
          },
          currentProfile.constraints,
          currentVersion,
        );
        currentVersion = currentProfile.profileVersion;
      }

      if (hasRoles || hasLevel) {
        let mappedRoles: TargetRoleItem[] = currentProfile.careerIntent?.target_roles || [];
        if (proposedChanges.targetRoles && proposedChanges.targetRoles.length > 0) {
          mappedRoles = proposedChanges.targetRoles.map((role, idx) => ({
            role: role.trim(),
            priority: (idx === 0 ? "primary" : "secondary") as "primary" | "secondary",
          }));
        }

        const validLevel: TargetLevel =
          (proposedChanges.targetLevel as TargetLevel) ||
          currentProfile.careerIntent?.target_level ||
          "mid_level";

        const validEmployment: EmploymentType[] =
          (currentProfile.careerIntent?.employment_types as EmploymentType[])?.length
            ? (currentProfile.careerIntent.employment_types as EmploymentType[])
            : ["full_time"];

        currentProfile = await profileClientService.updateCareerIntent(
          {
            target_roles: mappedRoles,
            target_level: validLevel,
            employment_types: validEmployment,
          },
          currentVersion,
        );
        currentVersion = currentProfile.profileVersion;
      }

      setApplied(true);
      toast.success("Profile preferences updated successfully.");

      if (messageId) {
        fetch(`/api/chat/message/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action_proposal_status: "applied" }),
        }).catch((err) => {
          console.warn("Failed to persist proposal applied status:", err);
        });
      }
    } catch (err) {
      toast.error(
        (err as Error).message || "Failed to apply proposed changes.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Career preference update proposal"
      className="my-3 p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground tracking-tight block">
              Preference Update Proposal
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Finder detected a new preference in your conversation
            </span>
          </div>
        </div>

        {applied && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <Check className="w-3 h-3" />
            Applied
          </span>
        )}
      </div>

      <p className="text-xs text-foreground/90 font-sans leading-relaxed">
        {summary}
      </p>

      <div className="flex flex-wrap gap-2 pt-1 text-xs">
        {hasWorkMode && (
          <div className="px-2.5 py-1 rounded-md bg-secondary/60 border border-border/60 text-foreground/90">
            <span className="text-muted-foreground mr-1.5">Work Mode:</span>
            <span className="font-medium capitalize">
              {proposedChanges.workMode?.join(", ")}
            </span>
          </div>
        )}

        {hasRoles && (
          <div className="px-2.5 py-1 rounded-md bg-secondary/60 border border-border/60 text-foreground/90">
            <span className="text-muted-foreground mr-1.5">Roles:</span>
            <span className="font-medium">
              {proposedChanges.targetRoles?.join(", ")}
            </span>
          </div>
        )}

        {hasLevel && (
          <div className="px-2.5 py-1 rounded-md bg-secondary/60 border border-border/60 text-foreground/90">
            <span className="text-muted-foreground mr-1.5">Level:</span>
            <span className="font-medium capitalize">
              {proposedChanges.targetLevel}
            </span>
          </div>
        )}
      </div>

      {!applied && (
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply Update</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={isApplying}
            className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      )}
    </div>
  );
}
