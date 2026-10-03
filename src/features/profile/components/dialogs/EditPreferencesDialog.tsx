"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  SlidersHorizontal,
  MapPin,
  Banknote,
  ShieldAlert,
  Plus,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Preferences,
  HardConstraints,
  WorkMode,
  NegativePreferenceItem,
} from "../../types/career-profile.types";
import {
  WORK_MODE_OPTIONS,
  PRESET_LOCATIONS,
  PRESET_PRIORITIES,
  PRESET_NEGATIVE_PREFERENCES,
  NEGATIVE_PREFERENCE_LABELS,
} from "@/features/onboarding/types/onboarding.types";
import { toast } from "sonner";

interface EditPreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: Preferences | undefined;
  constraints: HardConstraints | undefined;
  onSave: (
    preferences: Preferences,
    constraints?: HardConstraints,
  ) => Promise<boolean>;
}

export function EditPreferencesDialog({
  isOpen,
  onClose,
  preferences,
  constraints,
  onSave,
}: EditPreferencesDialogProps) {
  const [workModes, setWorkModes] = useState<WorkMode[]>(["remote"]);
  const [workModeStrict, setWorkModeStrict] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocationInput, setNewLocationInput] = useState("");
  const [relocationProhibited, setRelocationProhibited] = useState(false);

  // Salary state
  const [salaryNotSpecified, setSalaryNotSpecified] = useState(true);
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [salaryPeriod, setSalaryPeriod] = useState<"year" | "month">("year");

  // Priorities and Negative Preferences
  const [priorities, setPriorities] = useState<string[]>([]);
  const [negativePreferences, setNegativePreferences] = useState<
    NegativePreferenceItem[]
  >([]);
  const [customNegativeToken, setCustomNegativeToken] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setWorkModes(
        preferences?.work_modes && preferences.work_modes.length > 0
          ? preferences.work_modes
          : ["remote"],
      );
      setWorkModeStrict(Boolean(constraints?.work_mode_strict));
      setLocations(preferences?.locations || []);
      setRelocationProhibited(Boolean(constraints?.relocation_prohibited));

      if (preferences?.salary && preferences.salary.min_amount) {
        setSalaryNotSpecified(false);
        setSalaryMin(preferences.salary.min_amount);
        setSalaryCurrency(preferences.salary.currency || "USD");
        setSalaryPeriod(
          preferences.salary.period === "month" ? "month" : "year",
        );
      } else {
        setSalaryNotSpecified(true);
        setSalaryMin(null);
        setSalaryCurrency(preferences?.salary?.currency || "USD");
        setSalaryPeriod(
          preferences?.salary?.period === "month" ? "month" : "year",
        );
      }

      setPriorities(preferences?.priorities || []);
      setNegativePreferences(preferences?.negative_preferences || []);
      setNewLocationInput("");
      setCustomNegativeToken("");
    }
  }, [isOpen, preferences, constraints]);

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

  const handleToggleWorkMode = (wm: WorkMode) => {
    setWorkModes((prev) => {
      if (prev.includes(wm)) {
        if (prev.length === 1) {
          toast.warning("Select at least one work mode.");
          return prev;
        }
        return prev.filter((m) => m !== wm);
      }
      return [...prev, wm];
    });
  };

  const handleAddLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    if (locations.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning("This location is already added.");
      return;
    }
    setLocations((prev) => [...prev, trimmed]);
    setNewLocationInput("");
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations((prev) => prev.filter((l) => l !== loc));
  };

  const handleTogglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleToggleNegativePreset = (item: NegativePreferenceItem) => {
    setNegativePreferences((prev) => {
      const exists = prev.some((p) => p.token === item.token);
      if (exists) {
        return prev.filter((p) => p.token !== item.token);
      }
      return [...prev, item];
    });
  };

  const handleAddCustomNegative = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customNegativeToken.trim().toLowerCase();
    if (!trimmed) return;
    if (negativePreferences.some((p) => p.token === trimmed)) {
      toast.warning("This negative preference is already added.");
      return;
    }
    setNegativePreferences((prev) => [
      ...prev,
      { domain: "work_style", token: trimmed, penalty_weight: 1.0 },
    ]);
    setCustomNegativeToken("");
  };

  const handleRemoveNegative = (token: string) => {
    setNegativePreferences((prev) => prev.filter((p) => p.token !== token));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (workModes.length === 0) {
      toast.error("Select at least one work mode.");
      return;
    }

    const payloadPreferences: Preferences = {
      work_modes: workModes,
      locations,
      priorities,
      salary:
        salaryNotSpecified || !salaryMin
          ? null
          : {
              min_amount: Number(salaryMin),
              currency: salaryCurrency,
              period: salaryPeriod,
            },
      negative_preferences: negativePreferences,
    };

    const payloadConstraints: HardConstraints = {
      work_mode_strict: workModeStrict,
      relocation_prohibited: relocationProhibited,
    };

    setIsSaving(true);
    try {
      const ok = await onSave(payloadPreferences, payloadConstraints);
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
      aria-labelledby="preferences-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-card border border-border rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-secondary text-muted-foreground border border-border">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="preferences-dialog-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Edit Preferences & Constraints
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Configure hard constraints and job match preferences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close preferences dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-muted-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="preferences-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar"
        >
          {/* Section 1: Work Mode & Strictness */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-foreground block">
              Work Mode (Select at least 1)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {WORK_MODE_OPTIONS.map((opt) => {
                const isSelected = workModes.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleToggleWorkMode(opt.value)}
                    className={`min-h-[44px] p-2.5 rounded-sm border text-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-muted-foreground ${
                      isSelected
                        ? "bg-secondary text-foreground border-border-strong font-bold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Strictness Switch */}
            <label className="flex items-center justify-between p-3.5 rounded-sm bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-semibold text-foreground block">
                  Strict Work Mode Filter
                </span>
                <p className="text-[11px] text-muted-foreground">
                  When active, jobs that do not match your selected work modes
                  will be excluded from recommendations.
                </p>
              </div>

              <input
                type="checkbox"
                checked={workModeStrict}
                onChange={(e) => setWorkModeStrict(e.target.checked)}
                className="w-5 h-5 accent-muted-foreground cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Section 2: Locations & Relocation */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Preferred Locations
            </label>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected = locations.includes(loc);
                return (
                  <button
                    key={`loc-preset-${loc}`}
                    type="button"
                    onClick={() =>
                      isSelected
                        ? handleRemoveLocation(loc)
                        : handleAddLocation(loc)
                    }
                    className={`min-h-[36px] px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-muted-foreground ${
                      isSelected
                        ? "bg-secondary text-foreground border-border-strong font-semibold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>

            {/* Custom Location Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                placeholder="+ Add custom location (e.g. London, Tokyo)..."
                className="flex-1 bg-secondary/30 border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddLocation(newLocationInput)}
                disabled={!newLocationInput.trim()}
                className="min-h-[40px] px-3 text-xs rounded-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
            </div>

            {/* Relocation Switch */}
            <label className="flex items-center justify-between p-3.5 rounded-sm bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50 transition-colors">
              <div className="space-y-0.5 pr-3">
                <span className="text-xs font-semibold text-foreground block">
                  Strict Relocation Prohibition
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Only consider local or remote positions. Exclude roles
                  requiring relocation.
                </p>
              </div>

              <input
                type="checkbox"
                checked={relocationProhibited}
                onChange={(e) => setRelocationProhibited(e.target.checked)}
                className="w-5 h-5 accent-primary cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* Section 3: Salary Expectation */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
              Salary Expectation
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="salary-not-specified"
                checked={salaryNotSpecified}
                onChange={(e) => setSalaryNotSpecified(e.target.checked)}
                className="w-5 h-5 accent-muted-foreground cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium">
                No minimum constraint (keep recommendations open)
              </span>
            </label>

            {!salaryNotSpecified && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  className="w-28 bg-card border border-border rounded-sm px-2 py-2 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="IDR">IDR (Rp)</option>
                </select>

                <select
                  value={salaryPeriod}
                  onChange={(e) =>
                    setSalaryPeriod(e.target.value as "year" | "month")
                  }
                  className="w-28 bg-card border border-border rounded-sm px-2 py-2 text-xs text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground"
                >
                  <option value="year">per year</option>
                  <option value="month">per month</option>
                </select>

                <input
                  type="number"
                  value={salaryMin || ""}
                  onChange={(e) =>
                    setSalaryMin(e.target.value ? Number(e.target.value) : null)
                  }
                  placeholder="Minimum amount..."
                  className="flex-1 bg-secondary/30 border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground"
                />
              </div>
            )}
          </div>

          {/* Section 4: Priorities */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground">
              Career Priorities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PRIORITIES.map((p) => {
                const isSelected = priorities.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePriority(p.id)}
                    className={`min-h-[44px] p-2.5 rounded-sm border text-left transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-muted-foreground ${
                      isSelected
                        ? "bg-secondary border-border-strong text-foreground font-semibold"
                        : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      <span>{p.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Negative Preferences */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
              Negative Preferences (Anti-Matches)
            </label>
            <p className="text-[11px] text-muted-foreground">
              Positions matching these criteria will receive a lower
              recommendation score.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_NEGATIVE_PREFERENCES.map((neg) => {
                const isSelected = negativePreferences.some(
                  (p) => p.token === neg.token,
                );
                return (
                  <button
                    key={`neg-${neg.token}`}
                    type="button"
                    onClick={() => handleToggleNegativePreset(neg)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-muted-foreground ${
                      isSelected
                        ? "bg-destructive/15 text-destructive border-destructive/30 font-bold"
                        : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                    }`}
                  >
                    {NEGATIVE_PREFERENCE_LABELS[neg.token] || neg.token}
                  </button>
                );
              })}
            </div>

            {/* Custom Negative Tag Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customNegativeToken}
                onChange={(e) => setCustomNegativeToken(e.target.value)}
                placeholder="+ Add custom anti-match (e.g. legacy-tech, overtime)..."
                className="flex-1 bg-secondary/30 border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCustomNegative}
                disabled={!customNegativeToken.trim()}
                className="min-h-[40px] px-3 text-xs rounded-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </Button>
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
            form="preferences-form"
            disabled={isSaving}
            className="min-h-[44px] h-11 px-5 text-xs font-semibold gap-1.5 rounded-sm"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Save Preferences</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
