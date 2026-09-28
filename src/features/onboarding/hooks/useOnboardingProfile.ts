// ==============================================================================
// ONBOARDING PROFILE HOOK
// Module: @/features/onboarding/hooks/useOnboardingProfile
// ==============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  OnboardingStepNumber,
  OnboardingFormState,
} from "../types/onboarding.types";
import {
  onboardingService,
  OnboardingVersionConflictError,
  OnboardingApiError,
} from "../services/onboarding.service";
import {
  CareerProfile,
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
  WorkMode,
  CapabilityItem,
  SkillCategory,
  SuppressedSkillItem,
  NegativePreferenceItem,
} from "@/features/profile/types/career-profile.types";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";

const INITIAL_STATE: OnboardingFormState = {
  resumeId: null,
  resumeFileName: null,
  isUploadingResume: false,
  isAnalyzingResume: false,
  resumeExtracted: false,
  background: { education: [], experience: [], projects: [] },
  targetRoles: [],
  targetLevel: null,
  employmentTypes: ["full_time"],
  workModes: ["remote"],
  workModeStrict: false,
  locations: [],
  relocationProhibited: false,
  salaryMin: null,
  salaryCurrency: "USD",
  priorities: [],
  negativePreferences: [],
  skills: [],
  suppressedSkills: [],
  currentStep: 1,
  expectedVersion: 1,
  profileId: null,
  isExistingActiveProfile: false,
};

