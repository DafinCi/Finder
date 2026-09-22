import React from "react";
import { Award, Briefcase, TrendingUp } from "lucide-react";

interface JobSummaryProps {
  stats: {
    count: number;
    highest: number;
    average: number;
  };
}

export default function JobSummary({ stats }: JobSummaryProps) {
  const { count, highest, average } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="border border-border bg-card/50 rounded-[6px] p-4 flex items-center gap-4">
        <div className="p-3 bg-secondary rounded-[6px] text-secondary-foreground border border-border">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground uppercase font-medium tracking-wider">
            Total Matches
          </p>
          <h4 className="text-[24px] font-semibold font-heading text-foreground">
            {count}{" "}
            <span className="text-[14px] text-muted-foreground font-normal">
              Roles
            </span>
          </h4>
        </div>
      </div>

      <div className="border border-border bg-card/50 rounded-[6px] p-4 flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-[6px] text-emerald-500 border border-emerald-500/10">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground uppercase font-medium tracking-wider">
            Highest Match
          </p>
          <h4 className="text-[24px] font-semibold font-heading text-foreground">
            {highest}%
          </h4>
        </div>
      </div>

      <div className="border border-border bg-card/50 rounded-[6px] p-4 flex items-center gap-4">
        <div className="p-3 bg-teal-500/10 rounded-[6px] text-teal-500 border border-teal-500/10">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[12px] text-muted-foreground uppercase font-medium tracking-wider">
            Average Match
          </p>
          <h4 className="text-[24px] font-semibold font-heading text-foreground">
            {average}%
          </h4>
        </div>
      </div>
    </div>
  );
}
