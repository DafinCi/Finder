"use client";

import React from "react";
import { Sparkles, Briefcase, Code, HelpCircle } from "lucide-react";

interface ChatActionPillsProps {
  onSelectPrompt: (promptText: string) => void;
}

const suggestions = [
  {
    icon: Sparkles,
    label: "Analyze CV & Match Jobs",
    prompt:
      "Please analyze my uploaded resume and match it against top technical positions.",
  },
  {
    icon: Code,
    label: "Audit Tech Stack & Skill Gap",
    prompt:
      "Perform a detailed audit of my tech stack and identify high-priority skills to improve.",
  },
  {
    icon: Briefcase,
    label: "High-Compensation Career Paths",
    prompt:
      "Recommend relevant high-yield career paths and roles aligned with my background.",
  },
  {
    icon: HelpCircle,
    label: "Simulate Technical Interview",
    prompt:
      "Simulate a technical recruiter screening with 3 deep-dive questions based on my experience.",
  },
];

export default function ChatActionPills({
  onSelectPrompt,
}: ChatActionPillsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
      {suggestions.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-card/60 hover:bg-secondary/60 hover:border-border text-left transition-all duration-150 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <div className="p-2 rounded-md bg-secondary text-primary border border-border/60 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {item.label}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {item.prompt}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
