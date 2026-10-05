"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OnboardingFormState,
  WORK_MODE_OPTIONS,
} from "../types/onboarding.types";
import { WorkMode } from "@/features/profile/types/career-profile.types";

interface StepManualPreferencesProps {
  state: OnboardingFormState;
  setWorkModes: (modes: WorkMode[]) => void;
  setLocations: (locations: string[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  isSaving: boolean;
}

const POPULAR_LOCATIONS = [
  "Remote",
  "Jakarta",
  "Singapore",
  "United States",
  "Worldwide",
];

export function StepManualPreferences({
  state,
  setWorkModes,
  setLocations,
  onNext,
  onBack,
  isSaving,
}: StepManualPreferencesProps) {
  const [customLocation, setCustomLocation] = useState("");

  const handleToggleWorkMode = (mode: WorkMode) => {
    const exists = state.workModes.includes(mode);
    if (exists) {
      if (state.workModes.length === 1) return;
      setWorkModes(state.workModes.filter((m) => m !== mode));
    } else {
      setWorkModes([...state.workModes, mode]);
    }
  };

  const handleAddLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (!trimmed) return;
    const exists = state.locations.some(
      (l) => l.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!exists) {
      setLocations([...state.locations, trimmed]);
    }
    setCustomLocation("");
  };

  const handleRemoveLocation = (loc: string) => {
    setLocations(state.locations.filter((l) => l !== loc));
  };

  const canContinue = state.workModes.length > 0;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading">
          Where and how do you want to work?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select preferred work environments and locations.
        </p>
      </div>

      {/* Work Modes */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-semibold text-foreground block">
          Work Environment (Select at least one)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORK_MODE_OPTIONS.map((opt) => {
            const isSelected = state.workModes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleWorkMode(opt.value)}
                className={`p-3.5 rounded-sm border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground block truncate mt-1">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="location-input"
            className="text-xs sm:text-sm font-semibold text-foreground block"
          >
            Preferred Locations (Optional)
          </label>
          <span className="text-xs text-muted-foreground">
            Leave blank if open anywhere
          </span>
        </div>

        {/* Selected Locations Chips */}
        {state.locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-sm bg-secondary/30 border border-border/70 max-h-[70px] overflow-y-auto custom-scrollbar">
            {state.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-card border border-border text-foreground"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  aria-label={`Remove ${loc}`}
                  className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick Location Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs text-muted-foreground shrink-0">
            Popular:
          </span>
          {POPULAR_LOCATIONS.map((loc) => {
            const isAdded = state.locations.some(
              (l) => l.toLowerCase() === loc.toLowerCase(),
            );
            return (
              <button
                key={loc}
                type="button"
                onClick={() =>
                  isAdded ? handleRemoveLocation(loc) : handleAddLocation(loc)
                }
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                  isAdded
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Custom Location Input */}
        <div className="flex gap-2 pt-0.5">
          <input
            id="location-input"
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLocation(customLocation);
              }
            }}
            placeholder="Add custom city or country..."
            className="flex-1 min-h-[42px] px-3.5 text-sm rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddLocation(customLocation)}
            disabled={!customLocation.trim()}
            className="min-h-[42px] px-4 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3.5 flex items-center justify-between gap-3 border-t border-border/80">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="min-h-[44px] text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={isSaving || !canContinue}
          className="min-h-[44px] text-sm font-semibold px-5 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            <>
              Next: Core Skills
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
