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
  "DevOps / SRE",
  "UI/UX Designer",
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

  const [prevPrimaryRole, setPrevPrimaryRole] = useState(primaryRole);
  if (primaryRole && primaryRole !== prevPrimaryRole) {
    setPrevPrimaryRole(primaryRole);
    setRoleInput(primaryRole);
  }

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
      if (state.employmentTypes.length === 1) return;
      setEmploymentTypes(state.employmentTypes.filter((t) => t !== type));
    } else {
      setEmploymentTypes([...state.employmentTypes, type]);
    }
  };

  const currentLevel: TargetLevel = state.targetLevel || "mid_level";
  const canContinue = Boolean(roleInput.trim());

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
          What role are you targeting?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Specify your target job title, seniority, and employment type.
        </p>
      </div>

      {/* Target Role Input & Chips */}
      <div className="space-y-2">
        <label
          htmlFor="manual-target-role"
          className="text-xs sm:text-sm font-semibold text-foreground block"
        >
          Target Job Title
        </label>
        <input
          id="manual-target-role"
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onBlur={handleInputBlur}
          placeholder="e.g. Frontend Engineer, Product Manager"
          className="w-full min-h-[42px] px-3.5 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none transition-colors"
        />

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-xs text-muted-foreground shrink-0">
            Popular:
          </span>
          {POPULAR_ROLES.map((role) => {
            const isSelected =
              roleInput.trim().toLowerCase() === role.toLowerCase();
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
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

      {/* Seniority Level */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm font-semibold text-foreground block">
          Experience Level
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SENIORITY_LEVEL_OPTIONS.map((opt) => {
            const isSelected = currentLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetLevel(opt.value)}
                className={`py-2 px-2 rounded-sm border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground font-semibold"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs sm:text-sm block truncate">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm font-semibold text-foreground block">
          Employment Type
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = state.employmentTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleEmployment(opt.value)}
                className={`py-2 px-3 rounded-sm border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground font-semibold"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm">{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3.5 flex items-center justify-between gap-3 border-t border-border/80">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="min-h-[44px] text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
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
          className="min-h-[44px] text-sm font-semibold px-5 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            <>
              Next: Work Preferences
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
