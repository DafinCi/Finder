"use client";

import React from "react";
import { Sparkles, Briefcase, Award, CheckCircle2 } from "lucide-react";
import { CandidateAnalysis } from "@/types/candidate";

interface CandidateSummaryCardProps {
  analysis: CandidateAnalysis;
}

export default function CandidateSummaryCard({
  analysis,
}: CandidateSummaryCardProps) {
  const candidate = (analysis as any).candidate || analysis;
  const career = (analysis as any).career || analysis;

  const name = candidate.name || "Kandidat Profesional";
  const title = candidate.title || "Software Engineer";
  const years = candidate.years_of_experience || 0;
  const summary = candidate.summary || "";
  const coreSkills = candidate.skills?.core || [];
  const strengths = career?.strengths || [];

  return (
    <div className="w-full my-4 rounded-xl border border-border/80 bg-card/60 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground leading-tight">
              {name}
            </h3>
            <p className="text-xs text-primary font-medium flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5" />
              {title} • {years} Tahun Pengalaman
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
          <Sparkles className="w-3 h-3" />
          Verified AI Profile
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {summary}
        </p>
      )}

      {/* Core Skills Chips */}
      {coreSkills.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Verified Tech Stack
          </span>
          <div className="flex flex-wrap gap-1.5">
            {coreSkills.map((skill: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs rounded-md bg-secondary/80 border border-border text-foreground font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="pt-1 border-t border-border/40">
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {strengths.slice(0, 3).map((st: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{st}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
