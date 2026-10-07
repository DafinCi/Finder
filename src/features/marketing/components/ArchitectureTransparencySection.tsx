import React from "react";
import {
  Layers,
  Database,
  Cpu,
  Coins,
  ExternalLink,
} from "lucide-react";
import StickerBadge from "./StickerBadge";
import {
  MARKETING_FALLBACK_MODEL,
  MARKETING_PRIMARY_MODEL,
} from "../data/ai-stack";

export default function ArchitectureTransparencySection() {
  const stack = [
    {
      icon: Layers,
      title: "Frontend & Runtime",
      technologies: "Next.js 16 • React 19 • Tailwind CSS 4",
      description:
        "Modern App Router architecture utilizing Server and Client Components, Base UI accessible primitives, and zero heavy render-blocking animation libraries.",
      badge: "App Router",
      badgeColor: "blue" as const,
    },
    {
      icon: Cpu,
      title: "AI & LLM Acceleration",
      technologies: `Groq Cloud API • ${MARKETING_PRIMARY_MODEL}`,
      description:
        `Ultra-low latency LPU inference using Groq SDK with automatic secondary fallback (${MARKETING_FALLBACK_MODEL}) and deterministic mathematical degradation formulas.`,
      badge: "Groq LPU",
      badgeColor: "sunburst" as const,
    },
    {
      icon: Database,
      title: "Persistence & Security",
      technologies: "Supabase PostgreSQL 15+ • 100% RLS",
      description:
        "14 relational tables with strict foreign key constraints, automated auth triggers, and private user-isolated storage buckets for resume PDF documents.",
      badge: "100% RLS",
      badgeColor: "mint" as const,
    },
    {
      icon: Coins,
      title: "Web3 Cryptographic & Memory Layer",
      technologies: "Sui Blockchain • SIWS • Walrus Mainnet",
      description:
        "Cryptographic Sign-In with Sui (SIWS) personal message verification, in-memory single-use challenge nonces, and Walrus Memory decentralized encrypted storage via Seal.",
      badge: "Sui + Walrus",
      badgeColor: "voltage" as const,
    },
  ];

  return (
    <section
      id="architecture"
      className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-concrete-gray"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center">
            <StickerBadge color="voltage" pill className="text-xs uppercase tracking-[0.032em]">
              Architecture Transparency
            </StickerBadge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
            BUILT ON PROVEN OPEN-SOURCE TECHNOLOGIES
          </h2>
          <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            No proprietary black boxes. Finder is transparent about how your
            data is processed, stored, and protected.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {stack.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[24px] border border-carbon bg-paper-white p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl border border-carbon bg-soft-mist flex items-center justify-center text-carbon shrink-0">
                        <Icon className="w-6 h-6 text-carbon" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-carbon">
                          {item.title}
                        </h3>
                        <p className="text-xs font-bold text-carbon/80 mt-0.5">
                          {item.technologies}
                        </p>
                      </div>
                    </div>
                    <StickerBadge color={item.badgeColor} pill className="text-[10px] shrink-0">
                      {item.badge}
                    </StickerBadge>
                  </div>

                  <p className="text-xs text-carbon/85 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                {/* If AI Card, display official Groq Badge */}
                {item.title.includes("AI & LLM") && (
                  <div className="pt-3 border-t border-carbon/20 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-carbon/70 uppercase tracking-wider">
                      Official Partner Engine:
                    </span>
                    <a
                      href="https://groq.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-carbon bg-paper-white hover:bg-soft-mist transition-colors"
                      title="Powered by Groq"
                    >
                      <img
                        src="https://console.groq.com/powered-by-groq-dark.svg"
                        alt="Powered by Groq for fast inference."
                        className="h-5 object-contain"
                      />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to Architecture Docs */}
        <div className="mt-12 text-center">
          <a
            href="https://github.com/DafinCi/Finder/tree/develop/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-xs font-bold uppercase tracking-[0.032em] transition-colors"
          >
            <span>Explore Full Architecture Specifications</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
