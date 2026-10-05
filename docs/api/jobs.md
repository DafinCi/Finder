# Jobs API

## Product endpoints

### `GET /api/recommendations`

- **Purpose**: return recommended jobs for the caller with their Match Scores.
- **Auth**: session.
- **Query**: `limit`.
- **Source of truth**: the matching engine. The score is deterministic and the
  model only supplies explanation text.
- **Notes**: recommendations respect the caller's saved and rejected jobs.

### `GET /api/jobs/saved`

- **Purpose**: list jobs the caller saved.
- **Auth**: session.

## Internal endpoint

### `POST /api/jobs/sync`

- **Purpose**: ingest jobs from the external feed. Scheduled, not user-facing.
- **Auth**: shared secret in the `Authorization: Bearer` header or `x-sync-secret`.
  Compared in constant time.
- **Production behavior**: if no secret is configured, the route rejects with 401.
  A bypass exists only when `NODE_ENV=development`.
- **Status**: this is not a public or integrator API.

## Infrastructure endpoint

### `GET /api/walrus/blob/[blobId]`

- **Purpose**: fetch a public Walrus blob and return it with a content type.
- **Auth**: none. This is deliberate, because Walrus blobs are public by design.
- **Validation**: the blob id is sanitized and length-checked, so the route cannot
  be used to fetch arbitrary hosts.
- **Status**: infrastructure proxy, not an application API. Do not document it as
  a public contract.

## Related

- [../architecture/invariants.md](../architecture/invariants.md) I3 for score
  authority
