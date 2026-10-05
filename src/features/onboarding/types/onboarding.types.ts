// ==============================================================================
// ONBOARDING DOMAIN TYPES & CONSTANTS
// Module: @/features/onboarding/types/onboarding.types
// ==============================================================================

import {
  TargetRoleItem,
  TargetLevel,
  EmploymentType,
  WorkMode,
  CapabilityItem,
  SuppressedSkillItem,
  BackgroundEvidence,
  NegativePreferenceItem,
  CareerProfile,
} from "@/features/profile/types/career-profile.types";

export type OnboardingStepNumber = 1 | 2 | 3 | 4;
export type OnboardingFlowMode = "choice" | "cv_magic" | "manual";

export interface OnboardingFormState {
  flowMode: OnboardingFlowMode;

  // Step 1: CV & Background
  resumeId: string | null;
  resumeFileName: string | null;
  isUploadingResume: boolean;
  isAnalyzingResume: boolean;
  resumeExtracted: boolean;
  background: BackgroundEvidence;

  // Step 2: Career Intent
  targetRoles: TargetRoleItem[];
  targetLevel: TargetLevel | null;
  employmentTypes: EmploymentType[];

  // Step 3: Work Mode & Constraints
  workModes: WorkMode[];
  workModeStrict: boolean;
  locations: string[];
  relocationProhibited: boolean;
  salaryMin: number | null;
  salaryCurrency: string;
  salaryPeriod: "year" | "month" | "hour";
  priorities: string[];
  negativePreferences: NegativePreferenceItem[];

  // Step 4: Skills & Capabilities (Review Bento)
  skills: CapabilityItem[];
  suppressedSkills: SuppressedSkillItem[];

  // Concurrency & Lifecycle
  currentStep: OnboardingStepNumber;
  expectedVersion: number;
  profileId: string | null;
  isExistingActiveProfile: boolean;
}

// Preset Options for Onboarding Wizard

export const PRESET_TARGET_ROLES: string[] = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "Mobile Engineer (iOS/Android)",
  "DevOps / SRE",
  "Data Engineer",
  "AI / Machine Learning Engineer",
  "Product Manager",
  "QA / Test Automation Engineer",
  "Smart Contract / Web3 Engineer",
];

export const SENIORITY_LEVEL_OPTIONS: {
  value: TargetLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "internship",
    label: "Internship",
    description: "Students or beginners seeking practical experience",
  },
  {
    value: "entry_level",
    label: "Entry-Level",
    description: "Recent graduates or starting out in your career (0–1 yr)",
  },
  {
    value: "junior",
    label: "Junior",
    description: "Building confidence and shipping code (1–2 yrs)",
  },
  {
    value: "mid_level",
    label: "Mid-Level",
    description:
      "Independent contributor owning features and systems (3–5 yrs)",
  },
  {
    value: "senior",
    label: "Senior",
    description:
      "Deep expertise, mentoring, and leading technical direction (5+ yrs)",
  },
  {
    value: "lead",
    label: "Lead",
    description:
      "Architectural leadership, team strategy, and high-level execution",
  },
];

export const EMPLOYMENT_TYPE_OPTIONS: {
  value: EmploymentType;
  label: string;
}[] = [
  { value: "full_time", label: "Full-Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "part_time", label: "Part-Time" },
  { value: "freelance", label: "Freelance" },
];

export const WORK_MODE_OPTIONS: {
  value: WorkMode;
  label: string;
  description: string;
}[] = [
  {
    value: "remote",
    label: "Remote",
    description: "Work from anywhere with a good internet connection",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Mix of working from home and office visits",
  },
  {
    value: "onsite",
    label: "On-site",
    description: "Work directly at the company office",
  },
];

export const COMMON_POPULAR_SKILLS: string[] = [
  "React",
  "TypeScript",
  "Node.js",
  "Next.js",
  "Python",
  "PostgreSQL",
  "Tailwind CSS",
  "Docker",
  "AWS",
  "Git",
];

export const SUGGESTED_SKILLS_BY_ROLE: Record<string, string[]> = {
  frontend: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "JavaScript",
    "HTML/CSS",
    "Vue.js",
    "Redux",
  ],
  backend: [
    "Node.js",
    "Python",
    "PostgreSQL",
    "Go",
    "Java",
    "Docker",
    "REST API",
    "Redis",
  ],
  fullstack: [
    "TypeScript",
    "React",
    "Node.js",
    "Next.js",
    "PostgreSQL",
    "Tailwind CSS",
    "Docker",
  ],
  mobile: [
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "Swift",
    "Kotlin",
    "TypeScript",
  ],
  devops: [
    "Docker",
    "Kubernetes",
    "AWS",
    "CI/CD",
    "Terraform",
    "Linux",
    "GitHub Actions",
  ],
  data: [
    "Python",
    "SQL",
    "Pandas",
    "PostgreSQL",
    "Machine Learning",
    "PyTorch",
    "Data Modeling",
  ],
  ai: [
    "Python",
    "PyTorch",
    "Machine Learning",
    "LLMs",
    "TensorFlow",
    "FastAPI",
    "Docker",
  ],
};

export const PRESET_LOCATIONS: string[] = [
  "Indonesia",
  "Jakarta, Indonesia",
  "Singapore",
  "Worldwide / Remote",
  "United States",
  "Europe",
];

export const PRESET_PRIORITIES: {
  id: string;
  label: string;
  description: string;
}[] = [
  {
    id: "mentorship",
    label: "Mentorship & Guidance",
    description: "Experienced leads who actively coach and review code",
  },
  {
    id: "modern_tech",
    label: "Modern Tech Stack",
    description: "TypeScript, Next.js, modern cloud architectures",
  },
  {
    id: "learning_growth",
    label: "High Learning & Growth",
    description: "Steep learning curve with opportunities to level up fast",
  },
  {
    id: "work_life_balance",
    label: "Work-Life Balance",
    description: "Healthy working hours without regular unpaid crunch",
  },
  {
    id: "competitive_salary",
    label: "Competitive Salary",
    description: "Market-leading compensation and transparent pay",
  },
  {
    id: "high_autonomy",
    label: "High Autonomy",
    description: "Freedom to make architectural and technical decisions",
  },
];

export const PRESET_NEGATIVE_PREFERENCES: NegativePreferenceItem[] = [
  {
    domain: "tech",
    token: "legacy_codebases",
    penalty_weight: 1.0,
  },
  {
    domain: "work_style",
    token: "unpaid_overtime",
    penalty_weight: 1.0,
  },
  {
    domain: "industry",
    token: "gambling",
    penalty_weight: 1.0,
  },
  {
    domain: "industry",
    token: "crypto_speculation",
    penalty_weight: 0.8,
  },
  {
    domain: "work_style",
    token: "frequent_travel",
    penalty_weight: 0.8,
  },
];

export const NEGATIVE_PREFERENCE_LABELS: Record<string, string> = {
  legacy_codebases: "Legacy Codebases / Maintenance-Only",
  unpaid_overtime: "Unpaid Overtime / 996 Schedule",
  gambling: "Gambling & Online Betting",
  crypto_speculation: "High-Risk Token Speculation",
  frequent_travel: "Frequent Business Travel (>25%)",
};

export interface OnboardingApiResponse<T = unknown> {
  profile?: CareerProfile;
  error?: string;
  code?: string;
  expectedVersion?: number;
  currentVersion?: number;
  details?: T;
}
