// ==============================================================================
// DOMAIN TYPES: Feedback & Telemetry
// Module: @/features/feedback/types/feedback.types
// ==============================================================================

export type FeedbackEventType =
  | "save"
  | "unsave"
  | "reject"
  | "external_apply_clicked"
  | "interview";

export type FeedbackReason =
  | "too_senior"
  | "too_junior"
  | "tech_mismatch"
  | "location_work_mode"
  | "salary"
  | "company"
  | "role_mismatch"
  | "employment_type"
  | "not_interested"
  | "other";

export interface JobFeedbackEvent {
  id: string;
  profileId: string;
  jobId: string;
  eventType: FeedbackEventType;
  reason?: FeedbackReason | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SavedJob {
  id: string;
  profileId: string;
  jobId: string;
  notes?: string | null;
  createdAt: string;
}

export type InteractionType = "impression" | "card_click" | "drawer_view";

export interface JobInteractionTelemetry {
  id: string;
  profileId: string;
  jobId: string;
  interactionType: InteractionType;
  durationMs?: number | null;
  createdAt: string;
}
