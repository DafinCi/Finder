import React from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Hourglass } from "lucide-react";
import { DashboardMetrics } from "../hooks/useDashboard";

interface CareerHeroProps {
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  cooldown?: number;
}

export default function CareerHero({
  metrics,
  onRefresh,
  isRefreshing,
  cooldown = 0,
}: CareerHeroProps) {
  return (
    <div className="border border-border bg-card/50 rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden transition-all duration-200">
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <h2 className="text-[24px] font-heading font-semibold text-foreground">
            Optimal Position:{" "}
            <span className="text-primary">{metrics?.topRole}</span>
          </h2>
          <p className="text-[16px] font-sans text-muted-foreground leading-relaxed max-w-xl">
            AI kami memverifikasi bahwa profil keahlian Anda saat ini sangat
            kompatibel dengan pasar industri untuk peran tersebut.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-sans font-medium text-[14px] rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          >
            Browse Matched Jobs
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onRefresh}
            disabled={isRefreshing || cooldown > 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border bg-secondary/30 text-foreground font-sans font-medium text-[14px] rounded-lg transition-all duration-150 hover:bg-secondary/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center cursor-pointer"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                Re-Analyzing...
              </>
            ) : cooldown > 0 ? (
              <>
                <Hourglass className="w-4 h-4 text-muted-foreground" />
                Wait {cooldown}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Re-Analyze Profile
              </>
            )}
          </button>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-secondary/40 border border-border/80 rounded-lg w-full md:w-48 text-center">
        <span className="text-[14px] font-sans font-medium text-muted-foreground tracking-wide uppercase">
          Career Readiness
        </span>
        <span className="text-[48px] font-heading font-bold text-foreground mt-1 leading-none">
          {metrics?.careerScore || 0}%
        </span>
        <span className="text-[14px] font-sans text-emerald-400 font-medium mt-2">
          Excellent Match
        </span>
      </div>
    </div>
  );
}
