import { z } from "zod";
import {
  groq,
  parseAndValidateJson,
  executeWithResilience,
  normalizeGroqError,
} from "./client";
import {
  PROFILE_EXTRACTOR_SYSTEM_PROMPT,
  buildProfileExtractorUserPrompt,
} from "./prompts/profile-extractor.prompt";

export const ExtractedCandidateSchema = z.object({
  name: z.string().trim().default("Anonim"),
  title: z.string().trim().default("Professional"),
  years_of_experience: z.coerce.number().min(0).max(60).default(0),
  summary: z.string().trim().default(""),
  skills: z
    .object({
      core: z.array(z.string().trim()).default([]),
      supporting: z.array(z.string().trim()).default([]),
    })
    .default({ core: [], supporting: [] }),
  experience: z
    .array(
      z.object({
        company: z.string().trim().default("Perusahaan"),
        role: z.string().trim().default("Posisi"),
        duration: z.string().trim().default(""),
        achievements: z.array(z.string().trim()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().trim().default(""),
        degree: z.string().trim().default(""),
        year: z.string().trim().default(""),
      }),
    )
    .default([]),
});

export const ExtractedCareerSchema = z.object({
  recommended_roles: z.array(z.string().trim()).default([]),
  career_level: z.string().trim().default("Mid-Level"),
  strengths: z.array(z.string().trim()).default([]),
  weaknesses: z.array(z.string().trim()).default([]),
});

export const ExtractedProfileResultSchema = z.preprocess(
  (val: unknown) => {
    // Resilient fallback if model skips top-level json_profile key
    if (
      val &&
      typeof val === "object" &&
      !("json_profile" in val) &&
      "candidate" in val
    ) {
      const casted = val as Record<string, unknown>;
      return {
        json_profile: {
          candidate: casted.candidate,
          career: casted.career || {},
        },
        extracted_skills: casted.extracted_skills || [],
      };
    }
    return val;
  },
  z.object({
    json_profile: z.object({
      candidate: ExtractedCandidateSchema,
      career: ExtractedCareerSchema,
    }),
    extracted_skills: z.array(z.string().trim()).default([]),
  }),
);

export type ExtractedProfileResult = z.infer<
  typeof ExtractedProfileResultSchema
>;

export type ExtractedProfileResultWithMeta = ExtractedProfileResult & {
  _modelUsed?: string;
};

export async function extractCandidateProfile(
  rawText: string,
): Promise<ExtractedProfileResultWithMeta> {
  const userPrompt = buildProfileExtractorUserPrompt(rawText);

  try {
    const result = await executeWithResilience(
      "ProfileExtractor",
      async (model) => {
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: PROFILE_EXTRACTOR_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2500,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Tidak menerima respon teks dari model Groq.");
        }

        return parseAndValidateJson(content, ExtractedProfileResultSchema);
      },
    );

    return { ...result.data, _modelUsed: result.modelUsed };
  } catch (error) {
    console.error("Groq Profile Extraction Error:", error);
    const friendlyMessage = normalizeGroqError(error);
    throw new Error(`Gagal mengekstrak profil kandidat: ${friendlyMessage}`);
  }
}
