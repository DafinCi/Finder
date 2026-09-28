// ==============================================================================
// REPOSITORY: Canonical Career Profile
// Module: @/features/profile/repositories/career-profile.repository
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  CareerProfile,
  BackgroundEvidence,
  CapabilityEvidence,
  CareerIntent,
  Preferences,
  HardConstraints,
  ProfileOrigin,
} from "../types/career-profile.types";
import { CareerProfileDbRowSchema } from "../schemas/career-profile.schema";
import {
  ProfileNotFoundError,
  VersionConflictError,
} from "../errors/profile-errors";

export interface CareerProfileDbRow {
  id: string;
  profile_id: string;
  resume_id: string | null;
  status: "draft" | "active";
  onboarding_completed: boolean;
  current_onboarding_step: number;
  profile_version: number;
  profile_origin: "web" | "v1_migrated";
  background: BackgroundEvidence;
  capabilities: CapabilityEvidence;
  career_intent: CareerIntent;
  preferences: Preferences;
  constraints: HardConstraints;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareerProfileCreateDraftInput {
  resumeId?: string | null;
  origin?: ProfileOrigin;
  currentStep?: number;
  background?: Partial<BackgroundEvidence>;
  capabilities?: Partial<CapabilityEvidence>;
  careerIntent?: Partial<CareerIntent>;
  preferences?: Partial<Preferences>;
  constraints?: Partial<HardConstraints>;
}

export interface CareerProfileUpdatePayload {
  resumeId?: string | null;
  status?: "draft" | "active";
  onboardingCompleted?: boolean;
  currentOnboardingStep?: number;
  background?: BackgroundEvidence;
  capabilities?: CapabilityEvidence;
  careerIntent?: CareerIntent;
  preferences?: Preferences;
  constraints?: HardConstraints;
  confirmedAt?: string | null;
}

export interface ConfirmedProfileData {
  careerIntent: CareerIntent;
  preferences: Preferences;
  constraints: HardConstraints;
  capabilities?: CapabilityEvidence;
  background?: BackgroundEvidence;
}

/**
 * Maps raw database row to canonical domain CareerProfile.
 * Strictly validates against CareerProfileDbRowSchema to fail fast on data corruption.
 */
export function mapDbRowToCareerProfile(row: unknown): CareerProfile {
  const parsed = CareerProfileDbRowSchema.parse(row);
  return {
    id: parsed.id,
    userId: parsed.profile_id,
    resumeId: parsed.resume_id,
    status: parsed.status,
    onboardingCompleted: parsed.onboarding_completed,
    currentOnboardingStep: parsed.current_onboarding_step,
    profileVersion: parsed.profile_version,
    profileOrigin: parsed.profile_origin,
    background: parsed.background as BackgroundEvidence,
    capabilities: parsed.capabilities as CapabilityEvidence,
    careerIntent: parsed.career_intent as CareerIntent,
    preferences: parsed.preferences as Preferences,
    constraints: parsed.constraints as HardConstraints,
    confirmedAt: parsed.confirmed_at,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
  };
}

export class CareerProfileRepository {
  constructor(private readonly client: any = supabaseAdmin) {}

