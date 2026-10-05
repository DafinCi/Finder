# Architecture Invariants

Rules that must hold for Finder to behave correctly. Each one explains why it
exists, who owns it, what must never happen, and what to do instead.

## I1 — Identity comes only from a verified session

- **Why**: any trust in client-supplied identity is an authorization bypass.
- **Owner**: route handlers and Supabase Auth.
- **Never**: accept a `userId`, `profileId`, or owner field from the request body
  as the acting identity.
- **Instead**: read the identity from `supabase.auth.getUser()` and reject with
  401 when it is missing.

## I2 — The canonical database wins over MemWal

- **Why**: recall must respect user intent, including forget.
- **Owner**: `career-memory.service.ts`.
- **Never**: surface a memory that the database marks forgotten or superseded.
- **Instead**: filter recall results against the canonical database.

## I3 — Match scores are deterministic

- **Why**: users must be able to trust a score, and it must not drift per run.
- **Owner**: the matching engine.
- **Never**: let the model set or override a Match Score.
- **Instead**: compute the score from profile evidence and skill overlap, and use
  the model only for explanation text.

## I4 — Success is claimed only after the backend confirms it

- **Why**: a model saying an action happened is not evidence that it did.
- **Owner**: the agent tool dispatcher.
- **Never**: tell the user a job was saved, a memory was stored, or a profile was
  updated based on model output alone.
- **Instead**: execute the tool server-side, check the result, then report.

## I5 — Resumes are never published to Walrus

- **Why**: resumes contain personal data and Walrus blobs are public.
- **Owner**: `POST /api/profile/resume/walrus-sync`, which returns 410 by design.
- **Never**: re-enable resume archival to Walrus.
- **Instead**: keep resumes in private storage, and publish only the minimized
  Public Career Passport with explicit confirmation.

## I6 — Walrus blobs are public; content privacy comes from encryption

- **Why**: describing Walrus storage as private would be false.
- **Owner**: Walrus and MemWal integration.
- **Never**: claim data is private because it is on Walrus.
- **Instead**: state that blobs are public and that MemWal encrypts memory content
  with Seal, readable only by the owner and authorized delegate keys.

## I7 — Forget hides a memory, it does not erase the blob

- **Why**: immutable storage semantics prevent guaranteed deletion.
- **Owner**: memory service and its UI copy.
- **Never**: promise permanent deletion.
- **Instead**: describe forget as removing the memory from recall, and note that
  permanent blob deletion requires a separate flow.

## I8 — Protected routes must match the guard list

- **Why**: inconsistent protection means pages render for users who cannot use
  them.
- **Owner**: `src/proxy.ts`.
- **Never**: add a new authenticated page without adding it to the guard.
- **Instead**: update the protected list and verify the redirect behavior.

## I9 — Persistence state must be explicit

- **Why**: the UI must not imply durability that has not happened.
- **Owner**: `walrus_status` and the resume processing stages.
- **Never**: show a memory or resume as stored while its status is pending or
  failed.
- **Instead**: render the real status and offer a retry.

## I10 — Development bypasses must not work in production

- **Why**: a missing secret must fail closed.
- **Owner**: `POST /api/jobs/sync`.
- **Never**: allow the sync bypass outside `NODE_ENV=development`.
- **Instead**: reject with 401 when no secret is configured.
