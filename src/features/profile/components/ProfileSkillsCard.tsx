"use client";

import React, { useState } from "react";
import {
  Code,
  Plus,
  Trash2,
  RotateCcw,
  FileText,
  Sliders,
  EyeOff,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CapabilityItem,
  SuppressedSkillItem,
  SkillCategory,
} from "../types/career-profile.types";

interface ProfileSkillsCardProps {
  coreSkills: CapabilityItem[];
  supportingSkills: CapabilityItem[];
  toolSkills: CapabilityItem[];
  suppressedSkills: SuppressedSkillItem[];
  isMutating: boolean;
  onAddSkill: (skill: string, category: SkillCategory) => Promise<boolean>;
  onSuppressSkill: (skill: string) => Promise<boolean>;
  onRestoreSkill: (skill: string) => Promise<boolean>;
  onConfirmSkill: (skill: string) => Promise<boolean>;
  onManage: () => void;
  className?: string;
}

export function ProfileSkillsCard({
  coreSkills,
  supportingSkills,
  toolSkills,
  suppressedSkills,
  isMutating,
  onAddSkill,
  onSuppressSkill,
  onRestoreSkill,
  onConfirmSkill,
  onManage,
  className = "rounded-sm border border-border bg-card p-5 space-y-6 shadow-2xs",
}: ProfileSkillsCardProps) {
  const [newSkill, setNewSkill] = useState("");
  const [newCategory, setNewCategory] = useState<SkillCategory>("core");
  const [showSuppressed, setShowSuppressed] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || isMutating) return;
    const ok = await onAddSkill(newSkill.trim(), newCategory);
    if (ok) {
      setNewSkill("");
    }
  };

  const renderSkillBadge = (item: CapabilityItem) => {
    const isConfirmed =
      item.confirmation_state === "confirmed" ||
      item.confirmation_state === "user_added";
    const isCvExtracted = item.provenance.source === "resume_extracted";

    return (
      <div
        key={item.skill}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-border bg-card/70 hover:bg-secondary/60 transition-colors text-xs"
      >
        <span className="font-medium text-foreground">{item.skill}</span>

        {/* Unconfirmed CV Extraction Action */}
        {!isConfirmed && isCvExtracted && (
          <button
            type="button"
            onClick={() => onConfirmSkill(item.skill)}
            disabled={isMutating}
            className="text-[10px] text-primary hover:underline flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors"
            title="Extracted from resume. Click to confirm"
          >
            <FileText className="w-2.5 h-2.5" />
            <span>Confirm</span>
          </button>
        )}

        {/* Remove Skill Button */}
        <button
          type="button"
          onClick={() => onSuppressSkill(item.skill)}
          disabled={isMutating}
          className="opacity-40 hover:opacity-100 hover:text-destructive transition-opacity ml-0.5 cursor-pointer p-0.5"
          title="Remove skill from profile"
          aria-label={`Remove ${item.skill}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Skills & Capabilities
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Verified technical proficiencies and domain strengths.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onManage}
          className="text-xs h-9 min-h-[36px] sm:h-8 gap-1.5 border-border hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-primary self-start sm:self-auto rounded-sm"
        >
          <Edit3 className="w-3.5 h-3.5 text-primary" />
          <span>Manage All Skills</span>
        </Button>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-sm bg-secondary/30 border border-border/70"
      >
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="+ Add skill (e.g. TypeScript, Docker, PostgreSQL)..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <div className="flex items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as SkillCategory)}
            className="text-xs rounded-sm bg-card border border-border px-2.5 py-1.5 text-foreground focus:outline-none"
          >
            <option value="core">Core Skill</option>
            <option value="supporting">Supporting Skill</option>
            <option value="tool">Tool / DevOps</option>
          </select>

          <Button
            type="submit"
            size="sm"
            disabled={!newSkill.trim() || isMutating}
            className="text-xs h-9 min-h-[36px] sm:h-8 px-3 gap-1 focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </div>
      </form>

      {/* Skills Sections */}
      <div className="space-y-4">
        {/* Core Skills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Core Skills ({coreSkills.length})
            </span>
            <span className="text-[10px] text-muted-foreground">
              Primary matching weight
            </span>
          </div>
          {coreSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coreSkills.map(renderSkillBadge)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No core skills added yet. Add your main strengths above.
            </p>
          )}
        </div>

        {/* Supporting Skills */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Supporting Skills ({supportingSkills.length})
            </span>
          </div>
          {supportingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {supportingSkills.map(renderSkillBadge)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No supporting skills added yet.
            </p>
          )}
        </div>

        {/* Tools & DevOps */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tools & DevOps ({toolSkills.length})
            </span>
          </div>
          {toolSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {toolSkills.map(renderSkillBadge)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No tools or DevOps technologies added yet.
            </p>
          )}
        </div>

        {/* Suppressed Skills Drawer Toggle */}
        {suppressedSkills.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowSuppressed(!showSuppressed)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>
                {showSuppressed
                  ? "Hide removed skills"
                  : `Show ${suppressedSkills.length} removed skills`}
              </span>
            </button>

            {showSuppressed && (
              <div className="mt-2 p-3 rounded-sm bg-destructive/5 border border-destructive/20 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  These skills have been removed and will not be suggested by
                  AI:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suppressedSkills.map((item) => (
                    <div
                      key={item.skill}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-secondary/80 border border-border text-xs text-muted-foreground"
                    >
                      <span className="line-through">{item.skill}</span>
                      <button
                        type="button"
                        onClick={() => onRestoreSkill(item.skill)}
                        disabled={isMutating}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Restore skill"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
