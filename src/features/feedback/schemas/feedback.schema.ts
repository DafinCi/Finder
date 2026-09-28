// ==============================================================================
// DOMAIN SCHEMAS: Feedback and Telemetry Validation
// Module: @/features/feedback/schemas/feedback.schema
// ==============================================================================

import { z } from "zod";

export const FeedbackEventTypeSchema = z.enum([
  "save",
  "unsave",
  "reject",
  "external_apply_clicked",
  "interview",
]);

export const FeedbackReasonSchema = z.enum([
  "too_senior",
  "too_junior",
  "tech_mismatch",
  "location_work_mode",
  "salary",
  "company",
  "role_mismatch",
  "employment_type",
  "not_interested",
  "other",
]);

export const FeedbackRequestSchema = z.object({
  jobId: z.string().uuid("Invalid jobId format"),
  eventType: FeedbackEventTypeSchema,
  reason: FeedbackReasonSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const InteractionTypeSchema = z.enum([
  "impression",
  "card_click",
  "drawer_view",
]);

export const TelemetryItemSchema = z.object({
  jobId: z.string().uuid("Invalid jobId format"),
  interactionType: InteractionTypeSchema,
  durationMs: z.number().int().nonnegative().optional(),
  timestamp: z.string().datetime().or(z.string()),
});

export const TelemetryBatchRequestSchema = z.object({
  events: z.array(TelemetryItemSchema).min(1).max(50),
});
