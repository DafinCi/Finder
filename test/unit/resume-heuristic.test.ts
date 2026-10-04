import { describe, it, expect } from "vitest";
import { scoreResumeHeuristic } from "@/features/ai-analysis/utils/resume-heuristic";

const RESUME_TEXT = `
Budi Santoso
budi@example.com | +62 812 3456 7890
linkedin.com/in/budisantoso

Professional Summary: Frontend Engineer with 6 years of experience.

Work Experience
Senior Frontend Engineer, Acme Corp, 2019 - 2023

Education
University of Indonesia, Computer Science

Skills: React, TypeScript, Node.js
`;

const INVOICE_TEXT = `
INVOICE #12345
Subtotal: 1,000,000
Tax 10%: 100,000
Total: 1,100,000
Bank account number: 1234567890
NPWP: 01.234.567.8-901.000
`;

const NEUTRAL_TEXT =
  "We are excited to share our quarterly product update with the team. This quarter we focused on improving reliability and developer experience across the platform.";

describe("Resume heuristic pre-filter", () => {
  it("should classify a clear resume as likely_resume", () => {
    const result = scoreResumeHeuristic(RESUME_TEXT);
    expect(result.verdict).toBe("likely_resume");
    expect(result.score).toBeGreaterThanOrEqual(0.55);
    expect(result.resumeSignals).toContain("experience");
    expect(result.resumeSignals).toContain("education");
    expect(result.resumeSignals).toContain("skills");
  });

  it("should classify a clear invoice as likely_not_resume", () => {
    const result = scoreResumeHeuristic(INVOICE_TEXT);
    expect(result.verdict).toBe("likely_not_resume");
    expect(result.nonResumeSignals).toContain("invoice");
    expect(result.resumeSignals).toHaveLength(0);
  });

  it("should stay uncertain for neutral prose", () => {
    const result = scoreResumeHeuristic(NEUTRAL_TEXT);
    expect(result.verdict).toBe("uncertain");
  });

  it("should not hard-reject a mixed document that has resume signals", () => {
    const mixed = `Resume\nJohn Doe\nWork Experience\nAcme 2019 - 2023\nInvoice reference: 12345`;
    const result = scoreResumeHeuristic(mixed);
    expect(result.verdict).not.toBe("likely_not_resume");
  });

  it("should flag long numeric-heavy text as likely_not_resume", () => {
    const numericHeavy = "1234567890 ".repeat(30);
    const result = scoreResumeHeuristic(numericHeavy);
    expect(result.verdict).toBe("likely_not_resume");
    expect(result.nonResumeSignals).toContain("lowLetterRatio");
  });

  it("should always return a score within [0, 1]", () => {
    for (const text of [RESUME_TEXT, INVOICE_TEXT, NEUTRAL_TEXT, ""]) {
      const result = scoreResumeHeuristic(text);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    }
  });
});
