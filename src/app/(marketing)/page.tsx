import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import MarketingHero from "@/features/marketing/components/MarketingHero";
import ProblemSection from "@/features/marketing/components/ProblemSection";
import HowItWorksSection from "@/features/marketing/components/HowItWorksSection";
import FeatureGridSection from "@/features/marketing/components/FeatureGridSection";
import InteractiveDemoShowcase from "@/features/marketing/components/InteractiveDemoShowcase";
import ArchitectureTransparencySection from "@/features/marketing/components/ArchitectureTransparencySection";
import TrustProofSection from "@/features/marketing/components/TrustProofSection";
import CTASection from "@/features/marketing/components/CTASection";

export const metadata: Metadata = {
  title: "Finder | AI Career Intelligence Platform & Job Matching",
  description:
    "Transform your resume into structured career intelligence. Resilient two-stage job matching, transparent skill gap analysis, and a real-time AI Career Copilot.",
  openGraph: {
    title: "Finder | AI Career Intelligence Platform & Job Matching",
    description:
      "Transform your resume into structured career intelligence. Resilient two-stage job matching, transparent skill gap analysis, and a real-time AI Career Copilot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finder | AI Career Intelligence Platform & Job Matching",
    description:
      "Transform your resume into structured career intelligence. Resilient two-stage job matching, transparent skill gap analysis, and a real-time AI Career Copilot.",
  },
};

export default async function MarketingPage() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    isAuthenticated = false;
  }

  return (
    <>
      <MarketingHero isAuthenticated={isAuthenticated} />
      <ProblemSection />
      <HowItWorksSection />
      <FeatureGridSection />
      <InteractiveDemoShowcase />
      <ArchitectureTransparencySection />
      <TrustProofSection />
      <CTASection isAuthenticated={isAuthenticated} />
    </>
  );
}
