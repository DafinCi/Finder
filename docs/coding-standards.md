# Coding Standards & Conventions

This document outlines the code quality, TypeScript standards, and architectural patterns enforced in the Finder repository.

---

## 1. Architecture: Feature-Based Design

Code is organized into domain-specific features under `src/features/`:

- `ai-analysis/`: Candidate profile extraction, analysis orchestrator service, summary cards.
- `auth/`: Email authentication hooks, forms, and session state.
- `chat/`: Real-time chat timeline, omni-prompt omnibar, message dispatch, SSE parser.
- `jobs/`: Job discovery view, filter toolbar, job drawer, ingestion service, Remotive adapter.
- `sui/`: Web3 wallet connection, SIWS verification, wallet linking UI cards.

Shared infrastructure code resides in:

- `src/lib/`: Database clients (`supabase/`), AI clients (`groq/`), Web3 utilities (`sui/`), rate limiters.
- `src/components/`: Common UI widgets, layout shell, providers, and base components.
- `src/types/`: Global TypeScript interfaces (`candidate.ts`, `chat.ts`, `database.ts`).

---

## 2. Layer Responsibilities

```text
View / Page (Orchestrates layout & connects hooks)
    ↓
Custom Hook (Manages client state, effects, & DOM lifecycle)
    ↓
Domain Service (Encapsulates business logic, API calls, & transformations)
    ↓
API Route Handler (Validates input, enforces auth & rate limits, calls services)
    ↓
Database / External API (Supabase PostgreSQL / Groq API / Sui RPC)
```

- **Components**: Responsible purely for rendering UI and receiving user events. Never execute direct database queries or AI API calls inside UI components.
- **Hooks**: Responsible for reactive client state. Do not render JSX inside hooks.
- **Services**: Pure TypeScript functions and domain objects containing business logic. Services never import React components.
- **API Route Handlers**: Validate input payloads, check authorization via Supabase SSR, handle error mapping, and return standardized JSON / SSE streams.

---

## 3. TypeScript Guidelines

- **Strict Mode**: The project enforces `"strict": true` in `tsconfig.json`.
- **No Implicit Any**: Explicitly type function parameters, return types, and complex object structures.
- **Prefer Interfaces & Type Aliases**: Define explicit interfaces for domain models and API responses in `src/types/` or co-located within domain schemas.
- **Zod for Runtime Boundaries**: Always validate untrusted external inputs (API request bodies, external job feeds, LLM JSON outputs) using Zod schemas (`src/features/*/schemas/` and `src/lib/groq/schemas/`).

---

## 4. Error Handling & User Feedback

- **Never Expose Raw Server Stack Traces**: Catch internal exceptions and return normalized, human-friendly error messages using `normalizeGroqError` or standard error structures.
- **HTTP Status Codes**:
  - `400 Bad Request`: Validation failure or missing required fields.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Cross-tenant attempt (e.g., accessing another user's session or resume).
  - `404 Not Found`: Entity does not exist.
  - `409 Conflict`: Concurrency lock collision or unique constraint violation (e.g., wallet already linked).
  - `429 Too Many Requests`: Rate limit triggered.
- **Client Feedback**: Display actionable toast notifications via `sonner` (`toast.error(...)`, `toast.success(...)`).
