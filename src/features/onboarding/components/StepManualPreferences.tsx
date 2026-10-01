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
      if (state.workModes.length === 1) return; // Keep at least one
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
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Where and how do you want to work?
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select your preferred work modes and any specific regions you want to
          focus on.
        </p>
      </div>

      {/* Work Modes */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-foreground block">
          Work Environment (Choose at least one)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WORK_MODE_OPTIONS.map((opt) => {
            const isSelected = state.workModes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleWorkMode(opt.value)}
                className={`min-h-[52px] p-3 rounded-sm border text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="space-y-2.5">
        <label
          htmlFor="location-input"
          className="text-xs font-semibold text-foreground block"
        >
          Preferred Locations (Optional)
        </label>
        <p className="text-[11px] text-muted-foreground">
          Leave blank if you are open to opportunities anywhere.
        </p>

        {/* Selected Locations Chips */}
        {state.locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-sm bg-secondary/30 border border-border">
            {state.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-card border border-border text-foreground"
              >
                <MapPin className="w-3 h-3 text-primary" />
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  aria-label={`Remove ${loc}`}
                  className="text-muted-foreground hover:text-destructive cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-xs p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom Location Input */}
        <div className="flex gap-2">
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
            placeholder="Type a city or country and press Add..."
            className="flex-1 min-h-[44px] px-3.5 text-xs rounded-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddLocation(customLocation)}
            disabled={!customLocation.trim()}
            className="min-h-[44px] px-4 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground mr-1">
            Quick add:
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
                className={`min-h-[32px] px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isAdded
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                }`}
              >
                {loc} {isAdded ? "✓" : "+"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 flex items-center justify-between gap-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Role
        </Button>

        <Button
          type="button"
          variant="default"
          onClick={onNext}
          disabled={isSaving || !canContinue}
          className="min-h-[44px] text-xs font-semibold px-5"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            <>
              Next: Core Skills
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
