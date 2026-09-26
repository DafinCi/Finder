import {
  RemotiveApiResponse,
  RemotiveApiResponseSchema,
} from "./remotive.schema";

export interface RemotiveFetchOptions {
  limit?: number;
  /**
   * Note: The Remotive Public API ignores `category` filtering on its public endpoint.
   * Marked as unverified/unsupported.
   */
  category?: string;
  /**
   * Note: The Remotive Public API ignores `search` filtering on its public endpoint.
   * Marked as unverified/unsupported.
   */
  search?: string;
  timeoutMs?: number;
}

export class RemotiveApiError extends Error {
  public readonly status?: number;
  public readonly code: string;

  constructor(message: string, code = "REMOTIVE_API_ERROR", status?: number) {
    super(message);
    this.name = "RemotiveApiError";
    this.code = code;
    this.status = status;
  }
}

const REMOTIVE_DEFAULT_URL = "https://remotive.com/api/remote-jobs";
const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT =
  "CareerPortal-Sync/1.0 (Job Ingestion Pipeline; Node.js/Next.js)";

/**
 * Fetches remote jobs from the Remotive Public API with timeout and schema validation.
 */
export async function fetchRemotiveJobs(
  options: RemotiveFetchOptions = {},
): Promise<RemotiveApiResponse> {
  const { limit, category, search, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const url = new URL(REMOTIVE_DEFAULT_URL);
  if (limit && limit > 0) {
    url.searchParams.set("limit", limit.toString());
  }
  if (category && category.trim()) {
    url.searchParams.set("category", category.trim());
  }
  if (search && search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new RemotiveApiError(
        `Remotive API request failed with status HTTP ${response.status} (${response.statusText})`,
        "HTTP_ERROR",
        response.status,
      );
    }

    let rawData: unknown;
    try {
      rawData = await response.json();
    } catch (parseError: any) {
      throw new RemotiveApiError(
        `Remotive API response was not valid JSON: ${parseError.message}`,
        "INVALID_JSON",
      );
    }

    const validationResult = RemotiveApiResponseSchema.safeParse(rawData);
    if (!validationResult.success) {
      const issues = validationResult.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new RemotiveApiError(
        `Remotive API response schema validation failed: ${issues}`,
        "SCHEMA_MISMATCH",
      );
    }

    return validationResult.data;
  } catch (error: any) {
    if (error.name === "AbortError" || error.code === "ABORT_ERR") {
      throw new RemotiveApiError(
        `Remotive API request timed out after ${timeoutMs}ms`,
        "TIMEOUT",
        408,
      );
    }
    if (error instanceof RemotiveApiError) {
      throw error;
    }
    throw new RemotiveApiError(
      `Network failure connecting to Remotive API: ${error.message}`,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timer);
  }
}
