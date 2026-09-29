// ==============================================================================
// SHEET: ManageSkillsSheet
// Module: @/features/profile/components/dialogs/ManageSkillsSheet
// ==============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Code,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  FileText,
  Sliders,
  CheckCheck,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CapabilityItem,
  SuppressedSkillItem,
  SkillCategory,
  SkillProficiencyClaim,
} from "../../types/career-profile.types";
import { toast } from "sonner";

interface ManageSkillsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  skills: CapabilityItem[];
  suppressedSkills: SuppressedSkillItem[];
  isMutating: boolean;
  onAddSkill: (
    skill: string,
    category: SkillCategory,
    proficiency?: SkillProficiencyClaim,
  ) => Promise<boolean>;
  onUpdateSkill: (
    skill: string,
    updates: {
      category?: SkillCategory;
      proficiency_claim?: SkillProficiencyClaim;
      confirmation_state?: "draft" | "confirmed" | "user_added";
    },
  ) => Promise<boolean>;
  onSuppressSkill: (
    skill: string,
    reason?: "user_deleted" | "user_rejected",
  ) => Promise<boolean>;
  onRestoreSkill: (skill: string, category?: SkillCategory) => Promise<boolean>;
  onSyncSkills: (
    skills: CapabilityItem[],
    suppressedSkills?: SuppressedSkillItem[],
  ) => Promise<boolean>;
}

