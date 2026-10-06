"use client";

import React, { useState } from "react";
import {
  FileText,
  Briefcase,
  Bot,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import StickerBadge from "./StickerBadge";
import { MARKETING_PRIMARY_MODEL } from "../data/ai-stack";

export default function InteractiveDemoShowcase() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "matching" | "copilot"
  >("profile");

  return (
    <section id="preview" className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-sky-wash">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center">
            <StickerBadge color="lavender" pill className="text-xs uppercase tracking-[0.032em]">
              Interactive Product Preview
            </StickerBadge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
            EXPLORE THE FINDER WORKSPACE EXPERIENCE
          </h2>
          <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            See the actual data structures and analytical output produced by
            Finder when evaluating technical candidates.
          </p>
        </div>

        {/* Tab Controls Pill Bar */}
        <div className="flex items-center justify-center max-w-lg mx-auto mb-8 p-1.5 rounded-full bg-paper-white border border-carbon">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold uppercase tracking-[0.03em] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "profile"
                ? "bg-carbon text-paper-white border border-carbon"
                : "text-carbon/80 hover:text-carbon hover:bg-soft-mist"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matching")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold uppercase tracking-[0.03em] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "matching"
                ? "bg-carbon text-paper-white border border-carbon"
                : "text-carbon/80 hover:text-carbon hover:bg-soft-mist"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>2. Match</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold uppercase tracking-[0.03em] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "copilot"
                ? "bg-carbon text-paper-white border border-carbon"
                : "text-carbon/80 hover:text-carbon hover:bg-soft-mist"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>3. Copilot</span>
          </button>
        </div>

        {/* Active Stage Showcase Card */}
        <div className="max-w-4xl mx-auto rounded-[32px] border border-carbon bg-paper-white overflow-hidden">
          {/* Header Metadata Bar */}
          <div className="border-b border-carbon/20 px-6 py-4 bg-soft-mist/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-ember border border-carbon" />
                <div className="w-3 h-3 rounded-full bg-sunburst border border-carbon" />
                <div className="w-3 h-3 rounded-full bg-mint-pop border border-carbon" />
              </div>
              <span className="font-bold text-carbon/70 ml-2">Session:</span>
              <span className="font-extrabold text-carbon">
                Senior_Fullstack_Alex_2026.pdf
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StickerBadge color="white" pill className="text-[10px]">
                Model: {MARKETING_PRIMARY_MODEL}
              </StickerBadge>
              <StickerBadge color="mint" pill className="text-[10px]">
                Status: Complete
              </StickerBadge>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* View 1: Extracted Candidate Profile */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-carbon/20 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl border border-carbon bg-lavender flex items-center justify-center text-carbon font-extrabold text-lg">
                      AR
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-carbon">
                        Alex Rivers
                      </h3>
                      <p className="text-xs text-carbon/80 font-bold flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>
                          Senior Full-Stack Engineer • 6 Years of Experience
                        </span>
                      </p>
                    </div>
                  </div>
                  <StickerBadge color="white" pill className="text-[11px] w-fit">
                    Extracted from PDF
                  </StickerBadge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-carbon/70 mb-2">
                      Professional Summary
                    </h4>
                    <p className="text-xs sm:text-sm text-carbon/85 leading-relaxed font-medium">
                      Senior software engineer with 6+ years specializing in
                      Next.js App Router, strict TypeScript architectures, and
                      high-concurrency PostgreSQL data modeling. Proven track
                      record leading front-end modernization and building
                      resilient cloud API services.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-[20px] border border-carbon bg-sky-wash/30 p-4 space-y-2">
                      <span className="text-[11px] font-bold text-carbon uppercase tracking-wider block">
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
                            className="px-2.5 py-1 rounded-full border border-carbon bg-paper-white text-xs text-carbon font-bold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-carbon bg-sky-wash/30 p-4 space-y-2">
                      <span className="text-[11px] font-bold text-carbon uppercase tracking-wider block">
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
                            className="px-2.5 py-1 rounded-full border border-carbon bg-paper-white text-xs text-carbon/80 font-bold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-carbon bg-mint-pop/25 p-4 space-y-1">
                    <span className="text-[11px] font-bold text-carbon uppercase tracking-wider block">
                      Verified Strengths
                    </span>
                    <p className="text-xs text-carbon/90 leading-relaxed font-medium">
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
              <div className="space-y-6">
                <div className="rounded-[24px] border border-carbon bg-paper-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl border border-carbon bg-sunburst flex items-center justify-center font-extrabold text-carbon">
                        CS
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-extrabold text-carbon">
                            CloudScale Technologies
                          </h3>
                          <StickerBadge color="mint" pill className="text-[10px]">
                            92% Fit Score
                          </StickerBadge>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-carbon/70 bg-soft-mist px-2 py-0.5 rounded-full border border-carbon">
                            Active Remote Job
                          </span>
                        </div>
                        <p className="text-xs text-carbon/80 font-bold mt-1">
                          Senior Full-Stack Engineer • Platform Team
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left">
                      <span className="text-xs font-bold text-carbon block">
                        $140,000 - $165,000
                      </span>
                      <p className="text-[11px] text-carbon/70 font-medium">
                        Full-time • Global Remote
                      </p>
                    </div>
                  </div>

                  {/* Qualitative Rationale */}
                  <div className="rounded-[20px] bg-soft-mist/40 border border-carbon p-4 space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-carbon uppercase tracking-wider block">
                      Qualitative Fit Evaluation
                    </span>
                    <p className="text-carbon/85 leading-relaxed font-medium">
                      Direct alignment on Next.js 16 App Router, TypeScript
                      strict typing, and relational schema optimization. Alex
                      exceeds the required 5+ years of engineering experience
                      and possesses the full-stack architecture background
                      demanded for CloudScale&apos;s developer platform.
                    </p>
                  </div>

                  {/* Skills Delta Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-carbon uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-carbon" />
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
                            className="px-2.5 py-1 rounded-full text-[11px] bg-mint-pop/25 text-carbon border border-carbon font-bold"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-ember uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-ember" />
                        <span>Identified Skill Gaps (2)</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Docker", "Redis"].map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-full text-[11px] bg-ember/15 text-carbon border border-carbon font-bold"
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
              <div className="space-y-4">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-lg rounded-3xl rounded-tr-sm bg-carbon text-paper-white p-4 text-xs font-bold border border-carbon">
                    How should I address the missing Docker and Redis skills
                    during my interview with CloudScale?
                  </div>
                </div>

                {/* Copilot Response */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full border border-carbon bg-paper-white flex items-center justify-center text-carbon shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-carbon" />
                  </div>
                  <div className="max-w-2xl space-y-3 rounded-3xl rounded-tl-sm bg-sky-wash/40 border border-carbon p-5 text-xs leading-relaxed">
                    <p className="text-carbon font-bold">
                      Here is a strategic approach to frame your experience
                      positively:
                    </p>
                    <ol className="list-decimal pl-4 space-y-2 text-carbon/85 font-medium">
                      <li>
                        <strong className="text-carbon">
                          Compensate for Redis:
                        </strong>{" "}
                        Emphasize your deep PostgreSQL indexing, query
                        optimization, and memory cache tuning. Mention that
                        while you haven&apos;t run standalone Redis in
                        production, you understand in-memory key-value eviction
                        and cache-aside patterns.
                      </li>
                      <li>
                        <strong className="text-carbon">
                          Containerization Bridge:
                        </strong>{" "}
                        Highlight your Next.js standalone container deployment
                        experience. You know how multi-stage Docker builds
                        operate even if orchestration was managed by DevOps.
                      </li>
                    </ol>
                    <div className="pt-2 border-t border-carbon/20 flex items-center justify-between text-[11px] text-carbon font-bold">
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
