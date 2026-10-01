"use client";

import React from "react";
import {
  Target,
  Briefcase,
  SlidersHorizontal,
  MapPin,
  Banknote,
  Edit3,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CareerIntent,
  TargetRoleItem,
  Preferences,
  HardConstraints,
} from "../types/career-profile.types";

interface ProfileTargetPreferencesCardProps {
  careerIntent: CareerIntent | undefined;
  preferences: Preferences | undefined;
  constraints: HardConstraints | undefined;
  primaryRole: TargetRoleItem | undefined;
  secondaryRoles: TargetRoleItem[];
  onEditIntent: () => void;
  onEditPreferences: () => void;
  className?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  internship: "Internship",
  entry_level: "Entry Level",
  junior: "Junior",
  mid_level: "Mid Level",
  senior: "Senior",
  lead: "Lead / Principal",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export function ProfileTargetPreferencesCard({
  careerIntent,
  preferences,
  constraints,
  primaryRole,
  secondaryRoles,
  onEditIntent,
  onEditPreferences,
  className = "rounded-sm border border-border bg-card p-5 space-y-6 shadow-2xs",
}: ProfileTargetPreferencesCardProps) {
  const isWorkModeStrict = Boolean(constraints?.work_mode_strict);
  const isRelocationProhibited = Boolean(constraints?.relocation_prohibited);

  const levelLabel = careerIntent?.target_level
    ? LEVEL_LABELS[careerIntent.target_level] || careerIntent.target_level
    : "Not specified";

  const formattedSalary = preferences?.salary?.min_amount
    ? `${preferences.salary.currency} ${preferences.salary.min_amount.toLocaleString("en-US")}`
    : "Flexible (No minimum constraint)";

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Career Goals & Work Preferences
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Target roles, seniority, work mode, and criteria used to tailor
              recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditIntent}
            className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>Edit Roles</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditPreferences}
            className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Edit Preferences</span>
          </Button>
        </div>
      </div>

      {/* Structured Key-Value Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-xs">
        {/* Primary Role */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Primary Target Role
          </span>
          <p className="text-sm font-semibold text-foreground">
            {primaryRole?.role || "Not specified"}
          </p>
        </div>

        {/* Alternative Roles */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Alternative Roles
          </span>
          <p className="text-xs text-foreground">
            {secondaryRoles.length > 0
              ? secondaryRoles.map((r) => r.role).join(" • ")
              : "None specified"}
          </p>
        </div>

        {/* Target Seniority */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Target Seniority Level
          </span>
          <p className="text-xs text-foreground">{levelLabel}</p>
        </div>

        {/* Employment Types */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Employment Types
          </span>
          <p className="text-xs text-foreground">
            {careerIntent?.employment_types &&
            careerIntent.employment_types.length > 0
              ? careerIntent.employment_types
                  .map((t) => EMPLOYMENT_LABELS[t] || t)
                  .join(" • ")
              : "Not specified"}
          </p>
        </div>

        {/* Work Mode */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Work Mode
          </span>
          <p className="text-xs text-foreground">
            {preferences?.work_modes && preferences.work_modes.length > 0
              ? preferences.work_modes
                  .map((wm) => WORK_MODE_LABELS[wm] || wm)
                  .join(" • ")
              : "Open to all modes"}
            <span
              className={`text-[11px] ml-1.5 font-medium ${
                isWorkModeStrict ? "text-amber-500" : "text-muted-foreground"
              }`}
            >
              ({isWorkModeStrict ? "Strict requirement" : "Flexible"})
            </span>
          </p>
        </div>

        {/* Locations & Relocation */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Locations & Relocation
          </span>
          <p className="text-xs text-foreground">
            {preferences?.locations && preferences.locations.length > 0
              ? preferences.locations.join(", ")
              : "Any location / Worldwide"}
            <span
              className={`text-[11px] ml-1.5 font-medium ${
                isRelocationProhibited
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              ({isRelocationProhibited ? "No relocation" : "Open to relocation"})
            </span>
          </p>
        </div>

        {/* Minimum Compensation Target */}
        <div className="space-y-1 md:col-span-2 pt-2 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Minimum Compensation Target
          </span>
          <p className="text-xs font-semibold text-foreground">
            {formattedSalary}
          </p>
        </div>

        {/* Excluded Criteria */}
        {preferences?.negative_preferences &&
          preferences.negative_preferences.length > 0 && (
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Excluded Criteria
              </span>
              <p className="text-xs text-destructive font-medium">
                {preferences.negative_preferences
                  .map((item) => item.token)
                  .join(" • ")}
              </p>
            </div>
          )}
      </div>

      {/* Provenance Tag */}
      {careerIntent?.provenance && (
        <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t border-border/40">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Goal source:{" "}
            {careerIntent.provenance.source === "user_explicit" ||
            careerIntent.provenance.source === "user_confirmed"
              ? "Directly confirmed by you"
              : "Derived from resume extraction"}
          </span>
        </div>
      )}
    </div>
  );
}
