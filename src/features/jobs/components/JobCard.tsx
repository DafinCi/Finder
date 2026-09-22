import React from "react";
import Image from "next/image";
import {
  MapPin,
  Briefcase,
  Brain,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import MatchBadge from "./MatchBadge";
import { FormattedJobMatch } from "../services/jobs.api";

interface JobCardProps {
  match: FormattedJobMatch;
  onSelect: (match: FormattedJobMatch) => void;
}

export default function JobCard({ match, onSelect }: JobCardProps) {
  const {
    title,
    companyName,
    companyLogo,
    location,
    experienceLevel,
    matchScore,
    reason,
    missingSkills,
  } = match;

  return (
    <div className="group border border-border bg-card/50 rounded-[6px] p-5 transition-all duration-200 hover:border-muted-foreground/30 flex flex-col md:flex-row gap-5 items-start justify-between">
      <div className="space-y-4 flex-1 w-full">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-[6px] border border-border bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden relative">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName || "Company"}
                fill
                unoptimized={true}
                sizes="48px"
                className="object-cover"
                priority={false}
              />
            ) : (
              <Briefcase className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-semibold font-heading text-foreground group-hover:text-primary transition-colors duration-200">
                {title}
              </h3>
              <MatchBadge score={matchScore} />
            </div>
            <p className="text-[14px] text-muted-foreground font-medium">
              {companyName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {location || "Remote"}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            {experienceLevel || "Mid Level"}
          </span>
        </div>

        <div className="p-3.5 bg-secondary/30 border border-border/50 rounded-[6px] space-y-2">
          <div className="flex items-center gap-1.5 text-primary text-[13px] font-semibold">
            <Brain className="w-4 h-4" />
            AI Match Insights
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground font-sans">
            {reason || "Analyzing fit..."}
          </p>

          {missingSkills && missingSkills.length > 0 && (
            <div className="pt-2.5 border-t border-border/40 mt-2 flex items-start gap-2 text-[12px] text-amber-500/90 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-500">
                  AI Recommendation:
                </span>{" "}
                Close the skill gap by mastering{" "}
                <span className="font-semibold text-foreground">
                  {missingSkills.join(", ")}
                </span>{" "}
                to boost your suitability.
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onSelect(match)}
        className="w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-1 px-4 py-2 border border-border bg-card/50 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground rounded-[6px] text-[13px] font-medium transition-all duration-200 whitespace-nowrap self-stretch md:self-center cursor-pointer"
      >
        View Details
        <ChevronRight className="w-4 h-4 ml-0.5" />
      </button>
    </div>
  );
}
