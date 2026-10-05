import React, { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/common/Logo";

export const metadata = {
  title: "Career Setup | Finder",
  description:
    "Build your verified Career Profile with deterministic job matching.",
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-background chat-wallpaper text-foreground select-none">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border/80 bg-sidebar/80 backdrop-blur-md shrink-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading font-bold text-foreground tracking-tight hover:opacity-90 transition-opacity"
          >
            <Logo size={24} />
            <span className="text-base font-bold">Finder</span>
          </Link>

          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            Career Onboarding
          </span>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
