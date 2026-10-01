"use client";

import React from "react";
import { Check, Compass } from "lucide-react";
import {
  OnboardingStepNumber,
  OnboardingFlowMode,
} from "../types/onboarding.types";

interface OnboardingHeaderProps {
  currentStep: OnboardingStepNumber;
  flowMode: OnboardingFlowMode;
  isExistingActiveProfile?: boolean;
}

const MANUAL_STEPS = [
  { step: 1 as OnboardingStepNumber, label: "Role & Level" },
  { step: 2 as OnboardingStepNumber, label: "Work & Location" },
  { step: 3 as OnboardingStepNumber, label: "Core Skills" },
];

export function OnboardingHeader({
  currentStep,
  flowMode,
  isExistingActiveProfile = false,
}: OnboardingHeaderProps) {
  // Manual flow progress calculation
  const manualStepIndex = Math.min(Math.max(currentStep, 1), 3);
  const progressPercent =
    flowMode === "cv_magic"
      ? 100
      : flowMode === "manual"
        ? (manualStepIndex / MANUAL_STEPS.length) * 100
        : 0;

  return (
    <header className="w-full space-y-5">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
              Career Setup
              {isExistingActiveProfile && (
                <span className="text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Profile Active
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {flowMode === "choice"
                ? "Fast job personalization based on your real skills"
                : flowMode === "cv_magic"
                  ? "Resume Review: Ready to match"
                  : "Quick 2-minute profile setup"}
            </p>
          </div>
        </div>

        {flowMode === "manual" && (
          <div className="text-right">
            <span className="text-xs font-medium text-muted-foreground">
              Step{" "}
              <strong className="text-foreground">{manualStepIndex}</strong> of{" "}
              {MANUAL_STEPS.length}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar (Visible during manual or CV review) */}
      {flowMode !== "choice" && (
        <div className="space-y-3">
          <div className="relative w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Pills for Manual Flow */}
          {flowMode === "manual" && (
            <nav aria-label="Setup Progress" className="grid grid-cols-3 gap-2">
              {MANUAL_STEPS.map((s) => {
                const isCompleted = manualStepIndex > s.step;
                const isCurrent = manualStepIndex === s.step;

                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isCurrent
                        ? "bg-card border-primary/40 shadow-2xs"
                        : isCompleted
                          ? "bg-card/40 border-border/70"
                          : "bg-transparent border-transparent opacity-60"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : isCurrent
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-secondary text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                    </div>
                    <span
                      className={`text-xs font-medium truncate ${
                        isCurrent
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
