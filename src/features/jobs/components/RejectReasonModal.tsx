import React, { useState, useEffect, useRef } from "react";
import { X, ThumbsDown, Check } from "lucide-react";
import { FeedbackReason } from "@/features/feedback/schemas/feedback.schema";

interface RejectReasonModalProps {
  isOpen: boolean;
  jobTitle: string;
  companyName: string;
  onConfirm: (reason?: FeedbackReason) => void;
  onCancel: () => void;
}

const REASON_OPTIONS: { id: FeedbackReason; label: string }[] = [
  { id: "role_mismatch", label: "Role doesn't match my target direction" },
  { id: "tech_mismatch", label: "Tech stack or skill mismatch" },
  { id: "too_senior", label: "Requires more experience (too senior)" },
  { id: "too_junior", label: "Looking for more senior level (too junior)" },
  { id: "location_work_mode", label: "Location or work mode not suitable" },
  { id: "salary", label: "Compensation / salary expectations not aligned" },
  { id: "company", label: "Not interested in this company" },
  { id: "not_interested", label: "General disinterest in this opportunity" },
  { id: "other", label: "Other reason" },
];

export default function RejectReasonModal({
  isOpen,
  jobTitle,
  companyName,
  onConfirm,
  onCancel,
}: RejectReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<FeedbackReason | null>(
    null,
  );
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedReason(null);
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  const handleCancel = () => {
    setSelectedReason(null);
    onCancel();
  };

  const handleConfirm = () => {
    const reason = selectedReason || undefined;
    setSelectedReason(null);
    onConfirm(reason);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slush-ember/10 text-slush-ember border border-slush-ember/20">
              <ThumbsDown className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="reject-modal-title"
                className="text-sm font-bold font-heading text-foreground"
              >
                Not Interested
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                {jobTitle} • {companyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          This job will be excluded from your future recommendations. Help us
          tune your feed by optionally sharing why (optional):
        </p>

        {/* Options list */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {REASON_OPTIONS.map((opt) => {
            const isSelected = selectedReason === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedReason(isSelected ? null : opt.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground font-medium"
                    : "bg-secondary/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3.5 py-2 text-xs rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs rounded-xl bg-slush-ember hover:bg-slush-ember/90 text-white font-medium shadow-xs transition-colors cursor-pointer"
          >
            {selectedReason ? "Submit & Exclude" : "Exclude without reason"}
          </button>
        </div>
      </div>
    </div>
  );
}
