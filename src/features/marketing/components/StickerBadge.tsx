import React, { ReactNode } from "react";

export type StickerColor =
  | "mint"
  | "ember"
  | "sunburst"
  | "voltage"
  | "lavender"
  | "white"
  | "blue"
  | "carbon";

interface StickerBadgeProps {
  children: ReactNode;
  color?: StickerColor;
  className?: string;
  rotate?: string;
  icon?: ReactNode;
  pill?: boolean;
}

const COLOR_MAP: Record<StickerColor, string> = {
  mint: "bg-mint-pop text-carbon",
  ember: "bg-ember text-paper-white",
  sunburst: "bg-sunburst text-carbon",
  voltage: "bg-voltage-violet text-paper-white",
  lavender: "bg-lavender text-carbon",
  white: "bg-paper-white text-carbon",
  blue: "bg-electric-blue text-paper-white",
  carbon: "bg-carbon text-paper-white",
};

export default function StickerBadge({
  children,
  color = "white",
  className = "",
  rotate = "",
  icon,
  pill = false,
}: StickerBadgeProps) {
  const colorClasses = COLOR_MAP[color] || COLOR_MAP.white;
  const radiusClass = pill ? "rounded-full" : "rounded-2xl";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold tracking-tight border border-carbon select-none transition-transform duration-150 ${radiusClass} ${colorClasses} ${rotate} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

