"use client";

import React from "react";
import Link from "next/link";
import { useProfile } from "../hooks/useProfile";
import ProfileHero from "../components/ProfileHero";
import ProfileStats from "../components/ProfileStats";
import CareerSummary from "../components/CareerSummary";
import SkillSection from "../components/SkillSection";
import ExperienceSection from "../components/ExperienceSection";
import EducationSection from "../components/EducationSection";
import ResumeCard from "../components/ResumeCard";
import ProfileSkeleton from "../skeletons/ProfileSkeleton";
import { AlertCircle } from "lucide-react";

export default function ProfileView() {
  const { data, isLoading, error, refetch } = useProfile();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-xl mx-auto border border-destructive/20 bg-destructive/5 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 my-12">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <div className="space-y-1">
          <h4 className="text-[18px] font-heading font-semibold text-foreground">
            Gagal Memuat Profil
          </h4>
          <p className="text-[14px] font-sans text-muted-foreground">
            {error || "Data profil tidak ditemukan"}
          </p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-secondary border border-border hover:bg-secondary/80 text-foreground text-[14px] font-sans font-medium rounded-[6px] transition-all"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const { user_data, analysis, resume_data } = data;

  if (!analysis) {
    return (
      <div className="w-full max-w-lg mx-auto text-center space-y-5 py-16">
        <h2 className="text-[28px] font-heading font-bold text-foreground">
          Lengkapi CV Anda Dahulu
        </h2>
        <p className="text-[15px] font-sans text-muted-foreground leading-relaxed">
          Finder membutuhkan dokumen CV Anda untuk dirangkum menggunakan
          kecerdasan buatan (AI) menjadi lembar portofolio profesional instan.
        </p>
        <Link
          href="/resume"
          className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground font-sans font-medium text-[14px] rounded-[6px] hover:opacity-90 transition-all"
        >
          Unggah Resume Sekarang
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 py-10 px-4 md:px-0">
      <ProfileHero userData={user_data} analysis={analysis} />
      <ProfileStats analysis={analysis} />
      <hr className="border-border/60" />
      <CareerSummary summary={analysis.summary} />
      <SkillSection skills={analysis.skills} />
      <ExperienceSection experiences={analysis.experience} />
      <EducationSection education={analysis.education} />
      <hr className="border-border/60" />
      <ResumeCard resumeData={resume_data} />
    </div>
  );
}
