// ==============================================================================
// VIEW: ProfileOverviewView
// Module: @/features/profile/views/ProfileOverviewView
// ==============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCareerProfile } from "../hooks/useCareerProfile";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileIntentCard } from "../components/ProfileIntentCard";
import { ProfilePreferencesCard } from "../components/ProfilePreferencesCard";
import { ProfileSkillsCard } from "../components/ProfileSkillsCard";
import { ProfileBackgroundCard } from "../components/ProfileBackgroundCard";
import { ProfilePageSkeleton } from "../components/ProfilePageSkeleton";
import { EditCareerIntentDialog } from "../components/dialogs/EditCareerIntentDialog";
import { EditPreferencesDialog } from "../components/dialogs/EditPreferencesDialog";
import { ManageSkillsSheet } from "../components/dialogs/ManageSkillsSheet";
import { EditBackgroundDialog } from "../components/dialogs/EditBackgroundDialog";
import { Button } from "@/components/ui/button";

export default function ProfileOverviewView() {
  const { user } = useAuth();
  const {
    profile,
    isLoading,
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

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  // If user has no profile or profile hasn't been initialized
  if (!profile) {
    return (
      <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold font-heading text-foreground">
              Profil Karir Belum Dibuat
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anda belum memiliki Canonical Career Profile. Selesaikan wizard
              onboarding untuk mendapatkan rekomendasi lowongan yang
              dipersonalisasi oleh AI Finder.
            </p>
          </div>

          <Link href="/onboarding" className="block">
            <Button className="w-full gap-2 text-xs">
              <span>Mulai Onboarding Karir</span>
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
    <div className="flex-1 min-h-0 w-full h-full overflow-y-auto custom-scrollbar">
      <div className="px-6 py-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          profile={profile}
          completenessScore={completenessScore}
          isMutating={isMutating}
          onRefresh={refreshProfile}
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Career Intent */}
          <ProfileIntentCard
            careerIntent={profile.careerIntent}
            primaryRole={primaryRole}
            secondaryRoles={secondaryRoles}
            onEdit={() => setActiveModal("intent")}
          />

          {/* Card 2: Career Preferences & Constraints */}
          <ProfilePreferencesCard
            preferences={profile.preferences}
            constraints={profile.constraints}
            onEdit={() => setActiveModal("preferences")}
          />

          {/* Card 3: Skills & Capabilities (Spans 2 columns on desktop) */}
          <div className="md:col-span-2">
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
            />
          </div>

          {/* Card 4: Career Background (Spans 2 columns on desktop) */}
          <div className="md:col-span-2">
            <ProfileBackgroundCard
              background={profile.background}
              onEdit={() => setActiveModal("background")}
            />
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
  );
}
