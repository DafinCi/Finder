import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";
import StickerBadge from "./StickerBadge";

interface CTASectionProps {
  isAuthenticated?: boolean;
}

export default function CTASection({
  isAuthenticated = false,
}: CTASectionProps) {
  return (
    <section className="py-20 md:py-28 rounded-[32px] sm:rounded-[44px] border border-carbon bg-sky-wash relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center">
          <StickerBadge color="white" pill className="text-xs uppercase tracking-[0.032em]">
            <span>Launch Your Career Intelligence Session</span>
          </StickerBadge>
        </div>

        {/* Sculptural Display Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-carbon leading-[0.88] select-none">
          READY TO GET
          <br />
          <span className="block mt-2 text-carbon">YOUR CAREER UNSTUCK?</span>
        </h2>

        <p className="text-base sm:text-lg text-carbon/85 max-w-xl mx-auto leading-relaxed font-medium pt-2">
          Upload your resume to extract your structured technical profile, discover
          verified job matches, and prepare for interviews with an AI Career Copilot.
        </p>

        {/* Dual Pill CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href={isAuthenticated ? "/c" : "/register"}
            className="w-full sm:w-auto"
          >
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-carbon bg-carbon text-paper-white hover:bg-neutral-800 text-sm font-bold tracking-[0.032em] uppercase transition-colors cursor-pointer"
            >
              <span>{isAuthenticated ? "Open Workspace" : "Get Started Free"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          {!isAuthenticated && (
            <Link href="/login" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-soft-mist text-sm font-bold tracking-[0.032em] uppercase transition-colors cursor-pointer"
              >
                <span>Sign In with Sui / Email</span>
              </button>
            </Link>
          )}
        </div>

        {/* Slush Voltage Violet Web3 SIWS Sticker Card */}
        <div className="pt-6 max-w-md mx-auto">
          <div className="rounded-[24px] border border-carbon bg-voltage-violet text-paper-white p-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl border border-carbon bg-paper-white text-carbon flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">
                  Web3 Native Authentication
                </h3>
                <p className="text-xs text-lavender font-medium mt-0.5">
                  Sign in with Sui (SIWS) or email with zero lock-in
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full border border-carbon bg-paper-white text-carbon text-xs font-bold uppercase tracking-[0.03em] hover:bg-soft-mist shrink-0"
            >
              Connect
            </Link>
          </div>
        </div>

        <div className="pt-4 text-xs text-carbon/75 font-semibold flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-carbon" />
          <span>Free and open source. Your resume remains private to your account.</span>
        </div>
      </div>
    </section>
  );
}
