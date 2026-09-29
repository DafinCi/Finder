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
    <div className="rounded-xl border border-border bg-card p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
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
            className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>Edit Roles</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditPreferences}
            className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Edit Preferences</span>
          </Button>
        </div>
      </div>

      {/* Target Roles Grid */}
      <div className="space-y-3">
        {/* Primary Role */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3 h-3 text-primary" />
            Primary Target Role
          </span>
          {primaryRole ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-sm font-bold text-foreground">
                {primaryRole.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                Primary Focus
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-secondary/30 border border-dashed border-border text-xs text-muted-foreground">
              No primary role selected. Click &quot;Edit Roles&quot; to specify
              your focus.
            </div>
          )}
        </div>

        {/* Alternative Roles */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Alternative Roles ({secondaryRoles.length})
          </span>
          {secondaryRoles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {secondaryRoles.map((r) => (
                <span
                  key={r.role}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/70 border border-border text-xs font-medium text-foreground"
                >
                  <span>{r.role}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">
                    (Alternative Focus)
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No alternative roles specified. Matching focuses exclusively on
              your primary target.
            </p>
          )}
        </div>
      </div>

      {/* Target Seniority & Employment Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Target Seniority Level
          </span>
          <span className="inline-block font-medium text-foreground px-2.5 py-1 rounded-md bg-secondary/50 border border-border">
            {levelLabel}
          </span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Employment Types
          </span>
          <div className="flex flex-wrap gap-1.5">
            {careerIntent?.employment_types &&
            careerIntent.employment_types.length > 0 ? (
              careerIntent.employment_types.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded-md bg-secondary/60 text-[11px] font-medium text-foreground border border-border/80"
                >
                  {EMPLOYMENT_LABELS[type] || type}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">Not specified</span>
            )}
          </div>
        </div>
      </div>

      {/* Work Mode & Location Constraints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/60 text-xs">
        {/* Work Mode */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Work Mode
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isWorkModeStrict
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {isWorkModeStrict ? "Strict requirement" : "Flexible preference"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {preferences?.work_modes && preferences.work_modes.length > 0 ? (
              preferences.work_modes.map((wm) => (
                <span
                  key={wm}
                  className="px-2.5 py-1 rounded-lg bg-secondary/80 border border-border text-xs font-medium text-foreground"
                >
                  {WORK_MODE_LABELS[wm] || wm}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground italic">
                Open to all work modes
              </span>
            )}
          </div>
        </div>

        {/* Locations & Relocation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              Locations & Relocation
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                isRelocationProhibited
                  ? "bg-destructive/10 text-destructive border border-destructive/20 font-semibold"
                  : "bg-secondary/40 text-foreground border border-border"
              }`}
            >
              {isRelocationProhibited ? "No relocation" : "Open to relocation"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {preferences?.locations && preferences.locations.length > 0 ? (
              preferences.locations.map((loc) => (
                <span
                  key={loc}
                  className="px-2 py-0.5 rounded-md bg-secondary/60 text-[11px] font-medium text-foreground border border-border/80"
                >
                  {loc}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">
                Worldwide / Any location
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Salary Expectation */}
      <div className="pt-3 border-t border-border/60 space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Banknote className="w-3 h-3 text-primary" />
          Salary Expectation
        </span>
        <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/80 text-xs flex items-center justify-between">
          <span className="font-semibold text-foreground">
            {formattedSalary}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {preferences?.salary?.min_amount
              ? "Minimum target"
              : "Positions will not be filtered out by salary"}
          </span>
        </div>
      </div>

      {/* Excluded Criteria (Negative Preferences) */}
      <div className="pt-3 border-t border-border/60 space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-destructive" />
          Excluded Criteria
        </span>
        {preferences?.negative_preferences &&
        preferences.negative_preferences.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {preferences.negative_preferences.map((item) => (
              <span
                key={`${item.domain}-${item.token}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
              >
                <span>✕</span>
                <span>{item.token}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No exclusions specified. Recommendations include all industries and
            tech stacks.
          </p>
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
