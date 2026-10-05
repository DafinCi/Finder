import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  classifyDocument,
  DocumentClassificationSchema,
} from "@/lib/groq/document-classifier";
import { buildDocumentClassifierUserPrompt } from "@/lib/groq/prompts/document-classifier.prompt";

const { mockGroqCreate } = vi.hoisted(() => ({
  mockGroqCreate: vi.fn(),
}));

vi.mock("@/lib/groq/client", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    groq: {
      chat: {
        completions: {
          create: (...args: any[]) => mockGroqCreate(...args),
        },
      },
    },
  };
});

describe("Document classifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should parse a valid classification response", async () => {
    mockGroqCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              is_resume: true,
              document_type: "resume",
              confidence: 0.94,
              reason: "Contains work history and skills",
            }),
          },
        },
      ],
    });

    const result = await classifyDocument("John Doe resume content");

    expect(result.is_resume).toBe(true);
    expect(result.document_type).toBe("resume");
    expect(result.confidence).toBeCloseTo(0.94);
  });

  it("should preserve a non-resume verdict", async () => {
    mockGroqCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              is_resume: false,
              document_type: "invoice",
              confidence: 0.9,
              reason: "Invoice totals detected",
            }),
          },
        },
      ],
    });

    const result = await classifyDocument("INVOICE total due");
    expect(result.is_resume).toBe(false);
    expect(result.document_type).toBe("invoice");
  });

  it("should throw on malformed JSON", async () => {
    mockGroqCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "not-json" } }],
    });

    await expect(classifyDocument("text")).rejects.toThrow(
      /Document classification failed/,
    );
  });

  it("should apply schema defaults for optional fields", () => {
    const parsed = DocumentClassificationSchema.parse({ is_resume: true });
    expect(parsed.document_type).toBe("other");
    expect(parsed.confidence).toBe(0.5);
    expect(parsed.reason).toBe("");
  });

  it("should wrap the document text in isolation tags", () => {
    const prompt = buildDocumentClassifierUserPrompt("Some document text");
    expect(prompt).toContain("<untrusted_resume_content>");
    expect(prompt).toContain("Some document text");
    expect(prompt).toContain("</untrusted_resume_content>");
  });
});
