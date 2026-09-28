// ==============================================================================
// ONBOARDING WIZARD ORCHESTRATOR
// Module: @/features/onboarding/components/OnboardingWizard
// ==============================================================================

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";
import { OnboardingHeader } from "./OnboardingHeader";
import { Step1BackgroundCv } from "./Step1BackgroundCv";
import { Step2CareerIntent } from "./Step2CareerIntent";
import { Step3PreferencesConstraints } from "./Step3PreferencesConstraints";
import { Step4ReviewBento } from "./Step4ReviewBento";
import { Button } from "@/components/ui/button";

export function OnboardingWizard() {
  const router = useRouter();
  const {
    state,
    loading,
    isSaving,
    error,
    goToStep,
    handleUploadAndAnalyzeResume,
    handleContinueWithoutCv,
    handleSaveStep2,
    handleSaveStep3,
    handleConfirmProfile,
    suppressSkill,
    restoreSkill,
    addCustomSkill,
    setTargetRoles,
    setTargetLevel,
    setEmploymentTypes,
    setWorkModes,
    setWorkModeStrict,
    setLocations,
    setRelocationProhibited,
    setSalaryMin,
    setSalaryCurrency,
    setPriorities,
    setNegativePreferences,
    reloadProfile,
  } = useOnboardingProfile();

  // On confirmation complete, redirect to /jobs
  const handleFinalConfirm = async () => {
    const confirmed = await handleConfirmProfile();
    if (confirmed) {
      router.push("/jobs");
    }
    return confirmed;
  };

  if (loading) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">
          Loading your Career Profile...
        </p>
      </div>
    );
  }

  if (error && !state.profileId) {
    return (
      <div className="p-8 rounded-xl border border-destructive/30 bg-destructive/10 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Unable to load profile
          </h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={reloadProfile}
          className="text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-6 px-4">
      {/* Header with step indicators */}
      <OnboardingHeader
        currentStep={state.currentStep}
        isExistingActiveProfile={state.isExistingActiveProfile}
      />

      {/* Main Form Container */}
      <main className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        {state.currentStep === 1 && (
          <Step1BackgroundCv
            state={state}
            onUploadAndAnalyze={handleUploadAndAnalyzeResume}
            onContinueWithoutCv={handleContinueWithoutCv}
            onContinueToStep2={() => goToStep(2)}
            isSaving={isSaving}
          />
        )}

        {state.currentStep === 2 && (
          <Step2CareerIntent
            state={state}
            setTargetRoles={setTargetRoles}
            setTargetLevel={setTargetLevel}
            setEmploymentTypes={setEmploymentTypes}
            onSaveAndContinue={handleSaveStep2}
            onBack={() => goToStep(1)}
            isSaving={isSaving}
          />
        )}

        {state.currentStep === 3 && (
          <Step3PreferencesConstraints
            state={state}
            setWorkModes={setWorkModes}
            setWorkModeStrict={setWorkModeStrict}
            setLocations={setLocations}
            setRelocationProhibited={setRelocationProhibited}
            setSalaryMin={setSalaryMin}
            setSalaryCurrency={setSalaryCurrency}
            setPriorities={setPriorities}
            setNegativePreferences={setNegativePreferences}
            onSaveAndContinue={handleSaveStep3}
            onBack={() => goToStep(2)}
            isSaving={isSaving}
          />
        )}

        {state.currentStep === 4 && (
          <Step4ReviewBento
            state={state}
            goToStep={goToStep}
            suppressSkill={suppressSkill}
            restoreSkill={restoreSkill}
            addCustomSkill={addCustomSkill}
            onConfirm={handleFinalConfirm}
            onBack={() => goToStep(3)}
            isSaving={isSaving}
          />
        )}
      </main>
    </div>
  );
}
