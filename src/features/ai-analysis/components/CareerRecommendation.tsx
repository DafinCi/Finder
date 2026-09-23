"use client";

import React from "react";
import { ArrowRight, Target } from "lucide-react";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CareerRecommendation({
  jobMatches,
}: {
  jobMatches?: any[];
}) {
  const router = useRouter();
  if (!jobMatches || jobMatches.length === 0) return null;

  const predictedRoles = jobMatches
    .map((match) => match.jobs?.title)
    .filter(Boolean);
  const uniqueRoles = [...new Set(predictedRoles)].slice(0, 3);

  return (
    <section className="mt-8">
      <div className="border border-border bg-card/50 rounded-[6px] overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4 text-foreground">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-[20px] font-semibold font-heading">
              Recommended Trajectories
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {uniqueRoles.map((role, idx) => (
              <div
                key={idx}
                className="px-4 py-2.5 rounded-[6px] bg-secondary/50 border border-border text-[14px] font-medium text-foreground"
              >
                {role}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-[16px] font-semibold font-heading text-foreground">
              {jobMatches.length} Highly Matched Roles Available
            </h4>
            <p className="text-[14px] text-muted-foreground font-sans mt-0.5">
              AI has found live opportunities aligning with your strengths.
            </p>
          </div>
          <button
            onClick={() => router.push("/jobs")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 w-full sm:w-auto rounded-[6px] bg-primary text-primary-foreground font-medium text-[14px] hover:opacity-90 transition-opacity duration-200 cursor-pointer"
          >
            Review Opportunities
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
