import React from "react";
import { SearchX, EyeOff, FileQuestion, Check, X } from "lucide-react";
import StickerBadge from "./StickerBadge";

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
    <section
      id="problem"
      className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-paper-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center">
            <StickerBadge color="ember" pill className="text-xs uppercase tracking-[0.032em]">
              The Industry Problem
            </StickerBadge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon leading-[0.95]">
            TRADITIONAL JOB BOARDS ARE TRANSACTIONAL. FINDER IS ADVISORY.
          </h2>
          <p className="text-base sm:text-lg text-carbon/80 font-medium leading-relaxed max-w-2xl mx-auto pt-1">
            Most job sites treat you as an application counter to maximize
            recruiter views. Finder acts as your personal technical career
            strategist.
          </p>
        </div>

        {/* 3 Column Problem Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-[24px] border border-carbon bg-paper-white p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl border border-carbon bg-sky-wash flex items-center justify-center text-carbon">
                    <Icon className="w-6 h-6 text-carbon" />
                  </div>
                  <h3 className="text-lg font-bold text-carbon">
                    {item.title}
                  </h3>

                  {/* Traditional Pain Point */}
                  <div className="space-y-1.5 rounded-2xl border border-carbon bg-ember/10 p-4 text-xs">
                    <div className="flex items-center gap-1.5 text-ember font-bold">
                      <X className="w-4 h-4 shrink-0" />
                      <span>Traditional Job Portals</span>
                    </div>
                    <p className="text-carbon/80 leading-relaxed font-medium">
                      {item.traditional}
                    </p>
                  </div>

                  {/* Finder Solution */}
                  <div className="space-y-1.5 rounded-2xl border border-carbon bg-mint-pop/25 p-4 text-xs">
                    <div className="flex items-center gap-1.5 text-carbon font-bold">
                      <Check className="w-4 h-4 text-carbon shrink-0" />
                      <span>The Finder Approach</span>
                    </div>
                    <p className="text-carbon/90 leading-relaxed font-medium">
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
