# Walrus and MemWal Integration

Finder uses Walrus through MemWal to give the agent durable, semantic career
memory, and optionally to publish a minimized public career passport. This
document covers how Finder uses them, not what they are. For protocol concepts,
see the official Walrus and Walrus Memory documentation.

## What Finder stores where

| Data | Where it goes | Public? |
| --- | --- | --- |
| Resume PDF | Supabase Storage only | No |
| Resume text | Supabase only | No |
| Career Memory | `career_memories` in Postgres, mirrored to Walrus via MemWal | Blob public, content encrypted with Seal |
| Public Career Passport | Walrus, only on explicit confirmation | Yes, minimized fields only |

**Resumes are never published to Walrus.** `POST /api/profile/resume/walrus-sync`
returns 410 by design. See [../architecture/invariants.md](../architecture/invariants.md) I5.

## Memory write path

1. The memory is written to `career_memories` first, because the database is
   canonical.
2. A background task calls MemWal's `rememberAndWait` under the namespace
   `finder:user:<profileId>`.
3. If MemWal returns a blob id, `walrus_status` becomes `stored`. Otherwise it
   stays `pending`, or becomes `failed`.

## Memory read path

Recall queries MemWal by namespace, then filters the results against the canonical
database so a forgotten or superseded memory never reappears.

## Public Career Passport

The passport is built by `src/features/walrus/services/career-snapshot.service.ts`
and contains only skills, target roles, employment types, and career level. It
excludes name, contact details, education, employers, salary, location, and
account identifiers.

- Publishing requires `confirmPublic: true`.
- Without a configured publisher the route returns 503 and publishes nothing.
  Walrus has no public unauthenticated Mainnet publisher, so public archival is
  disabled until an operator configures one.

## Network and configuration

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_WALRUS_NETWORK` | Public | `mainnet` by default |
| `MEMWAL_ACCOUNT_ID` | Server only | MemWal account for the agent |
| `MEMWAL_DELEGATE_PRIVATE_KEY` | Server only | Delegate key used to sign memory operations |
| `MEMWAL_SERVER_URL` | Server only | Relayer endpoint |
| `WALRUS_PUBLISHER_URL` | Server only | Optional; required only for public passport archival |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` | Public | Optional read endpoint override |

## Failure and privacy behavior

- A production build without MemWal credentials does not silently fall back to a
  mock. The client fails loudly on first use.
- A memory that is pending or failed is never shown as stored.
- Blobs are public. Content privacy comes from Seal encryption, not from Walrus.
- Forget removes a memory from recall. It does not delete the blob.

## Limitations to state honestly

- One MemWal account and one delegate key serve the whole application. User
  separation is by namespace, not by separate credentials.
- Walrus storage is time-limited per blob. MemWal manages that lifecycle, and a
  restore flow can rebuild the index from Walrus.
- Deletion of immutable storage is not guaranteed.

## Related

- [../ai/memory.md](../ai/memory.md)
- [../api/memory.md](../api/memory.md)
- [../api/career-profile.md](../api/career-profile.md)
