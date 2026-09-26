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
export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";
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
    console.error("Malformed JSON received from LLM:", cleaned);
    throw new Error(
      `Couldn't process AI response: invalid JSON format (${(parseError as Error).message})`,
    );
  }

  const validation = schema.safeParse(rawParsed);
  if (!validation.success) {
    console.error("Zod Schema Validation Failed on LLM Output:", {
      issues: validation.error.issues,
      raw: rawParsed,
    });
    const issueSummary = validation.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Struktur respons AI tidak memenuhi skema yang diharapkan: ${issueSummary}`,
    );
  }

  return validation.data;
}

export function normalizeGroqError(error: unknown): string {
  if (!error) return "Terjadi kesalahan pada layanan AI.";
  const err = error as { status?: number; message?: string; code?: string };
  const message = err.message || String(error);

  if (
    err.status === 429 ||
    message.includes("429") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("tpm")
  ) {
    return "Layanan AI sedang mencapai batas kapasitas trafik (Rate Limit). Sedang dialihkan atau silakan coba beberapa saat lagi.";
  }
  if (
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("timed out") ||
    message.toLowerCase().includes("etimedout")
  ) {
    return "Koneksi ke layanan AI melebihi batas waktu (timeout 30s). Silakan periksa jaringan dan coba kembali.";
  }
  if (
    err.status === 503 ||
    message.includes("503") ||
    message.toLowerCase().includes("overloaded") ||
    message.toLowerCase().includes("unavailable")
  ) {
    return "Penyedia model AI sedang mengalami beban tinggi sementara. Silakan coba kembali sesaat lagi.";
  }
  if (
    err.status === 401 ||
    message.includes("401") ||
    message.toLowerCase().includes("api key")
  ) {
    return "Kredensial API AI tidak valid atau belum dikonfigurasi.";
  }

  return message;
}

export interface ResilienceResult<T> {
  data: T;
  modelUsed: string;
  durationMs: number;
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
    const isRecoverable =
      errorMsg.includes("429") ||
      errorMsg.includes("503") ||
      errorMsg.includes("rate limit") ||
      errorMsg.includes("overloaded") ||
      errorMsg.includes("not found") ||
      errorMsg.includes("model");

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
          `[AI:Resilience] op=${operationName} fallback=${fallbackModel} also failed:`,
          fallbackError,
        );
        throw fallbackError;
      }
    }

    throw primaryError;
  }
}
