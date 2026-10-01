import React from "react";
import {
  CheckCircle2,
  FileCode,
  Shield,
  BookOpen,
  Terminal,
} from "lucide-react";
import { GithubIcon } from "@/components/common/GithubIcon";
import { Button } from "@/components/ui/button";

export default function TrustProofSection() {
  const proofs = [
    {
      icon: Terminal,
      title: "173 Automated Tests Passing",
      description:
        "Every commit and Pull Request is validated across 120 hermetic unit tests and 53 mocked integration tests in GitHub Actions.",
    },
    {
      icon: Shield,
      title: "Zero Data Brokerage",
      description:
        "Your resume PDF is stored exclusively in private, user-isolated Supabase buckets protected by strict PostgreSQL Row Level Security.",
    },
    {
      icon: FileCode,
      title: "Version-Controlled Prompts",
      description:
        "No opaque prompt engineering. Finder's extraction schemas and system prompts (v2.1.0) are open source in the repository.",
    },
    {
      icon: BookOpen,
      title: "Public Specifications",
      description:
        "Full documentation for API endpoints, database schemas, matching formulas, and quality gates available for inspection.",
    },
  ];

  return (
    <section className="py-20 md:py-28 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-card to-card/50 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/80 text-xs font-mono text-muted-foreground">
              <GithubIcon className="w-3.5 h-3.5 text-foreground" />
              <span>Public Open Source Software</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
              Verifiable transparency over marketing claims
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                    className="rounded-sm border border-border/60 bg-secondary/30 p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-semibold font-heading text-foreground">
                        {proof.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {proof.description}
                    </p>
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
              >
                <Button variant="outline" className="gap-2 text-xs font-medium">
                  <GithubIcon className="w-4 h-4" />
                  <span>Inspect Code on GitHub</span>
                </Button>
              </a>

              <a
                href="https://github.com/DafinCi/Finder/blob/develop/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-2 px-3"
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
