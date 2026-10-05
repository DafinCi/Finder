// ==============================================================================
// STEP 3: WORK PREFERENCES & CONSTRAINTS
// Module: @/features/onboarding/components/Step3PreferencesConstraints
// ==============================================================================

"use client";

import React, { useState } from "react";
import {
  MapPin,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Plus,
  X,
  Sliders,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WORK_MODE_OPTIONS,
  PRESET_LOCATIONS,
  PRESET_PRIORITIES,
  PRESET_NEGATIVE_PREFERENCES,
  NEGATIVE_PREFERENCE_LABELS,
  OnboardingFormState,
} from "../types/onboarding.types";
import {
  WorkMode,
  NegativePreferenceItem,
} from "@/features/profile/types/career-profile.types";

interface Step3PreferencesConstraintsProps {
  state: OnboardingFormState;
  setWorkModes: (modes: WorkMode[]) => void;
  setWorkModeStrict: (strict: boolean) => void;
  setLocations: (locations: string[]) => void;
  setRelocationProhibited: (prohibited: boolean) => void;
  setSalaryMin: (amount: number | null) => void;
  setSalaryCurrency: (currency: string) => void;
  setPriorities: (priorities: string[]) => void;
  setNegativePreferences: (prefs: NegativePreferenceItem[]) => void;
  onSaveAndContinue: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

export function Step3PreferencesConstraints({
  state,
  setWorkModes,
  setWorkModeStrict,
  setLocations,
  setRelocationProhibited,
  setSalaryMin,
  setSalaryCurrency,
  setPriorities,
  setNegativePreferences,
  onSaveAndContinue,
  onBack,
  isSaving,
}: Step3PreferencesConstraintsProps) {
  const [customLocationInput, setCustomLocationInput] = useState("");

  const handleToggleWorkMode = (mode: WorkMode) => {
    if (state.workModes.includes(mode)) {
      if (state.workModes.length === 1) return; // Keep at least one
      setWorkModes(state.workModes.filter((m) => m !== mode));
    } else {
      setWorkModes([...state.workModes, mode]);
    }
  };

  const handleToggleLocation = (loc: string) => {
    if (state.locations.includes(loc)) {
      setLocations(state.locations.filter((l) => l !== loc));
    } else {
      setLocations([...state.locations, loc]);
    }
  };

  const handleAddCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLocationInput.trim();
    if (!trimmed) return;
    if (!state.locations.includes(trimmed)) {
      setLocations([...state.locations, trimmed]);
    }
    setCustomLocationInput("");
  };

  const handleTogglePriority = (pId: string) => {
    if (state.priorities.includes(pId)) {
      setPriorities(state.priorities.filter((p) => p !== pId));
    } else {
      if (state.priorities.length >= 3) {
        // Max 3 priorities allowed
        return;
      }
      setPriorities([...state.priorities, pId]);
    }
  };

  const handleToggleNegativePreference = (item: NegativePreferenceItem) => {
    const exists = state.negativePreferences.some(
      (np) => np.token === item.token,
    );
    if (exists) {
      setNegativePreferences(
        state.negativePreferences.filter((np) => np.token !== item.token),
      );
    } else {
      setNegativePreferences([...state.negativePreferences, item]);
    }
  };

  const canContinue = state.workModes.length > 0;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold font-heading text-foreground tracking-tight">
          Work Modes & Non-Negotiables
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure where you want to work, your hard constraints, and what
          matters most in your next opportunity.
        </p>
      </div>

