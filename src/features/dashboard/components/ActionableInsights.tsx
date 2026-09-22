import React from "react";
import Link from "next/link";
import { BrainCircuit, Compass } from "lucide-react";
import { DashboardInsight } from "../hooks/useDashboard";

export default function ActionableInsights({
  insight,
  isLoading,
}: {
  insight: DashboardInsight | null;
  isLoading: boolean;
}) {
  return (
    <div className="border border-border bg-card/50 rounded-[6px] p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border/40">
        <BrainCircuit className="w-5 h-5 text-primary" />
        <h3 className="text-[20px] font-heading font-semibold text-foreground">
          AI Career Advisor Insight
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-secondary rounded-[6px] w-full" />
          <div className="h-4 bg-secondary rounded-[6px] w-5/6" />
          <div className="h-4 bg-secondary rounded-[6px] w-4/6" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 bg-secondary rounded-[6px] w-36" />
            <div className="h-10 bg-secondary rounded-[6px] w-44" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-[16px] font-sans text-muted-foreground leading-relaxed">
            {insight?.insightText}
          </p>

          {insight?.quickActions && insight.quickActions.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {insight.quickActions.map((action) => {
                const isHigh = action.priority === "high";
                const isMedium = action.priority === "medium";

                return (
                  <Link
                    key={action.id}
                    href={action.path}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-[14px] font-sans font-medium rounded-[6px] transition-all duration-150 active:scale-[0.98] ${
                      isHigh
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : isMedium
                          ? "border border-border bg-secondary/30 text-foreground hover:bg-secondary/60"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    }`}
                  >
                    <Compass className="w-4 h-4 shrink-0" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
