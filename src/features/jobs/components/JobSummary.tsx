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
    <div>
      {/* Mobile compact summary strip */}
      <div className="sm:hidden border border-border/80 bg-card rounded-sm px-3.5 py-2.5 flex items-center justify-between text-xs text-muted-foreground shadow-2xs">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">
            {count} {isFiltered ? `of ${totalCount} Roles` : "Roles Found"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {highest !== null && (
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slush-mint" />
              <span className="font-medium text-foreground">{highest}%</span>
              <span className="text-[10px] text-muted-foreground uppercase">Top</span>
            </span>
          )}
          {average !== null && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{average}%</span>
              <span className="text-[10px] text-muted-foreground uppercase">Avg</span>
            </span>
          )}
        </div>
      </div>

      {/* Desktop 3-column KPI cards */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3.5">
        <div className="border border-border/80 bg-card rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-secondary/80 rounded-sm text-secondary-foreground border border-border/60">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
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

        <div className="border border-border/80 bg-card rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-slush-mint/10 rounded-sm text-slush-mint border border-slush-mint/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Highest Match
            </p>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold font-heading text-foreground">
                {highest !== null ? `${highest} / 100` : "N/A"}
              </h4>
            </div>
          </div>
        </div>

        <div className="border border-border/80 bg-card rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="p-2.5 bg-secondary/80 rounded-sm text-secondary-foreground border border-border/60">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
              Average Match
            </p>
            <div className="flex items-baseline gap-1.5">
              <h4 className="text-xl font-bold font-heading text-foreground">
                {average !== null ? `${average} / 100` : "N/A"}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
