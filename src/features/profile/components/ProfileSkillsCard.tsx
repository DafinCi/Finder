// ==============================================================================
// COMPONENT: ProfileSkillsCard
// Module: @/features/profile/components/ProfileSkillsCard
// ==============================================================================

"use client";

import React, { useState } from "react";
import {
  Code,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Shield,
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
        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/60 hover:bg-secondary/60 transition-colors text-xs"
      >
        <span className="font-semibold text-foreground">{item.skill}</span>

        {/* Provenance Badge */}
        {isConfirmed ? (
          <span
            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"
            title="Dikonfirmasi langsung oleh Anda"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Confirmed</span>
          </span>
        ) : isCvExtracted ? (
          <button
            type="button"
            onClick={() => onConfirmSkill(item.skill)}
            disabled={isMutating}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 bg-blue-500/10 px-1 rounded cursor-pointer"
            title="Dianalisis dari CV. Klik untuk konfirmasi keahlian ini"
          >
            <FileText className="w-2.5 h-2.5" />
            <span>Confirm?</span>
          </button>
        ) : (
          <span
            className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5"
            title="AI Inferred"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI</span>
          </span>
        )}

        {/* Quick Suppress/Delete Button */}
        <button
          type="button"
          onClick={() => onSuppressSkill(item.skill)}
          disabled={isMutating}
          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity ml-1 cursor-pointer p-0.5"
          title="Sembunyikan keahlian ini dari matching"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold font-heading text-foreground">
              Skills & Capabilities
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Keahlian kanonikal untuk kalkulasi S_tech (skor teknologi & tools)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onManage}
          className="text-xs h-8 gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Manage Skills</span>
        </Button>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/70"
      >
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="+ Tambah keahlian (contoh: TypeScript, Docker, PostgreSQL)..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <div className="flex items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as SkillCategory)}
            className="text-xs rounded-md bg-card border border-border px-2 py-1.5 text-foreground focus:outline-none"
          >
            <option value="core">Core Skill</option>
            <option value="supporting">Supporting Skill</option>
            <option value="tool">Tool / DevOps</option>
          </select>

          <Button
            type="submit"
            size="sm"
            disabled={!newSkill.trim() || isMutating}
            className="text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
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
              Bobot tertinggi dalam matching
            </span>
          </div>
          {coreSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {coreSkills.map(renderSkillBadge)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Belum ada core skill. Tambahkan keahlian utama Anda di atas.
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
              Belum ada supporting skill.
            </p>
          )}
        </div>

        {/* Tool Skills */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Tools & Platforms ({toolSkills.length})
            </span>
          </div>
          {toolSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {toolSkills.map(renderSkillBadge)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Belum ada tools terdaftar.
            </p>
          )}
        </div>
      </div>

      {/* Suppressed Skills Drawer/Accordion */}
      <div className="pt-2 border-t border-border/80">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSuppressed(!showSuppressed)}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Suppressed Skills ({suppressedSkills.length})</span>
          </button>
          <span className="text-[10px] text-muted-foreground">
            {showSuppressed ? "Sembunyikan" : "Tampilkan"}
          </span>
        </div>

        {showSuppressed && (
          <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border space-y-2 animate-in fade-in duration-150">
            <p className="text-[11px] text-muted-foreground">
              Skill di bawah ini telah Anda hapus/tolak. Finder tidak akan
              memasukkannya kembali meskipun terdeteksi di CV yang Anda upload
              ulang:
            </p>

            {suppressedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {suppressedSkills.map((item) => (
                  <span
                    key={item.skill}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground line-through"
                  >
                    <span>{item.skill}</span>
                    <button
                      type="button"
                      onClick={() => onRestoreSkill(item.skill)}
                      disabled={isMutating}
                      className="text-primary hover:underline not-italic cursor-pointer flex items-center gap-0.5 text-[10px] font-semibold"
                      title="Pulihkan skill ini ke daftar aktif"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Restore</span>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Tidak ada skill yang di-suppress.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
