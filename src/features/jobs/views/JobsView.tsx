"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  MessageSquare,
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
      <div className="h-full flex-1 overflow-y-auto bg-background text-foreground py-10 px-4 scrollbar-thin">
        <JobsPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex-1 overflow-y-auto bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/20 bg-destructive/10 rounded-xl p-6 text-center space-y-3">
          <h3 className="text-base font-semibold text-destructive">
            Failed to Load Recommendations
          </h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 overflow-y-auto bg-background text-foreground pb-20 relative scrollbar-thin">
      <div className="max-w-5xl mx-auto pt-10 pb-8 px-4 space-y-7">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            Recommended Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            AI-driven career opportunities custom-matched to your resume
            profile.
          </p>
        </div>

        {/* Stats summary */}
        <JobSummary stats={stats} />

        {/* Search & Filter Toolbar */}
        <div className="border border-border/80 bg-card/60 backdrop-blur-xs rounded-xl p-4 space-y-3.5 shadow-2xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by job title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/40 border border-border/80 rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedMatchLevel}
                onChange={(e) => setSelectedMatchLevel(e.target.value)}
                className="w-full bg-secondary/40 border border-border/80 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="all">All Match Levels</option>
                <option value="excellent">Excellent (90%+)</option>
                <option value="strong">Strong (75%-89%)</option>
                <option value="good">Good (60%-74%)</option>
                <option value="potential">Potential (&lt;60%)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mr-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="bg-secondary/40 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Experience Levels</option>
              <option value="junior">Junior Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-secondary/40 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer capitalize"
            >
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "all" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Cards Stream */}
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
            <div className="border border-border/80 bg-card/40 rounded-xl p-12 text-center space-y-4">
              <p className="text-base font-semibold text-foreground">
                No matching opportunities found
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Upload your CV in the AI Career Copilot to unlock real-time
                match scores and tailored job recommendations.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Go to Career Copilot</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Solid Detail Drawer (No Transparency Bleed-Through) */}
      {selectedJob && (
        <>
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-xs z-40 transition-opacity duration-300"
            onClick={() => setSelectedJob(null)}
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border z-50 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-tight">
                <Sparkles className="w-4 h-4" />
                <span>AI Deep Matching Analysis</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 scrollbar-thin">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold font-heading text-foreground leading-tight">
                    {selectedJob.title}
                  </h2>
                  <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                    {selectedJob.matchScore}% Match
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedJob.companyName}
                </p>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedJob.location || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {selectedJob.experienceLevel || "Mid Level"}
                  </span>
                </div>
              </div>

              {/* Fit Insights */}
              <div className="border border-border/80 bg-secondary/30 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Why This Job Fits:</span>
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                  {selectedJob.reason}
                </p>
              </div>

              {/* Skill Gap */}
              {selectedJob.missingSkills &&
                selectedJob.missingSkills.length > 0 && (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Identified Skills Gap:</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                      Target requirements mention{" "}
                      <span className="font-semibold text-foreground">
                        {selectedJob.missingSkills.join(", ")}
                      </span>
                      . Preparing these areas will boost your interview
                      readiness.
                    </p>
                  </div>
                )}

              {/* Job Details */}
              <div className="space-y-4 pt-3 border-t border-border/60">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold font-heading text-foreground uppercase tracking-wider">
                    Job Description
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line font-sans">
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-semibold font-heading text-foreground uppercase tracking-wider">
                    Core Requirements
                  </h4>
                  {selectedJob.requirements &&
                  selectedJob.requirements.length > 0 ? (
                    <ul className="space-y-1.5">
                      {selectedJob.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground font-sans">
                      Not specified.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-border/80 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log("Applying to job:", selectedJob.jobId);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <span>Apply Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2.5 border border-border/80 bg-secondary/60 rounded-xl text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
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
