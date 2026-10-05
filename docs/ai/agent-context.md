# Agent Context

High-signal context for coding agents and new contributors. Read this before
changing the repository.

## Purpose

Finder turns a resume into a Career Profile, matches it against Jobs with a
deterministic score, and runs a chat agent that remembers durable career facts.

## Architecture in one paragraph

Next.js 16 App Router. Pages under `src/app`; route guard in `src/proxy.ts`; API
handlers in `src/app/api`; domain logic in `src/features`; integrations in
`src/lib`; database in `src/database`. Supabase provides Auth, Postgres, and
Storage. Groq provides the models. Sui provides wallet authentication. Walrus
through MemWal provides durable memory.

## Important directories

| Path | Contents |
| --- | --- |
| `src/app/api` | 35 route handlers |
| `src/features/ai-analysis` | Resume pipeline and processing state |
| `src/features/agent` | Agent tool definitions and dispatcher |
| `src/features/memory` | Career Memory service, repository, UI |
| `src/features/jobs` | Ingestion, matching, recommendations, saved jobs |
| `src/features/sui` | SIWS hooks and wallet UI |
| `src/features/walrus` | Public Career Passport snapshot |
| `src/lib/groq` | Model client, schemas, prompts |
| `src/lib/walrus` | Walrus client and MemWal wrapper |
| `src/database` | Schema, migrations, optional demo seed |

## Source-of-truth rules

1. Code beats documentation.
2. Postgres is canonical for anything the user can change.
3. MemWal and Walrus are retrieval and durability layers, not canonical stores.
4. The model is never authoritative for identity, scores, persistence, or
   ownership.
5. Zod schemas in code are the canonical API contracts.

## Invariants you must preserve

- Identity only from a verified session.
- Canonical database wins over MemWal.
- Match scores are deterministic.
- Report success only after the backend confirms it.
- Resumes are never published to Walrus.
- Walrus blobs are public; memory privacy comes from Seal encryption.
- Forget hides a memory, it does not erase the blob.
- Protected pages must be listed in `src/proxy.ts`.
- Persistence state must be explicit: never show "stored" while pending.
- Development bypasses must not work in production.

See [../architecture/invariants.md](../architecture/invariants.md) for the full
rationale.

## Models and limits

- Primary: `qwen/qwen3.8-27b` (`GROQ_MODEL`).
- Fallback on 429 or 503: `openai/gpt-oss-20b` (`GROQ_FALLBACK_MODEL`).
- Optional agent model: `GROQ_AGENT_MODEL`.
- The agent loop is bounded. Check the loop constant in the agent code before
  changing behavior.
- Rate limits exist on upload, chat, analyze, and all Sui auth routes.

## Security constraints

- The service role key is server-only. Never add a `NEXT_PUBLIC_` prefix to it.
- Never log resume text, memory content, prompts, or credentials.
- Never return internal error details in a response.

## Testing expectations

- `npm run test:unit` and `npm run test:integration:mocked` must stay green.
- `npx tsc --noEmit` and `npm run lint` must stay clean.
- Run `npm run build` before pushing changes that touch routing or modules.

## Common pitfalls

- Assuming `/api/*` is a public API. Most routes are product-internal.
- Treating the model as authoritative for state.
- Editing the schema without updating `career-profile.types.ts`, RLS, and tests.
- Adding an authenticated page without adding it to the route guard.
- Claiming Walrus durability before `walrus_status` says stored.

## Related documents

- [overview.md](overview.md), [agent.md](agent.md), [tools.md](tools.md), [memory.md](memory.md)
- [../architecture/invariants.md](../architecture/invariants.md)
- [../glossary.md](../glossary.md)
