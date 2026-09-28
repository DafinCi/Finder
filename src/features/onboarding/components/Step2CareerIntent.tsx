// ==============================================================================
// STEP 2: CAREER INTENT
// Module: @/features/onboarding/components/Step2CareerIntent
// ==============================================================================

"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  X,
  Star,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PRESET_TARGET_ROLES,
  SENIORITY_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  OnboardingFormState,
} from "../types/onboarding.types";
import {
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
} from "@/features/profile/types/career-profile.types";

interface Step2CareerIntentProps {
  state: OnboardingFormState;
  setTargetRoles: (roles: TargetRoleItem[]) => void;
  setTargetLevel: (level: TargetLevel) => void;
  setEmploymentTypes: (types: EmploymentType[]) => void;
  onSaveAndContinue: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

export function Step2CareerIntent({
  state,
  setTargetRoles,
  setTargetLevel,
  setEmploymentTypes,
  onSaveAndContinue,
  onBack,
  isSaving,
}: Step2CareerIntentProps) {
  const [customRoleInput, setCustomRoleInput] = useState("");

  const handleTogglePresetRole = (roleName: string) => {
    const exists = state.targetRoles.find(
      (r) => r.role.toLowerCase() === roleName.toLowerCase(),
    );

    if (exists) {
      const remaining = state.targetRoles.filter(
        (r) => r.role.toLowerCase() !== roleName.toLowerCase(),
      );
      // If we removed the only primary role, promote the first remaining role to primary
      if (
        exists.priority === "primary" &&
        remaining.length > 0 &&
        !remaining.some((r) => r.priority === "primary")
      ) {
        remaining[0].priority = "primary";
      }
      setTargetRoles(remaining);
    } else {
      // If first role, make it primary, otherwise secondary
      const priority = state.targetRoles.length === 0 ? "primary" : "secondary";
      setTargetRoles([...state.targetRoles, { role: roleName, priority }]);
    }
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;

    if (
      !state.targetRoles.some(
        (r) => r.role.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      const priority = state.targetRoles.length === 0 ? "primary" : "secondary";
      setTargetRoles([...state.targetRoles, { role: trimmed, priority }]);
    }
    setCustomRoleInput("");
  };

  const handleRemoveRole = (roleName: string) => {
    const remaining = state.targetRoles.filter((r) => r.role !== roleName);
    if (
      remaining.length > 0 &&
      !remaining.some((r) => r.priority === "primary")
    ) {
      remaining[0].priority = "primary";
    }
    setTargetRoles(remaining);
  };

  const handleTogglePriority = (roleName: string) => {
    setTargetRoles(
      state.targetRoles.map((r) => {
        if (r.role === roleName) {
          const newPriority =
            r.priority === "primary" ? "secondary" : "primary";
          return { ...r, priority: newPriority };
        }
        return r;
      }),
    );
  };

  const handleToggleEmploymentType = (type: EmploymentType) => {
    if (state.employmentTypes.includes(type)) {
      if (state.employmentTypes.length === 1) return; // Keep at least one
      setEmploymentTypes(state.employmentTypes.filter((t) => t !== type));
    } else {
      setEmploymentTypes([...state.employmentTypes, type]);
    }
  };

  const canContinue =
    state.targetRoles.length > 0 &&
    state.targetRoles.some((r) => r.priority === "primary") &&
    state.targetLevel !== null &&
    state.employmentTypes.length > 0;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold font-heading text-foreground tracking-tight">
          What are your career targets?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Define the roles and seniority you are actively seeking. Unlike your
          past resume history, this defines your immediate job search intent.
        </p>
      </div>

      {/* 1. Target Roles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            Target Roles (Select at least one)
          </label>
          <span className="text-[11px] text-muted-foreground">
            {state.targetRoles.length} selected
          </span>
        </div>

        {/* Selected Roles with Priority Pills */}
        {state.targetRoles.length > 0 && (
          <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Selected Targets (Click star to toggle Primary vs Secondary)
            </p>
            <div className="flex flex-wrap gap-2">
              {state.targetRoles.map((item) => {
                const isPrimary = item.priority === "primary";
                return (
                  <div
                    key={item.role}
                    className={`inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isPrimary
                        ? "bg-primary/10 border-primary/40 text-foreground shadow-2xs"
                        : "bg-secondary/40 border-border/80 text-muted-foreground"
                    }`}
                  >
                    <span>{item.role}</span>

                    <button
                      type="button"
                      onClick={() => handleTogglePriority(item.role)}
                      title={`Toggle priority (currently ${item.priority})`}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                        isPrimary
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      }`}
                    >
                      <Star
                        className={`w-3 h-3 ${isPrimary ? "fill-current" : ""}`}
                      />
                      {isPrimary ? "Primary" : "Secondary"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRole(item.role)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preset Roles Grid */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TARGET_ROLES.map((role) => {
            const isSelected = state.targetRoles.some(
              (r) => r.role.toLowerCase() === role.toLowerCase(),
            );
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleTogglePresetRole(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 border-primary/50 text-primary font-semibold"
                    : "bg-secondary/30 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {role}
              </button>
            );
          })}
        </div>

        {/* Custom Role Input */}
        <form onSubmit={handleAddCustomRole} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Add custom role (e.g. Solutions Architect)..."
            value={customRoleInput}
            onChange={(e) => setCustomRoleInput(e.target.value)}
            className="flex-1 bg-secondary/40 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!customRoleInput.trim()}
            className="text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </form>
      </div>

      {/* 2. Target Seniority Level */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-foreground block">
          Target Seniority Level (Select one)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SENIORITY_LEVEL_OPTIONS.map((opt) => {
            const isSelected = state.targetLevel === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTargetLevel(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground shadow-2xs"
                    : "bg-card/70 border-border/70 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span
                    className={`text-xs font-bold font-heading ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Employment Types */}
      <div className="space-y-2.5 pt-2">
        <label className="text-xs font-semibold text-foreground block">
          Opportunity Types (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-2">
          {EMPLOYMENT_TYPE_OPTIONS.map((opt) => {
            const isSelected = state.employmentTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleEmploymentType(opt.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 border-primary/50 text-primary font-semibold"
                    : "bg-secondary/30 border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/80">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onSaveAndContinue}
          disabled={!canContinue || isSaving}
          className="text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Work Preferences
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
