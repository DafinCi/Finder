"use client";

import React from "react";

export type BotAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

interface BotAvatarProps {
  name?: string;
  size?: BotAvatarSize;
  className?: string;
  showStatusIndicator?: boolean;
  indicatorStatus?: "online" | "typing" | "offline";
  "aria-label"?: string;
}

const PALETTES = [
  {
    name: "violet",
    bg: "bg-[#5C4ADE]/15",
    border: "border-[#5C4ADE]/30",
    text: "text-[#5C4ADE]",
    fill: "#5C4ADE",
    headFill: "#5C4ADE",
  },
  {
    name: "mint",
    bg: "bg-[#55DB9C]/15",
    border: "border-[#55DB9C]/30",
    text: "text-[#55DB9C]",
    fill: "#55DB9C",
    headFill: "#55DB9C",
  },
  {
    name: "blue",
    bg: "bg-[#4DA2FF]/15",
    border: "border-[#4DA2FF]/30",
    text: "text-[#4DA2FF]",
    fill: "#4DA2FF",
    headFill: "#4DA2FF",
  },
  {
    name: "ember",
    bg: "bg-[#FB4903]/15",
    border: "border-[#FB4903]/30",
    text: "text-[#FB4903]",
    fill: "#FB4903",
    headFill: "#FB4903",
  },
  {
    name: "lavender",
    bg: "bg-[#E9CCFF]/15",
    border: "border-[#E9CCFF]/30",
    text: "text-[#E9CCFF]",
    fill: "#E9CCFF",
    headFill: "#E9CCFF",
  },
  {
    name: "yellow",
    bg: "bg-[#FFD731]/15",
    border: "border-[#FFD731]/30",
    text: "text-[#FFD731]",
    fill: "#FFD731",
    headFill: "#FFD731",
  },
];

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getSizeDimensions(size: BotAvatarSize): {
  containerClass: string;
  pixelSize: number;
  indicatorSizeClass: string;
} {
  if (typeof size === "number") {
    return {
      containerClass: "",
      pixelSize: size,
      indicatorSizeClass: size > 48 ? "w-3.5 h-3.5" : "w-2.5 h-2.5",
    };
  }

  switch (size) {
    case "xs":
      return {
        containerClass: "w-6 h-6",
        pixelSize: 24,
        indicatorSizeClass: "w-1.5 h-1.5",
      };
    case "sm":
      return {
        containerClass: "w-8 h-8",
        pixelSize: 32,
        indicatorSizeClass: "w-2 h-2",
      };
    case "md":
      return {
        containerClass: "w-10 h-10",
        pixelSize: 40,
        indicatorSizeClass: "w-2.5 h-2.5",
      };
    case "lg":
      return {
        containerClass: "w-14 h-14",
        pixelSize: 56,
        indicatorSizeClass: "w-3 h-3",
      };
    case "xl":
      return {
        containerClass: "w-18 h-18",
        pixelSize: 72,
        indicatorSizeClass: "w-3.5 h-3.5",
      };
    default:
      return {
        containerClass: "w-10 h-10",
        pixelSize: 40,
        indicatorSizeClass: "w-2.5 h-2.5",
      };
  }
}

export default function BotAvatar({
  name = "Finder",
  size = "md",
  className = "",
  showStatusIndicator = false,
  indicatorStatus = "online",
  "aria-label": ariaLabel,
}: BotAvatarProps) {
  const paletteIndex = getHash(name) % PALETTES.length;
  const palette = PALETTES[paletteIndex];
  const { containerClass, pixelSize, indicatorSizeClass } =
    getSizeDimensions(size);

  const customStyle =
    typeof size === "number"
      ? { width: `${pixelSize}px`, height: `${pixelSize}px` }
      : undefined;

  return (
    <div
      role="img"
      aria-label={ariaLabel || `${name} bot avatar`}
      style={customStyle}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none border transition-colors ${palette.bg} ${palette.border} ${palette.text} ${containerClass} ${className}`}
    >
      {/* Bot Bust Illustration (Head with half-body torso) */}
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[78%] h-[78%] overflow-visible"
      >
        {/* Antenna */}
        <line
          x1="20"
          y1="5"
          x2="20"
          y2="8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="20" cy="4" r="1.6" fill="currentColor" />

        {/* Ears / Side audio receivers */}
        <rect
          x="7.5"
          y="12.5"
          width="2.5"
          height="6"
          rx="1.25"
          fill="currentColor"
          opacity="0.85"
        />
        <rect
          x="30"
          y="12.5"
          width="2.5"
          height="6"
          rx="1.25"
          fill="currentColor"
          opacity="0.85"
        />

        {/* Head Shell */}
        <rect
          x="9.5"
          y="8"
          width="21"
          height="15"
          rx="5"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        {/* Eyes Visor Screen */}
        <rect
          x="12.5"
          y="11.5"
          width="15"
          height="6"
          rx="3"
          fill="currentColor"
          fillOpacity="0.4"
        />

        {/* Glowing Eye Pupils */}
        <circle cx="16" cy="14.5" r="1.3" fill="currentColor" />
        <circle cx="24" cy="14.5" r="1.3" fill="currentColor" />

        {/* Friendly Smile Arc */}
        <path
          d="M17.5 19.5 C18.5 21, 21.5 21, 22.5 19.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Neck Connector */}
        <rect
          x="18"
          y="23"
          width="4"
          height="3"
          rx="1"
          fill="currentColor"
          opacity="0.7"
        />

        {/* Half-body Torso / Curved Robotic Shoulders */}
        <path
          d="M7 38 C7 28.5, 12.5 26, 20 26 C27.5 26, 33 28.5, 33 38 Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Chest Core Indicator */}
        <circle cx="20" cy="31" r="1.4" fill="currentColor" />
      </svg>

      {/* Optional Online / Activity Indicator */}
      {showStatusIndicator && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-background ${indicatorSizeClass} ${
            indicatorStatus === "online"
              ? "bg-[#55DB9C]"
              : indicatorStatus === "typing"
                ? "bg-primary animate-pulse"
                : "bg-muted-foreground/50"
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
