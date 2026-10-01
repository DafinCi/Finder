"use client";

import React from "react";
import { Briefcase, Target, Edit3, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CareerIntent, TargetRoleItem } from "../types/career-profile.types";

interface ProfileIntentCardProps {
  careerIntent: CareerIntent | undefined;
  primaryRole: TargetRoleItem | undefined;
  secondaryRoles: TargetRoleItem[];
  onEdit: () => void;
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

export function ProfileIntentCard({
  careerIntent,
  primaryRole,
  secondaryRoles,
  onEdit,
}: ProfileIntentCardProps) {
  const levelLabel = careerIntent?.target_level
    ? LEVEL_LABELS[careerIntent.target_level] || careerIntent.target_level
    : "Not specified";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Career Intent
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Career trajectory and target roles for recommendation matching
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
          <span>Edit Intent</span>
        </Button>
      </div>

      {/* Primary Role */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="w-3 h-3 text-muted-foreground" />
          Primary Target Role
        </span>
        {primaryRole ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
            <span className="text-sm font-bold text-foreground">
              {primaryRole.role}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-foreground border border-border shadow-2xs">
              Primary Role (Weight: 1.0)
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-secondary/30 border border-dashed border-border text-xs text-muted-foreground">
            No primary role selected. Select the edit button to choose one.
          </div>
        )}
      </div>

      {/* Secondary Roles */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Secondary Target Roles ({secondaryRoles.length})
        </span>
        {secondaryRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {secondaryRoles.map((r) => (
              <span
                key={r.role}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/70 border border-border text-xs font-medium text-foreground"
              >
                <span>{r.role}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  (0.7)
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No secondary roles selected. Matching against primary role only.
          </p>
        )}
      </div>

      {/* Seniority Level & Employment Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60 text-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Target Seniority Level
          </span>
          <span className="inline-block font-medium text-foreground px-2.5 py-1 rounded-md bg-secondary/40 border border-border">
            {levelLabel}
          </span>
        </div>

        <div className="space-y-1">
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

      {/* Provenance Footer */}
      {careerIntent?.provenance && (
        <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
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
