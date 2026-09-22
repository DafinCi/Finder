"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13px] font-sans"
    >
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        Finder
      </Link>
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
