import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ResumeProcessingRepository,
  mapDbRowToResumeProcessing,
} from "@/features/ai-analysis/repositories/resume-processing.repository";

const TEST_RESUME_ID = "resume-0000-0000-0000-000000000001";
const TEST_PROFILE_ID = "profile-0000-0000-0000-000000000001";

const baseRow = {
  resume_id: TEST_RESUME_ID,
  profile_id: TEST_PROFILE_ID,
  stage: "classifying",
  document_type: "resume",
  is_resume: true,
  classification_confidence: "0.930",
  classification_reason: "Contains work history and skills",
  heuristic_score: "0.810",
  decision: "accepted",
  overridden_by_user: false,
  error_code: null,
  error_message: null,
  raw_content_deleted_at: null,
  created_at: "2026-10-04T00:00:00.000Z",
  updated_at: "2026-10-04T00:00:05.000Z",
};

describe("ResumeProcessingRepository", () => {
  let mockRow: any;
  let maybeSingle: ReturnType<typeof vi.fn>;
  let upsert: ReturnType<typeof vi.fn>;
  let repository: ResumeProcessingRepository;

  beforeEach(() => {
    mockRow = { ...baseRow };
    maybeSingle = vi.fn(async () => ({ data: mockRow, error: null }));
    upsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: mockRow, error: null })),
      })),
    }));

    const client: any = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        })),
        upsert,
      })),
    };

    repository = new ResumeProcessingRepository(client);
  });

  it("should map a database row to the domain model", () => {
    const entity = mapDbRowToResumeProcessing(baseRow as any);
    expect(entity.resumeId).toBe(TEST_RESUME_ID);
    expect(entity.stage).toBe("classifying");
    expect(entity.classificationConfidence).toBeCloseTo(0.93);
    expect(entity.heuristicScore).toBeCloseTo(0.81);
    expect(entity.decision).toBe("accepted");
    expect(entity.overriddenByUser).toBe(false);
  });

  it("should return null when no processing row exists", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const result = await repository.getByResumeId(
      TEST_RESUME_ID,
      TEST_PROFILE_ID,
    );
    expect(result).toBeNull();
  });

  it("should return the existing state without upserting on ensureState", async () => {
    const result = await repository.ensureState(TEST_RESUME_ID, TEST_PROFILE_ID);
    expect(result?.stage).toBe("classifying");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("should create a 'received' state when none exists", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockRow = { ...baseRow, stage: "received" };

    const result = await repository.ensureState(TEST_RESUME_ID, TEST_PROFILE_ID);

    expect(result.stage).toBe("received");
    expect(upsert).toHaveBeenCalledTimes(1);
    const [payload, options] = upsert.mock.calls[0];
    expect(payload.resume_id).toBe(TEST_RESUME_ID);
    expect(payload.profile_id).toBe(TEST_PROFILE_ID);
    expect(payload.stage).toBe("received");
    expect(options).toEqual({ onConflict: "resume_id" });
  });

  it("should write snake_case patch fields on updateStage", async () => {
    await repository.updateStage(
      TEST_RESUME_ID,
      TEST_PROFILE_ID,
      "rejected",
      {
        documentType: "invoice",
        isResume: false,
        classificationConfidence: 0.12,
        classificationReason: "No work history found",
        decision: "rejected",
      },
    );

    expect(upsert).toHaveBeenCalledTimes(1);
    const [payload] = upsert.mock.calls[0];
    expect(payload.stage).toBe("rejected");
    expect(payload.document_type).toBe("invoice");
    expect(payload.is_resume).toBe(false);
    expect(payload.classification_confidence).toBe(0.12);
    expect(payload.classification_reason).toBe("No work history found");
    expect(payload.decision).toBe("rejected");
    expect(typeof payload.updated_at).toBe("string");
  });
});
