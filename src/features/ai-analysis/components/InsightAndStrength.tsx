"use client";

import React from "react";
import { Check, ArrowUpRight } from "lucide-react";

interface InsightAndStrengthProps {
  strengths?: string[];
  weaknesses?: string[];
}

export default function InsightAndStrength({
  strengths,
  weaknesses,
}: InsightAndStrengthProps) {
  const hasStrengths = strengths && strengths.length > 0;
  const hasWeaknesses = weaknesses && weaknesses.length > 0;

  if (!hasStrengths && !hasWeaknesses) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {hasStrengths && (
        <div className="space-y-3">
          <h3 className="text-[20px] font-semibold font-heading text-foreground">
            Strengths
          </h3>
          <div className="border border-border bg-card/50 rounded-[6px] p-6 h-full">
            <ul className="space-y-4">
              {strengths.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[14px] text-muted-foreground font-sans leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {hasWeaknesses && (
        <div className="space-y-3">
          <h3 className="text-[20px] font-semibold font-heading text-foreground">
            Improvement Areas
          </h3>
          <div className="border border-border bg-card/50 rounded-[6px] p-6 h-full">
            <ul className="space-y-4">
              {weaknesses.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[14px] text-muted-foreground font-sans leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
