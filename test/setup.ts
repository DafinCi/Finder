/**
 * Global test environment setup.
 * Sets deterministic dummy variables so automated test suites never require real secrets.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key-test-123456";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key-test-123456";
process.env.GROQ_API_KEY = "gsk_mock_test_api_key_1234567890";
process.env.GROQ_MODEL = "openai/gpt-oss-120b";
process.env.GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";
process.env.GROQ_MAX_TOKENS = "2500";
