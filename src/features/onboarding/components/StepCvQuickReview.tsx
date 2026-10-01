"use client";

import React, { useState } from "react";
import {
  FileText,
  RotateCcw,
  Check,
  X,
  Plus,
  Loader2,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OnboardingFormState,
  SENIORITY_LEVEL_OPTIONS,
  WORK_MODE_OPTIONS,
  COMMON_POPULAR_SKILLS,
} from "../types/onboarding.types";
import {
  TargetLevel,
  WorkMode,
  SkillCategory,
} from "@/features/profile/types/career-profile.types";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";

interface StepCvQuickReviewProps {
  state: OnboardingFormState;
  setPrimaryRole: (roleTitle: string) => void;
  setTargetLevel: (level: TargetLevel) => void;
  setWorkModes: (modes: WorkMode[]) => void;
  removeSkill: (skillName: string) => void;
  addCustomSkill: (skillName: string, category: SkillCategory) => void;
  onConfirmAndExplore: () => Promise<void>;
  onSwitchToManual: () => void;
  onUploadDifferentResume: () => void;
  isSaving: boolean;
}

export function StepCvQuickReview({
  state,
  setPrimaryRole,
  setTargetLevel,
  setWorkModes,
  removeSkill,
  addCustomSkill,
  onConfirmAndExplore,
  onSwitchToManual,
  onUploadDifferentResume,
  isSaving,
}: StepCvQuickReviewProps) {
  const [roleInput, setRoleInput] = useState(() => {
    const primary = state.targetRoles.find((r) => r.priority === "primary");
    return primary?.role || state.targetRoles[0]?.role || "Software Engineer";
  });
  const [newSkillInput, setNewSkillInput] = useState("");

  const handleRoleBlur = () => {
    if (roleInput.trim()) {
      setPrimaryRole(roleInput.trim());
    }
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRoleBlur();
    }
  };

  const handleToggleWorkMode = (mode: WorkMode) => {
    const exists = state.workModes.includes(mode);
    if (exists) {
      if (state.workModes.length === 1) {
        return; // Keep at least one selected
      }
      setWorkModes(state.workModes.filter((m) => m !== mode));
    } else {
      setWorkModes([...state.workModes, mode]);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    addCustomSkill(trimmed, "core");
    setNewSkillInput("");
  };

  const currentLevel: TargetLevel = state.targetLevel || "mid_level";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Review your profile
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Here is what we extracted from your resume. Everything can be adjusted
          here, and fine-tuned anytime later in your Profile.
        </p>
      </div>

      {/* Resume File Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-sm bg-secondary/40 border border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {state.resumeFileName || "Uploaded Resume"}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium">
              Parsed successfully
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onUploadDifferentResume}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-sm px-1 py-0.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Replace resume
        </button>
      </div>

      {/* Section 1: Target Role */}
      <div className="space-y-2">
        <label
          htmlFor="primary-role-input"
          className="text-xs font-semibold text-foreground block"
        >
          Target Job Title
        </label>
        <input
          id="primary-role-input"
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onBlur={handleRoleBlur}
          onKeyDown={handleRoleKeyDown}
          placeholder="e.g. Frontend Engineer, Product Manager"
          className="w-full min-h-[44px] px-3.5 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-colors"
        />
        <p className="text-[11px] text-muted-foreground">
          Tip: You can change this title anytime to focus your matching results.
        </p>
      </div>

      {/* Section 2: Seniority Level */}
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
                className={`min-h-[44px] p-2.5 rounded-sm border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
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

      {/* Section 3: Work Mode */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground block">
          Work Environment
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {WORK_MODE_OPTIONS.map((opt) => {
            const isSelected = state.workModes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleWorkMode(opt.value)}
                className={`min-h-[44px] p-2.5 rounded-sm border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
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
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 4: Extracted Skills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Top Skills ({state.skills.length})
          </span>
          <span className="text-[11px] text-muted-foreground">
            Click X to remove any irrelevant skill
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-sm border border-border/80 bg-secondary/20 min-h-[56px] items-center">
          {state.skills.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No skills selected yet. Add one below.
            </p>
          ) : (
            state.skills.map((s) => (
              <span
                key={s.skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-card border border-border text-foreground shadow-2xs"
              >
                <span>{s.skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(s.skill)}
                  aria-label={`Remove ${s.skill}`}
                  className="text-muted-foreground hover:text-destructive cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xs p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Quick Suggestions */}
        {state.skills.length < 5 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-muted-foreground mr-1">
              Suggestions:
            </span>
            {COMMON_POPULAR_SKILLS.filter(
              (name) => !state.skills.some((s) => matchesSkill(s.skill, name)),
            )
              .slice(0, 5)
              .map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addCustomSkill(name, "core")}
                  className="min-h-[30px] px-2.5 py-0.5 rounded-md text-xs font-medium border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  + {name}
                </button>
              ))}
          </div>
        )}

        {/* Quick Add Skill Form */}
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <input
            type="text"
            value={newSkillInput}
            onChange={(e) => setNewSkillInput(e.target.value)}
            placeholder="Add missing skill (e.g. Next.js, Docker)..."
            className="flex-1 min-h-[44px] px-3 text-xs rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!newSkillInput.trim()}
            className="min-h-[44px] px-4 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </form>
      </div>

      {/* Helpful Context */}
      <div className="p-3.5 rounded-sm bg-secondary/30 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">
          Salary, dealbreakers, and past experience
        </p>
        <p>
          You can add detailed compensation expectations, hard dealbreakers, and
          work history anytime from your Profile page after completing setup.
        </p>
      </div>

      {/* Actions */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onSwitchToManual}
          disabled={isSaving}
          className="w-full sm:w-auto min-h-[44px] text-xs text-muted-foreground hover:text-foreground justify-center"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Customize step-by-step instead
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onConfirmAndExplore}
          disabled={isSaving || !roleInput.trim()}
          className="w-full sm:w-auto min-h-[44px] text-sm font-semibold px-6 justify-center"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Saving Profile...
            </>
          ) : (
            <>
              Explore Matching Jobs
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