export function ManageSkillsSheet({
  isOpen,
  onClose,
  skills,
  suppressedSkills,
  isMutating,
  onAddSkill,
  onUpdateSkill,
  onSuppressSkill,
  onRestoreSkill,
  onSyncSkills,
}: ManageSkillsSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "core" | "supporting" | "tool" | "suppressed"
  >("all");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] =
    useState<SkillCategory>("core");
  const [newSkillProficiency, setNewSkillProficiency] =
    useState<SkillProficiencyClaim>("competent");

  const modalRef = useRef<HTMLDivElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isMutating) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMutating, onClose]);

  if (!isOpen) return null;

  // Filter skills
  const filteredSkills = skills.filter((item) => {
    const matchesSearch = item.skill
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "core") return item.category === "core";
    if (activeTab === "supporting") return item.category === "supporting";
    if (activeTab === "tool") return item.category === "tool";
    return true;
  });

  const filteredSuppressed = suppressedSkills.filter((item) =>
    item.skill.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const unconfirmedCount = skills.filter(
    (s) =>
      s.confirmation_state !== "confirmed" &&
      s.confirmation_state !== "user_added",
  ).length;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed || isMutating) return;

    const ok = await onAddSkill(trimmed, newSkillCategory, newSkillProficiency);
    if (ok) {
      setNewSkillName("");
    }
  };

  const handleConfirmAll = async () => {
    const updatedSkills: CapabilityItem[] = skills.map((s) => ({
      ...s,
      confirmation_state: "confirmed",
      provenance: {
        source: "user_confirmed",
        confidence: 1.0,
        updated_at: new Date().toISOString(),
      },
    }));

    await onSyncSkills(updatedSkills);
    toast.success("Semua keahlian berhasil dikonfirmasi.");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-skills-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="manage-skills-sheet-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Manage Skills & Capabilities
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kategorisasi, tingkat kemahiran, konfirmasi, dan pengelolaan
                skill yang disembunyikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMutating}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search, Add, Tabs */}
        <div className="p-4 border-b border-border/70 space-y-3 bg-secondary/15 shrink-0">
          {/* Quick Add Form */}
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="+ Tambah keahlian baru..."
              className="flex-1 bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <select
              value={newSkillCategory}
              onChange={(e) =>
                setNewSkillCategory(e.target.value as SkillCategory)
              }
              className="bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value="core">Core</option>
              <option value="supporting">Supporting</option>
              <option value="tool">Tool</option>
            </select>

            <Button
              type="submit"
              size="sm"
              disabled={!newSkillName.trim() || isMutating}
              className="text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </Button>
          </form>

          {/* Search & Category Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                All ({skills.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("core")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "core"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Core ({skills.filter((s) => s.category === "core").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("supporting")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "supporting"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Supporting (
                {skills.filter((s) => s.category === "supporting").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tool")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "tool"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Tools ({skills.filter((s) => s.category === "tool").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("suppressed")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "suppressed"
                    ? "bg-destructive text-destructive-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Suppressed ({suppressedSkills.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari skill..."
                className="w-full bg-card border border-border rounded-md pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (if unconfirmed detected skills exist) */}
        {activeTab !== "suppressed" && unconfirmedCount > 0 && (
          <div className="px-5 py-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs shrink-0">
            <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Terdapat {unconfirmedCount} skill terdeteksi dari CV yang belum
              dikonfirmasi.
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={handleConfirmAll}
              disabled={isMutating}
              className="text-xs h-7 gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Konfirmasi Semua</span>
            </Button>
          </div>
        )}

        {/* Scrollable Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
          {activeTab === "suppressed" ? (
            /* Suppressed Skills List */
            filteredSuppressed.length > 0 ? (
              filteredSuppressed.map((item) => (
                <div
                  key={item.skill}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-muted-foreground line-through">
                      {item.skill}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Disembunyikan pada:{" "}
                      {new Date(item.suppressed_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onRestoreSkill(item.skill)}
                    disabled={isMutating}
                    className="text-xs gap-1 text-primary hover:bg-primary/10"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-8">
                Tidak ada skill yang disembunyikan.
              </p>
            )
          ) : /* Active Skills List */
          filteredSkills.length > 0 ? (
            filteredSkills.map((item) => {
              const isConfirmed =
                item.confirmation_state === "confirmed" ||
                item.confirmation_state === "user_added";

              return (
                <div
                  key={item.skill}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/60 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-foreground">
                      {item.skill}
                    </span>

                    {/* Provenance Badge */}
                    {isConfirmed ? (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Confirmed</span>
                      </span>
                    ) : item.provenance.source === "resume_extracted" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSkill(item.skill, {
                            confirmation_state: "confirmed",
                          })
                        }
                        disabled={isMutating}
                        className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 hover:underline cursor-pointer"
                        title="Klik untuk konfirmasi"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>Confirm?</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AI</span>
                      </span>
                    )}
                  </div>

                  {/* Actions: Category change & Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Category switcher */}
                    <select
                      value={item.category}
                      onChange={(e) =>
                        onUpdateSkill(item.skill, {
                          category: e.target.value as SkillCategory,
                        })
                      }
                      disabled={isMutating}
                      className="text-[11px] bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none"
                    >
                      <option value="core">Core</option>
                      <option value="supporting">Supporting</option>
                      <option value="tool">Tool</option>
                    </select>

                    {/* Proficiency claim switcher */}
                    <select
                      value={item.proficiency_claim || "competent"}
                      onChange={(e) =>
                        onUpdateSkill(item.skill, {
                          proficiency_claim: e.target
                            .value as SkillProficiencyClaim,
                        })
                      }
                      disabled={isMutating}
                      className="text-[11px] bg-secondary border border-border rounded px-2 py-1 text-foreground focus:outline-none"
                    >
                      <option value="foundational">Foundational</option>
                      <option value="competent">Competent</option>
                      <option value="proficient">Proficient</option>
                    </select>

                    {/* Suppress Button */}
                    <button
                      type="button"
                      onClick={() => onSuppressSkill(item.skill)}
                      disabled={isMutating}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Sembunyikan skill ini dari pencocokan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-8">
              Tidak ada keahlian yang cocok dengan pencarian.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border/80 bg-card shrink-0 text-xs text-muted-foreground">
          <span>Total {skills.length} keahlian aktif</span>
          <Button size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
