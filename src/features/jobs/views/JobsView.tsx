"use client";

import React, { useState } from "react";
import { useJobs } from "../hooks/useJobs";
import JobSummary from "../components/JobSummary";
import JobCard from "../components/JobCard";
import JobsPageSkeleton from "../skeletons/JobsPageSkeleton";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Briefcase,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { FormattedJobMatch } from "../services/jobs.api";

export default function JobsView() {
  const {
    matches,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedMatchLevel,
    setSelectedMatchLevel,
    selectedExperience,
    setSelectedExperience,
    selectedLocation,
    setSelectedLocation,
    uniqueLocations,
    stats,
  } = useJobs();

  const [selectedJob, setSelectedJob] = useState<FormattedJobMatch | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 px-4">
        <JobsPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/20 bg-destructive/10 rounded-[6px] p-6 text-center">
          <h3 className="text-[18px] font-semibold text-destructive mb-2">
            Failed to Load Recommendations
          </h3>
          <p className="text-[14px] text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative">
      <div className="max-w-5xl mx-auto pt-12 pb-8 px-4 space-y-8">
        <div>
          <h1 className="text-[36px] font-semibold font-heading tracking-tight mb-2">
            Recommended Roles
          </h1>
          <p className="text-[16px] text-muted-foreground font-sans">
            AI-driven opportunities custom-matched to your professional
            blueprint.
          </p>
        </div>

        <JobSummary stats={stats} />

        <div className="border border-border bg-card/50 rounded-[6px] p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-[6px] pl-10 pr-4 py-2 text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-200"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedMatchLevel}
                onChange={(e) => setSelectedMatchLevel(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-[6px] px-3 py-2 text-[14px] focus:outline-none focus:border-primary cursor-pointer transition-colors duration-200"
              >
                <option value="all">All Match Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="strong">Strong (75%-89%)</option>
                <option value="good">Good (60%-74%)</option>
                <option value="potential">Potential (&lt;60%)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[13px] font-medium mr-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters:
            </div>

            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="bg-card/50 border border-border rounded-[6px] px-3 py-1.5 text-[13px] focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Experience Levels</option>
              <option value="junior">Junior Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-card/50 border border-border rounded-[6px] px-3 py-1.5 text-[13px] focus:outline-none focus:border-primary cursor-pointer capitalize"
            >
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "all" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <JobCard
                key={match.matchId}
                match={match}
                onSelect={setSelectedJob}
              />
            ))
          ) : (
            <div className="border border-border bg-card/50 rounded-[6px] p-12 text-center space-y-3">
              <p className="text-[16px] font-semibold text-foreground">
                No matches found
              </p>
              <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
                Try adjusting your search criteria, or update your resume
                analysis to recalculate matches.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedJob && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedJob(null)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card/50 border-l border-border z-50 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2 text-primary font-medium text-[14px]">
                <Sparkles className="w-4 h-4" />
                AI Deep Matching Analysis
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-[6px] hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2 custom-scrollbar">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-[22px] font-semibold font-heading text-foreground leading-tight">
                    {selectedJob.title}
                  </h2>
                  <span className="text-[14px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md shrink-0">
                    {selectedJob.matchScore}% Match
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-muted-foreground">
                  {selectedJob.companyName}
                </p>

                <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedJob.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {selectedJob.experienceLevel || "Mid Level"}
                  </span>
                </div>
              </div>

              <div className="border border-border bg-secondary/30 rounded-[6px] p-4 space-y-3">
                <h4 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Why This Job Fits:
                </h4>
                <p className="text-[14px] leading-relaxed text-muted-foreground font-sans">
                  {selectedJob.reason}
                </p>
              </div>

              {selectedJob.missingSkills &&
                selectedJob.missingSkills.length > 0 && (
                  <div className="border border-amber-500/10 bg-amber-500/5 rounded-[6px] p-4 space-y-3">
                    <h4 className="text-[14px] font-bold text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Identified Skills Gap:
                    </h4>
                    <p className="text-[13px] leading-relaxed text-muted-foreground font-sans">
                      They require{" "}
                      <span className="font-semibold text-foreground">
                        {selectedJob.missingSkills.join(", ")}
                      </span>
                      , which wasn&apos;t highlighted in your resume analysis.
                      Closing this gap will significantly improve your
                      applications.
                    </p>
                  </div>
                )}

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <h4 className="text-[15px] font-semibold font-heading text-foreground">
                    Job Description
                  </h4>
                  <p className="text-[14px] leading-relaxed text-muted-foreground whitespace-pre-line font-sans">
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-[15px] font-semibold font-heading text-foreground">
                    Core Requirements
                  </h4>
                  {selectedJob.requirements &&
                  selectedJob.requirements.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 text-[14px] text-muted-foreground leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[14px] text-muted-foreground font-sans">
                      Not specified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 flex gap-3">
              <button
                onClick={() => {
                  console.log("Applying to job:", selectedJob.jobId);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-[6px] text-[14px] hover:opacity-90 transition-opacity duration-150 cursor-pointer"
              >
                Apply Now
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 border border-border bg-card/50 rounded-[6px] text-[14px] font-medium text-foreground hover:bg-secondary transition-colors duration-150 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
