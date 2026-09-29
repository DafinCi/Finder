// ==============================================================================
// HOOK: useCareerProfile
// Module: @/features/profile/hooks/useCareerProfile
// ==============================================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

export function useCareerProfile(): UseCareerProfileResult {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile =
    useCallback(async (): Promise<CareerProfile | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await profileClientService.getProfile();
        setProfile(data);
        return data;
      } catch (err) {
        const msg = (err as Error).message || "Gagal memuat profil";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    let cancelled = false;

    profileClientService
      .getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
        toast.error("Profil belum dimuat.");
        return false;
      }

      setIsMutating(true);
      try {
        const updated = await mutationFn(profile.profileVersion);
        setProfile(updated);
        toast.success(successMessage);
        return true;
      } catch (err) {
        if (err instanceof ProfileClientVersionConflictError) {
          toast.warning(
            "Profil telah diperbarui di sesi lain. Memuat data terbaru...",
          );
          await refreshProfile();
          return false;
        }

        const msg = (err as Error).message || "Gagal memperbarui profil";
        toast.error(msg);
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [profile, refreshProfile],
  );

  const updateCareerIntent = useCallback(
    async (intent: {
      target_roles: TargetRoleItem[];
      target_level: TargetLevel | null;
      employment_types: EmploymentType[];
    }) => {
      return executeMutation(
        (version) => profileClientService.updateCareerIntent(intent, version),
        "Target karir berhasil diperbarui.",
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
        "Preferensi kerja berhasil diperbarui.",
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
        `Keahlian "${skill}" berhasil ditambahkan.`,
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
        `Keahlian "${skill}" telah disembunyikan.`,
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
        `Keahlian "${skill}" berhasil dipulihkan.`,
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
        `Keahlian "${skill}" berhasil diperbarui.`,
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
        "Daftar keahlian berhasil disinkronkan.",
      );
    },
    [executeMutation],
  );

  const updateBackground = useCallback(
    async (background: BackgroundEvidence) => {
      return executeMutation(
        (version) => profileClientService.updateBackground(background, version),
        "Riwayat latar belakang berhasil diperbarui.",
      );
    },
    [executeMutation],
  );

  return {
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
  };
}
