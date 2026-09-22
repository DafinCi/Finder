import React from "react";
import { FileText, Download } from "lucide-react";

interface ResumeData {
  file_name?: string;
  url?: string;
  uploaded_at?: string;
}

interface ResumeCardProps {
  resumeData?: ResumeData | null;
}

export default function ResumeCard({ resumeData }: ResumeCardProps) {
  if (!resumeData) return null;

  const handleDownload = () => {
    if (resumeData.url && resumeData.url !== "#") {
      window.open(resumeData.url, "_blank");
    } else {
      alert("Tautan berkas resume tidak dapat dibuat.");
    }
  };

  const formattedDate = resumeData.uploaded_at
    ? new Date(resumeData.uploaded_at).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Baru saja";

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-[22px] font-heading font-semibold text-foreground">
          Dokumen Pendukung
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between p-4 border border-border/70 bg-secondary/20 rounded-xl">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-11 h-11 rounded-[6px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-foreground leading-none">
              {resumeData.file_name || "Resume.pdf"}
            </h3>
            <p className="text-[12px] font-sans text-muted-foreground mt-1.5">
              Diunggah pada {formattedDate}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="mt-4 md:mt-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-sans font-semibold text-[13px] rounded-[6px] transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          Unduh Resume PDF
        </button>
      </div>
    </div>
  );
}
