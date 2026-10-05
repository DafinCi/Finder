# AI Overview

Finder uses Groq-hosted models for three jobs: extracting a structured profile
from resume text, explaining job matches, and answering as the career agent.

## Where AI is used

| Job | Entry point | Output | Authority |
| --- | --- | --- | --- |
| Profile extraction | `src/lib/groq/profile-extractor.ts` | Structured candidate JSON | Advisory; the profile service validates and stores it |
| Document classification | `src/lib/groq/document-classifier.ts` | Is this a resume, and why | Advisory; drives a product decision |
| Match explanation | `src/lib/groq/job-matcher.ts` | Explanation text | Advisory only; the score is deterministic |
| Agent answers and tools | `src/features/agent` | Streamed answer plus tool requests | The model requests; the backend executes and decides |

## Model configuration

- Primary: `qwen/qwen3.8-27b` via `GROQ_MODEL`.
- Fallback on 429 or 503: `openai/gpt-oss-20b` via `GROQ_FALLBACK_MODEL`.
- Optional dedicated agent model: `GROQ_AGENT_MODEL`.

Model names are reported by `GET /api/agent/status` so the UI can show what is
actually running.

## Validation

Every structured model output is parsed and validated with Zod before it is used.
Invalid output fails the request instead of being stored. Raw model output is not
written to logs.

## What the model must never be

- Authoritative for identity, ownership, or Match Scores.
- A source of truth for persisted state.
- Trusted to claim that a write happened.

See [../architecture/invariants.md](../architecture/invariants.md).

## Documents

- [agent.md](agent.md) for the chat agent
- [tools.md](tools.md) for Agent Tools
- [memory.md](memory.md) for durable memory and MemWal
- [prompting.md](prompting.md) for prompt structure and precedence
- [agent-context.md](agent-context.md) for a coding-agent summary
