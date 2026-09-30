import React from "react";

interface MatchBadgeProps {
  score: number;
  showScoreOnly?: boolean;
}

export default function MatchBadge({
  score,
  showScoreOnly = false,
}: MatchBadgeProps) {
  let text = "Potential Match";
  let colorClass = "bg-slush-yellow/10 text-slush-yellow border-slush-yellow/25";

  if (score >= 90) {
    text = "Excellent Match";
    colorClass = "bg-slush-mint/10 text-slush-mint border-slush-mint/25";
  } else if (score >= 75) {
    text = "Strong Match";
    colorClass = "bg-primary/15 text-slush-lavender border-primary/30";
  } else if (score >= 60) {
    text = "Good Match";
    colorClass = "bg-slush-blue/10 text-slush-blue border-slush-blue/25";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {showScoreOnly ? `${score} / 100` : `${text} • ${score} / 100`}
    </span>
  );
}
