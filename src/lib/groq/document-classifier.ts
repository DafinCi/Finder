import { z } from "zod";
import {
  groq,
  parseAndValidateJson,
  executeWithResilience,
  normalizeGroqError,
} from "./client";
import {
  DOCUMENT_CLASSIFIER_SYSTEM_PROMPT,
  buildDocumentClassifierUserPrompt,
} from "./prompts/document-classifier.prompt";

export const DocumentClassificationSchema = z.object({
  is_resume: z.boolean(),
  document_type: z.string().trim().min(1).max(100).default("other"),
  confidence: z.coerce.number().min(0).max(1).default(0.5),
  reason: z.string().trim().max(300).default(""),
});

export type DocumentClassification = z.infer<
  typeof DocumentClassificationSchema
>;

export type DocumentClassificationWithMeta = DocumentClassification & {
  _modelUsed?: string;
};

export async function classifyDocument(
  rawText: string,
): Promise<DocumentClassificationWithMeta> {
  const userPrompt = buildDocumentClassifierUserPrompt(rawText);

  try {
    const result = await executeWithResilience(
      "DocumentClassifier",
      async (model) => {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: DOCUMENT_CLASSIFIER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          max_completion_tokens: 300,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No text response received from Groq model.");
        }

        return parseAndValidateJson(content, DocumentClassificationSchema);
      },
    );

    return { ...result.data, _modelUsed: result.modelUsed };
  } catch (error) {
    console.error("Groq Document Classification Error:", error);
    const friendlyMessage = normalizeGroqError(error);
    throw new Error(`Document classification failed: ${friendlyMessage}`);
  }
}