export function useOnboardingProfile() {
  const [state, setState] = useState<OnboardingFormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state from CareerProfile entity
  const syncFromProfile = useCallback((profile: CareerProfile) => {
    setState((prev) => ({
      ...prev,
      profileId: profile.id,
      expectedVersion: profile.profileVersion,
      currentStep: Math.min(
        Math.max(profile.currentOnboardingStep || 1, 1),
        4,
      ) as OnboardingStepNumber,
      isExistingActiveProfile:
        profile.status === "active" || profile.onboardingCompleted,
      resumeId: profile.resumeId,
      background: profile.background || {
        education: [],
        experience: [],
        projects: [],
      },
      skills: profile.capabilities?.skills || [],
      suppressedSkills: profile.capabilities?.suppressed_skills || [],
      targetRoles: profile.careerIntent?.target_roles || [],
      targetLevel: profile.careerIntent?.target_level || null,
      employmentTypes:
        profile.careerIntent?.employment_types &&
        profile.careerIntent.employment_types.length > 0
          ? profile.careerIntent.employment_types
          : ["full_time"],
      workModes:
        profile.preferences?.work_modes &&
        profile.preferences.work_modes.length > 0
          ? profile.preferences.work_modes
          : ["remote"],
      workModeStrict: Boolean(profile.constraints?.work_mode_strict),
      locations: profile.preferences?.locations || [],
      relocationProhibited: Boolean(profile.constraints?.relocation_prohibited),
      salaryMin: profile.preferences?.salary?.min_amount ?? null,
      salaryCurrency: profile.preferences?.salary?.currency || "USD",
      priorities: profile.preferences?.priorities || [],
      negativePreferences: profile.preferences?.negative_preferences || [],
    }));
  }, []);

  // Initial load effect with cancellation guard
  useEffect(() => {
    let cancelled = false;

    async function initProfile() {
      try {
        let profile = await onboardingService.fetchProfile();
        if (cancelled) return;
        if (!profile) {
          profile = await onboardingService.initializeDraft();
        }
        if (cancelled) return;
        syncFromProfile(profile);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load career profile";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initProfile();

    return () => {
      cancelled = true;
    };
  }, [syncFromProfile]);

  const reloadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let profile = await onboardingService.fetchProfile();
      if (!profile) {
        profile = await onboardingService.initializeDraft();
      }
      syncFromProfile(profile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load career profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [syncFromProfile]);

  // Handle 409 Conflict Recovery
  const handleVersionConflict = useCallback(
    async (conflictErr: OnboardingVersionConflictError) => {
      toast.warning(
        "Profile was modified in another session. Synchronizing with latest version...",
      );
      try {
        const freshProfile = await onboardingService.fetchProfile();
        if (freshProfile) {
          syncFromProfile(freshProfile);
        }
      } catch (e) {
        console.error("Failed to re-sync after version conflict:", e);
      }
    },
    [syncFromProfile],
  );

  // Step 1: Upload & Analyze CV
  const handleUploadAndAnalyzeResume = useCallback(
    async (file: File) => {
      try {
        setError(null);
        setState((prev) => ({
          ...prev,
          isUploadingResume: true,
          resumeFileName: file.name,
        }));

        const uploadRes = await onboardingService.uploadResume(file);
        const resumeId = uploadRes.resumeId;

        setState((prev) => ({
          ...prev,
          resumeId,
          isUploadingResume: false,
          isAnalyzingResume: true,
        }));

        const analyzeRes = await onboardingService.analyzeResume(resumeId);
        const candidate = analyzeRes.analysis?.candidate;
        const career = analyzeRes.analysis?.career;

        const now = new Date().toISOString();

        // Convert extracted skills
        const extractedSkills: CapabilityItem[] = [];
        if (candidate?.skills?.core) {
          for (const s of candidate.skills.core) {
            extractedSkills.push({
              skill: s,
              category: "core",
              confirmation_state: "draft",
              provenance: {
                source: "resume_extracted",
                confidence: 0.9,
                updated_at: now,
              },
            });
          }
        }
        if (candidate?.skills?.supporting) {
          for (const s of candidate.skills.supporting) {
            // Avoid duplicate with core
            if (!extractedSkills.some((item) => matchesSkill(item.skill, s))) {
              extractedSkills.push({
                skill: s,
                category: "supporting",
                confirmation_state: "draft",
                provenance: {
                  source: "resume_extracted",
                  confidence: 0.8,
                  updated_at: now,
                },
              });
            }
          }
        }

        // Filter against any previously suppressed skills
        const filteredSkills = extractedSkills.filter(
          (extracted) =>
            !state.suppressedSkills.some((supp) =>
              matchesSkill(supp.skill, extracted.skill),
            ),
        );

        // Build education
        const education = (candidate?.education || []).map((edu) => ({
          id: `edu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          institution: edu.institution || "Unknown Institution",
          degree: edu.degree || "",
          field_of_study: "",
          graduation_year:
            edu.year && !isNaN(parseInt(edu.year, 10))
              ? parseInt(edu.year, 10)
              : null,
          provenance: {
            source: "resume_extracted" as const,
            confidence: 0.9,
            updated_at: now,
          },
        }));

        // Build experience
        const experience = (candidate?.experience || []).map((exp) => ({
          id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          company_name: exp.company || "Company",
          role_title: exp.role || "Role",
          start_date: null,
          end_date: null,
          is_current: false,
          description_summary: exp.achievements?.join(". ") || "",
          technologies_used: [],
          provenance: {
            source: "resume_extracted" as const,
            confidence: 0.9,
            updated_at: now,
          },
        }));

        const newBackground = {
          education,
          experience,
          projects: [],
        };

        // Determine suggested roles if user hasn't selected any yet
        let suggestedRoles = state.targetRoles;
        if (suggestedRoles.length === 0 && career?.recommended_roles?.length) {
          suggestedRoles = career.recommended_roles
            .slice(0, 3)
            .map((r, idx) => ({
              role: r,
              priority: idx === 0 ? "primary" : "secondary",
            }));
        }

        // Determine suggested level if user hasn't selected any yet
        let suggestedLevel = state.targetLevel;
        if (!suggestedLevel && career?.career_level) {
          const raw = career.career_level.toLowerCase();
          if (raw.includes("intern")) suggestedLevel = "internship";
          else if (raw.includes("entry") || raw.includes("fresh"))
            suggestedLevel = "entry_level";
          else if (raw.includes("junior")) suggestedLevel = "junior";
          else if (raw.includes("mid")) suggestedLevel = "mid_level";
          else if (raw.includes("senior")) suggestedLevel = "senior";
          else if (raw.includes("lead") || raw.includes("principal"))
            suggestedLevel = "lead";
        }

        // Save to draft profile with CAS
        const updatedProfile = await onboardingService.saveDraftStep({
          expected_version: state.expectedVersion,
          current_step: 1,
          background: newBackground,
          capabilities: {
            extraction_status: "success",
            skills: filteredSkills,
            suppressed_skills: state.suppressedSkills,
          },
        });

        setState((prev) => ({
          ...prev,
          expectedVersion: updatedProfile.profileVersion,
          resumeExtracted: true,
          background: newBackground,
          skills: filteredSkills,
          targetRoles: suggestedRoles,
          targetLevel: suggestedLevel,
        }));

        toast.success(
          "Resume parsed successfully! Skills & background extracted.",
        );
      } catch (err) {
        if (err instanceof OnboardingVersionConflictError) {
          await handleVersionConflict(err);
        } else {
          const msg =
            err instanceof Error ? err.message : "Failed to analyze resume";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setState((prev) => ({
          ...prev,
          isUploadingResume: false,
          isAnalyzingResume: false,
        }));
      }
    },
    [
      state.expectedVersion,
      state.suppressedSkills,
      state.targetRoles,
      state.targetLevel,
      handleVersionConflict,
    ],
  );

  // Step 1: Skip / Continue without CV
  const handleContinueWithoutCv = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);
      const updatedProfile = await onboardingService.saveDraftStep({
        expected_version: state.expectedVersion,
        current_step: 2,
      });

      setState((prev) => ({
        ...prev,
        currentStep: 2,
        expectedVersion: updatedProfile.profileVersion,
      }));
    } catch (err) {
      if (err instanceof OnboardingVersionConflictError) {
        await handleVersionConflict(err);
      } else {
        const msg =
          err instanceof Error ? err.message : "Failed to proceed to Step 2";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [state.expectedVersion, handleVersionConflict]);

  // Step 2: Save Career Intent & Continue to Step 3
  const handleSaveStep2 = useCallback(async () => {
    if (state.targetRoles.length === 0) {
      toast.error("Please select at least one target role.");
      return;
    }
    if (!state.targetRoles.some((r) => r.priority === "primary")) {
      toast.error("Please mark at least one role as Primary.");
      return;
    }
    if (!state.targetLevel) {
      toast.error("Please select your target seniority level.");
      return;
    }
    if (state.employmentTypes.length === 0) {
      toast.error("Please select at least one employment type.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updatedProfile = await onboardingService.saveDraftStep({
        expected_version: state.expectedVersion,
        current_step: 3,
        career_intent: {
          target_roles: state.targetRoles,
          target_level: state.targetLevel,
          employment_types: state.employmentTypes,
        },
      });

      setState((prev) => ({
        ...prev,
        currentStep: 3,
        expectedVersion: updatedProfile.profileVersion,
      }));
    } catch (err) {
      if (err instanceof OnboardingVersionConflictError) {
        await handleVersionConflict(err);
      } else {
        const msg =
          err instanceof Error ? err.message : "Failed to save career intent";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    state.targetRoles,
    state.targetLevel,
    state.employmentTypes,
    state.expectedVersion,
    handleVersionConflict,
  ]);

  // Step 3: Save Preferences & Constraints & Continue to Step 4
  const handleSaveStep3 = useCallback(async () => {
    if (state.workModes.length === 0) {
      toast.error("Please select at least one preferred work mode.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updatedProfile = await onboardingService.saveDraftStep({
        expected_version: state.expectedVersion,
        current_step: 4,
        preferences: {
          locations: state.locations,
          work_modes: state.workModes,
          priorities: state.priorities,
          salary:
            state.salaryMin !== null
              ? {
                  min_amount: state.salaryMin,
                  currency: state.salaryCurrency,
                }
              : null,
          negative_preferences: state.negativePreferences,
        },
        constraints: {
          work_mode_strict: state.workModeStrict,
          relocation_prohibited: state.relocationProhibited,
        },
      });

      setState((prev) => ({
        ...prev,
        currentStep: 4,
        expectedVersion: updatedProfile.profileVersion,
      }));
    } catch (err) {
      if (err instanceof OnboardingVersionConflictError) {
        await handleVersionConflict(err);
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to save work preferences";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    state.workModes,
    state.locations,
    state.priorities,
    state.salaryMin,
    state.salaryCurrency,
    state.negativePreferences,
    state.workModeStrict,
    state.relocationProhibited,
    state.expectedVersion,
    handleVersionConflict,
  ]);

  // Step 4: Final Confirmation
  const handleConfirmProfile =
    useCallback(async (): Promise<CareerProfile | null> => {
      if (state.targetRoles.length === 0) {
        toast.error("At least one target role is required.");
        return null;
      }
      if (!state.targetLevel) {
        toast.error("Seniority level is required.");
        return null;
      }
      if (state.employmentTypes.length === 0) {
        toast.error("At least one employment type is required.");
        return null;
      }
      if (state.workModes.length === 0) {
        toast.error("At least one work mode is required.");
        return null;
      }

      try {
        setIsSaving(true);
        setError(null);
        const confirmedProfile = await onboardingService.confirmProfile({
          expected_version: state.expectedVersion,
          career_intent: {
            target_roles: state.targetRoles,
            target_level: state.targetLevel,
            employment_types: state.employmentTypes,
          },
          preferences: {
            locations: state.locations,
            work_modes: state.workModes,
            priorities: state.priorities,
            salary:
              state.salaryMin !== null
                ? {
                    min_amount: state.salaryMin,
                    currency: state.salaryCurrency,
                  }
                : null,
            negative_preferences: state.negativePreferences,
          },
          constraints: {
            work_mode_strict: state.workModeStrict,
            relocation_prohibited: state.relocationProhibited,
          },
          capabilities: {
            skills: state.skills,
            suppressed_skills: state.suppressedSkills,
          },
        });

        setState((prev) => ({
          ...prev,
          expectedVersion: confirmedProfile.profileVersion,
          isExistingActiveProfile: true,
        }));

        toast.success(
          "Career Profile successfully confirmed! Finder matching is now active.",
        );
        return confirmedProfile;
      } catch (err) {
        if (err instanceof OnboardingVersionConflictError) {
          await handleVersionConflict(err);
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to confirm career profile";
          setError(msg);
          toast.error(msg);
        }
        return null;
      } finally {
        setIsSaving(false);
      }
    }, [
      state.targetRoles,
      state.targetLevel,
      state.employmentTypes,
      state.workModes,
      state.locations,
      state.priorities,
      state.salaryMin,
      state.salaryCurrency,
      state.negativePreferences,
      state.workModeStrict,
      state.relocationProhibited,
      state.skills,
      state.suppressedSkills,
      state.expectedVersion,
      handleVersionConflict,
    ]);

  // Skill Management (Step 4)
  const suppressSkill = useCallback((skillName: string) => {
    setState((prev) => {
      const remainingSkills = prev.skills.filter(
        (s) => !matchesSkill(s.skill, skillName),
      );
      const newSuppressed: SuppressedSkillItem = {
        skill: skillName,
        suppressed_at: new Date().toISOString(),
        reason: "user_deleted",
      };
      return {
        ...prev,
        skills: remainingSkills,
        suppressedSkills: [...prev.suppressedSkills, newSuppressed],
      };
    });
    toast.info(`"${skillName}" removed from matching capabilities.`);
  }, []);

  const restoreSkill = useCallback((skillName: string) => {
    setState((prev) => {
      const remainingSuppressed = prev.suppressedSkills.filter(
        (s) => !matchesSkill(s.skill, skillName),
      );
      const restoredSkill: CapabilityItem = {
        skill: skillName,
        category: "core",
        confirmation_state: "user_added",
        provenance: {
          source: "user_confirmed",
          confidence: 1.0,
          updated_at: new Date().toISOString(),
        },
      };
      return {
        ...prev,
        skills: [...prev.skills, restoredSkill],
        suppressedSkills: remainingSuppressed,
      };
    });
    toast.success(`"${skillName}" restored to capabilities.`);
  }, []);

  const addCustomSkill = useCallback(
    (skillName: string, category: SkillCategory) => {
      const trimmed = skillName.trim();
      if (!trimmed) return;

      setState((prev) => {
        if (prev.skills.some((s) => matchesSkill(s.skill, trimmed))) {
          toast.error(`"${trimmed}" is already in your skills list.`);
          return prev;
        }
        // If it was previously suppressed, un-suppress it
        const remainingSuppressed = prev.suppressedSkills.filter(
          (s) => !matchesSkill(s.skill, trimmed),
        );
        const newSkill: CapabilityItem = {
          skill: trimmed,
          category,
          confirmation_state: "user_added",
          provenance: {
            source: "user_explicit",
            confidence: 1.0,
            updated_at: new Date().toISOString(),
          },
        };
        return {
          ...prev,
          skills: [...prev.skills, newSkill],
          suppressedSkills: remainingSuppressed,
        };
      });
      toast.success(`Added "${trimmed}" to capabilities.`);
    },
    [],
  );

  // Form Mutation Helpers
  const goToStep = useCallback((step: OnboardingStepNumber) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setTargetRoles = useCallback((roles: TargetRoleItem[]) => {
    setState((prev) => ({ ...prev, targetRoles: roles }));
  }, []);

  const setTargetLevel = useCallback((level: TargetLevel) => {
    setState((prev) => ({ ...prev, targetLevel: level }));
  }, []);

  const setEmploymentTypes = useCallback((types: EmploymentType[]) => {
    setState((prev) => ({ ...prev, employmentTypes: types }));
  }, []);

  const setWorkModes = useCallback((modes: WorkMode[]) => {
    setState((prev) => ({ ...prev, workModes: modes }));
  }, []);

  const setWorkModeStrict = useCallback((strict: boolean) => {
    setState((prev) => ({ ...prev, workModeStrict: strict }));
  }, []);

  const setLocations = useCallback((locations: string[]) => {
    setState((prev) => ({ ...prev, locations }));
  }, []);

  const setRelocationProhibited = useCallback((prohibited: boolean) => {
    setState((prev) => ({ ...prev, relocationProhibited: prohibited }));
  }, []);

  const setSalaryMin = useCallback((amount: number | null) => {
    setState((prev) => ({ ...prev, salaryMin: amount }));
  }, []);

  const setSalaryCurrency = useCallback((currency: string) => {
    setState((prev) => ({ ...prev, salaryCurrency: currency }));
  }, []);

  const setPriorities = useCallback((priorities: string[]) => {
    setState((prev) => ({ ...prev, priorities }));
  }, []);

  const setNegativePreferences = useCallback(
    (negativePreferences: NegativePreferenceItem[]) => {
      setState((prev) => ({ ...prev, negativePreferences }));
    },
    [],
  );

  return {
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
  };
}
