import React from "react";

export default function MatchBadge({ score }: { score: number }) {
  let text = "Potential Match";
  let colorClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";

  if (score >= 90) {
    text = "Excellent Match";
    colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  } else if (score >= 75) {
    text = "Strong Match";
    colorClass = "bg-teal-500/10 text-teal-500 border-teal-500/20";
  } else if (score >= 60) {
    text = "Good Match";
    colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-semibold ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {text} • {score}%
    </span>
  );
}
