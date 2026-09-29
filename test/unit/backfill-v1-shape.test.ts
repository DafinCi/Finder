import { describe, it, expect } from "vitest";

/**
 * Simulates the backfill logic defined in 20260929_phase1_backfill_v1_profiles.sql
 * to assert that real V1 resume_analysis JSON structures are correctly transformed
 * without intent fabrication or false core skill inflation.
 */
function simulateV1Backfill(v1Record: {
  profile_id: string;
  resume_id: string;
  candidate_data: any;
  extracted_skills: string[];
  created_at: string;
}) {
  const cd = v1Record.candidate_data || {};
  const education = cd?.candidate?.education || cd?.education || [];
  const experience = cd?.candidate?.experience || cd?.experience || [];
  const projects = cd?.candidate?.projects || cd?.projects || [];

  const coreSkills = cd?.candidate?.skills?.core || cd?.skills?.core || [];
  const supportingSkills =
    cd?.candidate?.skills?.supporting || cd?.skills?.supporting || [];

  const coreSet = new Set(
    coreSkills.map((s: string) => s.toLowerCase().trim()),
  );
  const supportingSet = new Set(
    supportingSkills.map((s: string) => s.toLowerCase().trim()),
  );

  const skills = (v1Record.extracted_skills || []).map((skillName: string) => {
    const normalized = skillName.toLowerCase().trim();
    let category = "tool"; // Conservative default
    if (coreSet.has(normalized)) {
      category = "core";
    } else if (supportingSet.has(normalized)) {
      category = "supporting";
    }

    return {
      skill: skillName,
      category,
      provenance: {
        source: "resume_extracted",
        confidence: 0.85,
        updated_at: v1Record.created_at,
      },
      confirmation_state: "draft",
    };
  });

  return {
    profile_id: v1Record.profile_id,
    resume_id: v1Record.resume_id,
    status: "draft",
    onboarding_completed: false,
    current_onboarding_step: 2,
    profile_origin: "v1_migrated",
    background: { education, experience, projects },
    capabilities: {
      extraction_status: "success",
      skills,
      suppressed_skills: [],
    },
    career_intent: {
      target_roles: [],
      target_level: null,
      employment_types: [],
    },
    preferences: {
      locations: [],
      work_modes: [],
      priorities: [],
      salary: null,
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: false,
      work_mode_strict: false,
    },
    confirmed_at: null,
  };
}

describe("Unit: V1 Resume Analysis Backfill Transformation", () => {
  it("should transform real V1 candidate payload with nested 'candidate' namespace", () => {
    // Exact shape from src/lib/groq/profile-extractor.ts
    const realV1Record = {
      profile_id: "user-123",
      resume_id: "res-456",
      created_at: "2026-09-01T10:00:00Z",
      candidate_data: {
        candidate: {
          name: "Budi Santoso",
          title: "Fullstack Developer",
          skills: {
            core: ["React", "TypeScript", "Next.js"],
            supporting: ["Tailwind CSS", "Docker"],
          },
          education: [
            {
              institution: "Institut Teknologi Bandung",
              degree: "S1",
              year: "2024",
            },
          ],
          experience: [],
          projects: [],
        },
      },
      extracted_skills: [
        "React",
        "TypeScript",
        "Next.js",
        "Tailwind CSS",
        "Docker",
        "Git",
      ],
    };

    const result = simulateV1Backfill(realV1Record);

    // Assert status and lifecycle
    expect(result.status).toBe("draft");
    expect(result.onboarding_completed).toBe(false);
    expect(result.current_onboarding_step).toBe(2);
    expect(result.profile_origin).toBe("v1_migrated");

    // Assert skills categorization: Core preserves core, supporting preserves supporting
    const skillsMap = new Map(
      result.capabilities.skills.map((s) => [s.skill, s.category]),
    );
    expect(skillsMap.get("React")).toBe("core");
    expect(skillsMap.get("TypeScript")).toBe("core");
    expect(skillsMap.get("Docker")).toBe("supporting");

    // Guardrail: Unclassified legacy skill "Git" MUST default to "tool", NOT inflated to "core"
    expect(skillsMap.get("Git")).toBe("tool");

    // ZERO Intent Fabrication Invariants
    expect(result.career_intent.target_roles).toEqual([]);
    expect(result.career_intent.target_level).toBeNull();
    expect(result.career_intent.employment_types).toEqual([]);
    expect(result.preferences.locations).toEqual([]);
    expect(result.preferences.work_modes).toEqual([]);
    expect(result.preferences.priorities).toEqual([]);
    expect(result.preferences.salary).toBeNull();
  });

  it("should transform flat V1 candidate payload without 'candidate' wrapper", () => {
    const flatV1Record = {
      profile_id: "user-789",
      resume_id: "res-101",
      created_at: "2026-09-02T12:00:00Z",
      candidate_data: {
        skills: {
          core: ["Go"],
          supporting: ["PostgreSQL"],
        },
        education: [],
        experience: [],
        projects: [],
      },
      extracted_skills: ["Go", "PostgreSQL", "Redis"],
    };

    const result = simulateV1Backfill(flatV1Record);

    const skillsMap = new Map(
      result.capabilities.skills.map((s) => [s.skill, s.category]),
    );
    expect(skillsMap.get("Go")).toBe("core");
    expect(skillsMap.get("PostgreSQL")).toBe("supporting");
    expect(skillsMap.get("Redis")).toBe("tool"); // Unclassified defaults to tool
  });
});
