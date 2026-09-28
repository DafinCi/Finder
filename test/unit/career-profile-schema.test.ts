import { describe, it, expect } from "vitest";
import {
  CareerProfileDbRowSchema,
  ConfirmProfileRequestSchema,
  SaveDraftProfileRequestSchema,
} from "@/features/profile/schemas/career-profile.schema";

describe("Unit: CareerProfile Schema & Boundary Validation", () => {
  const validProfileFixture = {
    id: "11111111-1111-4111-8111-111111111111",
    profile_id: "22222222-2222-4222-8222-222222222222",
    resume_id: "33333333-3333-4333-8333-333333333333",
    status: "active" as const,
    onboarding_completed: true,
    current_onboarding_step: 4,
    profile_version: 1,
    profile_origin: "web" as const,
    background: {
      education: [
        {
          id: "edu-1",
          institution: "Universitas Indonesia",
          degree: "Bachelor of Science",
          field_of_study: "Computer Science",
          graduation_year: 2024,
          provenance: {
            source: "resume_extracted" as const,
            confidence: 0.9,
            updated_at: new Date().toISOString(),
          },
        },
      ],
      experience: [
        {
          id: "exp-1",
          company_name: "Tech Corp",
          role_title: "Frontend Engineer",
          start_date: "2023-01-01",
          end_date: null,
          is_current: true,
          description_summary: "Built modern Next.js applications",
          technologies_used: ["TypeScript", "Next.js"],
          provenance: {
            source: "resume_extracted" as const,
            confidence: 0.85,
            updated_at: new Date().toISOString(),
          },
        },
      ],
      projects: [],
    },
    capabilities: {
      extraction_status: "success" as const,
      skills: [
        {
          skill: "TypeScript",
          category: "core" as const,
          proficiency_claim: "competent" as const,
          provenance: {
            source: "user_explicit" as const,
            confidence: 1.0,
            updated_at: new Date().toISOString(),
          },
          confirmation_state: "confirmed" as const,
        },
      ],
      suppressed_skills: [
        {
          skill: "Angular",
          suppressed_at: new Date().toISOString(),
          reason: "user_deleted" as const,
        },
      ],
    },
    career_intent: {
      target_roles: [
        { role: "Frontend Engineer", priority: "primary" as const },
      ],
      target_level: "junior" as const,
      employment_types: ["full_time" as const],
    },
    preferences: {
      locations: ["Indonesia"],
      work_modes: ["remote" as const],
      priorities: ["mentorship", "modern_tech"],
      salary: {
        min_amount: 15000000,
        currency: "IDR",
      },
      negative_preferences: [
        { domain: "tech" as const, token: "angular", penalty_weight: 1.0 },
      ],
    },
    constraints: {
      relocation_prohibited: true,
      work_mode_strict: true,
    },
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("should validate a structurally sound canonical career profile row", () => {
    const parsed = CareerProfileDbRowSchema.parse(validProfileFixture);
    expect(parsed.id).toBe(validProfileFixture.id);
    expect(parsed.capabilities.extraction_status).toBe("success");
    expect(parsed.capabilities.suppressed_skills).toHaveLength(1);
    expect(parsed.capabilities.suppressed_skills[0].skill).toBe("Angular");
  });

  it("should fail loudly when invalid enum values are encountered (NO silent fallback to 'junior')", () => {
    const invalidProfile = {
      ...validProfileFixture,
      career_intent: {
        ...validProfileFixture.career_intent,
        target_level: "principal_architect", // Unexpected/invalid enum
      },
    };

    expect(() => CareerProfileDbRowSchema.parse(invalidProfile)).toThrow();
  });

  it("should fail loudly when status is unexpected", () => {
    const invalidProfile = {
      ...validProfileFixture,
      status: "archived_v1", // Not allowed in Option A single-canonical profile model
    };

    expect(() => CareerProfileDbRowSchema.parse(invalidProfile)).toThrow();
  });

  it("should validate draft save request with optimistic version check", () => {
    const draftPayload = {
      expected_version: 2,
      current_step: 3,
      preferences: {
        locations: ["Singapore"],
        work_modes: ["remote" as const],
      },
    };

    const parsed = SaveDraftProfileRequestSchema.parse(draftPayload);
    expect(parsed.expected_version).toBe(2);
    expect(parsed.preferences?.locations).toEqual(["Singapore"]);
  });

  it("should enforce mandatory primary target role during profile confirmation", () => {
    const invalidConfirm = {
      expected_version: 1,
      career_intent: {
        target_roles: [], // Violation: must have at least 1 role
        target_level: "junior" as const,
        employment_types: ["full_time" as const],
      },
      preferences: {
        locations: ["Indonesia"],
        work_modes: ["remote" as const],
        priorities: [],
        salary: null,
        negative_preferences: [],
      },
      constraints: {
        relocation_prohibited: false,
        work_mode_strict: false,
      },
    };

    expect(() => ConfirmProfileRequestSchema.parse(invalidConfirm)).toThrow();
  });

  it("should explicitly track extraction_status as failed when AI fails", () => {
    const profileWithFailedExtraction = {
      ...validProfileFixture,
      capabilities: {
        extraction_status: "failed" as const,
        extraction_error: "Groq 503 Overloaded",
        skills: [],
        suppressed_skills: [],
      },
    };

    const parsed = CareerProfileDbRowSchema.parse(profileWithFailedExtraction);
    expect(parsed.capabilities.extraction_status).toBe("failed");
    expect(parsed.capabilities.extraction_error).toBe("Groq 503 Overloaded");
    expect(parsed.capabilities.skills).toHaveLength(0);
  });
});
