import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  isAuthenticated?: boolean;
}

export default function CTASection({
  isAuthenticated = false,
}: CTASectionProps) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-card/40">
      {/* Background radial accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-semibold">
          <span>Start Your Career Session Today</span>
        </div>

        <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-foreground tracking-tight">
          Ready to understand your career before applying?
        </h3>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Upload your resume to extract your structured technical profile, discover verified job matches, and prepare for interviews with an AI Career Copilot.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link href={isAuthenticated ? "/c" : "/register"} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 font-semibold px-8 shadow-md">
              <span>{isAuthenticated ? "Open Workspace" : "Get Started Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {!isAuthenticated && (
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In with Sui / Email
              </Button>
            </Link>
          )}
        </div>

        <div className="pt-2 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Free and open source. Your resume remains private to your account.</span>
        </div>
      </div>
    </section>
  );
}
