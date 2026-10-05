"use client";

import React, { useState } from "react";
import { Check, X, Plus, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OnboardingFormState,
  COMMON_POPULAR_SKILLS,
  SUGGESTED_SKILLS_BY_ROLE,
} from "../types/onboarding.types";
import { SkillCategory } from "@/features/profile/types/career-profile.types";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";

interface StepManualSkillsProps {
  state: OnboardingFormState;
  toggleSkill: (skillName: string) => void;
  removeSkill: (skillName: string) => void;
  addCustomSkill: (skillName: string, category: SkillCategory) => void;
  onFinish: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

export function StepManualSkills({
  state,
  toggleSkill,
  removeSkill,
  addCustomSkill,
  onFinish,
  onBack,
  isSaving,
}: StepManualSkillsProps) {
  const [customSkill, setCustomSkill] = useState("");

  const primaryRole = (
    state.targetRoles.find((r) => r.priority === "primary")?.role ||
    state.targetRoles[0]?.role ||
    ""
  ).toLowerCase();

  let roleKey: keyof typeof SUGGESTED_SKILLS_BY_ROLE = "frontend";
  if (primaryRole.includes("back")) roleKey = "backend";
  else if (primaryRole.includes("full")) roleKey = "fullstack";
  else if (
    primaryRole.includes("mobil") ||
    primaryRole.includes("android") ||
    primaryRole.includes("ios")
  )
    roleKey = "mobile";
  else if (
    primaryRole.includes("devops") ||
    primaryRole.includes("cloud") ||
    primaryRole.includes("infra")
  )
    roleKey = "devops";
  else if (primaryRole.includes("data") || primaryRole.includes("analyst"))
    roleKey = "data";
  else if (
    primaryRole.includes("ai") ||
    primaryRole.includes("machine") ||
    primaryRole.includes("ml")
  )
    roleKey = "ai";
  else if (
    primaryRole.includes("design") ||
    primaryRole.includes("ui") ||
    primaryRole.includes("ux")
  )
    roleKey = "design";
  else if (primaryRole.includes("product")) roleKey = "product";

  const suggestedList =
    SUGGESTED_SKILLS_BY_ROLE[roleKey] || COMMON_POPULAR_SKILLS;

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    addCustomSkill(trimmed, "core");
    setCustomSkill("");
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
          What are your core skills?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select key technologies you feel most confident working with.
        </p>
      </div>

      {/* Selected Skills Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-semibold text-foreground">
            Selected Skills ({state.skills.length})
          </label>
          <span className="text-xs text-muted-foreground">Tap X to remove</span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-sm border border-border/80 bg-secondary/30 min-h-[90px] max-h-[110px] overflow-y-auto custom-scrollbar items-center">
          {state.skills.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground italic py-1">
              No skills selected yet. Tap suggestions below or type your own.
            </p>
          ) : (
            state.skills.map((s) => (
              <span
                key={s.skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-card border border-border text-foreground shadow-2xs"
              >
                <span className="truncate max-w-[140px]">{s.skill}</span>
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
      </div>

      {/* Suggested Skills based on role */}
      <div className="space-y-2">
        <span className="text-xs sm:text-sm font-semibold text-foreground block">
          Suggested for your role
        </span>

        <div className="flex flex-wrap gap-1.5 max-h-[95px] overflow-y-auto custom-scrollbar">
          {suggestedList.slice(0, 10).map((skillName) => {
            const isSelected = state.skills.some((s) =>
              matchesSkill(s.skill, skillName),
            );
            return (
              <button
                key={skillName}
                type="button"
                onClick={() => toggleSkill(skillName)}
                className={`px-3 py-1.5 rounded-sm text-xs sm:text-sm font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                }`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>{skillName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Skill */}
      <div className="space-y-1.5">
        <label
          htmlFor="custom-skill-input"
          className="text-xs sm:text-sm font-semibold text-foreground block"
        >
          Add custom skill
        </label>
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <input
            id="custom-skill-input"
            type="text"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            placeholder="e.g. GraphQL, Tailwind CSS, Kubernetes..."
            className="flex-1 min-h-[42px] px-3.5 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!customSkill.trim()}
            className="min-h-[42px] px-4 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </form>
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
          onClick={onFinish}
          disabled={isSaving}
          className="min-h-[44px] text-sm font-semibold px-6 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving Profile...
            </>
          ) : (
            <>
              Finish and Explore Jobs
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
