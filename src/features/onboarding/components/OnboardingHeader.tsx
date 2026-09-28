// ==============================================================================
// ONBOARDING HEADER COMPONENT
// Module: @/features/onboarding/components/OnboardingHeader
// ==============================================================================

"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { OnboardingStepNumber } from "../types/onboarding.types";

interface OnboardingHeaderProps {
  currentStep: OnboardingStepNumber;
  isExistingActiveProfile?: boolean;
}

const STEPS = [
  { step: 1 as OnboardingStepNumber, label: "Resume & Background" },
  { step: 2 as OnboardingStepNumber, label: "Career Intent" },
  { step: 3 as OnboardingStepNumber, label: "Work & Constraints" },
  { step: 4 as OnboardingStepNumber, label: "Review & Confirm" },
];

export function OnboardingHeader({
  currentStep,
  isExistingActiveProfile = false,
}: OnboardingHeaderProps) {
  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <header className="w-full space-y-6">
      {/* Top Banner / Brand */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold font-heading text-foreground tracking-tight flex items-center gap-2">
              Finder V2 Career Setup
              {isExistingActiveProfile && (
                <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Profile Active
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              Deterministic, AI-assisted career profile onboarding
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-medium text-muted-foreground">
            Step <strong className="text-foreground">{currentStep}</strong> of{" "}
            {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-1.5 bg-secondary/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Indicators */}
      <nav aria-label="Onboarding Progress" className="grid grid-cols-4 gap-2">
        {STEPS.map((s) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;

          return (
            <div
              key={s.step}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                isCurrent
                  ? "bg-card border-primary/40 shadow-xs"
                  : isCompleted
                    ? "bg-card/40 border-border/70"
                    : "bg-transparent border-transparent opacity-60"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-muted-foreground border border-border/80"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
              </div>
              <span
                className={`text-xs font-medium truncate hidden sm:inline ${
                  isCurrent
                    ? "text-foreground font-semibold"
                    : isCompleted
                      ? "text-muted-foreground"
                      : "text-muted-foreground/80"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </nav>
    </header>
  );
}
