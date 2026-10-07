import React from "react";
import { FileCode, Shield, BookOpen, Terminal } from "lucide-react";
import { GithubIcon } from "@/components/common/GithubIcon";
import StickerBadge from "./StickerBadge";

export default function TrustProofSection() {
  const proofs = [
    {
      icon: Terminal,
      title: "476+ Automated Tests Passing",
      description:
        "Hermetic unit tests and mocked integration test suites validate matching formulas, Zod validation, Groq resilience, and Walrus memory.",
      badge: "62 Suites",
    },
    {
      icon: Shield,
      title: "Zero Data Brokerage",
      description:
        "Your resume PDF is stored exclusively in private, user-isolated Supabase buckets protected by strict PostgreSQL Row Level Security.",
      badge: "100% RLS",
    },
    {
      icon: FileCode,
      title: "Version-Controlled Prompts",
      description:
        "No opaque prompt engineering. Finder's extraction schemas and system prompts are version-tracked and open source in the repository.",
      badge: "Prompts v2.7",
    },
    {
      icon: BookOpen,
      title: "Public Specifications",
      description:
        "Full documentation for API endpoints, database schemas, matching formulas, and quality gates available for direct inspection.",
      badge: "Full Specs",
    },
  ];

  return (
    <section className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-paper-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-carbon bg-paper-white p-8 sm:p-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center">
              <StickerBadge
                color="white"
                pill
                className="text-xs uppercase tracking-[0.032em]"
              >
                <span>Public Open Source Software</span>
              </StickerBadge>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
              VERIFIABLE TRANSPARENCY OVER MARKETING CLAIMS
            </h2>

            <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed">
              We do not invent fake testimonials or fabricated user metrics.
              Finder is built in public under the MIT License so you can inspect
              every line of code, run the test suites locally, and audit how
              your data is handled.
            </p>

            {/* Proof Points Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {proofs.map((proof, idx) => {
                const Icon = proof.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-[20px] border border-carbon bg-soft-mist/40 p-5 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-carbon" />
                          <h3 className="text-xs font-extrabold text-carbon uppercase tracking-wider">
                            {proof.title}
                          </h3>
                        </div>
                        <StickerBadge color="white" pill className="text-[9px]">
                          {proof.badge}
                        </StickerBadge>
                      </div>
                      <p className="text-xs text-carbon/80 leading-relaxed font-medium">
                        {proof.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GitHub Call to Action */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/DafinCi/Finder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-xs font-bold uppercase tracking-[0.032em] transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Inspect Code on GitHub</span>
              </a>

              <a
                href="https://github.com/DafinCi/Finder/blob/develop/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold uppercase tracking-[0.032em] text-carbon/70 hover:text-carbon transition-colors py-2 px-3"
              >
                License: MIT
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
