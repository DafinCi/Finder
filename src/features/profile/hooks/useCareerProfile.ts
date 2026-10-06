// ==============================================================================
// HOOK: useCareerProfile
// Module: @/features/profile/hooks/useCareerProfile
// ==============================================================================

"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CareerProfile,
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
  WorkMode,
  Preferences,
  HardConstraints,
  CapabilityItem,
  SkillCategory,
  SkillProficiencyClaim,
  SuppressedSkillItem,
  BackgroundEvidence,
} from "../types/career-profile.types";
import {
  profileClientService,
  ProfileClientVersionConflictError,
  ProfileClientError,
} from "../services/profile-client.service";

export interface UseCareerProfileResult {
  profile: CareerProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isMutating: boolean;
  error: string | null;

  // Derived taxonomy and categorization
  primaryRole: TargetRoleItem | undefined;
  secondaryRoles: TargetRoleItem[];
  coreSkills: CapabilityItem[];
  supportingSkills: CapabilityItem[];
  toolSkills: CapabilityItem[];
  suppressedSkills: SuppressedSkillItem[];
  completenessScore: number;

  // Actions
  refreshProfile: () => Promise<CareerProfile | null>;
  updateCareerIntent: (intent: {
    target_roles: TargetRoleItem[];
    target_level: TargetLevel | null;
    employment_types: EmploymentType[];
  }) => Promise<boolean>;
  updatePreferences: (
    preferences: Preferences,
    constraints?: HardConstraints,
  ) => Promise<boolean>;
  addSkill: (
    skill: string,
    category?: SkillCategory,
    proficiency?: SkillProficiencyClaim,
  ) => Promise<boolean>;
  suppressSkill: (
    skill: string,
    reason?: "user_deleted" | "user_rejected",
  ) => Promise<boolean>;
  restoreSkill: (skill: string, category?: SkillCategory) => Promise<boolean>;
  updateSkill: (
    skill: string,
    updates: {
      category?: SkillCategory;
      proficiency_claim?: SkillProficiencyClaim;
      confirmation_state?: "draft" | "confirmed" | "user_added";
    },
  ) => Promise<boolean>;
  syncSkills: (
    skills: CapabilityItem[],
    suppressedSkills?: SuppressedSkillItem[],
  ) => Promise<boolean>;
  updateBackground: (background: BackgroundEvidence) => Promise<boolean>;
}

export const careerProfileQueryKey = ["career-profile"] as const;

