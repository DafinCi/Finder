"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/common/GithubIcon";

interface MarketingNavbarProps {
  isAuthenticated?: boolean;
}

export default function MarketingNavbar({
  isAuthenticated = false,
}: MarketingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "THE PROBLEM", href: "#problem" },
    { label: "HOW IT WORKS", href: "#how-it-works" },
    { label: "CAPABILITIES", href: "#features" },
    { label: "PREVIEW", href: "#preview" },
    { label: "ARCHITECTURE", href: "#architecture" },
  ];

  return (
    <div className="w-full relative z-20 pb-8 sm:pb-12 md:pb-16">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-carbon focus:text-paper-white focus:rounded-full focus:border focus:border-carbon focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>

      {/* In-Hero Slush Floating Navigation Bar */}
      <div className="flex items-center justify-between">
        {/* Brand Logo Circle Button */}
        <Link
          href="/"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-carbon bg-paper-white flex items-center justify-center shrink-0 hover:bg-soft-mist transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon"
          aria-label="Finder Home"
        >
          <Image
            src="/brand/finder-logo.png"
            alt="Finder logo"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation Links (Individual White Pill Buttons matching Slush) */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-1.5 xl:gap-2"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 xl:px-4 py-2 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* GitHub Icon Circle */}
          <a
            href="https://github.com/DafinCi/Finder"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist flex items-center justify-center transition-colors"
            title="View source on GitHub"
          >
            <GithubIcon className="w-4 h-4" />
          </a>

          {/* Launch App / Workspace Action Pill */}
          <Link
            href={isAuthenticated ? "/c" : "/register"}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-carbon bg-carbon text-paper-white hover:bg-neutral-800 text-xs font-extrabold tracking-wider uppercase transition-colors"
          >
            <span>{isAuthenticated ? "WORKSPACE" : "LAUNCH APP"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>

        {/* Mobile Action & Menu Trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href={isAuthenticated ? "/c" : "/register"}
            className="px-4 py-2 rounded-full border border-carbon bg-carbon text-paper-white hover:bg-neutral-800 text-xs font-extrabold tracking-wider uppercase transition-colors"
          >
            {isAuthenticated ? "WORKSPACE" : "LAUNCH APP"}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="w-10 h-10 rounded-full border border-carbon bg-paper-white flex items-center justify-center text-carbon hover:bg-soft-mist transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Card */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 border border-carbon rounded-[28px] bg-paper-white p-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider text-carbon hover:bg-soft-mist transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-carbon/20 flex flex-col gap-2">
            <a
              href="https://github.com/DafinCi/Finder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 rounded-full border border-carbon bg-paper-white text-xs font-bold text-carbon hover:bg-soft-mist"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View Source on GitHub</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
