# Data Ownership

Every piece of data has one authoritative owner. When two systems hold the same
fact, the one listed here wins.

| Data | Authoritative source | Mirrors | Never authoritative |
| --- | --- | --- | --- |
| Login identity | Supabase Auth (`auth.users`) | — | Wallet address |
| Wallet identity | `profiles.sui_address` | — | Wallet session state |
| Career Profile | `career_profiles` | UI cache | Chat history |
| Resume file | Supabase Storage, private bucket `resumes` | — | Walrus |
| Resume text | `resumes.raw_text` | — | Client state |
| Resume processing state | `resume_processing` | UI polling | Optimistic UI |
| Career Memory | `career_memories` | MemWal, for semantic retrieval | Chat messages |
| Memory persistence | `career_memories.walrus_status` | — | UI labels |
| Job facts | `jobs` and `companies` | Remotive feed at ingestion time | Model output |
| Match score | Matching engine | `job_matches` snapshot | Model output |
| Saved or rejected job | `saved_jobs` | Client list | Model output |
| Feedback | `job_feedback_events` | Corrected Career Memory | Model output |
| Telemetry | `job_interaction_telemetry` | — | Any analytics cache |
| Chat history | `chat_sessions` and `chat_messages` | — | Career Memory |
| Public Career Passport | `career_snapshot` blob on Walrus | Blob id in user metadata | Full Career Profile |

## Rules

- The database is canonical for anything the user can change. MemWal and Walrus
  are retrieval and durability layers, not the source of truth.
- The model is never authoritative for identity, scores, persistence, or
  ownership.
- The browser is never authoritative. It may show optimistic state, but the
  server decides.
