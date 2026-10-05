# Career Profile API

All routes here require a session and operate on the caller's own Career Profile.
Request bodies are validated by Zod schemas in the service layer; those schemas
are the canonical contract.

## Profile

| Route | Purpose | Notes |
| --- | --- | --- |
| `GET /api/profile` | Read the current Career Profile | Returns the canonical profile |
| `POST /api/profile` | Create or replace profile data | Used during onboarding |
| `PATCH /api/profile/draft` | Save draft edits | Uses `expected_version` for optimistic concurrency |
| `PATCH /api/profile/background` | Update education, experience, projects | |
| `PATCH /api/profile/career-intent` | Update target roles, level, employment types | |
| `PATCH /api/profile/preferences` | Update work modes, locations, salary, priorities | |
| `PATCH /api/profile/skills` | Update the skills inventory | |
| `POST /api/profile/confirm` | Confirm the profile | Pins `profileVersion` used by matching |

### Concurrency

`PATCH /api/profile/draft` and confirm accept `expected_version`. A mismatch
returns 409 with the expected and current version so the client can refetch
instead of overwriting newer data.

## Resume attachment

| Route | Purpose | Notes |
| --- | --- | --- |
| `GET /api/profile/resume` | Read active resume metadata | Falls back to the latest non-failed resume |
| `POST /api/profile/resume` | Apply an uploaded resume to the profile | Creates a draft profile when none exists |
| `GET /api/profile/resume/view` | Stream the stored resume for the owner | Owner-scoped |

## Public Career Passport

| Route | Purpose | Notes |
| --- | --- | --- |
| `GET /api/profile/snapshot/walrus` | Report snapshot status | Returns blob id, network, and whether public archival is configured |
| `POST /api/profile/snapshot/walrus` | Publish the public passport | Requires `confirmPublic: true` |

### Publish rules

- The published document contains only skills, target roles, employment types, and
  career level. It excludes name, contact details, education, employers, salary,
  location, and account identifiers.
- Without explicit confirmation the route returns 400 `CONFIRMATION_REQUIRED`.
- When no publisher is configured it returns 503 `WALRUS_NOT_CONFIGURED` and
  publishes nothing.

## Deprecated

`POST /api/profile/resume/walrus-sync` always returns 410
`RESUME_ARCHIVAL_DISABLED`. Resumes are never published to Walrus. See
[../architecture/invariants.md](../architecture/invariants.md) I5.