  /**
   * Retrieves canonical CareerProfile by candidate profile_id.
   * Returns null if no record exists.
   */
  async findByProfileId(profileId: string): Promise<CareerProfile | null> {
    const { data, error } = await this.client
      .from("career_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapDbRowToCareerProfile(data);
  }

  /**
   * Creates a draft CareerProfile for a user.
   * Idempotent: If a profile already exists for this profile_id, returns existing record.
   */
  async createDraft(
    profileId: string,
    initialData?: CareerProfileCreateDraftInput,
  ): Promise<CareerProfile> {
    const existing = await this.findByProfileId(profileId);
    if (existing) {
      return existing;
    }

    const defaultBackground: BackgroundEvidence = {
      education: initialData?.background?.education || [],
      experience: initialData?.background?.experience || [],
      projects: initialData?.background?.projects || [],
    };

    const defaultCapabilities: CapabilityEvidence = {
      extraction_status:
        initialData?.capabilities?.extraction_status || "unattempted",
      extraction_error: initialData?.capabilities?.extraction_error || null,
      skills: initialData?.capabilities?.skills || [],
      suppressed_skills: initialData?.capabilities?.suppressed_skills || [],
    };

    const defaultIntent: CareerIntent = {
      target_roles: initialData?.careerIntent?.target_roles || [],
      target_level: initialData?.careerIntent?.target_level || null,
      employment_types: initialData?.careerIntent?.employment_types || [],
    };

    const defaultPreferences: Preferences = {
      locations: initialData?.preferences?.locations || [],
      work_modes: initialData?.preferences?.work_modes || [],
      priorities: initialData?.preferences?.priorities || [],
      salary: initialData?.preferences?.salary || null,
      negative_preferences:
        initialData?.preferences?.negative_preferences || [],
    };

    const defaultConstraints: HardConstraints = {
      relocation_prohibited:
        initialData?.constraints?.relocation_prohibited ?? false,
      work_mode_strict: initialData?.constraints?.work_mode_strict ?? false,
    };

    const insertPayload = {
      profile_id: profileId,
      resume_id: initialData?.resumeId || null,
      status: "draft",
      onboarding_completed: false,
      current_onboarding_step: initialData?.currentStep || 1,
      profile_version: 1,
      profile_origin: initialData?.origin || "web",
      background: defaultBackground,
      capabilities: defaultCapabilities,
      career_intent: defaultIntent,
      preferences: defaultPreferences,
      constraints: defaultConstraints,
      confirmed_at: null,
    };

    const { data, error } = await this.client
      .from("career_profiles")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // In case of concurrent race condition, attempt to read existing profile
      if (error.code === "23505") {
        const raceExisting = await this.findByProfileId(profileId);
        if (raceExisting) return raceExisting;
      }
      throw error;
    }

    return mapDbRowToCareerProfile(data);
  }

  /**
   * Updates an existing profile using Compare-And-Swap (CAS) Optimistic Concurrency Control.
   * Throws VersionConflictError if expectedVersion does not match database version.
   * Throws ProfileNotFoundError if the record does not exist.
   */
  async updateProfileWithCas(
    profileId: string,
    updates: CareerProfileUpdatePayload,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const dbUpdates: Record<string, unknown> = {
      profile_version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    };

    if (updates.resumeId !== undefined) dbUpdates.resume_id = updates.resumeId;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.onboardingCompleted !== undefined)
      dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.currentOnboardingStep !== undefined)
      dbUpdates.current_onboarding_step = updates.currentOnboardingStep;
    if (updates.background !== undefined)
      dbUpdates.background = updates.background;
    if (updates.capabilities !== undefined)
      dbUpdates.capabilities = updates.capabilities;
    if (updates.careerIntent !== undefined)
      dbUpdates.career_intent = updates.careerIntent;
    if (updates.preferences !== undefined)
      dbUpdates.preferences = updates.preferences;
    if (updates.constraints !== undefined)
      dbUpdates.constraints = updates.constraints;
    if (updates.confirmedAt !== undefined)
      dbUpdates.confirmed_at = updates.confirmedAt;

    const { data, error } = await this.client
      .from("career_profiles")
      .update(dbUpdates)
      .eq("profile_id", profileId)
      .eq("profile_version", expectedVersion)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      // Differentiate between 404 (Not Found) and 409 (Version Conflict)
      const current = await this.client
        .from("career_profiles")
        .select("profile_version")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (current.error) {
        throw current.error;
      }

      if (!current.data) {
        throw new ProfileNotFoundError(profileId);
      }

      throw new VersionConflictError(
        expectedVersion,
        current.data.profile_version,
      );
    }

    return mapDbRowToCareerProfile(data);
  }

  /**
   * Finalizes profile confirmation during onboarding:
   * Sets status='active', onboarding_completed=true, confirmed_at=NOW(),
   * stores confirmed career intent, preferences, constraints, and increments version.
   */
  async confirmProfile(
    profileId: string,
    confirmedData: ConfirmedProfileData,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const payload: CareerProfileUpdatePayload = {
      status: "active",
      onboardingCompleted: true,
      currentOnboardingStep: 4,
      confirmedAt: new Date().toISOString(),
      careerIntent: confirmedData.careerIntent,
      preferences: confirmedData.preferences,
      constraints: confirmedData.constraints,
    };

    if (confirmedData.capabilities) {
      payload.capabilities = confirmedData.capabilities;
    }

    if (confirmedData.background) {
      payload.background = confirmedData.background;
    }

    return this.updateProfileWithCas(profileId, payload, expectedVersion);
  }

  /**
   * Deletes a career profile record. (Admin/testing utility).
   */
  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await this.client
      .from("career_profiles")
      .delete()
      .eq("profile_id", profileId);

    if (error) {
      throw error;
    }
  }
}

export const careerProfileRepository = new CareerProfileRepository();
