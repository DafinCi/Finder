import React from "react";
import {
  Layers,
  Database,
  Cpu,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function ArchitectureTransparencySection() {
  const stack = [
    {
      icon: Layers,
      title: "Frontend & Runtime",
      technologies: "Next.js 16 • React 19 • Tailwind CSS 4",
      description:
        "Modern App Router architecture utilizing Server and Client Components, Base UI accessible primitives, and zero heavy render-blocking animation libraries.",
    },
    {
      icon: Cpu,
      title: "AI & LLM Acceleration",
      technologies: "Groq Cloud API • openai/gpt-oss-120b",
      description:
        "Ultra-low latency inference using Groq SDK with automatic secondary fallback (openai/gpt-oss-20b) and deterministic mathematical degradation formulas.",
    },
    {
      icon: Database,
      title: "Persistence & Security",
      technologies: "Supabase PostgreSQL 15+ • 100% RLS",
      description:
        "8 relational tables with strict foreign key constraints, automated auth triggers, and private user-isolated storage buckets for resume PDF documents.",
    },
    {
      icon: Coins,
      title: "Web3 Cryptographic Layer",
      technologies: "Sui Blockchain • SIWS • Ed25519",
      description:
        "Cryptographic Sign-In with Sui (SIWS) personal message verification, in-memory single-use challenge nonces, and synthetic account abstraction.",
    },
  ];

  return (
    <section
      id="architecture"
      className="py-20 md:py-28 border-b border-border/40 bg-card/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            Architecture Transparency
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            Built on proven open-source technologies
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                className="rounded-sm border border-border/80 bg-card/70 p-6 space-y-4 hover:border-border transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-sm bg-secondary text-foreground flex items-center justify-center border border-border shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold font-heading text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-xs font-mono text-primary font-medium">
                      {item.technologies}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Link to Architecture Docs */}
        <div className="mt-10 text-center">
          <a
            href="https://github.com/DafinCi/Finder/tree/develop/docs/architecture"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>Explore full System Architecture & Data Flow diagrams</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
