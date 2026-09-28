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
  SkillCategory,
  ProfileOrigin,
} from "../types/career-profile.types";
import {
  ConfirmProfileRequestSchema,
  SaveDraftProfileRequestSchema,
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
      // Upgrade confirmation state
      updatedSkills = existing.capabilities.skills.map((s) =>
        matchesSkill(s.skill, skillName)
          ? {
              ...s,
              category,
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
}

export const careerProfileService = new CareerProfileService();
