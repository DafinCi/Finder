import React from "react";
import { Briefcase, Layers, AlertCircle } from "lucide-react";
import { DashboardMetrics } from "../hooks/useDashboard";

export default function OverviewMetrics({
  metrics,
}: {
  metrics: DashboardMetrics | null;
}) {
  const cards = [
    {
      title: "Total Matches",
      value: `${metrics?.totalMatches || 0} Jobs`,
      desc: "Pekerjaan aktif di pasar yang sangat cocok dengan kualifikasi Anda saat ini.",
      icon: Briefcase,
    },
    {
      title: "Extracted Skills",
      value: `${metrics?.skillsCount || 0} Skills`,
      desc: "Kemampuan teknis unik yang berhasil diekstraksi AI dari CV Anda.",
      icon: Layers,
    },
    {
      title: "Missing Skill Gaps",
      value: `${metrics?.missingSkillsCount || 0} Gaps`,
      desc: "Kelemahan atau celah keahlian yang membatasi nilai tawar industri Anda.",
      icon: AlertCircle,
      highlight:
        (metrics?.missingSkillsCount || 0) > 0
          ? "text-amber-400"
          : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div
            key={i}
            className="border border-border bg-card/50 rounded-[6px] p-5 flex flex-col justify-between space-y-4 hover:border-muted/50 transition-colors duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-sans font-medium text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <IconComponent className="w-5 h-5 text-muted-foreground/60" />
            </div>

            <div className="space-y-1">
              <div
                className={`text-[24px] font-heading font-semibold tracking-tight ${card.highlight || "text-foreground"}`}
              >
                {card.value}
              </div>
              <p className="text-[14px] font-sans text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
