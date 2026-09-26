import React from "react";
import { Award, Briefcase, TrendingUp } from "lucide-react";

interface JobSummaryProps {
  stats: {
    count: number;
    totalCount?: number;
    highest: number | null;
    average: number | null;
  };
}

export default function JobSummary({ stats }: JobSummaryProps) {
  const { count, totalCount, highest, average } = stats;
  const isFiltered = totalCount !== undefined && totalCount > count;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div className="border border-border/80 bg-card/60 backdrop-blur-xs rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="p-2.5 bg-secondary/80 rounded-lg text-secondary-foreground border border-border/60">
          <Briefcase className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
            {isFiltered ? "Showing Matches" : "Total Matches"}
          </p>
          <h4 className="text-xl font-bold font-heading text-foreground">
            {count}{" "}
            <span className="text-xs text-muted-foreground font-normal">
              {isFiltered ? `of ${totalCount} Roles` : "Roles"}
            </span>
          </h4>
        </div>
      </div>

      <div className="border border-border/80 bg-card/60 backdrop-blur-xs rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
            Highest Match
          </p>
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-xl font-bold font-heading text-foreground">
              {highest !== null ? `${highest}%` : "—"}
            </h4>
          </div>
        </div>
      </div>

      <div className="border border-border/80 bg-card/60 backdrop-blur-xs rounded-xl p-4 flex items-center gap-3.5 shadow-2xs">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
            Average Match
          </p>
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-xl font-bold font-heading text-foreground">
              {average !== null ? `${average}%` : "—"}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
