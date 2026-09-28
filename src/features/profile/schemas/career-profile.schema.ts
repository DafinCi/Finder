// ==============================================================================
// DOMAIN SCHEMAS: Canonical Career Profile Validation
// Module: @/features/profile/schemas/career-profile.schema
// ==============================================================================

import { z } from "zod";

export const ProvenanceSourceSchema = z.enum([
  "user_explicit",
  "user_confirmed",
  "resume_extracted",
  "ai_inferred",
]);

export const ProvenanceMetadataSchema = z.object({
  source: ProvenanceSourceSchema,
  confidence: z.number().min(0).max(1),
  raw_excerpt: z.string().optional(),
  updated_at: z.string().datetime().or(z.string()),
});

// --- Background Schemas ---
export const EducationEvidenceSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  institution: z.string().trim().min(1),
  degree: z.string().trim().default(""),
  field_of_study: z.string().trim().default(""),
  graduation_year: z
    .number()
    .int()
    .min(1950)
    .max(2100)
    .nullable()
    .default(null),
  provenance: ProvenanceMetadataSchema,
});

export const WorkExperienceEvidenceSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  company_name: z.string().trim().min(1),
  role_title: z.string().trim().min(1),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
  is_current: z.boolean().default(false),
  description_summary: z.string().trim().default(""),
  technologies_used: z.array(z.string().trim()).default([]),
  provenance: ProvenanceMetadataSchema,
});

export const ProjectEvidenceSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  title: z.string().trim().min(1),
  description: z.string().trim().default(""),
  technologies_used: z.array(z.string().trim()).default([]),
  url: z.string().trim().url().optional().or(z.literal("")),
  provenance: ProvenanceMetadataSchema,
});

export const BackgroundEvidenceSchema = z.object({
  education: z.array(EducationEvidenceSchema).default([]),
  experience: z.array(WorkExperienceEvidenceSchema).default([]),
  projects: z.array(ProjectEvidenceSchema).default([]),
});

// --- Capability Schemas ---
export const SkillCategorySchema = z.enum(["core", "supporting", "tool"]);
export const SkillProficiencyClaimSchema = z.enum([
  "foundational",
  "competent",
  "proficient",
]);

export const CapabilityItemSchema = z.object({
  skill: z.string().trim().min(1),
  category: SkillCategorySchema,
  proficiency_claim: SkillProficiencyClaimSchema.optional(),
  provenance: ProvenanceMetadataSchema,
  confirmation_state: z.enum(["draft", "confirmed", "user_added"]),
});

export const SuppressedSkillItemSchema = z.object({
  skill: z.string().trim().min(1),
  suppressed_at: z.string().datetime().or(z.string()),
  reason: z.enum(["user_deleted", "user_rejected"]),
});

export const CapabilityEvidenceSchema = z.object({
  extraction_status: z
    .enum(["success", "failed", "unattempted"])
    .default("unattempted"),
  extraction_error: z.string().nullable().optional(),
  skills: z.array(CapabilityItemSchema).default([]),
  suppressed_skills: z.array(SuppressedSkillItemSchema).default([]),
});

// --- Career Intent Schemas ---
export const TargetLevelSchema = z.enum([
  "internship",
  "entry_level",
  "junior",
  "mid_level",
  "senior",
  "lead",
]);

export const EmploymentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
]);

export const TargetRoleItemSchema = z.object({
  role: z.string().trim().min(1),
  priority: z.enum(["primary", "secondary"]),
});

export const CareerIntentSchema = z.object({
  target_roles: z.array(TargetRoleItemSchema).default([]),
  target_level: TargetLevelSchema.nullable().default(null),
  employment_types: z.array(EmploymentTypeSchema).default([]),
  provenance: ProvenanceMetadataSchema.optional(),
});

// --- Preferences & Constraints Schemas ---
export const WorkModeSchema = z.enum(["remote", "hybrid", "onsite"]);

export const HardConstraintsSchema = z.object({
  relocation_prohibited: z.boolean().default(false),
  work_mode_strict: z.boolean().default(false),
});

export const NegativePreferenceItemSchema = z.object({
  domain: z.enum(["tech", "industry", "work_style"]),
  token: z.string().trim().min(1).max(50),
  penalty_weight: z.number().min(0).max(1).default(1.0),
});

export const PreferencesSchema = z.object({
  locations: z.array(z.string().trim()).default([]),
  work_modes: z.array(WorkModeSchema).default([]),
  priorities: z.array(z.string().trim()).default([]),
  salary: z
    .object({
      min_amount: z.number().positive().nullable(),
      currency: z.string().trim().min(1).max(10).default("USD"),
    })
    .nullable()
    .default(null),
  negative_preferences: z.array(NegativePreferenceItemSchema).default([]),
});

// --- Canonical CareerProfile Database Boundary Schema ---
// Strict validation: Fails loudly on data corruption rather than silently mutating data
export const CareerProfileDbRowSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  resume_id: z.string().uuid().nullable().default(null),
  status: z.enum(["draft", "active"]),
  onboarding_completed: z.boolean(),
  current_onboarding_step: z.number().int().min(1).max(4),
  profile_version: z.number().int().min(1),
  profile_origin: z.enum(["web", "v1_migrated"]).default("web"),
  background: BackgroundEvidenceSchema,
  capabilities: CapabilityEvidenceSchema,
  career_intent: CareerIntentSchema,
  preferences: PreferencesSchema,
  constraints: HardConstraintsSchema,
  confirmed_at: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});

// --- API Request Schemas ---
export const SaveDraftProfileRequestSchema = z.object({
  expected_version: z.number().int().min(1),
  current_step: z.number().int().min(1).max(4).optional(),
  background: BackgroundEvidenceSchema.partial().optional(),
  capabilities: CapabilityEvidenceSchema.partial().optional(),
  career_intent: CareerIntentSchema.partial().optional(),
  preferences: PreferencesSchema.partial().optional(),
  constraints: HardConstraintsSchema.partial().optional(),
});

export const ConfirmProfileRequestSchema = z.object({
  expected_version: z.number().int().min(1),
  career_intent: z.object({
    target_roles: z
      .array(TargetRoleItemSchema)
      .min(1, "At least one target role is required"),
    target_level: TargetLevelSchema,
    employment_types: z
      .array(EmploymentTypeSchema)
      .min(1, "At least one employment type is required"),
  }),
  preferences: z.object({
    locations: z.array(z.string().trim()).default([]),
    work_modes: z
      .array(WorkModeSchema)
      .min(1, "At least one work mode is required"),
    priorities: z.array(z.string().trim()).default([]),
    salary: z
      .object({
        min_amount: z.number().positive().nullable(),
        currency: z.string().trim().default("USD"),
      })
      .nullable()
      .default(null),
    negative_preferences: z.array(NegativePreferenceItemSchema).default([]),
  }),
  constraints: HardConstraintsSchema,
  capabilities: z
    .object({
      skills: z.array(CapabilityItemSchema),
      suppressed_skills: z.array(SuppressedSkillItemSchema).default([]),
    })
    .optional(),
});
