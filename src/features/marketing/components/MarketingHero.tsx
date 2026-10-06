"use client";

import React from "react";
import Link from "next/link";
import MarketingNavbar from "./MarketingNavbar";

interface MarketingHeroProps {
  isAuthenticated?: boolean;
}

export default function MarketingHero({
  isAuthenticated = false,
}: MarketingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-4 pb-16 md:pt-6 md:pb-24 px-4 sm:px-6 lg:px-8 rounded-[32px] sm:rounded-[44px] border border-carbon bg-sky-wash">
      {/* Hand-drawn Doodle Silhouette Background (Same iconic pattern as Chat page) */}
      <div
        className="absolute inset-0 pointer-events-none hero-doodle-wallpaper z-0"
        aria-hidden="true"
      />

      {/* In-Hero Navbar sitting inside the top of the Hero card */}
      <MarketingNavbar isAuthenticated={isAuthenticated} />

      {/* Centered Sculptural Hero Display (Pure Slush Minimalism) */}
      <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10 py-6 sm:py-12 md:py-16">
        {/* Giant Display Headline matching SLUSH */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[140px] xl:text-[170px] font-extrabold tracking-tighter text-carbon leading-[0.85] select-none font-sans uppercase">
          FINDER
        </h1>

        {/* Subhead matching 'Your money. Unstuck.' */}
        <p className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-carbon">
          Your career. Unstuck.
        </p>

        {/* Dual Pill CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 sm:pt-6">
          <Link
            href={isAuthenticated ? "/c" : "/register"}
            className="w-full sm:w-auto"
          >
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-colors cursor-pointer"
            >
              LAUNCH WEB APP
            </button>
          </Link>

          <Link href="/jobs" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 sm:px-10 py-3.5 sm:py-4 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-colors cursor-pointer"
            >
              EXPLORE JOBS
            </button>
          </Link>
        </div>

        {/* Official Powered by Groq Badge */}
        <div className="pt-6 sm:pt-8 flex items-center justify-center">
          <a
            href="https://groq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-1.5 rounded-full border border-carbon bg-paper-white hover:bg-soft-mist transition-colors"
            title="Powered by Groq"
          >
            <img
              src="https://console.groq.com/powered-by-groq-dark.svg"
              alt="Powered by Groq"
              className="h-6 object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