      {/* 1. Work Modes & Strict Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            Preferred Work Modes (Select at least one)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORK_MODE_OPTIONS.map((opt) => {
            const isSelected = state.workModes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleWorkMode(opt.value)}
                className={`p-3 rounded-sm border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground shadow-2xs"
                    : "bg-card/70 border-border/70 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <span
                    className={`text-xs font-bold font-heading ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Strict Work Mode Switch */}
        <div className="p-3 rounded-sm bg-card border border-border/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" />
              Strict Work Mode Constraint
            </span>
            <p className="text-[11px] text-muted-foreground">
              When enabled, opportunities that do not match your chosen modes
              will be filtered out.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.workModeStrict}
            onClick={() => setWorkModeStrict(!state.workModeStrict)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              state.workModeStrict
                ? "bg-primary"
                : "bg-secondary border border-border"
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                state.workModeStrict ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Locations & Relocation Switch */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          Preferred Locations (Optional)
        </label>

        {/* Selected Locations Chips */}
        {state.locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {state.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-sm bg-primary/10 border border-primary/30 text-xs font-medium text-foreground"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleToggleLocation(loc)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Preset Location Pills */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_LOCATIONS.map((loc) => {
            const isSelected = state.locations.includes(loc);
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleToggleLocation(loc)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 border-primary/50 text-primary font-semibold"
                    : "bg-secondary/30 border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {loc}
              </button>
            );
          })}
        </div>

        {/* Custom Location Input */}
        <form onSubmit={handleAddCustomLocation} className="flex gap-2">
          <input
            type="text"
            placeholder="Add location (e.g. Bandung, remote APAC, London)..."
            value={customLocationInput}
            onChange={(e) => setCustomLocationInput(e.target.value)}
            className="flex-1 bg-secondary/40 border border-border/80 rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-sans"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!customLocationInput.trim()}
            className="text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </form>

        {/* Prohibit Relocation Switch */}
        <div className="p-3 rounded-sm bg-card border border-border/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-primary" />
              Prohibit Relocation
            </span>
            <p className="text-[11px] text-muted-foreground">
              Hard-exclude any job listing that requires physical relocation
              away from your preferred location.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.relocationProhibited}
            onClick={() => setRelocationProhibited(!state.relocationProhibited)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
              state.relocationProhibited
                ? "bg-primary"
                : "bg-secondary border border-border"
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                state.relocationProhibited ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Salary Expectation (Optional) */}
      <div className="space-y-2.5 pt-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-primary" />
          Minimum Expected Salary (Optional)
        </label>
        <p className="text-[11px] text-muted-foreground">
          Used as a soft preference. Jobs without disclosed compensation will
          never be penalized.
        </p>

        <div className="flex gap-2 max-w-sm">
          <select
            value={state.salaryCurrency}
            onChange={(e) => setSalaryCurrency(e.target.value)}
            className="bg-secondary/40 border border-border/80 rounded-sm px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
          >
            <option value="USD">USD ($)</option>
            <option value="IDR">IDR (Rp)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="EUR">EUR (€)</option>
          </select>

          <input
            type="number"
            min="0"
            step="1000"
            placeholder={state.salaryCurrency === "IDR" ? "15000000" : "50000"}
            value={state.salaryMin ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setSalaryMin(val === "" ? null : parseFloat(val));
            }}
            className="flex-1 bg-secondary/40 border border-border/80 rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
          />

          {state.salaryMin !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSalaryMin(null)}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 4. Top Priorities (Choose up to 3) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground block">
            What matters most in your next opportunity? (Choose up to 3)
          </label>
          <span className="text-[11px] text-muted-foreground">
            {state.priorities.length} / 3 selected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_PRIORITIES.map((p) => {
            const isSelected = state.priorities.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleTogglePriority(p.id)}
                className={`p-2.5 rounded-sm border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground shadow-2xs"
                    : "bg-secondary/20 border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between pb-0.5">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {p.label}
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80"
                    }`}
                  >
                    {isSelected && <Check className="w-2 h-2" />}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Negative Preferences (Things to avoid) */}
      <div className="space-y-2.5 pt-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ThumbsDown className="w-3.5 h-3.5 text-primary" />
          Things to Avoid (Optional)
        </label>
        <p className="text-[11px] text-muted-foreground">
          Jobs featuring these attributes will receive a deterministic penalty.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_NEGATIVE_PREFERENCES.map((np) => {
            const isSelected = state.negativePreferences.some(
              (item) => item.token === np.token,
            );
            return (
              <button
                key={np.token}
                type="button"
                onClick={() => handleToggleNegativePreference(np)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-destructive/15 border-destructive/50 text-destructive font-semibold"
                    : "bg-secondary/30 border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                {NEGATIVE_PREFERENCE_LABELS[np.token] || np.token}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/80">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onSaveAndContinue}
          disabled={!canContinue || isSaving}
          className="text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Review Profile Bento
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
