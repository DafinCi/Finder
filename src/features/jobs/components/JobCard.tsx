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
    <div className="group border border-border/80 bg-card/60 hover:bg-card/90 rounded-xl p-5 transition-all duration-200 hover:border-primary/40 shadow-2xs flex flex-col md:flex-row gap-5 items-start justify-between">
      <div className="space-y-3.5 flex-1 w-full">
        {/* Company & Title Header */}
        <div className="flex gap-3.5 items-start">
          <div className="w-11 h-11 rounded-lg border border-border/80 bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName || "Company"}
                fill
                unoptimized={true}
                sizes="44px"
                className="object-cover"
                priority={false}
              />
            ) : (
              <Briefcase className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold font-heading text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <MatchBadge score={matchScore} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {companyName}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location || "Remote"}</span>
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{experienceLevel || "Mid Level"}</span>
          </span>
        </div>

        {/* AI Insight Box */}
        <div className="p-3 bg-secondary/30 border border-border/60 rounded-lg space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-primary font-semibold">
            <Brain className="w-3.5 h-3.5" />
            <span>AI Match Insights</span>
          </div>
          <p className="leading-relaxed text-muted-foreground font-sans">
            {reason || "Analyzing fit..."}
          </p>

          {missingSkills && missingSkills.length > 0 && (
            <div className="pt-2 border-t border-border/40 mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-500/90 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-500">
                  AI Recommendation:
                </span>{" "}
                Familiarize yourself with{" "}
                <span className="font-semibold text-foreground">
                  {missingSkills.join(", ")}
                </span>{" "}
                to maximize interview performance.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onSelect(match)}
        className="w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-1 px-3.5 py-2 border border-border/80 bg-secondary/60 hover:bg-primary hover:border-primary hover:text-primary-foreground rounded-lg text-xs font-semibold transition-all whitespace-nowrap self-stretch md:self-center cursor-pointer shadow-2xs"
      >
        <span>View Details</span>
        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
      </button>
    </div>
  );
}
