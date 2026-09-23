import {
  ExtractedCandidateData,
  CandidateSkillSet,
  CandidateExperience,
  CandidateEducation,
} from "./database";

export type {
  ExtractedCandidateData,
  CandidateSkillSet,
  CandidateExperience,
  CandidateEducation,
};

export interface MatchAnalysisResult {
  match_score: number;
  reason: string;
  missing_skills: string[];
  strengths: string[];
}

export interface CareerRecommendationItem {
  role: string;
  reason: string;
  fit_score?: number;
}

export interface CandidateAnalysis {
  name?: string;
  title?: string;
  years_of_experience?: number;
  summary?: string;
  skills?: CandidateSkillSet;
  experience?: CandidateExperience[];
  education?: CandidateEducation[];
  insights?: {
    strengths: string[];
    growth_areas?: string[];
  };
  career_recommendations?: CareerRecommendationItem[];
  career_score?: number;
  [key: string]: any;
}
