# Testing

Finder uses Vitest with three tiers. The tiers exist so most tests stay fast and
hermetic, while a small set verifies real database behavior.

| Tier | Location | Needs network | Purpose |
| --- | --- | --- | --- |
| Unit | `test/unit` | No | Pure logic, schemas, parsers, crypto helpers |
| Mocked integration | `test/integration/mocked` | No | Route handlers and services with in-memory mocks |
| Live integration | `test/integration/live` | Yes | Real Supabase RLS, constraints, and auth flows |

The exact number and names of test files change often. Treat the `test/`
directory as the source of truth rather than any count written in documentation.

## Commands

```bash
npm run test:unit                  # fast, hermetic
npm run test:integration:mocked    # route handlers with mocks
npm run test:integration:live      # requires test credentials
npm run test:coverage              # full suite with coverage
```

Warning: `npm test` runs the whole suite, including the live tier. Use
`test:unit` and `test:integration:mocked` for everyday work, and run the live
tier only against a dedicated test project.

## Mocked integration

Route handlers are exercised with `NextRequest` and `NextResponse`, using
in-memory adapters for Supabase and Groq under `test/mocks/`. This tier is where
authorization and ownership behavior, rate limiting, and pipeline branching are
verified without touching a real database.

## Live integration

Live tests read dedicated credentials:

```env
SUPABASE_TEST_URL=
SUPABASE_TEST_ANON_KEY=
SUPABASE_TEST_SERVICE_ROLE_KEY=
```

Never point these at production. Live tests create and delete temporary accounts
and records.

## CI

`.github/workflows/test.yml` runs:

1. Lint, type-check, and production build.
2. Unit and mocked integration tests.
3. Live integration tests, gated on the `SUPABASE_TEST_*` repository variables,
   with a guard step that fails with a clear message when the variables are set
   but the matching secrets are missing.

## What is well covered and what is not

Covered: SIWS verification, wallet linking, memory service behavior, matching
determinism, resume pipeline heuristics, agent tool calling, and documentation
contracts such as the database schema file.

Thin or missing: route-level cross-user isolation for every resource, a full
browser end-to-end flow, and simulated Walrus failure rendered in the UI. Treat
these as known gaps rather than covered behavior.
