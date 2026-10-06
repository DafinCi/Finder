import React from "react";
import {
  UploadCloud,
  Cpu,
  GitCompare,
  MessagesSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { MARKETING_PRIMARY_MODEL } from "../data/ai-stack";

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: UploadCloud,
      title: "Upload Your Resume (PDF)",
      description:
        "Drag and drop your standard text-based PDF. The system performs cryptographic magic-bytes verification (%PDF-) and extracts raw text in memory without third-party data broker storage.",
      specs: [
        "Magic bytes verification",
        "Private Supabase Storage",
        "User-isolated RLS policy",
      ],
    },
    {
      number: "02",
      icon: Cpu,
      title: "AI Candidate Intelligence",
      description:
        `Groq-accelerated models (${MARKETING_PRIMARY_MODEL}) decompose your resume into normalized skills, Core vs Supporting capabilities, seniority level, and verified strengths.`,
      specs: [
        "Versioned prompt template",
        "Strict Zod schema validation",
        "Lineage tracking in database",
      ],
    },
    {
      number: "03",
      icon: GitCompare,
      title: "Two-Stage Matching Engine",
      description:
        "First, deterministic SQL filters active jobs by skill overlap with weighted pre-ranking. Then, Groq qualitative evaluation scores top matches with automated algorithmic fallback (55 + overlapRatio * 35).",
      specs: [
        "SQL array overlap filter",
        "Weighted core (2.0x) scoring",
        "Zero-downtime resilience fallback",
      ],
    },
    {
      number: "04",
      icon: MessagesSquare,
      title: "Interactive Career Copilot",
      description:
        "Engage with a real-time conversational advisor streaming via Server-Sent Events (SSE). Ask how to address skill gaps, simulate technical interview questions, or optimize your application positioning.",
      specs: [
        "Token-by-token SSE streaming",
        "Pre-grounded with job context",
        "Multi-turn interview practice",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 border-b border-border/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            How Finder Works
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            A resilient, four-step career intelligence pipeline
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Every step is traceable, deterministic where possible, and protected
            by resilient fallbacks to ensure you never encounter broken states.
          </p>
        </div>

        {/* 4 Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="rounded-sm border border-border/80 bg-card/60 p-6 flex flex-col justify-between space-y-6 hover:border-primary/40 transition-all hover:bg-card/90 group"
              >
                <div className="space-y-4">
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-primary/40 group-hover:text-primary transition-colors">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-sm bg-secondary text-foreground flex items-center justify-center border border-border">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold font-heading text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Technical Specs List */}
                <div className="pt-4 border-t border-border/60 space-y-1.5">
                  {step.specs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 text-[11px] text-muted-foreground/80 font-mono"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
