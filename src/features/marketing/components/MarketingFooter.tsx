import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/common/GithubIcon";
import Logo from "@/components/common/Logo";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/60 text-muted-foreground text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo size={28} alt="" />
              <span className="text-base font-heading font-bold text-foreground tracking-tight">
                Finder
              </span>
            </Link>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Open-source AI Career Intelligence Platform &amp; Job Portal.
              Understand your technical career before applying.
            </p>

            <div className="pt-1">
              <a
                href="https://github.com/DafinCi/Finder"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/60 text-foreground hover:bg-secondary text-[11px] font-medium transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-heading">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/c"
                  className="hover:text-foreground transition-colors"
                >
                  Career Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/jobs"
                  className="hover:text-foreground transition-colors"
                >
                  Explore Active Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-foreground transition-colors"
                >
                  Sign In (Email / Sui)
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-foreground transition-colors"
                >
                  Create Free Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-heading">
              Architecture
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/docs/architecture/system-architecture.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>System Architecture</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/docs/architecture/matching-engine.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Matching Engine Specs</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/docs/database/schema-and-rls.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Database Schema &amp; RLS</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/docs/development/setup.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Development Setup</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Open Source & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground font-heading">
              Open Source
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Contributing Guide</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/CODE_OF_CONDUCT.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Code of Conduct</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/SECURITY.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>Security Policy</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DafinCi/Finder/blob/develop/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <span>MIT License</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground/80">
          <p>
            © {new Date().getFullYear()} Finder. Built in public under the MIT
            License.
          </p>
          <p className="font-mono">
            Next.js 16 • Supabase RLS • Groq SDK • Sui Network
          </p>
        </div>
      </div>
    </footer>
  );
}
