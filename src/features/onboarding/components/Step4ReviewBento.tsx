// ==============================================================================
// STEP 4: PROFILE CONFIRMATION BENTO CARD (REVIEW & FINALIZE)
// Module: @/features/onboarding/components/Step4ReviewBento
// ==============================================================================

"use client";

import React, { useState } from "react";
import {
  Briefcase,
  MapPin,
  ShieldCheck,
  Plus,
  X,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  DollarSign,
  GraduationCap,
  Building2,
  Edit2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NEGATIVE_PREFERENCE_LABELS,
  OnboardingFormState,
  OnboardingStepNumber,
} from "../types/onboarding.types";
import {
  SkillCategory,
  CareerProfile,
} from "@/features/profile/types/career-profile.types";

interface Step4ReviewBentoProps {
  state: OnboardingFormState;
  goToStep: (step: OnboardingStepNumber) => void;
  suppressSkill: (skillName: string) => void;
  restoreSkill: (skillName: string) => void;
  addCustomSkill: (skillName: string, category: SkillCategory) => void;
  onConfirm: () => Promise<CareerProfile | null>;
  onBack: () => void;
  isSaving: boolean;
}

export function Step4ReviewBento({
  state,
  goToStep,
  suppressSkill,
  restoreSkill,
  addCustomSkill,
  onConfirm,
  onBack,
  isSaving,
}: Step4ReviewBentoProps) {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] =
    useState<SkillCategory>("core");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    addCustomSkill(trimmed, newSkillCategory);
    setNewSkillName("");
  };

  const handleConfirmClick = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const isBusy = isSaving || isConfirming;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold font-heading text-foreground tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Review & Confirm Your Career Profile
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Here is what Finder understands about your career goals. This
          canonical profile governs your deterministic 0–100 match scores. You
          can adjust any skills or preferences before proceeding.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Career Intent */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h3 className="text-xs font-semibold font-heading text-foreground flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              Career Intent & Targets
            </h3>
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Target Roles
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {state.targetRoles.length > 0 ? (
                  state.targetRoles.map((r) => (
                    <span
                      key={r.role}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        r.priority === "primary"
                          ? "bg-primary/10 border-primary/30 text-foreground font-semibold"
                          : "bg-secondary/40 border-border/70 text-muted-foreground"
                      }`}
                    >
                      {r.role}
                      <span className="text-[9px] font-mono uppercase opacity-75">
                        ({r.priority})
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic">
                    No roles selected
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Seniority Level
                </span>
                <p className="font-semibold text-foreground capitalize mt-0.5">
                  {state.targetLevel?.replace("_", " ") || "Not set"}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Opportunity Types
                </span>
                <p className="font-medium text-muted-foreground capitalize mt-0.5">
                  {state.employmentTypes
                    .map((t) => t.replace("_", " "))
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Work Arrangements & Constraints */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h3 className="text-xs font-semibold font-heading text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Work & Boundaries
            </h3>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Work Modes
                </span>
                <p className="font-semibold text-foreground capitalize mt-0.5">
                  {state.workModes.join(", ")}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {state.workModeStrict ? "Strict Filter" : "Flexible"}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Relocation
                </span>
                <p className="font-semibold text-foreground mt-0.5">
                  {state.relocationProhibited ? "Prohibited" : "Permitted"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Preferred Locations
              </span>
              <p className="text-muted-foreground mt-0.5">
                {state.locations.length > 0
                  ? state.locations.join(", ")
                  : "Any / Flexible"}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                Minimum Salary
              </span>
              <p className="font-mono text-foreground mt-0.5">
                {state.salaryMin !== null
                  ? `${state.salaryCurrency} ${state.salaryMin.toLocaleString()}`
                  : "Flexible / Unstated"}
              </p>
            </div>

            {state.negativePreferences.length > 0 && (
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Things to Avoid
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {state.negativePreferences.map((np) => (
                    <span
                      key={np.token}
                      className="text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                    >
                      {NEGATIVE_PREFERENCE_LABELS[np.token] || np.token}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Skills & Capabilities (Interactive) */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h3 className="text-xs font-semibold font-heading text-foreground">
                Verified Capabilities & Skills
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Click × to suppress any skill you do NOT want matched. Add new
                skills below.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              {state.skills.length} Active Skills
            </span>
          </div>

          {/* Active Skills List */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              Active Skills (Used in Deterministic Match Scoring)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
              {state.skills.length > 0 ? (
                state.skills.map((item) => {
                  const isCore = item.category === "core";
                  return (
                    <span
                      key={item.skill}
                      className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        isCore
                          ? "bg-secondary/70 border-border/80 text-foreground"
                          : "bg-secondary/40 border-border/50 text-muted-foreground"
                      }`}
                    >
                      <span>{item.skill}</span>
                      <span className="text-[9px] font-mono uppercase bg-background/80 px-1 py-0.2 rounded border border-border/60">
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => suppressSkill(item.skill)}
                        title={`Suppress "${item.skill}" (never match or re-add)`}
                        className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No skills added yet. Use the form below to add your primary
                  skills.
                </p>
              )}
            </div>
          </div>

          {/* Suppressed Skills List (if any) */}
          {state.suppressedSkills.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-1.5">
              <span className="text-[10px] text-destructive font-semibold uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Suppressed Skills ({state.suppressedSkills.length}) &bull; AI
                will never re-extract these
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.suppressedSkills.map((supp) => (
                  <span
                    key={supp.skill}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-md bg-secondary/50 border border-border/80 text-[11px] text-muted-foreground line-through"
                  >
                    <span>{supp.skill}</span>
                    <button
                      type="button"
                      onClick={() => restoreSkill(supp.skill)}
                      title={`Restore "${supp.skill}"`}
                      className="text-primary hover:text-primary/80 cursor-pointer no-underline p-0.5 flex items-center gap-0.5 text-[10px]"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Restore
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Skill Form */}
          <form
            onSubmit={handleAddSkill}
            className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/60"
          >
            <input
              type="text"
              placeholder="Add skill (e.g. React, Docker, Python)..."
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 bg-secondary/40 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
            />
            <div className="flex gap-2">
              <select
                value={newSkillCategory}
                onChange={(e) =>
                  setNewSkillCategory(e.target.value as SkillCategory)
                }
                className="bg-secondary/40 border border-border/80 rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="core">Core Skill</option>
                <option value="supporting">Supporting Skill</option>
                <option value="tool">Tool / Library</option>
              </select>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!newSkillName.trim()}
                className="text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Skill
              </Button>
            </div>
          </form>
        </div>

        {/* Card 4: Background Summary (if available) */}
        {(state.background.education.length > 0 ||
          state.background.experience.length > 0) && (
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs md:col-span-2">
            <h3 className="text-xs font-semibold font-heading text-foreground flex items-center gap-1.5 pb-2 border-b border-border/60">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              Documented Background Evidence
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Education */}
              {state.background.education.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Education
                  </span>
                  <div className="space-y-1.5">
                    {state.background.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-2 rounded-lg bg-secondary/30 border border-border/60"
                      >
                        <p className="font-semibold text-foreground">
                          {edu.degree || "Degree"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {edu.institution}{" "}
                          {edu.graduation_year && `(${edu.graduation_year})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {state.background.experience.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    Experience
                  </span>
                  <div className="space-y-1.5">
                    {state.background.experience.slice(0, 3).map((exp) => (
                      <div
                        key={exp.id}
                        className="p-2 rounded-lg bg-secondary/30 border border-border/60"
                      >
                        <p className="font-semibold text-foreground">
                          {exp.role_title}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {exp.company_name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Governance & Deterministic Guarantee Box */}
      <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground block font-semibold">
            Deterministic Engine Authority Guarantee
          </strong>
          Your 0–100 Match Scores are computed strictly by Finder&apos;s
          deterministic scoring algorithms using the preferences confirmed
          above. AI models never hallucinate your qualifications or overwrite
          your career intent.
        </div>
      </div>

      {/* Final Action CTA */}
      <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/80">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isBusy}
          className="text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={handleConfirmClick}
          disabled={isBusy}
          className="text-xs px-6 py-2.5 h-auto bg-primary hover:opacity-90 font-semibold"
        >
          {isBusy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finalizing Profile...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Confirm Profile & Discover Jobs
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
