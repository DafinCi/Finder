// ==============================================================================
// ONBOARDING API SERVICE
// Module: @/features/onboarding/services/onboarding.service
// ==============================================================================

import {
  CareerProfile,
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
  WorkMode,
  CapabilityItem,
  SuppressedSkillItem,
  BackgroundEvidence,
  NegativePreferenceItem,
} from "@/features/profile/types/career-profile.types";

export class OnboardingVersionConflictError extends Error {
  readonly expectedVersion: number;
  readonly currentVersion?: number;

  constructor(
    message: string,
    expectedVersion: number,
    currentVersion?: number,
  ) {
    super(message);
    this.name = "OnboardingVersionConflictError";
    this.expectedVersion = expectedVersion;
    this.currentVersion = currentVersion;
  }
}

export class OnboardingApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "OnboardingApiError";
    this.status = status;
    this.details = details;
  }
}

export interface SaveDraftPayload {
  expected_version: number;
  current_step: number;
  resume_id?: string | null;
  background?: Partial<BackgroundEvidence>;
  capabilities?: {
    extraction_status?: "success" | "failed" | "unattempted";
    skills?: CapabilityItem[];
    suppressed_skills?: SuppressedSkillItem[];
  };
  career_intent?: {
    target_roles?: TargetRoleItem[];
    target_level?: TargetLevel | null;
    employment_types?: EmploymentType[];
  };
  preferences?: {
    locations?: string[];
    work_modes?: WorkMode[];
    priorities?: string[];
    salary?: {
      min_amount: number | null;
      currency: string;
      period?: "year" | "month" | "hour" | null;
    } | null;
    negative_preferences?: NegativePreferenceItem[];
  };
  constraints?: {
    work_mode_strict?: boolean;
    relocation_prohibited?: boolean;
  };
}

export interface ConfirmProfilePayload {
  expected_version: number;
  career_intent: {
    target_roles: TargetRoleItem[];
    target_level: TargetLevel;
    employment_types: EmploymentType[];
  };
  preferences: {
    locations: string[];
    work_modes: WorkMode[];
    priorities: string[];
    salary: {
      min_amount: number | null;
      currency: string;
      period?: "year" | "month" | "hour" | null;
    } | null;
    negative_preferences: NegativePreferenceItem[];
  };
  constraints: {
    work_mode_strict: boolean;
    relocation_prohibited: boolean;
  };
  capabilities?: {
    skills: CapabilityItem[];
    suppressed_skills: SuppressedSkillItem[];
  };
}

export interface UploadResumeResult {
  success: boolean;
  resumeId: string;
  fileName: string;
  message?: string;
}

export interface AnalyzeResumeResult {
  success: boolean;
  message: string;
  analysisId?: string;
  analysis?: {
    candidate: {
      name: string;
      title: string;
      years_of_experience: number;
      summary: string;
      skills: {
        core: string[];
        supporting: string[];
      };
      experience: Array<{
        company: string;
        role: string;
        duration: string;
        achievements: string[];
      }>;
      education: Array<{
        institution: string;
        degree: string;
        year: string;
      }>;
    };
    career: {
      recommended_roles: string[];
      career_level: string;
      strengths: string[];
      weaknesses: string[];
    };
  };
}

export const onboardingService = {
  /**
   * Fetches the candidate's existing CareerProfile.
   * Returns null if no profile exists yet.
   */
  async fetchProfile(): Promise<CareerProfile | null> {
    const res = await fetch("/api/profile", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new OnboardingApiError(
          "Session expired. Please log in again.",
          401,
        );
      }
      throw new OnboardingApiError("Failed to fetch profile", res.status);
    }

    const data = await res.json();
    return data.profile || null;
  },

  /**
   * Initializes a new draft profile for the authenticated user.
   */
  async initializeDraft(): Promise<CareerProfile> {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingApiError(
        err.error || "Failed to initialize draft profile",
        res.status,
        err,
      );
    }

    const data = await res.json();
    return data.profile;
  },

  /**
   * Saves a draft step with Optimistic Concurrency Control (CAS).
   */
  async saveDraftStep(payload: SaveDraftPayload): Promise<CareerProfile> {
    const res = await fetch("/api/profile/draft", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingVersionConflictError(
        err.error || "Profile version conflict",
        payload.expected_version,
        err.currentVersion,
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingApiError(
        err.error || "Failed to save draft step",
        res.status,
        err,
      );
    }

    const data = await res.json();
    return data.profile;
  },

  /**
   * Confirms the candidate's CareerProfile, transitioning from draft to active.
   */
  async confirmProfile(payload: ConfirmProfilePayload): Promise<CareerProfile> {
    const res = await fetch("/api/profile/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingVersionConflictError(
        err.error || "Profile version conflict during confirmation",
        payload.expected_version,
        err.currentVersion,
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingApiError(
        err.error || "Failed to confirm profile",
        res.status,
        err.details || err,
      );
    }

    const data = await res.json();
    return data.profile;
  },

  /**
   * Uploads resume PDF file.
   */
  async uploadResume(file: File): Promise<UploadResumeResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-resume", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingApiError(
        err.error || "Failed to upload resume file",
        res.status,
        err,
      );
    }

    return await res.json();
  },

  /**
   * Analyzes an uploaded resume using Groq LLM extraction.
   */
  async analyzeResume(resumeId: string): Promise<AnalyzeResumeResult> {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ resumeId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new OnboardingApiError(
        err.error || "Failed to analyze resume",
        res.status,
        err,
      );
    }

    return await res.json();
  },
};
