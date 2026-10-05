# Change Map

When you change one thing, check the others. Each row lists a verified
relationship in the codebase.

| If you change | Also inspect |
| --- | --- |
| `src/database/schema_v2.sql` or a migration | RLS policies, `src/types/database.ts`, the feature types, `test/integration/mocked/database-contract.test.ts`, this documentation |
| A database constraint | The service that writes that table, and any route that can surface a 409 |
| An API request or response shape | The Zod schema, the frontend consumer, `docs/api/*`, and any test that asserts the shape |
| An API route's auth behavior | Its entry in `docs/api/overview.md` and the ownership check |
| A new authenticated page | The protected route list in `src/proxy.ts` |
| Agent tool definitions | The dispatcher, the tool documentation, the agent tests, and the prompt's tool rules |
| The chat prompt | `CAREER_COPILOT_PROMPT_VERSION`, memory precedence rules, and the AI tests |
| Memory semantics | `docs/ai/memory.md`, the recall filter, and the UI status labels |
| Matching weights or limits | `docs/jobs/matching.md` and the matching tests |
| Model names or fallback behavior | `docs/integrations/ai-provider.md`, `.env.example`, and `GET /api/agent/status` |
| Environment variables | `.env.example`, `docs/development/setup.md`, and the CI workflow |
| Walrus or MemWal configuration | `docs/integrations/walrus-memwal.md` and the failure semantics |
| Job ingestion source | The adapter, normalization, and `docs/jobs/ingestion.md` |
| User-facing copy | `docs/design/design-system.md` and the UI components |
| CI workflow | `docs/development/testing.md` and the quality gates |

## Why this exists

Documentation drift happens when a change lands in code but not in the documents
that describe it, or when a schema change silently breaks a documented behavior.
This map is the checklist that keeps them aligned.
