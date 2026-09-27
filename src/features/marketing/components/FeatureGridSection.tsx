import React from "react";
import {
  FileCode2,
  GitBranch,
  Bot,
  KeyRound,
  RefreshCw,
  LayoutTemplate,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function FeatureGridSection() {
  const capabilities = [
    {
      icon: FileCode2,
      capability: "Structured Profile Extraction",
      problem:
        "Manual profile wizards are exhausting, and basic text extractors fail to distinguish core technical skills from passing mentions.",
      behavior:
        "Extracts text directly from PDFs and validates against strict Zod schemas, identifying Core (primary) vs Supporting skills and career seniority.",
      benefit:
        "Instant, highly structured breakdown of your technical market positioning with zero manual data entry.",
      tag: "AI Extraction (v2.1.0)",
    },
    {
      icon: GitBranch,
      capability: "Two-Stage Matching Engine",
      problem:
        "Keyword searches match irrelevant titles, while passing hundreds of jobs to an LLM causes severe rate limits and downtime.",
      behavior:
        "Deterministic SQL array overlap pre-filters candidate pools, weighted pre-ranking selects top 5, and Groq evaluates qualitative fit.",
      benefit:
        "High-accuracy job recommendations with transparent fit percentages, detailed reasoning, and exact missing skills.",
      tag: "Algorithmic + LLM",
    },
    {
      icon: Bot,
      capability: "Conversational Career Copilot",
      problem:
        "Job listings are passive descriptions that don't help you prepare for technical screens or translate your past experience.",
      behavior:
        "Streams tokens in real-time via Server-Sent Events (SSE), pre-grounded with your resume strengths and target role requirements.",
      benefit:
        "Practice mock interview questions, clarify ambiguous requirements, and develop strategies to compensate for missing skills.",
      tag: "SSE Token Streaming",
    },
    {
      icon: KeyRound,
      capability: "Dual Auth: Web2 + Web3 (SIWS)",
      problem:
        "Most platforms force proprietary email accounts, locking out Web3 natives who demand cryptographic identity ownership.",
      behavior:
        "Supports standard email/password SSR cookies alongside cryptographic Sign-In with Sui (SIWS) personal message verification.",
      benefit:
        "Connect with a Web3 browser wallet or traditional email with unified identity continuity and zero lock-in.",
      tag: "Cryptographic SIWS",
    },
    {
      icon: RefreshCw,
      capability: "Automated External Job Ingestion",
      problem:
        "Many job sites display stale, expired listings that waste candidates' time applying to closed openings.",
      behavior:
        "Scheduled cron synchronization from Remotive API normalizes remote tech roles with timing-safe constant-time authentication.",
      benefit:
        "Direct access to active, fresh software engineering and tech opportunities ready for immediate evaluation.",
      tag: "Live Remote Feed",
    },
    {
      icon: LayoutTemplate,
      capability: "Accessible Discovery Drawer",
      problem:
        "Opening dozens of external browser tabs ruins your evaluation workflow and creates visual clutter.",
      behavior:
        "WAI-ARIA accessible slide-over sheet featuring focus trapping, keyboard navigation, and responsive filter controls.",
      benefit:
        "Evaluate job specs, match insights, and apply externally without ever losing your place in the workspace.",
      tag: "WAI-ARIA Accessible",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 md:py-28 border-b border-border/40 bg-card/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Product Capabilities
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            Engineered for technical precision and transparency
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every feature in Finder addresses a concrete failure point of
            traditional recruiting software.
          </p>
        </div>

        {/* 6 Grid Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-card/70 p-6 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all hover:bg-card group"
              >
                <div className="space-y-4">
                  {/* Top Bar: Icon + Tag */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/80 text-muted-foreground border border-border">
                      {item.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-semibold font-heading text-foreground group-hover:text-primary transition-colors">
                    {item.capability}
                  </h4>

                  {/* Problem & Behavior */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
                        The Problem
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.problem}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block mb-0.5">
                        System Behavior
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.behavior}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Benefit */}
                <div className="pt-3 border-t border-border/60">
                  <div className="flex items-start gap-2 text-xs text-foreground bg-secondary/40 p-2.5 rounded-lg border border-border/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">
                      {item.benefit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
