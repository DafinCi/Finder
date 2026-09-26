import fs from "fs";
import path from "path";

/**
 * Global test environment setup.
 * Loads .env.local if available (for live integration tests),
 * otherwise defaults to deterministic dummy variables so automated test suites never fail in isolated environments.
 */
const envLocalPath = path.resolve(import.meta.dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// Map dedicated SUPABASE_TEST_* variables if provided
if (process.env.SUPABASE_TEST_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_TEST_URL;
}
if (process.env.SUPABASE_TEST_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    process.env.SUPABASE_TEST_ANON_KEY;
}
if (process.env.SUPABASE_TEST_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
}

process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mock-test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key-test-123456";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key-test-123456";
process.env.GROQ_API_KEY =
  process.env.GROQ_API_KEY || "gsk_mock_test_api_key_1234567890";
process.env.GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
process.env.GROQ_FALLBACK_MODEL =
  process.env.GROQ_FALLBACK_MODEL || "openai/gpt-oss-20b";
process.env.GROQ_MAX_TOKENS = process.env.GROQ_MAX_TOKENS || "2500";
process.env.NEXT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
