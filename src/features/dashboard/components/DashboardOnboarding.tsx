"use client";

import React, { useEffect } from "react";
import { FileText, Target, Zap, AlertTriangle } from "lucide-react";
import ResumeDropzone from "../../resume/components/ResumeDropzone";
import { useResumeUpload } from "../../resume/hooks/useResumeUpload";
import AIProcessingChecklist from "../../ai-analysis/components/AIProcessingChecklist";

export default function DashboardOnboarding({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const { step, processResume, errorMsg, resetFlow } = useResumeUpload();

  useEffect(() => {
    if (step === "success") {
      onUploadSuccess();
    }
  }, [step, onUploadSuccess]);

  if (step !== "idle" && step !== "error" && step !== "success") {
    return (
      <div className="w-full border border-border bg-card/50 rounded-lg p-12 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
        <AIProcessingChecklist currentStep={step} />
        <p className="mt-8 text-[14px] text-muted-foreground font-sans animate-pulse">
          Mohon jangan tutup halaman ini, AI sedang merangkai profil Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border border-border bg-card/50 rounded-lg p-8 md:p-12 transition-all duration-300">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-secondary/50 rounded-lg text-foreground">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-[14px] font-semibold text-foreground">
              Smart Parsing
            </h4>
            <p className="text-[13px] text-muted-foreground">
              Ekstraksi data akurat dari PDF.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-secondary/50 rounded-lg text-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-[14px] font-semibold text-foreground">
              Skill Mapping
            </h4>
            <p className="text-[13px] text-muted-foreground">
              Deteksi kompetensi tersembunyi.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-secondary/50 rounded-lg text-foreground">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="text-[14px] font-semibold text-foreground">
              Job Matching
            </h4>
            <p className="text-[13px] text-muted-foreground">
              Pencocokan ke lowongan aktif.
            </p>
          </div>
        </div>

        <div className="pt-4 w-full max-w-lg mx-auto">
          <ResumeDropzone
            onFileUpload={(file) => processResume(file)}
            disabled={step !== "idle" && step !== "error"}
          />

          {errorMsg && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[14px] font-semibold font-heading">
                  Proses Analisis Gagal
                </p>
                <p className="text-[13px] font-sans opacity-90">{errorMsg}</p>
                <button
                  onClick={resetFlow}
                  className="text-[13px] font-medium underline underline-offset-2 hover:opacity-80 pt-1 cursor-pointer"
                >
                  Coba unggah ulang
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
