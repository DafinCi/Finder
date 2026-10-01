"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { useOnboardingProfile } from "../hooks/useOnboardingProfile";
import { OnboardingHeader } from "./OnboardingHeader";
import { StepWelcomeChoice } from "./StepWelcomeChoice";
import { StepCvQuickReview } from "./StepCvQuickReview";
import { StepManualRole } from "./StepManualRole";
import { StepManualPreferences } from "./StepManualPreferences";
import { StepManualSkills } from "./StepManualSkills";
import { Button } from "@/components/ui/button";

export function OnboardingWizard() {
  const router = useRouter();
  const {
    state,
    loading,
    isSaving,
    error,
    goToStep,
    setFlowMode,
    setPrimaryRole,
    toggleSkill,
    removeSkill,
    addCustomSkill,
    handleUploadAndAnalyzeResume,
    handleQuickCvConfirm,
    handleSaveManualStep1,
    handleSaveManualStep2,
    handleConfirmProfile,
    setTargetLevel,
    setEmploymentTypes,
    setWorkModes,
    setLocations,
    reloadProfile,
  } = useOnboardingProfile();

  const handleFinalConfirm = async () => {
    const confirmed = await handleConfirmProfile();
    if (confirmed) {
      router.push("/jobs");
    }
  };

  const handleQuickCvExplore = async () => {
    const confirmed = await handleQuickCvConfirm();
    if (confirmed) {
      router.push("/jobs");
    }
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
      <div className="p-8 rounded-sm border border-destructive/30 bg-destructive/10 text-center space-y-4 max-w-md mx-auto">
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
    <div className="w-full max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Dynamic Header */}
      <OnboardingHeader
        currentStep={state.currentStep}
        flowMode={state.flowMode}
        isExistingActiveProfile={state.isExistingActiveProfile}
      />

      {/* Active Profile Shortcut Banner */}
      {state.isExistingActiveProfile && (
        <div className="p-4 rounded-sm border border-emerald-500/30 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              You already have an active Career Profile
            </p>
            <p className="text-muted-foreground">
              You can re-configure your preferences here, or manage your full
              settings in your Career Profile.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-secondary text-foreground font-medium transition-colors"
            >
              Manage in Profile
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              View Matching Jobs
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Screen Container */}
      <main className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        {state.flowMode === "choice" && (
          <StepWelcomeChoice
            state={state}
            onUploadAndAnalyze={handleUploadAndAnalyzeResume}
            onStartManual={() => {
              setFlowMode("manual");
              goToStep(1);
            }}
            onGoToCvReview={() => setFlowMode("cv_magic")}
            isSaving={isSaving}
          />
        )}

        {state.flowMode === "cv_magic" && (
          <StepCvQuickReview
            state={state}
            setPrimaryRole={setPrimaryRole}
            setTargetLevel={setTargetLevel}
            setWorkModes={setWorkModes}
            removeSkill={removeSkill}
            addCustomSkill={addCustomSkill}
            onConfirmAndExplore={handleQuickCvExplore}
            onSwitchToManual={() => {
              setFlowMode("manual");
              goToStep(1);
            }}
            onUploadDifferentResume={() => setFlowMode("choice")}
            isSaving={isSaving}
          />
        )}

        {state.flowMode === "manual" && (
          <>
            {state.currentStep === 1 && (
              <StepManualRole
                state={state}
                setPrimaryRole={setPrimaryRole}
                setTargetLevel={setTargetLevel}
                setEmploymentTypes={setEmploymentTypes}
                onNext={async () => {
                  await handleSaveManualStep1();
                }}
                onBack={() => setFlowMode("choice")}
                isSaving={isSaving}
              />
            )}

            {state.currentStep === 2 && (
              <StepManualPreferences
                state={state}
                setWorkModes={setWorkModes}
                setLocations={setLocations}
                onNext={async () => {
                  await handleSaveManualStep2();
                }}
                onBack={() => goToStep(1)}
                isSaving={isSaving}
              />
            )}

            {state.currentStep >= 3 && (
              <StepManualSkills
                state={state}
                toggleSkill={toggleSkill}
                removeSkill={removeSkill}
                addCustomSkill={addCustomSkill}
                onFinish={handleFinalConfirm}
                onBack={() => goToStep(2)}
                isSaving={isSaving}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
