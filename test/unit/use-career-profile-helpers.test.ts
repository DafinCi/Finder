import { describe, it, expect } from "vitest";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

/**
 * Pure calculation logic matching useCareerProfile
 */
function calculateCompletenessScore(profile: CareerProfile | null): number {
  if (!profile) return 0;
  let score = 0;

  const primaryRole = profile?.careerIntent?.target_roles?.find(
    (r) => r.priority === "primary",
  );

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
}

describe("Unit: Career Profile Completeness & Derived Groups", () => {
  it("should return 0 when profile is null", () => {
    expect(calculateCompletenessScore(null)).toBe(0);
  });

  it("should return 100 for a fully populated career profile", () => {
    const fullProfile: CareerProfile = {
      id: "p1",
      userId: "u1",
      resumeId: "r1",
      status: "active",
      onboardingCompleted: true,
      currentOnboardingStep: 4,
      profileVersion: 1,
      profileOrigin: "web",
      background: {
        education: [
          {
            id: "e1",
            institution: "ITB",
            degree: "S1",
            field_of_study: "IF",
            graduation_year: 2024,
            provenance: {
              source: "user_explicit",
              confidence: 1,
              updated_at: "",
            },
          },
        ],
        experience: [
          {
            id: "x1",
            company_name: "Startup",
            role_title: "Dev",
            start_date: "2023-01-01",
            end_date: null,
            is_current: true,
            description_summary: "",
            technologies_used: [],
            provenance: {
              source: "user_explicit",
              confidence: 1,
              updated_at: "",
            },
          },
        ],
        projects: [],
      },
      capabilities: {
        extraction_status: "success",
        skills: [
          {
            skill: "TypeScript",
            category: "core",
            confirmation_state: "confirmed",
            provenance: {
              source: "user_confirmed",
              confidence: 1,
              updated_at: "",
            },
          },
          {
            skill: "React",
            category: "core",
            confirmation_state: "confirmed",
            provenance: {
              source: "user_confirmed",
              confidence: 1,
              updated_at: "",
            },
          },
          {
            skill: "Git",
            category: "tool",
            confirmation_state: "confirmed",
            provenance: {
              source: "user_confirmed",
              confidence: 1,
              updated_at: "",
            },
          },
        ],
        suppressed_skills: [],
      },
      careerIntent: {
        target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
        target_level: "junior",
        employment_types: ["full_time"],
      },
      preferences: {
        locations: ["Indonesia"],
        work_modes: ["remote"],
        priorities: ["mentorship"],
        salary: null,
        negative_preferences: [],
      },
      constraints: { relocation_prohibited: false, work_mode_strict: false },
      confirmedAt: null,
      createdAt: "",
      updatedAt: "",
    };

    expect(calculateCompletenessScore(fullProfile)).toBe(100);
  });

  it("should return partial score when only intent is filled", () => {
    const partialProfile: CareerProfile = {
      id: "p1",
      userId: "u1",
      resumeId: null,
      status: "draft",
      onboardingCompleted: false,
      currentOnboardingStep: 1,
      profileVersion: 1,
      profileOrigin: "web",
      background: { education: [], experience: [], projects: [] },
      capabilities: {
        extraction_status: "unattempted",
        skills: [],
        suppressed_skills: [],
      },
      careerIntent: {
        target_roles: [{ role: "Frontend Engineer", priority: "primary" }],
        target_level: "junior",
        employment_types: ["full_time"],
      },
      preferences: {
        locations: [],
        work_modes: ["remote"],
        priorities: [],
        salary: null,
        negative_preferences: [],
      },
      constraints: { relocation_prohibited: false, work_mode_strict: false },
      confirmedAt: null,
      createdAt: "",
      updatedAt: "",
    };

    // primaryRole (20) + level (15) + employmentTypes (10) + work_modes (15) = 60
    expect(calculateCompletenessScore(partialProfile)).toBe(60);
  });
});
