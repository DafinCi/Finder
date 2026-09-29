// ==============================================================================
// CLIENT SERVICE: Career Profile API Operations
// Module: @/features/profile/services/profile-client.service
// ==============================================================================

import {
  CareerProfile,
  BackgroundEvidence,
  Preferences,
  HardConstraints,
  CareerIntent,
} from "../types/career-profile.types";
import { UpdateSkillsRequest } from "../schemas/career-profile.schema";

export class ProfileClientError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ProfileClientError";
    this.status = status;
    this.details = details;
  }
}

export class ProfileClientVersionConflictError extends ProfileClientError {
  readonly expectedVersion: number;
  readonly currentVersion?: number;

  constructor(
    message: string,
    expectedVersion: number,
    currentVersion?: number,
  ) {
    super(message, 409);
    this.name = "ProfileClientVersionConflictError";
    this.expectedVersion = expectedVersion;
    this.currentVersion = currentVersion;
  }
}

export class ProfileClientService {
  /**
   * Fetches the candidate's canonical CareerProfile.
   */
  async getProfile(): Promise<CareerProfile | null> {
    const res = await fetch("/api/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ProfileClientError(
        body.error || "Gagal memuat profil karir",
        res.status,
        body.details,
      );
    }

    const data = await res.json();
    return data.profile || null;
  }

  /**
   * Initializes draft profile if needed.
   */
  async getOrCreateProfile(): Promise<CareerProfile> {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: "web" }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ProfileClientError(
        body.error || "Gagal menginisialisasi profil karir",
        res.status,
        body.details,
      );
    }

    const data = await res.json();
    return data.profile;
  }

  /**
   * Updates career intent with CAS.
   */
  async updateCareerIntent(
    careerIntent: Omit<CareerIntent, "provenance">,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const res = await fetch("/api/profile/career-intent", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_version: expectedVersion,
        career_intent: careerIntent,
      }),
    });

    return this.handleResponse(res, expectedVersion);
  }

  /**
   * Updates career preferences & hard constraints with CAS.
   */
  async updatePreferences(
    preferences: Preferences,
    constraints: HardConstraints | undefined,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const res = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_version: expectedVersion,
        preferences,
        constraints,
      }),
    });

    return this.handleResponse(res, expectedVersion);
  }

  /**
   * Dispatches skill action (add, suppress, restore, update, sync) with CAS.
   */
  async updateSkills(payload: UpdateSkillsRequest): Promise<CareerProfile> {
    const res = await fetch("/api/profile/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return this.handleResponse(res, payload.expected_version);
  }

  /**
   * Updates career background with CAS.
   */
  async updateBackground(
    background: BackgroundEvidence,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const res = await fetch("/api/profile/background", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expected_version: expectedVersion,
        background,
      }),
    });

    return this.handleResponse(res, expectedVersion);
  }

  private async handleResponse(
    res: Response,
    expectedVersion: number,
  ): Promise<CareerProfile> {
    const body = await res.json().catch(() => ({}));

    if (res.status === 409) {
      throw new ProfileClientVersionConflictError(
        body.error || "Terjadi konflik versi profil. Silakan refresh data.",
        expectedVersion,
        body.currentVersion,
      );
    }

    if (!res.ok) {
      throw new ProfileClientError(
        body.error || "Gagal memperbarui profil karir",
        res.status,
        body.details,
      );
    }

    return body.profile;
  }
}

export const profileClientService = new ProfileClientService();
