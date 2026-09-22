"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import { UploadStep } from "../hooks/useResumeUpload";

interface ResumeDropzoneProps {
  onFileUpload: (file: File) => void;
  currentStep?: UploadStep;
  disabled?: boolean;
}

export default function ResumeDropzone({
  onFileUpload,
  currentStep = "idle",
  disabled = false,
}: ResumeDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const narrativeMeta: Record<string, { title: string; subtext: string }> = {
    uploading: {
      title: "Reading your resume...",
      subtext: "Preparing data.",
    },
    extracting: {
      title: "Understanding your experience...",
      subtext: "Building your profile.",
    },
    analyzing: {
      title: "Analyzing your skills...",
      subtext: "Finding your strengths.",
    },
    matching: {
      title: "Matching opportunities...",
      subtext: "Comparing with available roles.",
    },
  };

  const isProcessing =
    currentStep !== "idle" &&
    currentStep !== "success" &&
    currentStep !== "error";
  const activeNarrative = isProcessing ? narrativeMeta[currentStep] : null;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isProcessing) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file: File | null) => {
    setError("");
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Format tidak didukung. Harap unggah dokumen PDF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file terlalu besar. Maksimal 5 MB.");
      return;
    }

    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    e.target.value = "";
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && !isProcessing && fileInputRef.current?.click()
        }
        className={`
          relative flex flex-col items-center justify-center w-full min-h-[240px] p-10
          rounded-[6px] transition-all duration-300 ease-in-out
          ${isProcessing ? "border border-border bg-card/15 cursor-wait" : "border border-dashed cursor-pointer"}
          ${disabled && !isProcessing ? "opacity-50 cursor-not-allowed" : ""}
          ${
            isDragging
              ? "border-primary bg-primary/5 shadow-inner"
              : !isProcessing
                ? "border-border bg-card/50 hover:bg-accent/40 hover:border-muted-foreground/40"
                : ""
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf, application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled || isProcessing}
        />

        {isProcessing && activeNarrative ? (
          <div
            key={currentStep}
            className="w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-5 px-4 animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out"
          >
            <span className="text-[12px] font-sans font-medium text-muted-foreground/60 tracking-widest uppercase">
              AI Career Intelligence
            </span>

            <h3 className="text-[17px] font-medium font-sans text-foreground tracking-tight max-w-md">
              {activeNarrative.title}
            </h3>

            <p className="text-[14px] text-muted-foreground/80 font-sans leading-relaxed max-w-xs">
              {activeNarrative.subtext}
            </p>

            <div className="flex items-center justify-center gap-1.5 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:0.4s]"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-bounce"></span>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`p-3 rounded-[6px] mb-4 transition-all duration-200 ease-in-out ${
                isDragging
                  ? "bg-primary/20 text-primary scale-110"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isDragging ? (
                <FileText className="w-6 h-6" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-[16px] font-medium text-foreground mb-1">
              Drag and drop or{" "}
              <span className="text-primary font-medium hover:underline">
                Browse
              </span>
            </h3>
            <p className="text-[14px] text-muted-foreground">
              File PDF only • Maximum 5 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-[14px] text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
