# Product Roadmap & Technical Status

This document reflects the current implementation status and planned engineering milestones for Finder.

---

## Current Status (v0.1.0)

Finder is currently in active development on the `develop` branch. Core authentication, document ingestion, candidate profiling, two-stage job matching, and conversational copilot features are fully implemented and verified.

### Implemented Capabilities (:white_check_mark:)

- [x] **Dual Authentication Architecture**:
  - Email & password sign-up and sign-in via Supabase SSR.
  - Sign-In with Sui (SIWS) challenge-response authentication with in-memory single-use nonces.
  - Sui Wallet linking and unlinking with unique address constraints.
- [x] **Resume Ingestion & Processing**:
  - Drag-and-drop PDF upload with magic bytes verification.
  - In-memory text extraction via `pdf-parse` (up to 15,000 characters).
  - Secure storage in private Supabase bucket `resumes`.
- [x] **AI Candidate Profile Extraction**:
  - Prompt v2.7 executed against Groq (`qwen/qwen3.8-27b`, fallback `openai/gpt-oss-20b`).
  - Structured JSON candidate data extraction with Zod schema validation.
- [x] **Two-Stage Job Matching Engine**:
  - SQL skill-overlap pre-filter (limit 25).
  - Deterministic pre-ranking with weighted core (2.0x), supporting (1.2x), and general (1.0x) skills.
  - Groq AI qualitative evaluation for top-5 candidates.
  - Deterministic fallback scoring formula (`55 + overlapRatio * 35`) for 429/503 resilience.
- [x] **Conversational Career Copilot**:
  - Server-Sent Events (SSE) token streaming via Groq.
  - System prompt context injection of candidate strengths, core skills, and top matched jobs.
- [x] **Recommended Jobs Exploration**:
  - Filterable jobs view with match level, experience, and location selectors.
  - WAI-ARIA accessible job detail drawer with external application portal links.
- [x] **Automated Testing & CI**:
  - 3-tier Vitest test architecture (Unit, Hermetic Mocked Integration, Live Supabase Integration).
  - GitHub Actions automated quality gates (Lint, Typecheck, Build, Tests).

---

## Planned Capabilities (:construction:)

- [ ] **Decentralized Walrus Storage & MemWal Integration**:
  - Store encrypted resume PDF blobs on Walrus decentralized storage.
  - Integrate MemWal SDK for persistent, cross-session agent memory.
- [ ] **Candidate Profile Builder**:
  - Manual profile editing interface to allow candidates to correct or enhance extracted skills.
- [ ] **Job Interaction Enhancements**:
  - Job bookmarking / saved jobs.
  - Job hiding / rejection to exclude unwanted roles from recommendations.
  - Application status tracking (Applied, Interviewing, Offered).
- [ ] **Public Job Search**:
  - Allow unauthenticated or resume-less exploration of active job listings.
- [ ] **Agentic Tool Calling**:
  - Enable Groq tool calling in Career Copilot for dynamic job queries and database actions.
