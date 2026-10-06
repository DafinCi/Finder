import React from "react";
import {
  FileCode2,
  GitBranch,
  Bot,
  KeyRound,
  RefreshCw,
  LayoutTemplate,
} from "lucide-react";
import StickerBadge, { StickerColor } from "./StickerBadge";

export default function FeatureGridSection() {
  const capabilities: Array<{
    icon: React.ElementType;
    capability: string;
    behavior: string;
    benefit: string;
    tag: string;
    tagColor: StickerColor;
  }> = [
    {
      icon: FileCode2,
      capability: "Structured Profile Extraction",
      behavior:
        "Extracts text directly from PDFs via pdf-parse, verifies magic bytes (%PDF-), and validates against strict Zod schemas to distinguish Core (2.0x) vs Supporting (1.2x) skills.",
      benefit:
        "Instant, highly structured breakdown of your technical market positioning with zero manual data entry.",
      tag: "AI Extraction (v2.7)",
      tagColor: "voltage",
    },
    {
      icon: GitBranch,
      capability: "Two-Stage Matching Engine",
      behavior:
        "Deterministic SQL array overlap pre-filters candidate pools, weighted pre-ranking selects top matches, and deterministic re-scoring locks the ranking.",
      benefit:
        "High-accuracy job recommendations with transparent fit percentages, detailed reasoning, and exact missing skills.",
      tag: "Deterministic SQL",
      tagColor: "mint",
    },
    {
      icon: Bot,
      capability: "Conversational Career Copilot",
      behavior:
        "Streams tokens in real-time via Server-Sent Events (SSE), pre-grounded with candidate strengths and active target role requirements.",
      benefit:
        "Practice mock interview questions, clarify ambiguous requirements, and develop strategies to compensate for missing skills.",
      tag: "SSE Streaming",
      tagColor: "ember",
    },
    {
      icon: KeyRound,
      capability: "Dual Auth: Web2 + Web3 (SIWS)",
      behavior:
        "Supports standard email/password SSR session cookies alongside cryptographic Sign-In with Sui (SIWS) personal message verification.",
      benefit:
        "Connect with a Web3 browser wallet or traditional email with unified identity continuity and zero lock-in.",
      tag: "Sui Ed25519",
      tagColor: "sunburst",
    },
    {
      icon: RefreshCw,
      capability: "Automated External Job Ingestion",
      behavior:
        "Scheduled cron synchronization from Remotive API normalizes remote tech roles with timing-safe constant-time secret authentication.",
      benefit:
        "Direct access to active, fresh software engineering and tech opportunities ready for immediate evaluation.",
      tag: "Live Remotive Feed",
      tagColor: "lavender",
    },
    {
      icon: LayoutTemplate,
      capability: "Accessible Discovery Drawer",
      behavior:
        "WAI-ARIA accessible slide-over sheet featuring focus trapping, keyboard navigation, and responsive filter controls.",
      benefit:
        "Evaluate job specs, match insights, and apply externally without ever losing your place in the workspace.",
      tag: "WAI-ARIA Ready",
      tagColor: "blue",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-paper-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center">
            <StickerBadge color="mint" pill className="text-xs uppercase tracking-[0.032em]">
              Product Capabilities
            </StickerBadge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
            ENGINEERED FOR TECHNICAL PRECISION AND TRANSPARENCY
          </h2>
          <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            Every feature in Finder addresses a concrete failure point of
            traditional recruiting software.
          </p>
        </div>

        {/* 6 Capabilities Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[24px] border border-carbon bg-paper-white p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl border border-carbon bg-soft-mist flex items-center justify-center text-carbon">
                      <Icon className="w-6 h-6 text-carbon" />
                    </div>
                    <StickerBadge color={item.tagColor} pill className="text-[10px]">
                      {item.tag}
                    </StickerBadge>
                  </div>

                  <h3 className="text-base font-extrabold text-carbon">
                    {item.capability}
                  </h3>

                  <div className="space-y-2 text-xs">
                    <p className="text-carbon/85 leading-relaxed font-medium">
                      {item.behavior}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-carbon/20">
                  <p className="text-xs text-carbon font-bold leading-relaxed">
                    <span className="text-carbon/70 uppercase text-[10px] block mb-0.5 tracking-wider">
                      User Benefit
                    </span>
                    {item.benefit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
