"use client";

import React, { useState } from "react";
import {
  FileText,
  Briefcase,
  Bot,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  ChevronRight,
  Terminal,
} from "lucide-react";
import MatchBadge from "@/features/jobs/components/MatchBadge";
import { Button } from "@/components/ui/button";
import { MARKETING_PRIMARY_MODEL } from "../data/ai-stack";

export default function InteractiveDemoShowcase() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "matching" | "copilot"
  >("profile");

  return (
    <section id="preview" className="py-20 md:py-28 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Interactive Product Preview
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            Explore the Finder workspace experience
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            See the actual data structures and analytical output produced by
            Finder when evaluating technical candidates.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center max-w-lg mx-auto mb-8 p-1 rounded-sm bg-secondary/80 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 px-3 rounded-sm text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "profile"
                ? "bg-card text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Extracted Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matching")}
            className={`flex-1 py-2 px-3 rounded-sm text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "matching"
                ? "bg-card text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>2. Matched Opportunity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className={`flex-1 py-2 px-3 rounded-sm text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "copilot"
                ? "bg-card text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>3. Career Copilot</span>
          </button>
        </div>

        {/* Active Stage Container */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden">
          {/* Header Metadata */}
          <div className="border-b border-border/70 px-5 py-3.5 bg-secondary/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">Session:</span>
              <span className="font-semibold text-foreground">
                Senior_Fullstack_Alex_2026.pdf
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                Model: {MARKETING_PRIMARY_MODEL}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Status: Complete
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* View 1: Extracted Candidate Profile */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold text-lg">
                      AR
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-foreground font-heading">
                        Alex Rivers
                      </h4>
                      <p className="text-xs text-primary font-medium flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>
                          Senior Full-Stack Engineer • 6 Years of Experience
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground px-2.5 py-1 rounded-md bg-secondary/80 border border-border w-fit">
                    Extracted from PDF
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Professional Summary
                    </h5>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      Senior software engineer with 6+ years specializing in
                      Next.js App Router, strict TypeScript architectures, and
                      high-concurrency PostgreSQL data modeling. Proven track
                      record leading front-end modernization and building
                      resilient cloud API services.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-sm border border-border bg-secondary/20 p-4 space-y-2">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                        Core Competencies (Weight: 2.0x)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "TypeScript",
                          "Next.js 16",
                          "React 19",
                          "PostgreSQL",
                          "Node.js",
                        ].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-xs bg-card border border-border text-foreground font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-sm border border-border bg-secondary/20 p-4 space-y-2">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                        Supporting Tools (Weight: 1.2x)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Tailwind CSS 4",
                          "REST APIs",
                          "Vitest",
                          "Git",
                          "Supabase SSR",
                        ].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-xs bg-card border border-border text-muted-foreground font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Verified Strengths
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Exemplary full-stack architecture depth, proven ownership
                      of mission-critical systems, and exceptional grasp of
                      modern React Server Components and data boundaries.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Matched Opportunity */}
            {activeTab === "matching" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="rounded-sm border border-border/80 bg-card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-sm bg-secondary border border-border flex items-center justify-center font-bold text-foreground font-heading">
                        CS
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-semibold font-heading text-foreground">
                            CloudScale Technologies
                          </h4>
                          <MatchBadge score={92} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                            Active Remote Job
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Senior Full-Stack Engineer • Platform Team
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className="text-xs font-mono font-medium text-foreground">
                        $140,000 - $165,000
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Full-time • Global Remote
                      </p>
                    </div>
                  </div>

                  {/* Qualitative Rationale */}
                  <div className="rounded-sm bg-secondary/40 border border-border/60 p-4 space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                      AI Qualitative Fit Evaluation
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      Direct alignment on Next.js 16 App Router, TypeScript
                      strict typing, and relational schema optimization. Alex
                      exceeds the required 5+ years of engineering experience
                      and possesses the full-stack architecture background
                      demanded for CloudScale&apos;s developer platform.
                    </p>
                  </div>

                  {/* Skills Delta Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Matched Requirements (5)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "TypeScript",
                          "Next.js",
                          "PostgreSQL",
                          "React",
                          "Node.js",
                        ].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Identified Skill Gaps (2)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Docker", "Redis"].map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-[11px] bg-destructive/10 text-destructive border border-destructive/25 font-mono"
                          >
                            ✕ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Career Copilot Multi-Turn Chat */}
            {activeTab === "copilot" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-lg rounded-2xl rounded-tr-xs bg-primary text-primary-foreground p-3.5 text-xs font-medium shadow-xs">
                    How should I address the missing Docker and Redis skills
                    during my interview with CloudScale?
                  </div>
                </div>

                {/* Copilot Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="max-w-2xl space-y-3 rounded-2xl rounded-tl-xs bg-secondary/40 border border-border p-4 text-xs leading-relaxed">
                    <p className="text-foreground font-medium">
                      Here is a strategic approach to frame your experience
                      positively:
                    </p>
                    <ol className="list-decimal pl-4 space-y-2 text-muted-foreground">
                      <li>
                        <strong className="text-foreground">
                          Compensate for Redis:
                        </strong>{" "}
                        Emphasize your deep PostgreSQL indexing, query
                        optimization, and memory cache tuning. Mention that
                        while you haven&apos;t run standalone Redis in
                        production, you understand in-memory key-value eviction
                        and cache-aside patterns.
                      </li>
                      <li>
                        <strong className="text-foreground">
                          Containerization Bridge:
                        </strong>{" "}
                        Highlight your Next.js standalone container deployment
                        experience. You know how multi-stage Docker builds
                        operate even if orchestration was managed by DevOps.
                      </li>
                    </ol>
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-primary">
                      <span>
                        Suggested: &quot;Simulate a question on
                        cache-invalidation strategies&quot;
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
