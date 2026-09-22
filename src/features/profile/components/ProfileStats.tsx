import React from "react";
import { Sparkles } from "lucide-react";
import { CandidateAnalysis } from "@/types/candidate";

interface ProfileStatsProps {
  analysis?: CandidateAnalysis | null;
}

export default function ProfileStats({ analysis }: ProfileStatsProps) {
  const stats = [
    { label: "AI Match Score", value: `${analysis?.career_score || 85}%` },
    {
      label: "Verified Core Skills",
      value: `${analysis?.skills?.core?.length || 0} Skills`,
    },
    {
      label: "Analyzed Projects",
      value: `${analysis?.experience?.length || 0} Projects`,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-4 border border-border bg-secondary/15 rounded-[6px] relative overflow-hidden">
      {/* Subtle background AI Badge indicator */}
      <div className="absolute right-3 top-3 opacity-20 flex items-center gap-1 text-primary text-[11px] font-sans font-medium uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" />
        AI Verified
      </div>

      {stats.map((stat, i) => (
        <div key={i} className="text-center md:text-left py-2">
          <p className="text-[14px] font-sans text-muted-foreground uppercase tracking-wide">
            {stat.label}
          </p>
          <p className="text-[24px] font-heading font-semibold text-foreground mt-1">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
