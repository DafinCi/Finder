import { describe, it, expect } from "vitest";
import {
  RESUME_PROCESSING_STAGES,
  RESUME_PROCESSING_DECISIONS,
  RESUME_PROCESSING_SEQUENCE,
  RESUME_PROCESSING_STAGE_LABELS,
  TERMINAL_RESUME_PROCESSING_STAGES,
  isTerminalResumeProcessingStage,
  type ResumeProcessingStage,
} from "@/features/ai-analysis/types/resume-processing.types";

describe("Resume processing pipeline contract", () => {
  it("should define a label for every stage", () => {
    for (const stage of RESUME_PROCESSING_STAGES) {
      expect(RESUME_PROCESSING_STAGE_LABELS[stage]).toBeTruthy();
    }
  });

  it("should only mark completed, rejected, and failed as terminal", () => {
    expect(TERMINAL_RESUME_PROCESSING_STAGES).toEqual([
      "completed",
      "rejected",
      "failed",
    ]);

    for (const stage of RESUME_PROCESSING_STAGES) {
      const isTerminal = TERMINAL_RESUME_PROCESSING_STAGES.includes(stage);
      expect(isTerminalResumeProcessingStage(stage)).toBe(isTerminal);
    }
  });

  it("should keep outcome states out of the linear progress sequence", () => {
    expect(RESUME_PROCESSING_SEQUENCE).toContain("awaiting_confirmation");
    expect(RESUME_PROCESSING_SEQUENCE).not.toContain("needs_review");
    expect(RESUME_PROCESSING_SEQUENCE).not.toContain("rejected");
    expect(RESUME_PROCESSING_SEQUENCE).not.toContain("failed");

    const knownStages = new Set<ResumeProcessingStage>(RESUME_PROCESSING_STAGES);
    for (const stage of RESUME_PROCESSING_SEQUENCE) {
      expect(knownStages.has(stage)).toBe(true);
    }
  });

  it("should expose the three decision outcomes", () => {
    expect(RESUME_PROCESSING_DECISIONS).toEqual([
      "accepted",
      "rejected",
      "overridden",
    ]);
  });
});
