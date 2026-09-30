"use client";

import React from "react";
import {
  SlidersHorizontal,
  MapPin,
  Banknote,
  Sparkles,
  AlertTriangle,
  Edit3,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Preferences, HardConstraints } from "../types/career-profile.types";

interface ProfilePreferencesCardProps {
  preferences: Preferences | undefined;
  constraints: HardConstraints | undefined;
  onEdit: () => void;
}

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export function ProfilePreferencesCard({
  preferences,
  constraints,
  onEdit,
}: ProfilePreferencesCardProps) {
  const isWorkModeStrict = Boolean(constraints?.work_mode_strict);
  const isRelocationProhibited = Boolean(constraints?.relocation_prohibited);

  const formattedSalary = preferences?.salary?.min_amount
    ? `${preferences.salary.currency} ${preferences.salary.min_amount.toLocaleString("en-US")}`
    : "Flexible (No minimum constraint)";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Career Preferences & Constraints
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Strict constraints (Stage 1) and flexible preferences (Stage 2)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-xs h-8 gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Preferences</span>
        </Button>
      </div>

      {/* Work Mode & Strictness */}
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
            {isWorkModeStrict
              ? "Stage 1: Strict Constraint"
              : "Stage 2: Flexible Preference"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {preferences?.work_modes && preferences.work_modes.length > 0 ? (
            preferences.work_modes.map((wm) => (
              <span
                key={wm}
                className="px-3 py-1 rounded-lg bg-secondary/80 border border-border text-xs font-medium text-foreground"
              >
                {WORK_MODE_LABELS[wm] || wm}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Not specified
            </span>
          )}
        </div>
      </div>

      {/* Location & Relocation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60 text-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            Preferred Locations
          </span>
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
              <span className="text-muted-foreground">Any location</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Relocation Policy
          </span>
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
              isRelocationProhibited
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-secondary/40 text-foreground border border-border"
            }`}
          >
            {isRelocationProhibited
              ? "Relocation Prohibited (Strict)"
              : "Open to Relocation"}
          </span>
        </div>
      </div>

      {/* Salary Expectation */}
      <div className="pt-2 border-t border-border/60 space-y-1">
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
              ? "Minimum expected"
              : "No minimum constraint"}
          </span>
        </div>
      </div>

      {/* Priorities */}
      {preferences?.priorities && preferences.priorities.length > 0 && (
        <div className="pt-2 border-t border-border/60 space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            Candidate Priorities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {preferences.priorities.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs text-primary font-medium capitalize"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Negative Preferences (Anti-Matches) */}
      <div className="pt-2 border-t border-border/60 space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3 h-3 text-destructive" />
          Negative Preferences (Anti-Matches)
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
                <span className="text-[10px] opacity-70">
                  (-{Math.round((item.penalty_weight ?? 1.0) * 20)}%)
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No negative preferences declared. Finder will not apply score penalties for
            specific domains or technologies.
          </p>
        )}
      </div>
    </div>
  );
}
