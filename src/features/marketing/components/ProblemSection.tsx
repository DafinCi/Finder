import React from "react";
import {
  SearchX,
  EyeOff,
  FileQuestion,
  LockKeyhole,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

export default function ProblemSection() {
  const problems = [
    {
      icon: SearchX,
      title: "Keyword Roulette",
      traditional:
        "Rigid keyword filters reject you if your CV says 'Postgres' instead of 'PostgreSQL', completely ignoring transferable technical depth.",
      finder:
        "Structured semantic extraction understands core vs. supporting skills, actual years of experience, and role seniority.",
    },
    {
      icon: EyeOff,
      title: "Black Box Applications",
      traditional:
        "You submit 50+ applications with zero feedback on whether you were a 40% match or an 85% match, or what skill was actually missing.",
      finder:
        "Transparent match scoring delivers an explicit fit percentage, detailed alignment rationale, and the exact missing skill gaps.",
    },
    {
      icon: FileQuestion,
      title: "Static Text Walls",
      traditional:
        "Job descriptions are static text walls that leave you guessing how to position your projects or prepare for the interview.",
      finder:
        "A real-time AI Career Copilot simulates interview questions, explains requirements, and helps address your specific gaps.",
    },
  ];

  return (
    <section id="problem" className="py-20 md:py-28 border-b border-border/40 bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            The Industry Problem
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
            Traditional job boards are transactional. Finder is advisory.
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Most job sites treat you as an application counter to maximize recruiter views. Finder acts as your personal technical career strategist.
          </p>
        </div>

        {/* 3 Column Problem Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border/80 bg-card/60 p-6 flex flex-col justify-between space-y-5 hover:border-border transition-colors"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary text-foreground flex items-center justify-center border border-border">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h4 className="text-base font-semibold font-heading text-foreground">
                    {item.title}
                  </h4>

                  {/* Traditional Pain Point */}
                  <div className="space-y-1.5 rounded-lg bg-destructive/5 border border-destructive/15 p-3 text-xs">
                    <div className="flex items-center gap-1.5 text-destructive font-semibold">
                      <X className="w-3.5 h-3.5" />
                      <span>Traditional Job Portals</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.traditional}
                    </p>
                  </div>

                  {/* Finder Solution */}
                  <div className="space-y-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>The Finder Approach</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.finder}
                    </p>
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
