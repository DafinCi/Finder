export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline?: string | null;
  sui_address?: string | null;
  memwal_space_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export type ResumeStatus = "uploaded" | "processing" | "completed" | "failed";

export interface Resume {
  id: string;
  profile_id: string;
  file_name: string;
  storage_path: string;
  raw_text?: string | null;
  status: ResumeStatus;
  walrus_blob_id?: string | null;
  walrus_status?: "pending" | "stored" | "failed" | null;
  uploaded_at: string;
}

export interface CandidateSkillSet {
  core: string[];
  supporting: string[];
}

export interface CandidateExperience {
  company: string;
  role: string;
  duration: string;
  achievements: string[];
}

export interface CandidateEducation {
  institution: string;
  degree: string;
  field_of_study?: string;
  graduation_year?: string | number;
}

export interface ExtractedCandidateData {
  candidate: {
    name: string;
    title: string;
    years_of_experience: number;
    summary: string;
    skills: CandidateSkillSet;
    experience: CandidateExperience[];
    education?: CandidateEducation[];
  };
  insights?: {
    strengths: string[];
    growth_areas?: string[];
  };
  career_recommendations?: Array<{
    role: string;
    reason: string;
    fit_score?: number;
  }>;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  model_version?: string | null;
  prompt_version?: string | null;
  candidate_data: ExtractedCandidateData;
  extracted_skills: string[];
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  website?: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  job_type?: "full-time" | "part-time" | "contract" | "remote" | "hybrid";
  salary_range?: string | null;
  experience_level: string;
  is_active: boolean;
  created_at: string;
  companies?: Company;
}

export interface JobMatch {
  id: string;
  analysis_id: string;
  job_id: string;
  match_score: number;
  reason?: string | null;
  missing_skills?: string[] | Json | null;
  created_at: string;
  jobs?: Job;
}
