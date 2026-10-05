# Job Ingestion

Jobs enter Finder through a scheduled sync, not through user input.

## Entry point

`POST /api/jobs/sync`, protected by a shared secret. The route compares the
presented secret in constant time and rejects with 401 when no secret is
configured in production. A bypass exists only when `NODE_ENV=development`.

## Source and normalization

- The external source adapter lives in `src/features/jobs/sources/`.
- Normalization produces the canonical Job shape used everywhere else:
  company, title, description, requirements, location, work mode, experience
  level, salary range, and source metadata.
- Each job keeps its source identity (`source` plus `source_job_id`) so repeat
  syncs update instead of duplicating. A unique constraint enforces this.

## Why it is internal

Ingestion is an infrastructure concern. It is not a client contract, and it must
not be documented as a public API.

## Failure behavior

- A failed sync logs the error and does not corrupt existing jobs.
- Because ingestion is idempotent per source id, a later run can recover.

## Related

- [../api/jobs.md](../api/jobs.md)
- [matching.md](matching.md)
