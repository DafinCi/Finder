"use client";

import React from "react";

export default function ProfessionalSummary({ summary }: { summary?: string }) {
  if (!summary) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-[20px] font-semibold font-heading text-foreground">
        Executive Summary
      </h3>
      <div className="border border-border bg-card/50 rounded-[6px] p-6">
        <p className="text-[16px] leading-relaxed text-muted-foreground font-sans">
          {summary}
        </p>
      </div>
    </section>
  );
}
