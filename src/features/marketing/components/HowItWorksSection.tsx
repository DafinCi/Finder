import React from "react";
import {
  UploadCloud,
  Cpu,
  GitCompare,
  MessagesSquare,
  CheckCircle2,
} from "lucide-react";
import StickerBadge from "./StickerBadge";
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
      tagColor: "sunburst" as const,
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
        "Database lineage tracking",
      ],
      tagColor: "voltage" as const,
    },
    {
      number: "03",
      icon: GitCompare,
      title: "Two-Stage Matching Engine",
      description:
        "Deterministic SQL array overlap pre-filters active tech roles with weighted pre-ranking (Core 2.0x, Supporting 1.2x), followed by deterministic re-scoring so rankings stay grounded.",
      specs: [
        "SQL array overlap filter",
        "Weighted core (2.0x) scoring",
        "Zero-downtime resilience",
      ],
      tagColor: "mint" as const,
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
      tagColor: "ember" as const,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-concrete-gray"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center">
            <StickerBadge color="voltage" pill className="text-xs uppercase tracking-[0.032em]">
              System Pipeline
            </StickerBadge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
            A RESILIENT, FOUR-STEP CAREER INTELLIGENCE PIPELINE
          </h2>
          <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
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
                className="rounded-[24px] border border-carbon bg-paper-white p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-carbon">
                      {step.number}
                    </span>
                    <div className="w-11 h-11 rounded-2xl border border-carbon bg-soft-mist flex items-center justify-center text-carbon">
                      <Icon className="w-5 h-5 text-carbon" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-carbon">
                      {step.title}
                    </h3>
                    <p className="text-xs text-carbon/80 leading-relaxed font-medium">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Technical Specs List */}
                <div className="pt-4 border-t border-carbon/20 space-y-2">
                  {step.specs.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 text-[11px] text-carbon font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-carbon shrink-0" />
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
