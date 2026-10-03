// ==============================================================================
// DOMAIN TYPES: Canonical Career Profile
// Module: @/features/profile/types/career-profile.types
// ==============================================================================

export type ProvenanceSource =
  | "user_explicit"
  | "user_confirmed"
  | "resume_extracted"
  | "ai_inferred";

export interface ProvenanceMetadata {
  source: ProvenanceSource;
  confidence: number; // 1.0 for user actions; 0.0 - 0.9 for AI
  raw_excerpt?: string;
  updated_at: string;
}

// --- Background Evidence ---
export interface EducationEvidence {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  graduation_year: number | null;
  provenance: ProvenanceMetadata;
}

export interface WorkExperienceEvidence {
  id: string;
  company_name: string;
  role_title: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description_summary: string;
  technologies_used: string[];
  provenance: ProvenanceMetadata;
}

export interface ProjectEvidence {
  id: string;
  title: string;
  description: string;
  technologies_used: string[];
  url?: string;
  provenance: ProvenanceMetadata;
}

export interface BackgroundEvidence {
  education: EducationEvidence[];
  experience: WorkExperienceEvidence[];
  projects: ProjectEvidence[];
}

// --- Capability Evidence ---
export type SkillCategory = "core" | "supporting" | "tool";
export type SkillProficiencyClaim = "foundational" | "competent" | "proficient";

export interface CapabilityItem {
  skill: string;
  category: SkillCategory;
  proficiency_claim?: SkillProficiencyClaim;
  provenance: ProvenanceMetadata;
  confirmation_state: "draft" | "confirmed" | "user_added";
}

export interface SuppressedSkillItem {
  skill: string;
  suppressed_at: string;
  reason: "user_deleted" | "user_rejected";
}

export interface CapabilityEvidence {
  extraction_status: "success" | "failed" | "unattempted";
  extraction_error?: string | null;
  skills: CapabilityItem[];
  suppressed_skills: SuppressedSkillItem[];
}

// --- Career Intent ---
export type TargetLevel =
  | "internship"
  | "entry_level"
  | "junior"
  | "mid_level"
  | "senior"
  | "lead";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance";

export interface TargetRoleItem {
  role: string;
  priority: "primary" | "secondary";
}

export interface CareerIntent {
  target_roles: TargetRoleItem[];
  target_level: TargetLevel | null;
  employment_types: EmploymentType[];
  provenance?: ProvenanceMetadata;
}

// --- Constraints & Preferences ---
export type WorkMode = "remote" | "hybrid" | "onsite";

export interface HardConstraints {
  relocation_prohibited: boolean;
  work_mode_strict: boolean;
}

export interface NegativePreferenceItem {
  domain: "tech" | "industry" | "work_style";
  token: string;
  penalty_weight?: number; // 0.0 to 1.0 (default 1.0)
}

export type SalaryPeriod = "year" | "month" | "hour";

export interface Preferences {
  locations: string[];
  work_modes: WorkMode[];
  priorities: string[]; // e.g. "mentorship", "modern_tech"
  salary: {
    min_amount: number | null;
    currency: string;
    period?: SalaryPeriod | null;
  } | null;
  negative_preferences: NegativePreferenceItem[];
}

// --- Canonical CareerProfile Aggregate Root ---
export type ProfileLifecycleStatus = "draft" | "active";
export type ProfileOrigin = "web" | "v1_migrated";

export interface CareerProfile {
  id: string; // CareerProfile Entity UUID (PK)
  userId: string; // Explicit alias for profile_id referencing public.profiles(id)
  resumeId: string | null;
  status: ProfileLifecycleStatus;
  onboardingCompleted: boolean;
  currentOnboardingStep: number;
  profileVersion: number;
  profileOrigin: ProfileOrigin;
  background: BackgroundEvidence;
  capabilities: CapabilityEvidence;
  careerIntent: CareerIntent;
  preferences: Preferences;
  constraints: HardConstraints;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
