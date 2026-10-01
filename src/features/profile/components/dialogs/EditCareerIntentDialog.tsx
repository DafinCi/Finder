"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Target, Briefcase, Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CareerIntent,
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
} from "../../types/career-profile.types";
import {
  PRESET_TARGET_ROLES,
  SENIORITY_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from "@/features/onboarding/types/onboarding.types";
import { toast } from "sonner";

interface EditCareerIntentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  careerIntent: CareerIntent | undefined;
  onSave: (intent: {
    target_roles: TargetRoleItem[];
    target_level: TargetLevel | null;
    employment_types: EmploymentType[];
  }) => Promise<boolean>;
}

export function EditCareerIntentDialog({
  isOpen,
  onClose,
  careerIntent,
  onSave,
}: EditCareerIntentDialogProps) {
  const [primaryRole, setPrimaryRole] = useState<string>("");
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([]);
  const [targetLevel, setTargetLevel] = useState<TargetLevel | null>(null);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentType[]>([
    "full_time",
  ]);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Sync state when dialog opens or careerIntent changes
  useEffect(() => {
    if (isOpen) {
      const primary =
        careerIntent?.target_roles.find((r) => r.priority === "primary")
          ?.role || "";
      const secondaries =
        careerIntent?.target_roles
          .filter((r) => r.priority === "secondary")
          .map((r) => r.role) || [];

      setPrimaryRole(primary);
      setSecondaryRoles(secondaries);
      setTargetLevel(careerIntent?.target_level || null);
      setEmploymentTypes(
        careerIntent?.employment_types &&
          careerIntent.employment_types.length > 0
          ? careerIntent.employment_types
          : ["full_time"],
      );
      setCustomRoleInput("");
    }
  }, [isOpen, careerIntent]);

  // Focus trap, autofocus, and ESC key
  useEffect(() => {
    if (!isOpen) return;
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown, true);
      triggerElementRef.current?.focus();
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSelectPrimary = (role: string) => {
    setPrimaryRole(role);
    // If it was in secondary, remove it from secondary
    setSecondaryRoles((prev) =>
      prev.filter((r) => r.toLowerCase() !== role.toLowerCase()),
    );
  };

  const handleToggleSecondary = (role: string) => {
    if (role.toLowerCase() === primaryRole.toLowerCase()) {
      toast.warning("This role is already selected as your primary role.");
      return;
    }

    if (secondaryRoles.some((r) => r.toLowerCase() === role.toLowerCase())) {
      setSecondaryRoles((prev) =>
        prev.filter((r) => r.toLowerCase() !== role.toLowerCase()),
      );
    } else {
      if (secondaryRoles.length >= 3) {
        toast.warning("Maximum 3 alternative roles allowed.");
        return;
      }
      setSecondaryRoles((prev) => [...prev, role]);
    }
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;

    if (!primaryRole) {
      setPrimaryRole(trimmed);
      setCustomRoleInput("");
      return;
    }

    if (trimmed.toLowerCase() === primaryRole.toLowerCase()) {
      toast.warning("This role is already selected as your primary role.");
      return;
    }

    if (secondaryRoles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("This role is already in your alternative list.");
      return;
    }

    if (secondaryRoles.length >= 3) {
      toast.warning("Maximum 3 alternative roles allowed.");
      return;
    }

    setSecondaryRoles((prev) => [...prev, trimmed]);
    setCustomRoleInput("");
  };

  const handleToggleEmployment = (type: EmploymentType) => {
    setEmploymentTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) {
          toast.warning("Please select at least 1 employment type.");
          return prev;
        }
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!primaryRole.trim()) {
      toast.error("Please select 1 primary target role.");
      return;
    }

    if (employmentTypes.length === 0) {
      toast.error("Please select at least 1 employment type.");
      return;
    }

    const targetRoles: TargetRoleItem[] = [
      { role: primaryRole.trim(), priority: "primary" },
      ...secondaryRoles.map((r) => ({
        role: r.trim(),
        priority: "secondary" as const,
      })),
    ];

    setIsSaving(true);
    try {
      const ok = await onSave({
        target_roles: targetRoles,
        target_level: targetLevel,
        employment_types: employmentTypes,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-intent-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-card border border-border rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-primary/10 text-primary border border-primary/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="career-intent-dialog-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Edit Career Intent
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Define your primary position, alternative roles, and seniority
                level.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close career intent dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="career-intent-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar"
        >
          {/* Section 1: Primary Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" />
                Primary Role (Select 1)
              </label>
              {primaryRole && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Selected
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Your main target position. Recommendations will prioritize jobs
              matching this role.
            </p>

            {primaryRole && (
              <div className="p-2.5 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-between">
                <span className="text-xs font-bold text-primary">
                  {primaryRole}
                </span>
                <span className="text-[10px] bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-sm">
                  Primary
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TARGET_ROLES.map((role) => {
                const isSelected =
                  primaryRole.toLowerCase() === role.toLowerCase();
                return (
                  <button
                    key={`primary-${role}`}
                    type="button"
                    onClick={() => handleSelectPrimary(role)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer min-h-[36px] ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Secondary Roles */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Alternative Target Roles (Up to 3)
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {secondaryRoles.length}/3 selected
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Alternative positions relevant to your background.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_TARGET_ROLES.map((role) => {
                const isPrimary =
                  primaryRole.toLowerCase() === role.toLowerCase();
                const isSecondary = secondaryRoles.some(
                  (r) => r.toLowerCase() === role.toLowerCase(),
                );

                if (isPrimary) return null; // Don't show primary in secondaries

                return (
                  <button
                    key={`sec-${role}`}
                    type="button"
                    onClick={() => handleToggleSecondary(role)}
                    className={`px-2.5 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer min-h-[36px] ${
                      isSecondary
                        ? "bg-secondary text-foreground font-bold border-primary/50"
                        : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>

            {/* Custom Role Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customRoleInput}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="+ Add custom role..."
                className="flex-1 bg-secondary/30 border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCustomRole}
                disabled={!customRoleInput.trim()}
                className="text-xs min-h-[40px] px-3 rounded-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          {/* Section 3: Seniority Level */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground">
              Target Seniority Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SENIORITY_LEVEL_OPTIONS.map((opt) => {
                const isSelected = targetLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetLevel(opt.value)}
                    className={`p-2.5 rounded-sm border text-left transition-colors cursor-pointer min-h-[44px] ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Employment Types */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground">
              Employment Types (Select at least 1)
            </label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPE_OPTIONS.map((emp) => {
                const isSelected = employmentTypes.includes(emp.value);
                return (
                  <button
                    key={emp.value}
                    type="button"
                    onClick={() => handleToggleEmployment(emp.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border text-xs font-medium transition-colors cursor-pointer min-h-[40px] ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{emp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border/80 bg-card shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="min-h-[44px] h-11 px-4 text-xs font-medium rounded-sm"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="career-intent-form"
            disabled={isSaving || !primaryRole.trim()}
            className="min-h-[44px] h-11 px-5 text-xs font-semibold gap-1.5 rounded-sm"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
