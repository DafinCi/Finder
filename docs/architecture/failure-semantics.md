# Failure Semantics

What Finder does when a dependency fails. These behaviors are part of the product
contract, not just error handling.

| Failure | Behavior | User-visible result | Source of truth |
| --- | --- | --- | --- |
| Primary AI model returns 429 or 503 | Retry once with the fallback model | Answer still arrives, marked as fallback in logs | `src/lib/groq/client.ts` |
| Both models fail | Request fails with a safe message | Error state, no fabricated answer | `src/lib/groq/client.ts` |
| AI returns malformed JSON | Parsing fails, raw output is not logged | Request fails, error surfaced | `src/lib/groq/client.ts` |
| AI response fails schema validation | Validation issues are logged without payload | Request fails | `src/lib/groq/client.ts` |
| Resume analysis already running | Existing run is awaited, duplicate LLM calls avoided | UI keeps polling | `analysis-orchestrator.service.ts` |
| Resume analysis fails | Resume marked `failed` | UI shows failure with retry | `resume_processing` |
| Non-resume document | Pipeline stops at `needs_review` | Review card with override option | `resume-heuristic.ts`, classifier |
| MemWal not configured in production | Client throws instead of using a mock | Memory action fails loudly | `memwal-client.ts` |
| MemWal write not yet complete | Memory stays `pending` | UI shows pending, never "stored" | `career_memories.walrus_status` |
| MemWal write fails | Memory marked `failed` | UI shows failure | `career_memories.walrus_status` |
| Walrus memory recall fails | Recall returns empty | Chat answers without memory context | `memwal-client.ts` |
| Public passport publish without confirmation | 400 `CONFIRMATION_REQUIRED` | UI keeps the confirm panel open | `api/profile/snapshot/walrus` |
| Public passport publish without a publisher configured | 503 `WALRUS_NOT_CONFIGURED` | UI explains archival is disabled | `api/profile/snapshot/walrus` |
| Resume archival request | 410 `RESUME_ARCHIVAL_DISABLED` | Not reachable from the UI by design | `api/profile/resume/walrus-sync` |
| Job sync without secret in production | 401 | No ingestion runs | `api/jobs/sync` |
| Rate limit exceeded | 429 with reset information | UI asks the user to wait | `src/lib/rate-limit.ts` |
| Missing session on a product route | 401 | UI redirects to login | route handlers |
| Forgot memory still present in Walrus | Blob remains, recall hides it | Memory absent from chat | `career-memory.service.ts` |

## Design rules behind these behaviors

- Fail loudly when a production dependency is missing. Do not silently degrade to
  a mock.
- Never claim durability that has not been confirmed.
- Prefer a safe error message over leaking internal details. Details stay in
  server logs.