export function useCareerProfile(): UseCareerProfileResult {
  const queryClient = useQueryClient();
  const [isMutating, setIsMutating] = useState(false);

  // Shared cache: every consumer of this hook reads the same profile request.
  const profileQuery = useQuery({
    queryKey: careerProfileQueryKey,
    queryFn: () => profileClientService.getProfile(),
  });

  const profile = profileQuery.data ?? null;
  const isLoading = profileQuery.isPending;
  const isRefreshing = profileQuery.isFetching && !profileQuery.isPending;
  const error = profileQuery.error
    ? (profileQuery.error as Error).message || "Failed to load profile."
    : null;

  const refreshProfile = useCallback(async (): Promise<CareerProfile | null> => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: careerProfileQueryKey,
        queryFn: () => profileClientService.getProfile(),
        staleTime: 0,
      });
      return data ?? null;
    } catch {
      return null;
    }
  }, [queryClient]);

  // Derived role groups
  const primaryRole = useMemo(() => {
    return profile?.careerIntent?.target_roles?.find(
      (r) => r.priority === "primary",
    );
  }, [profile]);

  const secondaryRoles = useMemo(() => {
    return (
      profile?.careerIntent?.target_roles?.filter(
        (r) => r.priority === "secondary",
      ) || []
    );
  }, [profile]);

  // Derived skill groups
  const coreSkills = useMemo(() => {
    return (
      profile?.capabilities?.skills?.filter((s) => s.category === "core") || []
    );
  }, [profile]);

  const supportingSkills = useMemo(() => {
    return (
      profile?.capabilities?.skills?.filter(
        (s) => s.category === "supporting",
      ) || []
    );
  }, [profile]);

  const toolSkills = useMemo(() => {
    return (
      profile?.capabilities?.skills?.filter((s) => s.category === "tool") || []
    );
  }, [profile]);

  const suppressedSkills = useMemo(() => {
    return profile?.capabilities?.suppressed_skills || [];
  }, [profile]);

  // Profile completeness calculation (0 to 100)
  const completenessScore = useMemo(() => {
    if (!profile) return 0;
    let score = 0;

    // 1. Primary target role set (20%)
    if (primaryRole && primaryRole.role.trim().length > 0) {
      score += 20;
    }

    // 2. Seniority level set (15%)
    if (profile.careerIntent?.target_level) {
      score += 15;
    }

    // 3. Employment type specified (10%)
    if (
      profile.careerIntent?.employment_types &&
      profile.careerIntent.employment_types.length > 0
    ) {
      score += 10;
    }

    // 4. Work modes & locations (15%)
    if (
      profile.preferences?.work_modes &&
      profile.preferences.work_modes.length > 0
    ) {
      score += 15;
    }

    // 5. Skills confirmed/added (20% if at least 3 skills)
    const totalSkills = profile.capabilities?.skills?.length || 0;
    if (totalSkills >= 3) {
      score += 20;
    } else if (totalSkills > 0) {
      score += Math.round((totalSkills / 3) * 20);
    }

    // 6. Background evidence (20%)
    const hasEducation = (profile.background?.education?.length || 0) > 0;
    const hasExperience = (profile.background?.experience?.length || 0) > 0;
    const hasProjects = (profile.background?.projects?.length || 0) > 0;
    if (hasEducation && (hasExperience || hasProjects)) {
      score += 20;
    } else if (hasEducation || hasExperience || hasProjects) {
      score += 10;
    }

    return Math.min(score, 100);
  }, [profile, primaryRole]);

  // Generic mutation executor with version conflict recovery
  const executeMutation = useCallback(
    async (
      mutationFn: (currentVersion: number) => Promise<CareerProfile>,
      successMessage: string,
    ): Promise<boolean> => {
      if (!profile) {
        toast.error("Profile not loaded.");
        return false;
      }

      setIsMutating(true);
      try {
        const updated = await mutationFn(profile.profileVersion);
        queryClient.setQueryData(careerProfileQueryKey, updated);
        toast.success(successMessage);
        return true;
      } catch (err) {
        if (err instanceof ProfileClientVersionConflictError) {
          toast.warning(
            "Profile was updated in another session. Loading latest data...",
          );
          await refreshProfile();
          return false;
        }

        const msg = (err as Error).message || "Failed to update profile.";
        toast.error(msg);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [profile, queryClient, refreshProfile],
  );

  const updateCareerIntent = useCallback(
    async (intent: {
      target_roles: TargetRoleItem[];
      target_level: TargetLevel | null;
      employment_types: EmploymentType[];
    }) => {
      return executeMutation(
        (version) => profileClientService.updateCareerIntent(intent, version),
        "Career goals updated.",
      );
    },
    [executeMutation],
  );

  const updatePreferences = useCallback(
    async (preferences: Preferences, constraints?: HardConstraints) => {
      return executeMutation(
        (version) =>
          profileClientService.updatePreferences(
            preferences,
            constraints,
            version,
          ),
        "Work preferences updated.",
      );
    },
    [executeMutation],
  );

  const addSkill = useCallback(
    async (
      skill: string,
      category: SkillCategory = "supporting",
      proficiency?: SkillProficiencyClaim,
    ) => {
      return executeMutation(
        (version) =>
          profileClientService.updateSkills({
            action: "add",
            expected_version: version,
            skill,
            category,
            proficiency_claim: proficiency,
          }),
        `Skill "${skill}" added.`,
      );
    },
    [executeMutation],
  );

  const suppressSkill = useCallback(
    async (
      skill: string,
      reason: "user_deleted" | "user_rejected" = "user_deleted",
    ) => {
      return executeMutation(
        (version) =>
          profileClientService.updateSkills({
            action: "suppress",
            expected_version: version,
            skill,
            reason,
          }),
        `Skill "${skill}" removed.`,
      );
    },
    [executeMutation],
  );

  const restoreSkill = useCallback(
    async (skill: string, category: SkillCategory = "supporting") => {
      return executeMutation(
        (version) =>
          profileClientService.updateSkills({
            action: "restore",
            expected_version: version,
            skill,
            category,
          }),
        `Skill "${skill}" restored.`,
      );
    },
    [executeMutation],
  );

  const updateSkill = useCallback(
    async (
      skill: string,
      updates: {
        category?: SkillCategory;
        proficiency_claim?: SkillProficiencyClaim;
        confirmation_state?: "draft" | "confirmed" | "user_added";
      },
    ) => {
      return executeMutation(
        (version) =>
          profileClientService.updateSkills({
            action: "update",
            expected_version: version,
            skill,
            ...updates,
          }),
        `Skill "${skill}" updated.`,
      );
    },
    [executeMutation],
  );

  const syncSkills = useCallback(
    async (
      skills: CapabilityItem[],
      suppressedSkills?: SuppressedSkillItem[],
    ) => {
      return executeMutation(
        (version) =>
          profileClientService.updateSkills({
            action: "sync",
            expected_version: version,
            skills,
            suppressed_skills: suppressedSkills,
          }),
        "Skills synchronized.",
      );
    },
    [executeMutation],
  );

  const updateBackground = useCallback(
    async (background: BackgroundEvidence) => {
      return executeMutation(
        (version) => profileClientService.updateBackground(background, version),
        "Background history updated.",
      );
    },
    [executeMutation],
  );

  return {
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
  };
}
