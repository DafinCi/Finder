"use client";

import React, { useState, useEffect } from "react";
import { Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OnboardingFormState,
  SENIORITY_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from "../types/onboarding.types";
import {
  TargetLevel,
  EmploymentType,
} from "@/features/profile/types/career-profile.types";

interface StepManualRoleProps {
  state: OnboardingFormState;
  setPrimaryRole: (roleTitle: string) => void;
  setTargetLevel: (level: TargetLevel) => void;
  setEmploymentTypes: (types: EmploymentType[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

const POPULAR_ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "Mobile Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Data Analyst",
  "Product Manager",
];

export function StepManualRole({
  state,
  setPrimaryRole,
  setTargetLevel,
  setEmploymentTypes,
  onNext,
  onBack,
  isSaving,
}: StepManualRoleProps) {
  const primaryRole =
    state.targetRoles.find((r) => r.priority === "primary")?.role ||
    state.targetRoles[0]?.role ||
    "";

  const [roleInput, setRoleInput] = useState(primaryRole);

  useEffect(() => {
    if (primaryRole && primaryRole !== roleInput) {
      setRoleInput(primaryRole);
    }
  }, [primaryRole]);

  const handleRoleSelect = (role: string) => {
    setRoleInput(role);
    setPrimaryRole(role);
  };

  const handleInputBlur = () => {
    if (roleInput.trim()) {
      setPrimaryRole(roleInput.trim());
    }
  };

  const handleToggleEmployment = (type: EmploymentType) => {
    const exists = state.employmentTypes.includes(type);
    if (exists) {
      if (state.employmentTypes.length === 1) return; // Keep at least one
      setEmploymentTypes(state.employmentTypes.filter((t) => t !== type));
    } else {
      setEmploymentTypes([...state.employmentTypes, type]);
    }
  };

  const currentLevel: TargetLevel = state.targetLevel || "mid_level";
  const canContinue = Boolean(roleInput.trim());

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          What role are you looking for?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tell us your ideal job title and current career stage so we can match
          relevant opportunities.
        </p>
      </div>

      {/* Target Role Field */}
      <div className="space-y-2.5">
        <label
          htmlFor="manual-target-role"
          className="text-xs font-semibold text-foreground block"
        >
          Target Job Title
        </label>
        <input
          id="manual-target-role"
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onBlur={handleInputBlur}
          placeholder="e.g. Frontend Engineer, Data Scientist"
          className="w-full min-h-[44px] px-3.5 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-colors"
        />

        {/* Quick Suggestions Chips */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground block">
            Popular suggestions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_ROLES.map((role) => {
              const isSelected =
                roleInput.trim().toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seniority Level */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground block">
          Experience Level
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SENIORITY_LEVEL_OPTIONS.map((opt) => {
            const isSelected = currentLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetLevel(opt.value)}
                className={`min-h-[44px] p-2.5 rounded-lg border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground block truncate mt-0.5">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground block">
          Employment Type
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = state.employmentTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleEmployment(opt.value)}
                className={`min-h-[44px] p-2.5 rounded-lg border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex items-center justify-between gap-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Options
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={async () => {
            if (roleInput.trim()) {
              setPrimaryRole(roleInput.trim());
            }
            await onNext();
          }}
          disabled={isSaving || !canContinue}
          className="min-h-[44px] text-xs font-semibold px-5"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            <>
              Next: Work Preferences
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
