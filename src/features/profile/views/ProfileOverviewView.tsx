"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code,
  AlertCircle,
  RotateCcw,
  Briefcase,
  Target,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCareerProfile } from "../hooks/useCareerProfile";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileTargetPreferencesCard } from "../components/ProfileTargetPreferencesCard";
import { ProfileResumeCard } from "../components/ProfileResumeCard";
import { ProfileSkillsCard } from "../components/ProfileSkillsCard";
import { ProfileBackgroundCard } from "../components/ProfileBackgroundCard";
import { ProfilePageSkeleton } from "../components/ProfilePageSkeleton";
import { EditCareerIntentDialog } from "../components/dialogs/EditCareerIntentDialog";
import { EditPreferencesDialog } from "../components/dialogs/EditPreferencesDialog";
import { ManageSkillsSheet } from "../components/dialogs/ManageSkillsSheet";
import { EditBackgroundDialog } from "../components/dialogs/EditBackgroundDialog";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/layouts/AppHeader";

export default function ProfileOverviewView() {
  const { user } = useAuth();
  const {
    profile,
    isLoading,
    isRefreshing,
    isMutating,
    error,
    primaryRole,
    secondaryRoles,
    coreSkills,
    supportingSkills,
    toolSkills,
    suppressedSkills,
    completenessScore,
    refreshProfile,
    updateCareerIntent,
    updatePreferences,
    addSkill,
    suppressSkill,
    restoreSkill,
    updateSkill,
    syncSkills,
    updateBackground,
  } = useCareerProfile();

  // Active dialog modal state
  const [activeModal, setActiveModal] = useState<
    "intent" | "preferences" | "skills" | "background" | null
  >(null);

  if (isLoading && !profile) {
    return <ProfilePageSkeleton />;
  }

  // If loading failed and there is no profile cached in state
  if (error && !profile) {
    return (
      <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-sm border border-destructive/30 bg-card p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-heading text-foreground">
              Unable to Load Career Profile
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error ||
                "An error occurred while retrieving your profile. Please check your connection and try again."}
            </p>
          </div>

          <Button
            onClick={() => refreshProfile()}
            className="w-full min-h-[44px] h-11 gap-2 text-xs font-semibold cursor-pointer rounded-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  // If user has no profile or profile hasn't been initialized
  if (!profile) {
    return (
      <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-sm border border-border bg-card p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-sm bg-secondary border border-border text-muted-foreground flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-heading text-foreground">
              No Career Profile Found
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete onboarding to configure your career targets, work
              preferences, and resume for high-accuracy job recommendations.
            </p>
          </div>

          <Link href="/onboarding" className="block">
            <Button className="w-full min-h-[44px] h-11 gap-2 text-xs font-semibold cursor-pointer rounded-sm">
              <span>Start Career Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleConfirmSkill = async (skillName: string) => {
    return updateSkill(skillName, { confirmation_state: "confirmed" });
  };

  return (
    <div className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
      <AppHeader title="Profile" />

      <div className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar scroll-smooth">
        <div className="">
          {/* Error banner when refreshing existing profile */}
          {error && profile && (
            <div className="p-4 rounded-sm border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => refreshProfile()}
                className="text-xs font-semibold underline hover:no-underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Unified Career Profile Document Sheet */}
          <div className="overflow-hidden">
            {/* Profile Hero Header with Centered Avatar and Chat-Wallpaper Cover */}
            <ProfileHeader
              user={user}
              profile={profile}
              completenessScore={completenessScore}
              isRefreshing={isRefreshing}
              isMutating={isMutating}
              onRefresh={refreshProfile}
            />

            {/* Sticky Navigation Bar across Desktop & Mobile (min 44px touch targets) */}
            <nav
              aria-label="Profile Sections"
              className="sticky top-0 z-20 bg-card/95 backdrop-blur-xs border-y border-border/80 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar"
            >
              <a
                href="#section-preferences"
                className="min-h-[44px] h-11 px-3.5 rounded-sm border border-border/70 bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Target & Preferences</span>
              </a>
              <a
                href="#section-resume"
                className="min-h-[44px] h-11 px-3.5 rounded-sm border border-border/70 bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Resume</span>
              </a>
              <a
                href="#section-skills"
                className="min-h-[44px] h-11 px-3.5 rounded-sm border border-border/70 bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <Code className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Skills Inventory</span>
              </a>
              <a
                href="#section-background"
                className="min-h-[44px] h-11 px-3.5 rounded-sm border border-border/70 bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Work & Background</span>
              </a>
            </nav>

            {/* Document Sections with clean continuous divider lines */}
            <div className="divide-y divide-border/80">
              {/* Section 1: Career Goals & Work Preferences */}
              <section id="section-preferences" className="scroll-mt-14">
                <ProfileTargetPreferencesCard
                  careerIntent={profile.careerIntent}
                  preferences={profile.preferences}
                  constraints={profile.constraints}
                  primaryRole={primaryRole}
                  secondaryRoles={secondaryRoles}
                  onEditIntent={() => setActiveModal("intent")}
                  onEditPreferences={() => setActiveModal("preferences")}
                  className="p-5 sm:p-7 space-y-6"
                />
              </section>

              {/* Section 2: Resume & Document Source */}
              <section id="section-resume" className="scroll-mt-14">
                <ProfileResumeCard
                  resumeId={profile.resumeId}
                  expectedVersion={profile.profileVersion}
                  onProfileUpdated={refreshProfile}
                  className="p-5 sm:p-7 space-y-4"
                />
              </section>

              {/* Section 3: Skills & Capabilities */}
              <section id="section-skills" className="scroll-mt-14">
                <ProfileSkillsCard
                  coreSkills={coreSkills}
                  supportingSkills={supportingSkills}
                  toolSkills={toolSkills}
                  suppressedSkills={suppressedSkills}
                  isMutating={isMutating}
                  onAddSkill={(skill, cat) => addSkill(skill, cat)}
                  onSuppressSkill={(skill) => suppressSkill(skill)}
                  onRestoreSkill={(skill) => restoreSkill(skill)}
                  onConfirmSkill={handleConfirmSkill}
                  onManage={() => setActiveModal("skills")}
                  className="p-5 sm:p-7 space-y-6"
                />
              </section>

              {/* Section 4: Career Background & Education */}
              <section id="section-background" className="scroll-mt-14">
                <ProfileBackgroundCard
                  background={profile.background}
                  onEdit={() => setActiveModal("background")}
                  className="p-5 sm:p-7 space-y-6"
                />
              </section>
            </div>
          </div>

          {/* Edit Dialogs */}
          <EditCareerIntentDialog
            isOpen={activeModal === "intent"}
            onClose={() => setActiveModal(null)}
            careerIntent={profile.careerIntent}
            onSave={updateCareerIntent}
          />

          <EditPreferencesDialog
            isOpen={activeModal === "preferences"}
            onClose={() => setActiveModal(null)}
            preferences={profile.preferences}
            constraints={profile.constraints}
            onSave={updatePreferences}
          />

          <ManageSkillsSheet
            isOpen={activeModal === "skills"}
            onClose={() => setActiveModal(null)}
            skills={profile.capabilities?.skills || []}
            suppressedSkills={profile.capabilities?.suppressed_skills || []}
            isMutating={isMutating}
            onAddSkill={addSkill}
            onUpdateSkill={updateSkill}
            onSuppressSkill={suppressSkill}
            onRestoreSkill={restoreSkill}
            onSyncSkills={syncSkills}
          />

          <EditBackgroundDialog
            isOpen={activeModal === "background"}
            onClose={() => setActiveModal(null)}
            background={profile.background}
            onSave={updateBackground}
          />
        </div>
      </div>
    </div>
  );
}
