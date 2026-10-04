/**
 * Shared resume-processing pipeline contract.
 *
 * The stage values mirror the persisted values in public.resume_processing and
 * must stay in sync with 20261004_phase8_resume_processing.sql.
 */

export const RESUME_PROCESSING_STAGES = [
  "received",
  "text_extracted",
  "heuristic_checked",
  "stored",
  "classifying",
  "classified",
  "extracting",
  "extracted",
  "matching",
  "persisting",
  "awaiting_confirmation",
  "needs_review",
  "completed",
  "rejected",
  "failed",
] as const;

export type ResumeProcessingStage = (typeof RESUME_PROCESSING_STAGES)[number];

export const RESUME_PROCESSING_DECISIONS = [
  "accepted",
  "rejected",
  "overridden",
] as const;

export type ResumeProcessingDecision =
  (typeof RESUME_PROCESSING_DECISIONS)[number];

export interface ResumeProcessing {
  resumeId: string;
  profileId: string;
  stage: ResumeProcessingStage;
  documentType: string | null;
  isResume: boolean | null;
  classificationConfidence: number | null;
  classificationReason: string | null;
  heuristicScore: number | null;
  decision: ResumeProcessingDecision | null;
  overriddenByUser: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  rawContentDeletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ordered stages for the user-facing progress checklist. Review/rejection/error
 * states are outcomes, not sequential steps, so they are excluded here.
 */
export const RESUME_PROCESSING_SEQUENCE: ResumeProcessingStage[] = [
  "received",
  "text_extracted",
  "heuristic_checked",
  "stored",
  "classifying",
  "classified",
  "extracting",
  "extracted",
  "matching",
  "persisting",
  "awaiting_confirmation",
  "completed",
];

export const TERMINAL_RESUME_PROCESSING_STAGES: ResumeProcessingStage[] = [
  "completed",
  "rejected",
  "failed",
];

export function isTerminalResumeProcessingStage(
  stage: ResumeProcessingStage,
): boolean {
  return TERMINAL_RESUME_PROCESSING_STAGES.includes(stage);
}

/**
 * Default user-facing labels. The UI may override wording, but these keep the
 * checklist aligned with the real backend stage names.
 */
export const RESUME_PROCESSING_STAGE_LABELS: Record<
  ResumeProcessingStage,
  string
> = {
  received: "Checking your file",
  text_extracted: "Reading the PDF",
  heuristic_checked: "Checking whether this is a resume",
  stored: "Saving your document",
  classifying: "Verifying the document type",
  classified: "Document verified",
  extracting: "Extracting your profile",
  extracted: "Profile extracted",
  matching: "Finding matching jobs",
  persisting: "Saving results",
  awaiting_confirmation: "Waiting for your confirmation",
  needs_review: "Needs your review",
  completed: "Completed",
  rejected: "Document rejected",
  failed: "Something went wrong",
};
