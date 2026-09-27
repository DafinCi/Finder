import { z } from "zod";
import {
  groq,
  parseAndValidateJson,
  executeWithResilience,
  normalizeGroqError,
} from "./client";
import {
  JOB_MATCHER_SYSTEM_PROMPT,
  buildJobMatcherUserPrompt,
} from "./prompts/job-matcher.prompt";

export const JobMatchResultItemSchema = z.object({
  job_id: z.string().trim(),
  score: z.coerce.number().min(0).max(100).default(50),
  reason: z
    .string()
    .trim()
    .default(
      "Kecocokan profil dievaluasi berdasarkan keselarasan tech stack dan pengalaman.",
    ),
  missing_skills: z.array(z.string().trim()).default([]),
});

export type JobMatchResultItem = z.infer<typeof JobMatchResultItemSchema>;

export const JobMatchResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) {
      return { matches: val };
    }
    return val;
  },
  z.object({
    matches: z.array(JobMatchResultItemSchema).default([]),
  }),
);

export type JobMatchResponse = z.infer<typeof JobMatchResponseSchema>;

export async function analyzeJobMatches(
  candidateData: unknown,
  jobs: unknown[],
): Promise<JobMatchResultItem[]> {
  const userPrompt = buildJobMatcherUserPrompt(candidateData, jobs);

  try {
    const result = await executeWithResilience("JobMatcher", async (model) => {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: JOB_MATCHER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2500,
      });

      if (completion.usage) {
        console.log(
          `[AI:Telemetry] op=JobMatcherTokens model=${model} prompt_tokens=${completion.usage.prompt_tokens} completion_tokens=${completion.usage.completion_tokens} total_tokens=${completion.usage.total_tokens}`,
        );
      }

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Tidak menerima respon teks dari model Groq.");
      }

      const validated = parseAndValidateJson(content, JobMatchResponseSchema);
      return validated.matches;
    });

    return result.data;
  } catch (error) {
    console.error("Groq Job Matching Error:", error);
    const friendlyMessage = normalizeGroqError(error);
    throw new Error(
      `Job matching failed: ${friendlyMessage}`,
    );
  }
}
