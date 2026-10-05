# API Overview

Finder exposes 35 route handlers under `src/app/api`. They are not one public API.
They are grouped by tier, and documentation depth follows the tier.

## Tiers

| Tier | Meaning | Documentation depth |
| --- | --- | --- |
| Public | Reachable without a session, safe for integrators to call | Detail |
| Product | Used by the Finder web app, requires a session | Contract |
| Internal | Server-to-server or infrastructure only | Brief |
| Deprecated | Kept only to return a clear refusal | Brief |

## Route map

| Route | Methods | Tier | Auth | Rate limit | Doc |
| --- | --- | --- | --- | --- | --- |
| `/api/auth/signup` | POST | Public | none | none | [authentication.md](authentication.md) |
| `/api/auth/signin` | POST | Public | none | none | [authentication.md](authentication.md) |
| `/api/auth/confirm` | GET | Public | none | none | [authentication.md](authentication.md) |
| `/api/auth/sui/nonce` | GET | Public | none | yes | [authentication.md](authentication.md) |
| `/api/auth/sui/verify` | POST | Public | none | yes | [authentication.md](authentication.md) |
| `/api/auth/sui/link` | POST | Product | session | yes | [authentication.md](authentication.md) |
| `/api/auth/sui/unlink` | POST | Product | session | yes | [authentication.md](authentication.md) |
| `/api/upload-resume` | POST | Product | session | 6/min | [resume-analysis.md](resume-analysis.md) |
| `/api/analyze` | POST | Product | session | yes | [resume-analysis.md](resume-analysis.md) |
| `/api/analyze/status` | GET | Product | session | none | [resume-analysis.md](resume-analysis.md) |
| `/api/profile` | GET, POST | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/draft` | PATCH | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/background` | PATCH | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/career-intent` | PATCH | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/preferences` | PATCH | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/skills` | PATCH | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/confirm` | POST | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/resume` | GET, POST | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/resume/view` | GET | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/profile/snapshot/walrus` | GET, POST | Product | session | none | [career-profile.md](career-profile.md) |
| `/api/chat/session` | GET, POST | Product | session | none | [chat.md](chat.md) |
| `/api/chat/session/[id]` | GET, PATCH, DELETE | Product | session | none | [chat.md](chat.md) |
| `/api/chat/message` | POST | Product | session | 12/min | [chat.md](chat.md) |
| `/api/chat/message/[id]` | PATCH | Product | session | none | [chat.md](chat.md) |
| `/api/memory` | GET, POST | Product | session | none | [memory.md](memory.md) |
| `/api/memory/[id]` | DELETE | Product | session | none | [memory.md](memory.md) |
| `/api/memory/reinforce` | POST | Product | session | none | [memory.md](memory.md) |
| `/api/feedback` | GET, POST | Product | session | none | [feedback.md](feedback.md) |
| `/api/telemetry` | POST | Product | session | none | [feedback.md](feedback.md) |
| `/api/jobs/saved` | GET | Product | session | none | [jobs.md](jobs.md) |
| `/api/recommendations` | GET | Product | session | none | [jobs.md](jobs.md) |
| `/api/agent/status` | GET | Product | session | none | [agents.md](agents.md) |
| `/api/jobs/sync` | POST | Internal | shared secret | none | [jobs.md](jobs.md) |
| `/api/walrus/blob/[blobId]` | GET | Internal | none | none | [jobs.md](jobs.md) |
| `/api/profile/resume/walrus-sync` | POST | Deprecated | session | none | [career-profile.md](career-profile.md) |

## Conventions

- **Authentication**: product routes call `supabase.auth.getUser()` and return 401
  when there is no session. Identity is never read from the request body.
- **Ownership**: every query is scoped to the authenticated identity. Cross-user
  access returns 404 or 403, never data.
- **Validation**: request bodies are validated by Zod schemas in the route or its
  service. Those schemas are the canonical contract; this documentation does not
  duplicate field lists.
- **Errors**: responses are JSON with at least an `error` string, and often a
  `code`. Internal details are logged server-side and not returned.
- **Rate limits**: enforced by `src/lib/rate-limit.ts`; exceeded requests return
  429 with reset information.
- **Side effects**: routes that write to Walrus or Supabase return success only
  after the write is confirmed.

## Internal endpoints are not a public contract

`POST /api/jobs/sync` is protected by `CRON_SECRET` and exists for scheduled
ingestion. `GET /api/walrus/blob/[blobId]` is an unauthenticated infrastructure
proxy for reading public Walrus blobs; it is not an application API. Do not treat
either as an integrator-facing contract.
