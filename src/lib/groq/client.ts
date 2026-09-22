import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.warn(
    "WARNING: GROQ_API_KEY is not defined in environment variables.",
  );
}

export const groq = new Groq({
  apiKey: apiKey || "",
});

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```\s*/, "")
      .replace(/```$/, "")
      .trim();
  }
  return JSON.parse(cleaned) as T;
}
