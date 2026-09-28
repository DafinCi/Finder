import { describe, it, expect } from "vitest";
import {
  FeedbackRequestSchema,
  TelemetryBatchRequestSchema,
} from "@/features/feedback/schemas/feedback.schema";

describe("Unit: Feedback and Telemetry Schemas", () => {
  it("should accept valid save and unsave feedback events", () => {
    const validSave = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "save" as const,
    };
    const parsed = FeedbackRequestSchema.parse(validSave);
    expect(parsed.eventType).toBe("save");

    const validUnsave = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "unsave" as const,
    };
    expect(FeedbackRequestSchema.parse(validUnsave).eventType).toBe("unsave");
  });

  it("should accept reject feedback events with reasons from the rich taxonomy", () => {
    const validReject = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "reject" as const,
      reason: "too_senior" as const,
    };
    const parsed = FeedbackRequestSchema.parse(validReject);
    expect(parsed.reason).toBe("too_senior");
  });

  it("should accept external_apply_clicked with explicit outbound semantics", () => {
    const validApply = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "external_apply_clicked" as const,
      metadata: {
        outboundUrl: "https://boards.greenhouse.io/example",
      },
    };
    const parsed = FeedbackRequestSchema.parse(validApply);
    expect(parsed.eventType).toBe("external_apply_clicked");
  });

  it("should accept self-reported interview milestone events", () => {
    const validInterview = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "interview" as const,
      metadata: {
        source: "user_reported",
        round: "technical_screening",
      },
    };
    const parsed = FeedbackRequestSchema.parse(validInterview);
    expect(parsed.eventType).toBe("interview");
  });

  it("should reject unauthorized feedback event types", () => {
    const invalidEvent = {
      jobId: "11111111-1111-4111-8111-111111111111",
      eventType: "view", // 'view' is passive telemetry, not a deliberate feedback event!
    };
    expect(() => FeedbackRequestSchema.parse(invalidEvent)).toThrow();
  });

  it("should validate quarantined telemetry batches", () => {
    const validBatch = {
      events: [
        {
          jobId: "11111111-1111-4111-8111-111111111111",
          interactionType: "impression" as const,
          timestamp: new Date().toISOString(),
        },
        {
          jobId: "22222222-2222-4222-8222-222222222222",
          interactionType: "drawer_view" as const,
          durationMs: 4500,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const parsed = TelemetryBatchRequestSchema.parse(validBatch);
    expect(parsed.events).toHaveLength(2);
  });
});
