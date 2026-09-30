import React from "react";
import {
  MapPin,
  Briefcase,
  Brain,
  ChevronRight,
  AlertCircle,
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
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground border border-border/60 font-medium">
          Work mode unspecified
        </span>
      );
    }

    if (workMode === "remote") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slush-mint/10 text-slush-mint border border-slush-mint/25 font-medium">
          <Laptop className="w-3 h-3" />
          <span>Remote</span>
        </span>
      );
    }

    if (workMode === "hybrid") {
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sui-blue-500/10 text-sui-blue-500 border border-sui-blue-500/25 font-medium">
          Hybrid
        </span>
      );
    }

    return (
      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/80 font-medium">
        Onsite
      </span>
    );
  };

  return (
    <div className="group border border-border/80 bg-card/60 hover:bg-card/90 rounded-xl p-5 transition-all duration-200 hover:border-primary/40 shadow-2xs flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3.5 items-start">
          <CompanyLogo src={companyLogo} name={companyName} size="md" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold font-heading text-foreground group-hover:text-primary transition-colors">
                {companyName}
              </h3>
              <MatchBadge score={matchScore} />
              {renderWorkModeBadge()}
              {match.source === "remotive" && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/90 bg-secondary/80 border border-border/70 px-2 py-0.5 rounded-full">
                  via Remotive
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
        </div>

        {/* Quick Save and Reject Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-start">
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(match);
              }}
              title={isSaved ? "Remove from saved" : "Save job"}
              aria-label={isSaved ? "Remove from saved" : "Save job"}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isSaved
                  ? "bg-primary/10 border-primary text-primary"
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
              className="p-2 rounded-xl border border-border/70 bg-secondary/60 text-muted-foreground hover:text-slush-ember hover:border-slush-ember/40 hover:bg-slush-ember/10 transition-colors cursor-pointer"
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
          <span>{location || "Remote"}</span>
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground/80" />
          <span>{experienceLevel || "Mid Level"}</span>
        </span>
        {salaryRange && (
          <span className="flex items-center gap-1 text-slush-mint font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{salaryRange}</span>
          </span>
        )}
      </div>

      {/* Score Breakdown Indicator (if available) */}
      {scoreBreakdown && (
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <div className="flex items-center gap-1.5 text-[11px] bg-secondary/50 border border-border/70 px-2.5 py-0.5 rounded-full text-muted-foreground">
            <span>Role:</span>
            <span className="font-semibold text-foreground">
              {scoreBreakdown.role_score} / 100
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] bg-secondary/50 border border-border/70 px-2.5 py-0.5 rounded-full text-muted-foreground">
            <span>Skills:</span>
            <span className="font-semibold text-foreground">
              {scoreBreakdown.capability_score} / 100
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] bg-secondary/50 border border-border/70 px-2.5 py-0.5 rounded-full text-muted-foreground">
            <span>Preferences:</span>
            <span className="font-semibold text-foreground">
              {scoreBreakdown.preference_score} / 100
            </span>
          </div>
          {scoreBreakdown.negative_penalty > 0 && (
            <div className="flex items-center gap-1 text-[11px] bg-slush-ember/10 border border-slush-ember/20 px-2.5 py-0.5 rounded-full text-slush-ember font-medium">
              <span>Penalty:</span>
              <span>-{scoreBreakdown.negative_penalty} pts</span>
            </div>
          )}
        </div>
      )}

      {/* Fit Rationale Box */}
      <div className="p-3.5 bg-secondary/40 border border-border/60 rounded-xl space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-primary font-semibold">
          <Brain className="w-3.5 h-3.5" />
          <span>Why this job fits</span>
        </div>
        <p className="leading-relaxed text-muted-foreground font-sans">
          {reason || "Strong alignment with your profile and career direction."}
        </p>

        {missingSkills && missingSkills.length > 0 && (
          <div className="pt-2 border-t border-border/40 mt-1.5 flex items-start gap-1.5 text-[11px] text-slush-yellow leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slush-yellow">
                Skills not yet found in profile:
              </span>{" "}
              Consider highlighting or developing{" "}
              <span className="font-semibold text-foreground">
                {missingSkills.join(", ")}
              </span>
              .
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Action */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onSelect(match)}
          aria-label={`View details for ${title} at ${companyName}`}
          className="w-full sm:w-auto min-h-[36px] flex items-center justify-center gap-1.5 px-4 py-2 border border-border/80 bg-secondary/60 hover:bg-primary hover:border-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ml-auto"
        >
          <span>View Details & Breakdown</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
