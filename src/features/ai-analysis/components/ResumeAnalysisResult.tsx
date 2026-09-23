"use client";

import React from "react";
import CandidateOverview from "./CandidateOverview";
import ProfessionalSummary from "./ProfessionalSummary";
import SkillSection from "./SkillSection";
import InsightAndStrength from "./InsightAndStrength";
import CareerRecommendation from "./CareerRecommendation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ResumeAnalysisResult({ data }: { data?: any }) {
  if (!data || !data.candidate_data) return null;

  const { candidate_data, extracted_skills, job_matches } = data;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out pb-20">
      <CandidateOverview
        careerLevel={candidate_data.career_level}
        skillsCount={extracted_skills?.length || 0}
        jobsCount={job_matches?.length || 0}
      />

      <ProfessionalSummary summary={candidate_data.summary} />

      <SkillSection skills={extracted_skills} />

      <InsightAndStrength
        strengths={candidate_data.strengths}
        weaknesses={candidate_data.weaknesses}
      />

      <CareerRecommendation jobMatches={job_matches} />
    </div>
  );
}
