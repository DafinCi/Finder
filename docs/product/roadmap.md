# Roadmap and Status

Status is described by capability, not by version numbers. Each item reflects
what the code does today.

## Shipped

**Authentication.** Email and password through Supabase SSR, Sign-In with Sui
using single-use nonces bound to purpose and network, and wallet linking with a
unique address constraint per account.

**Resume pipeline.** PDF upload with content-type, size, and file-signature
checks, private storage, text extraction, a non-resume heuristic, a document
classifier with an override path, and a processing state the UI polls.

**Career Profile.** Extraction from resume, manual editing for intent,
preferences, skills, and background, draft saving with optimistic concurrency,
and confirmation that pins a profile version.

**Matching and recommendations.** Deterministic skill-overlap prefilter and
pre-ranking, deterministic final score, match snapshots per profile version, and
explanation text from the model.

**Jobs.** Scheduled ingestion from the external feed with per-source idempotency,
saved jobs, rejected jobs, and recommendation filtering that respects both.

**Chat and agent.** Server-Sent Events streaming, bounded agent loop, seven typed
Agent Tools executed server-side, and confirmation only after the backend
confirms a write.

**Memory.** Career Memory in Postgres, mirrored to Walrus through MemWal,
namespace isolation per user, supersede and forget semantics, confidence
reinforcement, and recall filtered against the canonical database.

**Web3 publishing.** An opt-in minimized Public Career Passport on Walrus.
Resumes are never published.

**Quality gates.** Lint, type-check, production build, unit tests, and mocked
integration tests run in CI, with live integration tests gated on dedicated
credentials.

## Known gaps

- Cross-user isolation is tested for some resources but not every route.
- No browser end-to-end test covers onboarding through memory persistence.
- Walrus persistence failure is not simulated in a UI test.
- Rate limiting covers upload, chat, analyze, and Sui auth routes, but not the
  profile and memory routes.
- One MemWal account and delegate key serve all users; separation is by namespace.
- Public passport archival is disabled unless an operator configures a publisher.
- The demo seed is opt-in and clearly marked, so a fresh production database has
  no jobs until ingestion runs.

## Not planned

- Publishing resumes to public storage.
- Letting the model set or override a Match Score.
- Claiming permanent deletion where the storage layer cannot guarantee it.
