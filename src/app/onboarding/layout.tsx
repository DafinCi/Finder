import React, { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Career Setup | Finder V2",
  description:
    "Build your verified Career Profile with deterministic job matching.",
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-heading font-bold text-foreground tracking-tight hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm">Finder</span>
          </Link>

          <div className="text-xs text-muted-foreground font-mono">
            V2 Architecture
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col justify-center py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
