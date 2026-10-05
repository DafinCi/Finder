# Glossary

Canonical terms used across Finder. Use these names in code, commits, issues, and
documentation.

| Term | Meaning | Owner | Not to be confused with |
| --- | --- | --- | --- |
| Identity | The authenticated Supabase account (`auth.users.id`) | Supabase Auth | Wallet address, profile id |
| Profile | The Supabase `profiles` row that links identity to app data | App database | Career Profile |
| Career Profile | Structured career data: intent, preferences, skills, background | App database (`career_profiles`) | User account |
| Wallet Identity | A Sui address linked to a Profile | App database (`profiles.sui_address`) | Login session |
| Resume | The uploaded PDF, stored privately in Supabase Storage | App storage | Extracted text, analysis |
| Resume Text | Text extracted from the PDF into `resumes.raw_text` | App database | The PDF file |
| Career Memory | A durable career fact owned by one Profile | App database (`career_memories`), mirrored to MemWal | Chat message |
| Memory Persistence | Whether a memory reached Walrus, tracked as `walrus_status` | App database | Whether the memory is active in recall |
| Job | A normalized job record used for matching | App database (`jobs`) | Saved job, recommendation |
| Match Score | Deterministic score for a Job against a Career Profile | Matching engine | LLM explanation text |
| Recommendation | A Job surfaced to a user with its Match Score | App | Saved job |
| Saved Job | A Job the user explicitly kept | App database (`saved_jobs`) | Recommendation |
| Rejected Job | A Job the user dismissed from recommendations | App database (`saved_jobs`) | Deleted job |
| Feedback | A user signal on a recommendation, used for memory correction | App database (`job_feedback_events`) | Telemetry |
| Telemetry | Interaction events used for product metrics | App database (`job_interaction_telemetry`) | Feedback |
| Chat Session | A conversation thread | App database (`chat_sessions`) | Career Memory |
| Chat Message | One turn inside a Chat Session | App database (`chat_messages`) | Career Memory |
| Agent | The assistant that answers using profile context and tools | App (`src/features/agent`) | The LLM model itself |
| Agent Tool | A typed operation the Agent may request | App (`agent-tool.definitions.ts`) | Arbitrary model output |
| Public Career Passport | An opt-in, minimized profile snapshot published to Walrus | App (`career-snapshot.service.ts`) | Full Career Profile |
