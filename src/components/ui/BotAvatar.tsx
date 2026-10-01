"use client";

import React from "react";

export type BotAvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

interface BotAvatarProps {
  name?: string;
  seed?: string;
  size?: BotAvatarSize;
  className?: string;
  showStatusIndicator?: boolean;
  indicatorStatus?: "online" | "typing" | "offline";
  "aria-label"?: string;
}

const PALETTES = [
  {
    name: "violet",
    bg: "bg-[#221D38]",
    border: "border-[#3D3363]",
    botColor: "#8E7CF5",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
  },
  {
    name: "mint",
    bg: "bg-[#162920]",
    border: "border-[#264737]",
    botColor: "#3DB87E",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
  },
  {
    name: "blue",
    bg: "bg-[#162338]",
    border: "border-[#253D61]",
    botColor: "#4B93E6",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
  },
  {
    name: "ember",
    bg: "bg-[#2B1D19]",
    border: "border-[#4A312A]",
    botColor: "#DE6433",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
  },
  {
    name: "lavender",
    bg: "bg-[#261C30]",
    border: "border-[#422F55]",
    botColor: "#A87DE8",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
  },
  {
    name: "yellow",
    bg: "bg-[#282318]",
    border: "border-[#453A26]",
    botColor: "#CCA033",
    visorColor: "#0B0D10",
    eyeColor: "#FFFFFF",
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
  seed,
  size = "md",
  className = "",
  showStatusIndicator = false,
  indicatorStatus = "online",
  "aria-label": ariaLabel,
}: BotAvatarProps) {
  const colorSeed = seed || name;
  const paletteIndex = getHash(colorSeed) % PALETTES.length;
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
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none border transition-colors ${palette.bg} ${palette.border} ${containerClass} ${className}`}
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
          stroke={palette.botColor}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="20" cy="4" r="1.6" fill={palette.botColor} />

        {/* Ears / Side audio receivers */}
        <rect
          x="7.5"
          y="12.5"
          width="2.5"
          height="6"
          rx="1.25"
          fill={palette.botColor}
        />
        <rect
          x="30"
          y="12.5"
          width="2.5"
          height="6"
          rx="1.25"
          fill={palette.botColor}
        />

        {/* Head Shell */}
        <rect
          x="9.5"
          y="8"
          width="21"
          height="15"
          rx="5"
          fill={palette.botColor}
        />

        {/* Eyes Visor Screen */}
        <rect
          x="12.5"
          y="11.5"
          width="15"
          height="6"
          rx="3"
          fill={palette.visorColor}
        />

        {/* Solid Eye Pupils */}
        <circle cx="16" cy="14.5" r="1.3" fill={palette.eyeColor} />
        <circle cx="24" cy="14.5" r="1.3" fill={palette.eyeColor} />

        {/* Friendly Smile Arc */}
        <path
          d="M17.5 19.5 C18.5 21, 21.5 21, 22.5 19.5"
          stroke={palette.visorColor}
          strokeWidth="1.4"
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
          fill={palette.botColor}
        />

        {/* Half-body Torso / Curved Robotic Shoulders */}
        <path
          d="M7 38 C7 28.5, 12.5 26, 20 26 C27.5 26, 33 28.5, 33 38 Z"
          fill={palette.botColor}
        />

        {/* Chest Core Indicator */}
        <circle cx="20" cy="31" r="1.4" fill={palette.visorColor} />
      </svg>

      {/* Optional Online / Activity Indicator */}
      {showStatusIndicator && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-card ${indicatorSizeClass} ${
            indicatorStatus === "online"
              ? "bg-[#22C55E]"
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
