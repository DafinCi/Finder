/**
 * Helper to ensure live Supabase integration tests only execute
 * against a real, properly configured dedicated Supabase environment.
 * 
 * Never silently skips: if credentials are missing or mock, throws a clear
 * actionable error as mandated by Phase 6.2 test failure semantics.
 */
export function requireLiveTestCredentials() {
  const url =
    process.env.SUPABASE_TEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.SUPABASE_TEST_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service =
    process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isMissing = !url || !anon || !service;
  const isMock =
    !url ||
    url.includes("mock-ci.supabase.co") ||
    url.includes("mock-test-project.supabase.co");

  if (isMissing || isMock) {
    throw new Error(
      "Live integration tests require:\n" +
        "SUPABASE_TEST_URL\n" +
        "SUPABASE_TEST_ANON_KEY\n" +
        "SUPABASE_TEST_SERVICE_ROLE_KEY\n\n" +
        "Configure the test environment before running integration tests.",
    );
  }

  return {
    supabaseUrl: url,
    anonKey: anon,
    serviceRoleKey: service,
  };
}
