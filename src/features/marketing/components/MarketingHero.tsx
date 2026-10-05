"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Brain,
  Bot,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketingHeroProps {
  isAuthenticated?: boolean;
}

export default function MarketingHero({
  isAuthenticated = false,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/40">
      {/* Background radial gradient accent */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold tracking-wide">
            <span>Open Source AI Career Intelligence Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-foreground tracking-tight leading-[1.12]">
            Stop applying blind. Turn your resume into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-purple-400">
              career intelligence
            </span>
          </h1>

          {/* Concise Value Proposition */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-sans">
            Finder extracts structured technical competencies from your CV, runs
            a resilient two-stage matching engine across active tech roles, and
            prepares you for interviews with a real-time AI Career Copilot.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={isAuthenticated ? "/c" : "/register"}
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 font-semibold px-6 shadow-md hover:shadow-primary/20"
              >
                <span>
                  {isAuthenticated
                    ? "Open Your Workspace"
                    : "Analyze Your CV Free"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/jobs" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 font-medium"
              >
                <span>Explore Live Jobs</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Open Source (MIT)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private storage (Row Level Security)</span>
            </span>
          </div>
        </div>

        {/* Hero Product Visual Mockup */}
        <div className="mt-12 md:mt-16 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card/80 p-3 sm:p-5 shadow-2xl backdrop-blur-xs relative overflow-hidden group">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40 border border-green-500/60" />
                </div>
                <span className="text-[11px] font-mono ml-2 text-foreground/80">
                  finder-workspace / cv-analysis-preview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Pipeline Completed (92% Match)</span>
                </span>
              </div>
            </div>

            {/* Simulated Live Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
              {/* Left Column: Extracted Candidate Intelligence Card */}
              <div className="lg:col-span-5 rounded-sm border border-border/70 bg-secondary/30 p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-base">
                      A
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Alex Rivers
                      </h4>
                      <p className="text-xs text-primary font-medium">
                        Senior Full-Stack Engineer • 6 Years
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                    Extracted Profile
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <span className="text-[11px] uppercase font-semibold text-foreground tracking-wider">
                    Core Technical Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "TypeScript",
                      "Next.js 16",
                      "React 19",
                      "PostgreSQL",
                      "Node.js 22",
                      "Tailwind CSS",
                      "REST/GraphQL",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-card border border-border text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 text-xs space-y-1">
                  <span className="text-[11px] uppercase font-semibold text-foreground tracking-wider">
                    Verified Strengths
                  </span>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    Architectural mastery in Next.js App Router, strict
                    TypeScript type systems, and relational schema optimization.
                  </p>
                </div>
              </div>

              {/* Right Column: Matched Job Card & AI Copilot Response */}
              <div className="lg:col-span-7 space-y-3">
                {/* Matched Job Preview */}
                <div className="rounded-sm border border-border/80 bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          CloudScale Technologies
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          92% Fit Score
                        </span>
                      </div>
                      <h5 className="text-sm font-semibold text-foreground mt-0.5">
                        Senior Full-Stack Engineer (Remote)
                      </h5>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      $130k - $160k
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground font-medium">
                      Why it fits:
                    </strong>{" "}
                    Direct technical alignment with Next.js 16, TypeScript, and
                    PostgreSQL. Candidate exceeds the 5+ years seniority
                    requirement.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="text-muted-foreground font-medium">
                      Missing Skills:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/25 font-mono">
                      Docker
                    </span>
                    <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/25 font-mono">
                      Redis
                    </span>
                  </div>
                </div>

                {/* Copilot Chat Bubble Preview */}
                <div className="rounded-sm border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                  <div className="p-1.5 rounded-sm bg-primary/20 text-primary shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground font-heading">
                        Career Copilot
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        SSE Token Stream
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      &quot;Alex, for the CloudScale role, emphasize your
                      high-throughput PostgreSQL indexing experience to
                      compensate for missing Redis. Would you like me to
                      simulate a 3-question interview on caching
                      strategies?&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
