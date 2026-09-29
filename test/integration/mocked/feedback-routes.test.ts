import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postFeedback } from "@/app/api/feedback/route";
import { POST as postTelemetry } from "@/app/api/telemetry/route";
import { NextRequest } from "next/server";

const { mockAuthUser, mockFeedbackRepo, mockTelemetryRepo } = vi.hoisted(
  () => ({
    mockAuthUser: vi.fn(),
    mockFeedbackRepo: {
      saveJob: vi.fn(),
      unsaveJob: vi.fn(),
      recordFeedback: vi.fn(),
    },
    mockTelemetryRepo: {
      recordInteraction: vi.fn(),
      recordBatch: vi.fn(),
    },
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthUser,
    },
  })),
}));

vi.mock("@/features/feedback/repositories/feedback.repository", () => ({
  feedbackRepository: mockFeedbackRepo,
}));

vi.mock("@/features/feedback/repositories/telemetry.repository", () => ({
  telemetryRepository: mockTelemetryRepo,
}));

describe("Integration (Mock-Based): Feedback & Telemetry API Routes", () => {
  const sampleUser = {
    id: "b0000000-0000-4000-8000-000000000001",
    email: "candidate@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/feedback", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("No session"),
      });

      const req = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          jobId: "c0000000-0000-4000-8000-000000000001",
          eventType: "save",
        }),
      });
      const res = await postFeedback(req);
      expect(res.status).toBe(401);
    });

    it("should return 422 on invalid jobId format", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });

      const req = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({ jobId: "not-a-uuid", eventType: "save" }),
      });
      const res = await postFeedback(req);
      expect(res.status).toBe(422);
    });

    it("should save job and return 200 when eventType is save", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockFeedbackRepo.saveJob.mockResolvedValueOnce({
        id: "s1",
        profileId: sampleUser.id,
        jobId: "c0000000-0000-4000-8000-000000000001",
      });

      const req = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          jobId: "c0000000-0000-4000-8000-000000000001",
          eventType: "save",
          metadata: { notes: "Great role" },
        }),
      });
      const res = await postFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFeedbackRepo.saveJob).toHaveBeenCalledWith(
        sampleUser.id,
        "c0000000-0000-4000-8000-000000000001",
        "Great role",
      );
    });

    it("should unsave job and return 200 when eventType is unsave", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockFeedbackRepo.unsaveJob.mockResolvedValueOnce(undefined);

      const req = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          jobId: "c0000000-0000-4000-8000-000000000001",
          eventType: "unsave",
        }),
      });
      const res = await postFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.unsaved).toBe(true);
      expect(mockFeedbackRepo.unsaveJob).toHaveBeenCalledWith(
        sampleUser.id,
        "c0000000-0000-4000-8000-000000000001",
      );
    });

    it("should record reject event and return 200", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockFeedbackRepo.recordFeedback.mockResolvedValueOnce({
        id: "f1",
        eventType: "reject",
      });

      const req = new NextRequest("http://localhost:3000/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          jobId: "c0000000-0000-4000-8000-000000000001",
          eventType: "reject",
          reason: "location_work_mode",
        }),
      });
      const res = await postFeedback(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFeedbackRepo.recordFeedback).toHaveBeenCalledWith(
        sampleUser.id,
        "c0000000-0000-4000-8000-000000000001",
        "reject",
        "location_work_mode",
        undefined,
      );
    });
  });

  describe("POST /api/telemetry", () => {
    it("should record batch telemetry events and return count", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockTelemetryRepo.recordBatch.mockResolvedValueOnce(2);

      const req = new NextRequest("http://localhost:3000/api/telemetry", {
        method: "POST",
        body: JSON.stringify({
          events: [
            {
              jobId: "c0000000-0000-4000-8000-000000000001",
              interactionType: "impression",
              timestamp: new Date().toISOString(),
            },
            {
              jobId: "c0000000-0000-4000-8000-000000000002",
              interactionType: "card_click",
              durationMs: 800,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      const res = await postTelemetry(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.count).toBe(2);
    });

    it("should record single telemetry item", async () => {
      mockAuthUser.mockResolvedValueOnce({
        data: { user: sampleUser },
        error: null,
      });
      mockTelemetryRepo.recordInteraction.mockResolvedValueOnce({
        id: "t1",
        interactionType: "drawer_view",
      });

      const req = new NextRequest("http://localhost:3000/api/telemetry", {
        method: "POST",
        body: JSON.stringify({
          jobId: "c0000000-0000-4000-8000-000000000001",
          interactionType: "drawer_view",
          durationMs: 3400,
          timestamp: new Date().toISOString(),
        }),
      });
      const res = await postTelemetry(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.event.id).toBe("t1");
    });
  });
});
