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
        return;
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
    <div className="space-y-4">
      {/* Top Header & File Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/70">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
            Review Extracted Profile
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Extracted from your resume. Adjust parameters or explore matches
            directly.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-secondary/60 border border-border/70 text-xs sm:text-sm shrink-0">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground max-w-[160px] truncate">
            {state.resumeFileName || "Resume.pdf"}
          </span>
          <button
            type="button"
            onClick={onUploadDifferentResume}
            className="text-muted-foreground hover:text-foreground underline text-xs cursor-pointer ml-1"
            title="Replace resume"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Left Column: Target Role & Work Preferences */}
        <div className="space-y-3.5">
          {/* Target Role */}
          <div className="space-y-1.5">
            <label
              htmlFor="primary-role-input"
              className="text-xs sm:text-sm font-semibold text-foreground block"
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
              placeholder="e.g. Frontend Engineer"
              className="w-full min-h-[42px] px-3.5 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none transition-colors"
            />
          </div>

          {/* Seniority Level */}
          <div className="space-y-1.5">
            <span className="text-xs sm:text-sm font-semibold text-foreground block">
              Experience Level
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {SENIORITY_LEVEL_OPTIONS.map((opt) => {
                const isSelected = currentLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetLevel(opt.value)}
                    className={`py-2 px-1.5 rounded-sm border text-center transition-all cursor-pointer ${
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

          {/* Work Mode */}
          <div className="space-y-1.5">
            <span className="text-xs sm:text-sm font-semibold text-foreground block">
              Work Environment
            </span>
            <div className="grid grid-cols-3 gap-2">
              {WORK_MODE_OPTIONS.map((opt) => {
                const isSelected = state.workModes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleWorkMode(opt.value)}
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
        </div>

        {/* Right Column: Skills Tag Cloud & Quick Add */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              Extracted Skills ({state.skills.length})
            </span>
            <span className="text-xs text-muted-foreground">
              Tap X to remove
            </span>
          </div>

          {/* Skills Chip Box */}
          <div className="flex flex-wrap gap-1.5 p-3 rounded-sm border border-border/80 bg-secondary/30 min-h-[90px] max-h-[115px] overflow-y-auto custom-scrollbar items-center">
            {state.skills.length === 0 ? (
              <p className="text-xs sm:text-sm text-muted-foreground italic py-1">
                No skills selected yet. Add one below.
              </p>
            ) : (
              state.skills.map((s) => (
                <span
                  key={s.skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-card border border-border text-foreground shadow-2xs"
                >
                  <span className="truncate max-w-[130px]">{s.skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(s.skill)}
                    aria-label={`Remove ${s.skill}`}
                    className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Quick Suggestions */}
          {state.skills.length < 5 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-xs text-muted-foreground shrink-0">
                Quick add:
              </span>
              {COMMON_POPULAR_SKILLS.filter(
                (name) =>
                  !state.skills.some((s) => matchesSkill(s.skill, name)),
              )
                .slice(0, 4)
                .map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addCustomSkill(name, "core")}
                    className="px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  >
                    + {name}
                  </button>
                ))}
            </div>
          )}

          {/* Quick Add Skill Form */}
          <form onSubmit={handleAddSkill} className="flex gap-2 pt-0.5">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              placeholder="Add skill (e.g. Docker, Next.js)..."
              className="flex-1 min-h-[40px] px-3 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={!newSkillInput.trim()}
              className="min-h-[40px] px-4 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </form>
        </div>
      </div>

      {/* Docked Action Footer */}
      <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
        <Button
          type="button"
          variant="ghost"
          onClick={onSwitchToManual}
          disabled={isSaving}
          className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm text-muted-foreground hover:text-foreground justify-center cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Customize step-by-step
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onConfirmAndExplore}
          disabled={isSaving || !roleInput.trim()}
          className="w-full sm:w-auto min-h-[44px] text-sm font-semibold px-6 justify-center cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving Profile...
            </>
          ) : (
            <>
              Explore Matching Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
