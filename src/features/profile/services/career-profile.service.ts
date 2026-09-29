// ==============================================================================
// SERVICE: Canonical Career Profile & Onboarding Service
// Module: @/features/profile/services/career-profile.service
// ==============================================================================

import {
  CareerProfileRepository,
  careerProfileRepository,
  CareerProfileUpdatePayload,
} from "../repositories/career-profile.repository";
import {
  CareerProfile,
  BackgroundEvidence,
  CapabilityEvidence,
  CapabilityItem,
  SuppressedSkillItem,
  SkillCategory,
  SkillProficiencyClaim,
  CareerIntent,
  Preferences,
  HardConstraints,
  ProfileOrigin,
} from "../types/career-profile.types";
import {
  ConfirmProfileRequestSchema,
  SaveDraftProfileRequestSchema,
  UpdateCareerIntentRequestSchema,
  UpdatePreferencesRequestSchema,
  UpdateBackgroundRequestSchema,
  UpdateSkillsRequestSchema,
} from "../schemas/career-profile.schema";
import {
  ProfileNotFoundError,
  InvalidProfileStateError,
  ProfileValidationError,
} from "../errors/profile-errors";
import { matchesSkill } from "@/features/matching/utils/skill-normalizer";

export interface CvProposalPayload {
  resumeId: string;
  background: BackgroundEvidence;
  capabilities: CapabilityEvidence;
}

export class CareerProfileService {
  constructor(
    private readonly profileRepo: CareerProfileRepository = careerProfileRepository,
  ) {}

  /**
   * Retrieves profile by user/profile ID.
   */
  async getProfile(profileId: string): Promise<CareerProfile | null> {
    return this.profileRepo.findByProfileId(profileId);
  }

  /**
   * Retrieves profile or throws 404 ProfileNotFoundError.
   */
  async requireProfile(profileId: string): Promise<CareerProfile> {
    const profile = await this.getProfile(profileId);
    if (!profile) {
      throw new ProfileNotFoundError(profileId);
    }
    return profile;
  }

  /**
   * Gets existing draft or initializes a new one.
   * If an active profile already exists, returns it directly.
   */
  async getOrCreateDraft(
    profileId: string,
    origin: ProfileOrigin = "web",
  ): Promise<CareerProfile> {
    const existing = await this.profileRepo.findByProfileId(profileId);
    if (existing) {
      return existing;
    }
    return this.profileRepo.createDraft(profileId, { origin });
  }

