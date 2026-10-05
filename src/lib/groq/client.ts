import Groq from "groq-sdk";
import { z } from "zod";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.warn(
    "WARNING: GROQ_API_KEY is not defined in environment variables.",
  );
}

export const groq = new Groq({
  apiKey: apiKey || "",
  timeout: 30000, // 30 seconds network timeout to prevent hanging serverless routes
});

// Primary and fallback models from active Groq quota list
export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
export const FALLBACK_GROQ_MODEL =
  process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b";

export function cleanJsonFences(text: string): string {
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
  return cleaned;
}

/**
 * Conservative token estimate for context budgeting. Uses ~4 characters per token,
 * which is a safe heuristic for mixed multilingual text without a tokenizer.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = cleanJsonFences(text);
  return JSON.parse(cleaned) as T;
}

export function parseAndValidateJson<T>(text: string, schema: z.ZodType<T>): T {
  const cleaned = cleanJsonFences(text);
  let rawParsed: unknown;

  try {
    rawParsed = JSON.parse(cleaned);
  } catch (parseError) {
    console.error(
      `[AI:Parse] Malformed JSON from LLM (output length ${cleaned.length}).`,
    );
    throw new Error(
      `Couldn't process AI response: invalid JSON format (${(parseError as Error).message})`,
    );
  }

  const validation = schema.safeParse(rawParsed);
  if (!validation.success) {
    console.error("Zod Schema Validation Failed on LLM Output:", {
      issues: validation.error.issues,
    });
    const issueSummary = validation.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(
      `AI response structure does not match expected schema: ${issueSummary}`,
    );
  }

  return validation.data;
}

export function normalizeGroqError(error: unknown): string {
  if (!error) return "An error occurred with the AI service.";
  const err = error as { status?: number; message?: string; code?: string };
  const message = err.message || String(error);

  if (
    err.status === 429 ||
    message.includes("429") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("tpm")
  ) {
    return "AI service traffic limit reached. Rerouting request or please try again shortly.";
  }
  if (
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("timed out") ||
    message.toLowerCase().includes("etimedout")
  ) {
    return "Connection to AI service timed out (30s). Please check your connection and try again.";
  }
  if (
    err.status === 503 ||
    message.includes("503") ||
    message.toLowerCase().includes("overloaded") ||
    message.toLowerCase().includes("unavailable")
  ) {
    return "AI model provider is experiencing temporary high load. Please try again in a moment.";
  }
  if (
    err.status === 401 ||
    message.includes("401") ||
    message.toLowerCase().includes("api key")
  ) {
    return "AI API credentials are invalid or unconfigured.";
  }

  return message;
}

export interface ResilienceResult<T> {
  data: T;
  modelUsed: string;
  durationMs: number;
}

/**
 * Determines whether a Groq error is transient/recoverable enough to warrant a fallback model.
 */
export function isRecoverableGroqError(message: string): boolean {
  return (
    message.includes("429") ||
    message.includes("503") ||
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("not found") ||
    message.includes("model")
  );
}

/**
 * Executes an AI operation with fallback resiliency and telemetry logging.
 * If the primary model fails due to 429 rate limit, 503 overload, or unexpected model error,
 * it automatically falls back to FALLBACK_GROQ_MODEL.
 */
export async function executeWithResilience<T>(
  operationName: string,
  executeFn: (model: string) => Promise<T>,
): Promise<ResilienceResult<T>> {
  const startTime = Date.now();
  const primaryModel = DEFAULT_GROQ_MODEL;
  const fallbackModel = FALLBACK_GROQ_MODEL;

  try {
    const data = await executeFn(primaryModel);
    const durationMs = Date.now() - startTime;
    console.log(
      `[AI:Telemetry] op=${operationName} model=${primaryModel} status=success duration=${durationMs}ms`,
    );
    return { data, modelUsed: primaryModel, durationMs };
  } catch (primaryError) {
    const errorMsg = (primaryError as Error).message || "";
    const isRecoverable = isRecoverableGroqError(errorMsg);

    if (isRecoverable && primaryModel !== fallbackModel) {
      console.warn(
        `[AI:Resilience] op=${operationName} primary=${primaryModel} failed (${errorMsg}). Initiating fallback to ${fallbackModel}...`,
      );
      try {
        const data = await executeFn(fallbackModel);
        const durationMs = Date.now() - startTime;
        console.log(
          `[AI:Telemetry] op=${operationName} model=${fallbackModel} (FALLBACK) status=success duration=${durationMs}ms`,
        );
        return { data, modelUsed: fallbackModel, durationMs };
      } catch (fallbackError) {
        console.error(
          `[AI:Resilience] op=${operationName} fallback=${fallbackModel} also failed: ${
            (fallbackError as Error).message || String(fallbackError)
          }`,
        );
        throw fallbackError;
      }
    }

    throw primaryError;
  }
}

export interface StreamingResilienceResult<T> {
  stream: AsyncIterable<T>;
  modelUsed: string;
}

export interface StreamingResilienceOptions {
  primaryModel?: string;
  fallbackModel?: string;
}

/**
 * Creates a streaming chat completion with the same primary/fallback resiliency as
 * executeWithResilience. Retries stream creation (before any tokens are consumed) when the
 * primary model fails with a recoverable provider error.
 */
export async function executeStreamWithResilience<T>(
  operationName: string,
  executeFn: (model: string) => Promise<AsyncIterable<T>>,
  options?: StreamingResilienceOptions,
): Promise<StreamingResilienceResult<T>> {
  const primaryModel = options?.primaryModel || DEFAULT_GROQ_MODEL;
  const fallbackModel = options?.fallbackModel || FALLBACK_GROQ_MODEL;

  try {
    const stream = await executeFn(primaryModel);
    return { stream, modelUsed: primaryModel };
  } catch (primaryError) {
    const errorMsg = (primaryError as Error).message || "";
    if (isRecoverableGroqError(errorMsg) && primaryModel !== fallbackModel) {
      console.warn(
        `[AI:StreamResilience] op=${operationName} primary=${primaryModel} failed (${errorMsg}). Falling back to ${fallbackModel}...`,
      );
      try {
        const stream = await executeFn(fallbackModel);
        return { stream, modelUsed: fallbackModel };
      } catch (fallbackError) {
        console.error(
          `[AI:StreamResilience] op=${operationName} fallback=${fallbackModel} also failed: ${
            (fallbackError as Error).message || String(fallbackError)
          }`,
        );
        throw fallbackError;
      }
    }

    throw primaryError;
  }
}
