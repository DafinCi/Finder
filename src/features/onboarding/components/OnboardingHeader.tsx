"use client";

import React from "react";
import { Compass } from "lucide-react";
import {
  OnboardingStepNumber,
  OnboardingFlowMode,
} from "../types/onboarding.types";

interface OnboardingHeaderProps {
  currentStep: OnboardingStepNumber;
  flowMode: OnboardingFlowMode;
  isExistingActiveProfile?: boolean;
}

const TOTAL_MANUAL_STEPS = 3;

export function OnboardingHeader({
  currentStep,
  flowMode,
  isExistingActiveProfile = false,
}: OnboardingHeaderProps) {
  const manualStepIndex = Math.min(
    Math.max(currentStep, 1),
    TOTAL_MANUAL_STEPS,
  );
  const progressPercent =
    flowMode === "cv_magic"
      ? 100
      : flowMode === "manual"
        ? (manualStepIndex / TOTAL_MANUAL_STEPS) * 100
        : 0;

  return (
    <header className="w-full space-y-2.5">
      {/* Top Meta Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 truncate">
            {isExistingActiveProfile && (
              <span className="text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Active Profile
              </span>
            )}
          </div>
        </div>

        {flowMode === "manual" && (
          <span className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
            Step <strong className="text-foreground">{manualStepIndex}</strong>{" "}
            of {TOTAL_MANUAL_STEPS}
          </span>
        )}

        {flowMode === "cv_magic" && (
          <span className="text-xs sm:text-sm font-medium text-emerald-400 shrink-0">
            Resume Extracted
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {flowMode !== "choice" && (
        <div className="relative w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
}
