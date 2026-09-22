"use client";

import React from "react";
import { useDashboard } from "../hooks/useDashboard";
import DashboardHeader from "../components/DashboardHeader";
import CareerHero from "../components/CareerHero";
import OverviewMetrics from "../components/OverviewMetrics";
import ActionableInsights from "../components/ActionableInsights";
import DashboardOnboarding from "../components/DashboardOnboarding";
import DashboardSkeleton from "../skeletons/DashboardSkeleton";
import { AlertTriangle } from "lucide-react";
import AIProcessingChecklist from "../../ai-analysis/components/AIProcessingChecklist";

export default function DashboardView() {
  const {
    hasResume,
    resumeStatus,
    metrics,
    insight,
    isMetricsLoading,
    isInsightLoading,
    error,
    refresh,
    isRefreshing,
    cooldown,
  } = useDashboard();

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto my-16 border border-border bg-card/50 rounded-lg p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
        <div className="p-2 bg-destructive/10 text-destructive rounded-md">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-[16px] font-heading font-semibold text-foreground">
            System Synchronization Failed
          </h4>
          <p className="text-[13px] font-sans text-muted-foreground leading-relaxed">
            {error ||
              "We encountered an unexpected error fetching your dashboard data."}
          </p>
        </div>
        <button
          onClick={refresh}
          className="w-full px-4 py-2 border border-border bg-secondary hover:bg-secondary/80 text-foreground font-sans font-medium text-[13px] rounded-lg transition-colors duration-150 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isMetricsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {!hasResume && (
        <>
          <DashboardHeader role="Workspace" />
          <DashboardOnboarding onUploadSuccess={refresh} />
        </>
      )}

      {hasResume && resumeStatus === "processing" && (
        <>
          <DashboardHeader role="Analyzing Profile..." />
          <div className="py-12 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <AIProcessingChecklist currentStep="analyzing" />
            <p className="mt-6 text-sm text-muted-foreground font-sans animate-pulse">
              Halaman ini akan otomatis diperbarui saat analisis selesai.
            </p>
          </div>
        </>
      )}

      {hasResume && resumeStatus === "completed" && (
        <>
          <DashboardHeader role={metrics?.topRole} />
          <CareerHero
            metrics={metrics}
            onRefresh={refresh}
            isRefreshing={isRefreshing}
            cooldown={cooldown}
          />
          <OverviewMetrics metrics={metrics} />
          <ActionableInsights insight={insight} isLoading={isInsightLoading} />
        </>
      )}
    </div>
  );
}
