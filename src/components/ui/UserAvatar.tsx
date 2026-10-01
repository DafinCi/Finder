"use client";

import React from "react";

export type UserAvatarSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | number;

interface UserAvatarProps {
  name?: string;
  seed?: string;
  size?: UserAvatarSize;
  className?: string;
  "aria-label"?: string;
}

export const USER_AVATAR_PALETTES = [
  {
    name: "violet",
    bg: "bg-[#221D38]",
    border: "border-[#3D3363]",
    userColor: "#8E7CF5",
  },
  {
    name: "mint",
    bg: "bg-[#162920]",
    border: "border-[#264737]",
    userColor: "#3DB87E",
  },
  {
    name: "blue",
    bg: "bg-[#162338]",
    border: "border-[#253D61]",
    userColor: "#4B93E6",
  },
  {
    name: "ember",
    bg: "bg-[#2B1D19]",
    border: "border-[#4A312A]",
    userColor: "#DE6433",
  },
  {
    name: "lavender",
    bg: "bg-[#261C30]",
    border: "border-[#422F55]",
    userColor: "#A87DE8",
  },
  {
    name: "yellow",
    bg: "bg-[#282318]",
    border: "border-[#453A26]",
    userColor: "#CCA033",
  },
];

export function getUserAvatarHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUserAvatarDimensions(size: UserAvatarSize): {
  containerClass: string;
  pixelSize: number;
} {
  if (typeof size === "number") {
    return {
      containerClass: "",
      pixelSize: size,
    };
  }

  switch (size) {
    case "xs":
      return { containerClass: "w-6 h-6", pixelSize: 24 };
    case "sm":
      return { containerClass: "w-8 h-8", pixelSize: 32 };
    case "md":
      return { containerClass: "w-10 h-10", pixelSize: 40 };
    case "lg":
      return { containerClass: "w-14 h-14", pixelSize: 56 };
    case "xl":
      return { containerClass: "w-18 h-18", pixelSize: 72 };
    case "2xl":
      return { containerClass: "w-20 h-20 sm:w-24 sm:h-24", pixelSize: 88 };
    case "3xl":
      return { containerClass: "w-24 h-24 sm:w-28 sm:h-28", pixelSize: 104 };
    default:
      return { containerClass: "w-10 h-10", pixelSize: 40 };
  }
}

export default function UserAvatar({
  name = "Candidate",
  seed,
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: UserAvatarProps) {
  const colorSeed = seed || name;
  const paletteIndex = getUserAvatarHash(colorSeed) % USER_AVATAR_PALETTES.length;
  const palette = USER_AVATAR_PALETTES[paletteIndex];
  const { containerClass, pixelSize } = getUserAvatarDimensions(size);

  const customStyle =
    typeof size === "number"
      ? { width: `${pixelSize}px`, height: `${pixelSize}px` }
      : undefined;

  return (
    <div className="relative inline-flex shrink-0">
      <div
        role="img"
        aria-label={ariaLabel || `${name} avatar`}
        style={customStyle}
        className={`inline-flex items-center justify-center overflow-hidden rounded-full shrink-0 select-none border transition-colors ${palette.bg} ${palette.border} ${containerClass} ${className}`}
      >
        {/* User Bust Illustration (Round Head with Curved Shoulders) */}
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[78%] h-[78%] overflow-visible"
        >
          {/* Round Head */}
          <circle cx="20" cy="14" r="7.5" fill={palette.userColor} />

          {/* Curved Shoulders and Torso */}
          <path
            d="M5 40 C5 26, 11 24, 20 24 C29 24, 35 26, 35 40 Z"
            fill={palette.userColor}
          />
        </svg>
      </div>
    </div>
  );
}
