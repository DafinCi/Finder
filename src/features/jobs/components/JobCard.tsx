import React from "react";
import {
  MapPin,
  Briefcase,
  Brain,
  ChevronRight,
  Bookmark,
  ThumbsDown,
  DollarSign,
  Laptop,
} from "lucide-react";
import MatchBadge from "./MatchBadge";
import CompanyLogo from "@/components/common/CompanyLogo";
import { FormattedJobMatch } from "../services/jobs.api";

interface JobCardProps {
  match: FormattedJobMatch;
  onSelect: (match: FormattedJobMatch) => void;
  onToggleSave?: (match: FormattedJobMatch) => void;
  onReject?: (match: FormattedJobMatch) => void;
}

export default function JobCard({
  match,
  onSelect,
  onToggleSave,
  onReject,
}: JobCardProps) {
  const {
    title,
    companyName,
    companyLogo,
    location,
    experienceLevel,
    workMode,
    salaryRange,
    matchScore,
    reason,
    missingSkills,
    scoreBreakdown,
    isSaved,
  } = match;

  const renderWorkModeBadge = () => {
    if (!workMode || workMode === "unknown") {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-sm bg-secondary/80 text-muted-foreground border border-border/60 font-medium">
          Work mode not specified
        </span>
      );
    }

    if (workMode === "remote") {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-sm bg-slush-mint/10 text-slush-mint border border-slush-mint/25 font-medium">
          <Laptop className="w-3 h-3" />
          <span>Remote</span>
        </span>
      );
    }

    if (workMode === "hybrid") {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-sm bg-secondary text-muted-foreground border border-border/80 font-medium">
          Hybrid
        </span>
      );
    }

    return (
      <span className="text-xs px-2.5 py-0.5 rounded-sm bg-secondary text-muted-foreground border border-border/80 font-medium">
        Onsite
      </span>
    );
  };

  return (
    <div className="group border border-border/80 bg-card hover:bg-card/90 rounded-sm p-5 transition-all duration-200 hover:border-border-strong shadow-2xs flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3.5 items-start min-w-0">
          <CompanyLogo src={companyLogo} name={companyName} size="md" />
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold font-heading text-foreground group-hover:text-foreground transition-colors">
                {title}
              </h3>
              <MatchBadge score={matchScore} />
              {renderWorkModeBadge()}
              {match.source === "remotive" && (
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90 bg-secondary/80 border border-border/70 px-2 py-0.5 rounded-sm">
                  via Remotive
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{companyName}</p>
          </div>
        </div>

        {/* Quick Save and Reject Actions */}
        <div className="flex items-center gap-2 self-end sm:self-start">
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(match);
              }}
              title={isSaved ? "Remove from saved" : "Save job"}
              aria-label={isSaved ? "Remove from saved" : "Save job"}
              className={`h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-sm border transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground ${
                isSaved
                  ? "bg-secondary border-border-strong text-foreground"
                  : "bg-secondary/60 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
              />
            </button>
          )}

          {onReject && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReject(match);
              }}
              title="Not interested"
              aria-label="Not interested in this role"
              className="h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center rounded-sm border border-border/70 bg-secondary/60 text-muted-foreground hover:text-slush-ember hover:border-slush-ember/40 hover:bg-slush-ember/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span>{location || "Location not specified"}</span>
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span>{experienceLevel || "Level not specified"}</span>
        </span>
        {salaryRange && (
          <span className="flex items-center gap-1 text-slush-mint font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{salaryRange}</span>
          </span>
        )}
      </div>

      {/* Fit Rationale Snippet */}
      {reason && (
        <div className="p-3 bg-secondary/40 border border-border/60 rounded-sm space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
            <Brain className="w-3.5 h-3.5" />
            <span>Why this matches you</span>
          </div>
          <p className="line-clamp-2 leading-relaxed text-muted-foreground font-sans">
            {reason}
          </p>
        </div>
      )}

      {/* Bottom Footer Action */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onSelect(match)}
          aria-label={`View details for ${title} at ${companyName}`}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[38px] flex items-center justify-center gap-1.5 px-4 py-2 border border-border/80 bg-secondary/60 hover:bg-secondary hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-2xs ml-auto"
        >
          <span>View Details & Breakdown</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
