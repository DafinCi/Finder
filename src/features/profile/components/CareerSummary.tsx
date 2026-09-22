import React from "react";
import { Sparkles } from "lucide-react";

interface CareerSummaryProps {
  summary?: string;
}

export default function CareerSummary({ summary }: CareerSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Title & Trust Badge */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="text-[24px] font-heading font-semibold text-foreground">
          Professional Summary
        </h2>
        <span className="flex items-center gap-1.5 text-primary text-[12px] font-sans font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          AI Synthesized
        </span>
      </div>

      {/* Main Paragraph */}
      <p className="text-[16px] font-sans text-muted-foreground leading-relaxed">
        {summary ||
          "Deskripsi profil profesional Anda sedang dipersiapkan oleh AI berdasarkan data resume terakhir."}
      </p>
    </div>
  );
}
