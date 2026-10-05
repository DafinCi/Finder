# Memory API

Career Memory is owned by `career_memories` and mirrored to MemWal for semantic
retrieval. See [../ai/memory.md](../ai/memory.md) for the architecture and
[../architecture/invariants.md](../architecture/invariants.md) for the rules.

## `GET /api/memory`

- **Purpose**: list the caller's memories and memory statistics.
- **Auth**: session.
- **Output**: memories plus counters (total, active, stored, pending, failed) and
  Walrus metadata used by the proof card.

## `POST /api/memory`

- **Purpose**: remember a new career fact.
- **Auth**: session.
- **Validation**: `CreateMemorySchema`.
- **Side effects**: writes the memory to Postgres immediately, supersedes an
  overlapping memory of the same category when one exists, then starts a
  background write to MemWal.
- **Notes**: this route is also the correction path when a user marks an answer
  unhelpful. Corrections are stored as a memory with the correction category.

## `DELETE /api/memory/[id]`

- **Purpose**: forget a memory.
- **Auth**: session, owner-scoped.
- **Side effects**: marks the memory `forgotten` in the database.
- **Important**: this does not delete the encrypted blob already written to
  Walrus. The memory disappears from recall, not from storage.

## `POST /api/memory/reinforce`

- **Purpose**: raise confidence for memories that produced a helpful answer.
- **Auth**: session.
- **Side effects**: bumps confidence one step (low to medium to high) for active
  memories only. Never throws on failure; a failed reinforcement must not break
  the chat UI.

## Persistence states

`walrus_status` is `pending`, `stored`, or `failed`. Only `stored` with a blob id
counts as persisted. The UI must not imply durability before that point.