  /**
   * Updates an onboarding draft step with partial data using CAS.
   */
  async updateDraftStep(
    profileId: string,
    step: number,
    data: unknown,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    if (step < 1 || step > 4) {
      throw new InvalidProfileStateError(
        `Invalid onboarding step: ${step}. Must be between 1 and 4.`,
      );
    }

    const validation = SaveDraftProfileRequestSchema.safeParse(data);
    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid draft update payload",
        validation.error.format(),
      );
    }

    const validated = validation.data;
    const existing = await this.requireProfile(profileId);

    const updatePayload: CareerProfileUpdatePayload = {
      currentOnboardingStep: step,
    };

    if (validated.background) {
      updatePayload.background = {
        ...existing.background,
        ...validated.background,
      } as BackgroundEvidence;
    }

    if (validated.capabilities) {
      updatePayload.capabilities = {
        ...existing.capabilities,
        ...validated.capabilities,
      } as CapabilityEvidence;
    }

    if (validated.career_intent) {
      updatePayload.careerIntent = {
        ...existing.careerIntent,
        ...validated.career_intent,
      };
    }

    if (validated.preferences) {
      updatePayload.preferences = {
        ...existing.preferences,
        ...validated.preferences,
      };
    }

    if (validated.constraints) {
      updatePayload.constraints = {
        ...existing.constraints,
        ...validated.constraints,
      };
    }

    return this.profileRepo.updateProfileWithCas(
      profileId,
      updatePayload,
      expectedVersion,
    );
  }

  /**
   * Finalizes onboarding confirmation.
   * Validates all required fields, marks status='active', onboarding_completed=true.
   * Confirmed skills are marked confirmation_state='confirmed'.
   */
  async confirmProfile(
    profileId: string,
    rawRequest: unknown,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const validation = ConfirmProfileRequestSchema.safeParse(rawRequest);
    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid profile confirmation data. Missing required career intent or work mode.",
        validation.error.format(),
      );
    }

    const validData = validation.data;
    const existing = await this.requireProfile(profileId);

    // Mark confirmed skills with authoritative provenance
    const now = new Date().toISOString();
    let confirmedCapabilities: CapabilityEvidence = existing.capabilities;

    if (validData.capabilities?.skills) {
      const updatedSkills: CapabilityItem[] = validData.capabilities.skills.map(
        (item) => ({
          ...item,
          confirmation_state: "confirmed",
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: now,
          },
        }),
      );

      confirmedCapabilities = {
        ...existing.capabilities,
        skills: updatedSkills,
        suppressed_skills:
          validData.capabilities.suppressed_skills ||
          existing.capabilities.suppressed_skills,
      };
    }

    return this.profileRepo.confirmProfile(
      profileId,
      {
        careerIntent: {
          target_roles: validData.career_intent.target_roles,
          target_level: validData.career_intent.target_level,
          employment_types: validData.career_intent.employment_types,
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: now,
          },
        },
        preferences: validData.preferences,
        constraints: validData.constraints,
        capabilities: confirmedCapabilities,
      },
      expectedVersion,
    );
  }

  /**
   * Applies AI/CV extraction proposals into draft profile.
   *
   * CRITICAL INVARIANTS:
   * 1. NEVER overwrite confirmed user intent (target_roles, target_level, preferences, constraints).
   * 2. NEVER resurrect suppressed skills that were explicitly removed by the user.
   * 3. Retain any user-added or confirmed skills on the profile.
   * 4. Extracted evidence is tagged as 'resume_extracted' with draft confirmation state.
   */
  async applyCvProposal(
    profileId: string,
    proposal: CvProposalPayload,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);
    const existingCapabilities = existing.capabilities;
    const suppressedSkills = existingCapabilities.suppressed_skills || [];

    // Filter proposed skills: discard any that match a suppressed skill
    const activeProposedSkills: CapabilityItem[] = [];
    for (const proposed of proposal.capabilities.skills || []) {
      const isSuppressed = suppressedSkills.some((s) =>
        matchesSkill(s.skill, proposed.skill),
      );
      if (!isSuppressed) {
        activeProposedSkills.push(proposed);
      }
    }

    // Preserve existing user-added or user-confirmed skills
    const existingConfirmedSkills = existingCapabilities.skills.filter(
      (s) =>
        s.confirmation_state === "confirmed" ||
        s.confirmation_state === "user_added",
    );

    // Merge: start with existing user-confirmed, then add proposed if not already present
    const mergedSkills: CapabilityItem[] = [...existingConfirmedSkills];

    for (const propSkill of activeProposedSkills) {
      const alreadyPresent = mergedSkills.some((existingSkill) =>
        matchesSkill(existingSkill.skill, propSkill.skill),
      );
      if (!alreadyPresent) {
        mergedSkills.push(propSkill);
      }
    }

    const mergedCapabilities: CapabilityEvidence = {
      extraction_status: proposal.capabilities.extraction_status,
      extraction_error: proposal.capabilities.extraction_error,
      skills: mergedSkills,
      suppressed_skills: suppressedSkills,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      {
        resumeId: proposal.resumeId,
        background: proposal.background,
        capabilities: mergedCapabilities,
        currentOnboardingStep: Math.max(existing.currentOnboardingStep, 2),
      },
      expectedVersion,
    );
  }

  /**
   * Suppresses/deletes a skill from profile.
   * Removes from active skills and appends to suppressed_skills so subsequent CV re-extractions
   * will not resurrect it.
   */
  async suppressSkill(
    profileId: string,
    skillName: string,
    reason: "user_deleted" | "user_rejected",
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);
    const now = new Date().toISOString();

    const remainingSkills = existing.capabilities.skills.filter(
      (s) => !matchesSkill(s.skill, skillName),
    );

    const existingSuppressed = existing.capabilities.suppressed_skills || [];
    const alreadySuppressed = existingSuppressed.some((s) =>
      matchesSkill(s.skill, skillName),
    );

    const updatedSuppressed = alreadySuppressed
      ? existingSuppressed
      : [
          ...existingSuppressed,
          {
            skill: skillName.trim().toLowerCase(),
            suppressed_at: now,
            reason,
          },
        ];

    const updatedCapabilities: CapabilityEvidence = {
      ...existing.capabilities,
      skills: remainingSkills,
      suppressed_skills: updatedSuppressed,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { capabilities: updatedCapabilities },
      expectedVersion,
    );
  }

  /**
   * Adds a user-defined skill with highest provenance authority.
   * If previously suppressed, removes it from suppressed_skills.
   */
  async addSkill(
    profileId: string,
    skillName: string,
    category: SkillCategory,
    expectedVersion: number,
    proficiencyClaim?: SkillProficiencyClaim,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);
    const now = new Date().toISOString();

    // Remove from suppressed if present
    const updatedSuppressed = (
      existing.capabilities.suppressed_skills || []
    ).filter((s) => !matchesSkill(s.skill, skillName));

    // Check if skill already exists in active list
    const existingSkill = existing.capabilities.skills.find((s) =>
      matchesSkill(s.skill, skillName),
    );

    let updatedSkills: CapabilityItem[];
    if (existingSkill) {
      // Upgrade confirmation state and category
      updatedSkills = existing.capabilities.skills.map((s) =>
        matchesSkill(s.skill, skillName)
          ? {
              ...s,
              category,
              proficiency_claim: proficiencyClaim ?? s.proficiency_claim,
              confirmation_state: "user_added" as const,
              provenance: {
                source: "user_explicit" as const,
                confidence: 1.0,
                updated_at: now,
              },
            }
          : s,
      );
    } else {
      updatedSkills = [
        ...existing.capabilities.skills,
        {
          skill: skillName.trim(),
          category,
          proficiency_claim: proficiencyClaim,
          confirmation_state: "user_added",
          provenance: {
            source: "user_explicit",
            confidence: 1.0,
            updated_at: now,
          },
        },
      ];
    }

    const updatedCapabilities: CapabilityEvidence = {
      ...existing.capabilities,
      skills: updatedSkills,
      suppressed_skills: updatedSuppressed,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { capabilities: updatedCapabilities },
      expectedVersion,
    );
  }

  /**
   * Updates career intent (target roles, level, employment types) with user_explicit provenance.
   * Enforces business invariants:
   * - Exactly 1 primary role
   * - No duplicate role names across primary and secondary
   */
  async updateCareerIntent(
    profileId: string,
    rawIntent: unknown,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const validation = UpdateCareerIntentRequestSchema.safeParse({
      expected_version: expectedVersion,
      career_intent: rawIntent,
    });

    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid career intent payload",
        validation.error.format(),
      );
    }

    const { career_intent } = validation.data;
    const now = new Date().toISOString();

    const updatedIntent: CareerIntent = {
      target_roles: career_intent.target_roles.map((r) => ({
        role: r.role.trim(),
        priority: r.priority,
      })),
      target_level: career_intent.target_level,
      employment_types: career_intent.employment_types,
      provenance: {
        source: "user_explicit",
        confidence: 1.0,
        updated_at: now,
      },
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { careerIntent: updatedIntent },
      expectedVersion,
    );
  }

  /**
   * Updates career preferences and optional hard constraints.
   */
  async updatePreferences(
    profileId: string,
    rawPreferences: unknown,
    rawConstraints: unknown | undefined,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const validation = UpdatePreferencesRequestSchema.safeParse({
      expected_version: expectedVersion,
      preferences: rawPreferences,
      constraints: rawConstraints,
    });

    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid preferences payload",
        validation.error.format(),
      );
    }

    const { preferences, constraints } = validation.data;
    const updatePayload: CareerProfileUpdatePayload = {
      preferences: preferences as Preferences,
    };
    if (constraints) {
      updatePayload.constraints = constraints as HardConstraints;
    }

    return this.profileRepo.updateProfileWithCas(
      profileId,
      updatePayload,
      expectedVersion,
    );
  }

  /**
   * Updates career background (education, experience, projects).
   */
  async updateBackground(
    profileId: string,
    rawBackground: unknown,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const validation = UpdateBackgroundRequestSchema.safeParse({
      expected_version: expectedVersion,
      background: rawBackground,
    });

    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid background payload",
        validation.error.format(),
      );
    }

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { background: validation.data.background as BackgroundEvidence },
      expectedVersion,
    );
  }

  /**
   * Restores a previously suppressed/deleted skill back to active skills with user_confirmed provenance.
   */
  async restoreSuppressedSkill(
    profileId: string,
    skillName: string,
    category: SkillCategory = "supporting",
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);
    const now = new Date().toISOString();

    const remainingSuppressed = (
      existing.capabilities.suppressed_skills || []
    ).filter((s) => !matchesSkill(s.skill, skillName));

    const existingSkill = existing.capabilities.skills.find((s) =>
      matchesSkill(s.skill, skillName),
    );

    let updatedSkills: CapabilityItem[];
    if (existingSkill) {
      updatedSkills = existing.capabilities.skills.map((s) =>
        matchesSkill(s.skill, skillName)
          ? {
              ...s,
              category: s.category || category,
              confirmation_state: "confirmed" as const,
              provenance: {
                source: "user_confirmed" as const,
                confidence: 1.0,
                updated_at: now,
              },
            }
          : s,
      );
    } else {
      updatedSkills = [
        ...existing.capabilities.skills,
        {
          skill: skillName.trim(),
          category,
          confirmation_state: "confirmed",
          provenance: {
            source: "user_confirmed",
            confidence: 1.0,
            updated_at: now,
          },
        },
      ];
    }

    const updatedCapabilities: CapabilityEvidence = {
      ...existing.capabilities,
      skills: updatedSkills,
      suppressed_skills: remainingSuppressed,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { capabilities: updatedCapabilities },
      expectedVersion,
    );
  }

  /**
   * Updates an existing skill's category, proficiency claim, or confirmation state.
   */
  async updateSkill(
    profileId: string,
    skillName: string,
    updates: {
      category?: SkillCategory;
      proficiency_claim?: SkillProficiencyClaim;
      confirmation_state?: "draft" | "confirmed" | "user_added";
    },
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);
    const now = new Date().toISOString();

    const targetSkill = existing.capabilities.skills.find((s) =>
      matchesSkill(s.skill, skillName),
    );

    if (!targetSkill) {
      throw new ProfileValidationError(
        `Skill '${skillName}' not found in profile capabilities.`,
      );
    }

    const updatedSkills = existing.capabilities.skills.map((s) => {
      if (matchesSkill(s.skill, skillName)) {
        const nextConfirmationState =
          updates.confirmation_state ?? s.confirmation_state;
        const isUserAction =
          nextConfirmationState === "confirmed" ||
          nextConfirmationState === "user_added";

        return {
          ...s,
          category: updates.category ?? s.category,
          proficiency_claim:
            updates.proficiency_claim !== undefined
              ? updates.proficiency_claim
              : s.proficiency_claim,
          confirmation_state: nextConfirmationState,
          provenance: {
            ...s.provenance,
            source: isUserAction ? "user_confirmed" : s.provenance.source,
            confidence: isUserAction ? 1.0 : s.provenance.confidence,
            updated_at: now,
          },
        };
      }
      return s;
    });

    const updatedCapabilities: CapabilityEvidence = {
      ...existing.capabilities,
      skills: updatedSkills,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { capabilities: updatedCapabilities },
      expectedVersion,
    );
  }

  /**
   * Synchronizes the entire capabilities list (skills and optional suppressed_skills).
   */
  async syncSkills(
    profileId: string,
    skills: CapabilityItem[],
    suppressedSkills: SuppressedSkillItem[] | undefined,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const existing = await this.requireProfile(profileId);

    const updatedCapabilities: CapabilityEvidence = {
      ...existing.capabilities,
      skills,
      suppressed_skills:
        suppressedSkills !== undefined
          ? suppressedSkills
          : existing.capabilities.suppressed_skills,
    };

    return this.profileRepo.updateProfileWithCas(
      profileId,
      { capabilities: updatedCapabilities },
      expectedVersion,
    );
  }

  /**
   * Action dispatcher for skill mutations (add, suppress, restore, update, sync).
   */
  async handleSkillAction(
    profileId: string,
    rawRequest: unknown,
  ): Promise<CareerProfile> {
    const validation = UpdateSkillsRequestSchema.safeParse(rawRequest);
    if (!validation.success) {
      throw new ProfileValidationError(
        "Invalid skill action payload",
        validation.error.format(),
      );
    }

    const payload = validation.data;
    switch (payload.action) {
      case "add":
        return this.addSkill(
          profileId,
          payload.skill,
          payload.category,
          payload.expected_version,
          payload.proficiency_claim,
        );
      case "suppress":
        return this.suppressSkill(
          profileId,
          payload.skill,
          payload.reason,
          payload.expected_version,
        );
      case "restore":
        return this.restoreSuppressedSkill(
          profileId,
          payload.skill,
          payload.category,
          payload.expected_version,
        );
      case "update":
        return this.updateSkill(
          profileId,
          payload.skill,
          {
            category: payload.category,
            proficiency_claim: payload.proficiency_claim,
            confirmation_state: payload.confirmation_state,
          },
          payload.expected_version,
        );
      case "sync":
        return this.syncSkills(
          profileId,
          payload.skills,
          payload.suppressed_skills,
          payload.expected_version,
        );
    }
  }
}

export const careerProfileService = new CareerProfileService();
