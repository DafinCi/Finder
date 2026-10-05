# Coding Standards

## Feature-based structure

Domain code lives under `src/features/`. Each feature owns its components, hooks,
services, repositories, and types. Shared infrastructure lives under `src/lib/`.
Reusable UI primitives live under `src/components/`.

## Layer responsibilities

```text
Page or view        renders layout, wires hooks
Hook                client state, effects, browser APIs
Service             business logic, orchestration, transformations
Repository          data access
Route handler       validation, auth, rate limit, calls a service
Database or API     Supabase, Groq, Sui, Walrus
```

- Components render and raise events. They do not query the database or call AI
  providers directly.
- Hooks do not render JSX.
- Services do not import React components.
- Route handlers verify the session, validate input with Zod, and return JSON or
  an SSE stream.

## TypeScript

- `strict` is enabled. Type function parameters, return values, and complex
  objects.
- Prefer explicit interfaces or type aliases for domain models and responses.
- Validate every untrusted boundary with Zod: request bodies, external feeds, and
  model output.

## Error handling

- Never return raw exception text to the client. Return a safe message and keep
  details in server logs.
- Status codes in use:

| Code | Meaning |
| --- | --- |
| 400 | Validation failure or missing field |
| 401 | Missing or invalid session |
| 403 | Explicit forbidden case |
| 404 | Entity missing, including another user's resource |
| 409 | Concurrency conflict or unique constraint violation |
| 410 | Feature intentionally removed |
| 413 | Payload too large |
| 422 | Domain validation failure with details |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
| 503 | Dependency not configured |

## Logging

- Log operational facts: IDs, model names, durations, stage transitions.
- Never log resume text, memory content, prompts, credentials, tokens, or
  authorization headers.
- Never log raw model output. Log its length or validation issues instead.

## Copy and interfaces

- User-facing copy is English.
- Do not use em dashes in product copy.
- Every interactive control must do something real, or it should not exist.

## Related

- [../architecture/invariants.md](../architecture/invariants.md)
- [../ai/prompting.md](../ai/prompting.md)
