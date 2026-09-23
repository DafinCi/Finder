"use client";

import React from "react";

export default function SkillSection({ skills }: { skills?: string[] }) {
  if (!skills || skills.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-[20px] font-semibold font-heading text-foreground">
        Core Competencies
      </h3>
      <div className="border border-border bg-card/50 rounded-[6px] p-6">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-[6px] border border-border bg-background text-[14px] text-foreground font-medium transition-colors hover:border-muted-foreground/30"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
