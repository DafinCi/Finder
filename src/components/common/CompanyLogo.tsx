"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";

export interface CompanyLogoProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CONFIG = {
  sm: {
    container: "w-8 h-8 rounded-md text-xs",
    icon: "w-3.5 h-3.5",
    sizes: "32px",
  },
  md: {
    container: "w-11 h-11 rounded-lg text-sm",
    icon: "w-5 h-5",
    sizes: "44px",
  },
  lg: {
    container: "w-14 h-14 rounded-xl text-lg",
    icon: "w-6 h-6",
    sizes: "56px",
  },
  xl: {
    container: "w-16 h-16 rounded-xl text-xl",
    icon: "w-7 h-7",
    sizes: "64px",
  },
};

export default function CompanyLogo({
  src,
  name,
  size = "md",
  className = "",
}: CompanyLogoProps) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "";
  const isValidSrc = typeof src === "string" && src.trim().length > 0;
  const hasError = errorSrc === src;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden border border-border/80 bg-secondary/50 text-muted-foreground select-none shadow-2xs ${config.container} ${className}`}
      title={name || "Company"}
      aria-label={name || "Company"}
    >
      {isValidSrc && !hasError ? (
        <Image
          src={src}
          alt={name || "Company logo"}
          fill
          unoptimized={true}
          sizes={config.sizes}
          className="object-cover"
          onError={() => setErrorSrc(src)}
          priority={false}
        />
      ) : initial ? (
        <span className="font-bold font-heading text-foreground tracking-tight">
          {initial}
        </span>
      ) : (
        <Building2 className={`${config.icon} text-muted-foreground/70`} />
      )}
    </div>
  );
}
