# AI Provider Integration (Groq)

Finder uses Groq as its model provider. This document covers the integration, not
Groq itself. For model and API details, see the official Groq documentation.

## Why Groq

The agent and the analysis pipeline need low-latency streaming and a
non-Anthropic, non-OpenAI primary model. Groq provides both.

## Models

| Role | Default | Variable |
| --- | --- | --- |
| Primary | `qwen/qwen3.8-27b` | `GROQ_MODEL` |
| Fallback on 429 or 503 | `openai/gpt-oss-20b` | `GROQ_FALLBACK_MODEL` |
| Optional agent model | unset | `GROQ_AGENT_MODEL` |

`GET /api/agent/status` reports the models actually in use.

## Client behavior in `src/lib/groq/client.ts`

- 30 second request timeout so a serverless route cannot hang.
- One retry on the fallback model for recoverable errors (rate limit or
  overload). Non-recoverable errors are rethrown.
- A deterministic fallback path exists for resume matching so a provider outage
  does not break recommendations.
- `GROQ_MAX_TOKENS` caps completion length.

## Output validation

Structured responses are parsed and validated with Zod. A parse or schema failure
fails the operation. Raw model output is never written to logs, because it can
contain resume-derived data.

## What the model is not allowed to do

- Set or override a Match Score.
- Decide identity or ownership.
- Be the evidence that a write succeeded.

See [../architecture/invariants.md](../architecture/invariants.md).

## Configuration

| Variable | Scope | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Server only | Provider credential |
| `GROQ_MODEL` | Server only | Primary model |
| `GROQ_FALLBACK_MODEL` | Server only | Fallback model |
| `GROQ_AGENT_MODEL` | Server only | Optional agent model |
| `GROQ_MAX_TOKENS` | Server only | Completion cap |
