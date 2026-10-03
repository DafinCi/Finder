import { describe, it, expect } from "vitest";
import {
  isJobConstraintCompliant,
  filterConstraintCompliantJobs,
  JobMatchCandidate,
} from "@/features/matching/engine/stage1-constraint-filter";
import { CareerProfile } from "@/features/profile/types/career-profile.types";

describe("Unit: Stage 1 Constraint Filter", () => {
  const baseProfile: CareerProfile = {
    id: "a0000000-0000-4000-8000-000000000001",
    userId: "b0000000-0000-4000-8000-000000000001",
    resumeId: null,
    status: "active",
    onboardingCompleted: true,
    currentOnboardingStep: 4,
    profileVersion: 1,
    profileOrigin: "web",
    background: { education: [], experience: [], projects: [] },
    capabilities: {
      extraction_status: "unattempted",
      skills: [],
      suppressed_skills: [],
    },
    careerIntent: {
      target_roles: [{ role: "Frontend Developer", priority: "primary" }],
      target_level: "mid_level",
      employment_types: ["full_time"],
    },
    preferences: {
      locations: ["Jakarta"],
      work_modes: ["remote"],
      priorities: [],
      salary: { min_amount: 50000, currency: "USD" },
      negative_preferences: [],
    },
    constraints: {
      relocation_prohibited: false,
      work_mode_strict: false,
    },
    confirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleJob: JobMatchCandidate = {
    id: "j0000000-0000-4000-8000-000000000001",
    title: "Senior Frontend Engineer",
    company_name: "Tech Corp",
    description: "Great remote job building web applications.",
    requirements: ["React", "TypeScript"],
    location: "Remote",
    work_mode: "remote",
    is_active: true,
    salary_range: "$60,000 - $80,000",
  };

  describe("Active status & Rejection exclusion", () => {
    it("should disqualify inactive jobs", () => {
      const inactiveJob = { ...sampleJob, is_active: false };
      const check = isJobConstraintCompliant(inactiveJob, baseProfile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("job_inactive");
    });

    it("should strictly exclude previously rejected jobs", () => {
      const excludedSet = new Set([sampleJob.id]);
      const check = isJobConstraintCompliant(
        sampleJob,
        baseProfile,
        excludedSet,
      );
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("user_rejected");
    });
  });

  describe("Work mode strictness guardrails", () => {
    it("should allow any work mode when work_mode_strict is false", () => {
      const profile = {
        ...baseProfile,
        constraints: { ...baseProfile.constraints, work_mode_strict: false },
      };
      const onsiteJob = {
        ...sampleJob,
        work_mode: "onsite" as const,
        location: "New York",
      };
      const check = isJobConstraintCompliant(onsiteJob, profile);
      expect(check.compliant).toBe(true);
    });

    it("should reject non-matching work mode when work_mode_strict is true", () => {
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          work_modes: ["remote" as const],
        },
        constraints: { ...baseProfile.constraints, work_mode_strict: true },
      };
      const onsiteJob = {
        ...sampleJob,
        work_mode: "onsite" as const,
        location: "Tokyo",
      };
      const check = isJobConstraintCompliant(onsiteJob, profile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("work_mode_strict_mismatch");
    });

    it("RATIFIED GUARDRAIL: must NEVER hard-exclude 'unknown' work mode even if work_mode_strict is true", () => {
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          work_modes: ["remote" as const],
        },
        constraints: { ...baseProfile.constraints, work_mode_strict: true },
      };
      const unknownWorkModeJob = {
        ...sampleJob,
        work_mode: "unknown" as const,
        location: "United States",
      };
      const check = isJobConstraintCompliant(unknownWorkModeJob, profile);

      expect(check.compliant).toBe(true);
      expect(check.workModeUnconfirmed).toBe(true);
    });
  });

  describe("Relocation prohibited constraint", () => {
    it("should allow remote jobs regardless of candidate location when relocation is prohibited", () => {
      const profile = {
        ...baseProfile,
        preferences: { ...baseProfile.preferences, locations: ["Jakarta"] },
        constraints: {
          ...baseProfile.constraints,
          relocation_prohibited: true,
        },
      };
      const remoteJob = {
        ...sampleJob,
        work_mode: "remote" as const,
        location: "London, UK",
      };
      const check = isJobConstraintCompliant(remoteJob, profile);
      expect(check.compliant).toBe(true);
    });

    it("should reject onsite jobs in a different location when relocation is prohibited", () => {
      const profile = {
        ...baseProfile,
        preferences: { ...baseProfile.preferences, locations: ["Jakarta"] },
        constraints: {
          ...baseProfile.constraints,
          relocation_prohibited: true,
        },
      };
      const foreignOnsiteJob = {
        ...sampleJob,
        work_mode: "onsite" as const,
        location: "Berlin, Germany",
      };
      const check = isJobConstraintCompliant(foreignOnsiteJob, profile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("relocation_prohibited");
    });

    it("should allow onsite jobs matching preferred location when relocation is prohibited", () => {
      const profile = {
        ...baseProfile,
        preferences: { ...baseProfile.preferences, locations: ["Jakarta"] },
        constraints: {
          ...baseProfile.constraints,
          relocation_prohibited: true,
        },
      };
      const localOnsiteJob = {
        ...sampleJob,
        work_mode: "onsite" as const,
        location: "Jakarta, Indonesia",
      };
      const check = isJobConstraintCompliant(localOnsiteJob, profile);
      expect(check.compliant).toBe(true);
    });
    it("should reject remote jobs with incompatible geographic restrictions when relocation is prohibited", () => {
      const profile = {
        ...baseProfile,
        preferences: { ...baseProfile.preferences, locations: ["Jakarta, Indonesia"] },
        constraints: {
          ...baseProfile.constraints,
          relocation_prohibited: true,
        },
      };
      const usOnlyRemoteJob = {
        ...sampleJob,
        work_mode: "remote" as const,
        location: "USA Only",
      };
      const check = isJobConstraintCompliant(usOnlyRemoteJob, profile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("relocation_prohibited");
    });

    it("should allow worldwide remote jobs regardless of candidate location when relocation is prohibited", () => {
      const profile = {
        ...baseProfile,
        preferences: { ...baseProfile.preferences, locations: ["Jakarta, Indonesia"] },
        constraints: {
          ...baseProfile.constraints,
          relocation_prohibited: true,
        },
      };
      const worldwideJob = {
        ...sampleJob,
        work_mode: "remote" as const,
        location: "Worldwide",
      };
      const check = isJobConstraintCompliant(worldwideJob, profile);
      expect(check.compliant).toBe(true);
    });
  });

  describe("Salary floor constraint", () => {
    it("should filter out job when declared max salary is below candidate minimum", () => {
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          salary: { min_amount: 90000, currency: "USD" },
        },
      };
      const lowSalaryJob = { ...sampleJob, salary_range: "$60,000 - $75,000" };
      const check = isJobConstraintCompliant(lowSalaryJob, profile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("below_minimum_salary");
    });

    it("should accurately compare across currencies (e.g. IDR candidate with Remotive USD job)", () => {
      // Candidate expects min 15,000,000 IDR (~$937 USD)
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          salary: { min_amount: 15000000, currency: "IDR" },
        },
      };
      // Remotive USD job paying $60k - $80k (well above 15m IDR)
      const usdJob = {
        ...sampleJob,
        salary_range: "$60,000 - $80,000",
        salary_currency: "USD",
      };
      const check = isJobConstraintCompliant(usdJob, profile);
      expect(check.compliant).toBe(true);
    });

    it("should filter out job when converted cross-currency salary is below candidate minimum", () => {
      // Candidate expects min $100,000 USD
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          salary: { min_amount: 100000, currency: "USD" },
        },
      };
      // Local job paying Rp 20,000,000 IDR (~$1,250 USD)
      const lowIdrJob = {
        ...sampleJob,
        salary_range: "Rp 20.000.000",
        salary_currency: "IDR",
      };
      const check = isJobConstraintCompliant(lowIdrJob, profile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("below_minimum_salary");
    });

    it("should NOT filter out job when salary is unstated or unparseable", () => {
      const profile = {
        ...baseProfile,
        preferences: {
          ...baseProfile.preferences,
          salary: { min_amount: 90000, currency: "USD" },
        },
      };
      const unstatedSalaryJob = { ...sampleJob, salary_range: null };
      const check = isJobConstraintCompliant(unstatedSalaryJob, profile);
      expect(check.compliant).toBe(true);
    });
  });

  describe("filterConstraintCompliantJobs helper", () => {
    it("should return compliant jobs bounded by pool limit", () => {
      const pool = filterConstraintCompliantJobs(
        [sampleJob],
        baseProfile,
        new Set(),
        10,
      );
      expect(pool.length).toBe(1);
      expect(pool[0].id).toBe(sampleJob.id);
    });
  });

  describe("Salary floor period normalization", () => {
    const monthlyFloorProfile = {
      ...baseProfile,
      preferences: {
        ...baseProfile.preferences,
        salary: {
          min_amount: 10000,
          currency: "USD",
          period: "month" as const,
        },
      },
    };

    it("should reject an annual job whose maximum is below a monthly floor", () => {
      const job = { ...sampleJob, salary_range: "$80,000 - $100,000" };
      const check = isJobConstraintCompliant(job, monthlyFloorProfile);
      expect(check.compliant).toBe(false);
      expect(check.rejectionReason).toBe("below_minimum_salary");
    });

    it("should accept an annual job whose maximum meets a monthly floor", () => {
      const job = { ...sampleJob, salary_range: "$130,000 - $150,000" };
      const check = isJobConstraintCompliant(job, monthlyFloorProfile);
      expect(check.compliant).toBe(true);
    });

    it("should compare a monthly job against a monthly floor", () => {
      const job = { ...sampleJob, salary_range: "$8,000 - $9,000 per month" };
      const check = isJobConstraintCompliant(job, monthlyFloorProfile);
      expect(check.compliant).toBe(false);
    });
  });
});
