<div>
  <img src="public/brand/finder-logo.png" alt="Finder logo" width="120" align="left" />
  
  <h1>Finder</h1>
  <p><strong>AI-Powered Career Intelligence Platform & Job Portal</strong></p>
  
  <a href="https://groq.com" target="_blank" rel="noopener noreferrer">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://console.groq.com/powered-by-groq-dark.svg" />
      <img alt="Powered by Groq for fast inference" src="https://console.groq.com/powered-by-groq-light.svg" height="28" />
    </picture>
  </a>
</div>
<br clear="both" />

Finder is an open-source platform that analyzes candidate resumes, extracts structured career profiles, and recommends matching job opportunities through an interactive, chat-first workspace.

Unlike traditional job boards that require users to search through raw keyword listings, Finder acts as a personal AI career advisor. Candidates upload their resume (PDF), which the system analyzes using Groq-accelerated models (`qwen/qwen3.8-27b`, fallback `openai/gpt-oss-20b`). The platform identifies core strengths, detects skill gaps, curates matching active jobs via a resilient two-stage matching pipeline, and provides an interactive Career Copilot for technical interview preparation.

---

## Key Features

- **Document Parsing & Text Extraction**: Drag-and-drop PDF resume upload with magic bytes verification (`%PDF-`), text extraction via `pdf-parse`, and storage in private Supabase buckets.
- **AI Candidate Profiling**: Structured profile extraction powered by Groq (`qwen/qwen3.8-27b` / Prompt v2.7, fallback `openai/gpt-oss-20b`) into candidate skills, experience, education, and career level.
- **Two-Stage Job Matching Engine**:
  - _Stage 1 (Deterministic)_: SQL skill-overlap pre-filter (limit 25) + weighted pre-ranking (Core: 2.0x, Supporting: 1.2x, General: 1.0x) to select the top 5 candidates.
  - _Stage 2 (Deterministic Re-score)_: Finder recomputes the final score deterministically from skill overlap and profile evidence, so the model never overrides the ranking.
- **Conversational Career Copilot**: Real-time multi-turn career consulting streaming via Server-Sent Events (SSE), pre-grounded with candidate strengths and active job requirements.
- **Job Discovery & Detail Drawer**: Curated job listings view with interactive match level, experience, and location filters, paired with an accessible WAI-ARIA detail drawer.
- **Dual Authentication (Web2 + Web3)**:
  - Standard email and password authentication with Supabase SSR session cookies.
  - Cryptographic **Sign-In with Sui (SIWS)** personal message verification with in-memory challenge nonces and synthetic account abstraction.
  - Sui Wallet linking and unlinking with unique address constraints.
- **Automated External Job Ingestion**: Scheduled job synchronization from Remotive API secured with timing-safe constant-time secret comparison.

---

## Tech Stack

| Layer                     | Technologies                                                                                                                                                             |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend Framework**    | [Next.js 16 (App Router)](https://nextjs.org), [React 19](https://react.dev)                                                                                             |
| **Styling & Components**  | [Tailwind CSS 4](https://tailwindcss.com), [Base UI](https://base-ui.com), [Lucide React](https://lucide.dev), [Sonner](https://sonner.emilkowal.ski)                    |
| **Backend & Runtime**     | Next.js Server & Edge Route Handlers, Node.js 22                                                                                                                         |
| **Database & Auth**       | [Supabase](https://supabase.com) (PostgreSQL 15+, Row Level Security, Auth SSR)                                                                                          |
| **AI / LLM Acceleration** | [Groq SDK](https://console.groq.com) (`qwen/qwen3.8-27b`, fallback `openai/gpt-oss-20b` - [Active Models](https://console.groq.com/docs/models))                      |
| **Web3 Blockchain**       | [@mysten/sui](https://sdk.mystenlabs.com/typescript), [@mysten/dapp-kit-react](https://sdk.mystenlabs.com/dapp-kit), [@tanstack/react-query](https://tanstack.com/query) |
| **Testing & Tooling**     | [Vitest 5](https://vitest.dev), ESLint 9, TypeScript 6                                                                                                                   |

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Browser"]
        UI["Next.js React 19 Frontend<br>(OmniPrompt, ChatTimeline, JobsView)"]
        WalletKit["@mysten/dapp-kit-react<br>(Sui Wallet Connection)"]
        SupabaseBrowser["@supabase/ssr Client<br>(Session State)"]
    end

    subgraph NextServer ["Next.js Server Runtime"]
        Middleware["proxy.ts<br>(Auth Route Guard)"]
        AuthRoutes["/api/auth/*<br>(Email Auth, SIWS Verifier, Wallet Link)"]
        ChatRoutes["/api/chat/*<br>(SSE Message Stream, Sessions)"]
        AnalysisRoutes["/api/upload-resume & /api/analyze<br>(PDF Parsing & Matching Orchestrator)"]
        SyncRoute["/api/jobs/sync<br>(Remotive Ingestion & Timing-Safe Guard)"]
    end

    subgraph ExternalServices ["External Cloud Services"]
        Supabase["Supabase Cloud<br>(PostgreSQL, Auth, RLS, Storage Bucket)"]
        Groq["Groq Cloud API<br>(qwen/qwen3.8-27b / openai/gpt-oss-20b)"]
        Remotive["Remotive Jobs API<br>(Remote Tech Jobs Feed)"]
        SuiNetwork["Sui Network<br>(Testnet / Mainnet RPC)"]
    end

    UI --> Middleware
    Middleware --> NextServer
    UI --> AuthRoutes
    UI --> ChatRoutes
    UI --> AnalysisRoutes
    WalletKit --> AuthRoutes

    AuthRoutes --> Supabase
    AuthRoutes --> SuiNetwork
    ChatRoutes --> Supabase
    ChatRoutes --> Groq
    AnalysisRoutes --> Supabase
    AnalysisRoutes --> Groq
    SyncRoute --> Remotive
    SyncRoute --> Supabase
```

---

## Prerequisites

- **Node.js**: `22.x` or later. Verify with:
  ```bash
  node -v
  ```
- **npm**: `10.x` or later.
- **Supabase Account**: A Supabase project with PostgreSQL database and Storage.
- **Groq API Key**: Free API key from [Groq Console](https://console.groq.com). For active model choices, see [Groq Supported Models](https://console.groq.com/docs/models).

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/DafinCi/Finder.git
cd Finder
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your configuration:

```env
# 1. Supabase Backend & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Application & Authentication URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 3. Groq AI Engine (Candidate Extraction, Job Matching & Career Copilot)
# Active models: https://console.groq.com/docs/models
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
# GROQ_AGENT_MODEL=openai/gpt-oss-20b
GROQ_MAX_TOKENS=2500

# 4. Web3 / Sui Blockchain Authentication (SIWS)
NEXT_PUBLIC_SUI_NETWORK=mainnet

# 5. Job Ingestion & Cron Sync
CRON_SECRET=your_secure_cron_sync_secret_here

# 6. Dedicated Test Environment Credentials (Optional for live integration tests)
# SUPABASE_TEST_URL=https://your-test-project.supabase.co
# SUPABASE_TEST_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_TEST_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 7. Walrus Memory (MemWal) - Sovereign Career Memory Persistence
MEMWAL_ACCOUNT_ID=0x0000000000000000000000000000000000000000000000000000000000000000
MEMWAL_DELEGATE_PRIVATE_KEY=your_memwal_delegate_private_key_here
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz

# 8. Walrus Storage Network
NEXT_PUBLIC_WALRUS_NETWORK=mainnet
# NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-mainnet.walrus.space
# WALRUS_PUBLISHER_URL=https://your-walrus-publisher.example
```

#### Environment Variables Breakdown

| Variable | Scope | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Required | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Required | Public Supabase anon key (safe for browser with RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Required | Secret Supabase service role key (never expose to client) |
| `NEXT_PUBLIC_SITE_URL` | Client & Server | Required | Canonical base URL for redirects, OAuth, and SIWS verification |
| `GROQ_API_KEY` | Server only | Required | Groq API key from [Groq Console](https://console.groq.com) |
| `GROQ_MODEL` | Server only | Optional (default: `qwen/qwen3.8-27b`) | Primary LLM model for candidate extraction, job matching, and career chat |
| `GROQ_FALLBACK_MODEL` | Server only | Optional (default: `openai/gpt-oss-20b`) | Fallback LLM model if primary encounters 429 rate limit or 503 overload |
| `GROQ_AGENT_MODEL` | Server only | Optional | Dedicated model for chat/agent tool-calling path (falls back to `GROQ_MODEL`) |
| `GROQ_MAX_TOKENS` | Server only | Optional (default: `2500`) | Maximum completion tokens per response |
| `NEXT_PUBLIC_SUI_NETWORK` | Client & Server | Optional (default: `mainnet`) | Target Sui network (`mainnet`, `testnet`, `devnet`, `localnet`) |
| `CRON_SECRET` | Server only | Dev: Optional / Prod: Required | Shared secret for authenticating `POST /api/jobs/sync` |
| `SUPABASE_TEST_URL` | Test only | Optional | Dedicated test DB URL for `npm run test:integration:live` |
| `SUPABASE_TEST_ANON_KEY` | Test only | Optional | Dedicated test DB anon key |
| `SUPABASE_TEST_SERVICE_ROLE_KEY` | Test only | Optional | Dedicated test DB service role key |
| `MEMWAL_ACCOUNT_ID` | Server only | Required for MemWal | 0x-prefixed 64 hex character MemWal agent account ID |
| `MEMWAL_DELEGATE_PRIVATE_KEY` | Server only | Required for MemWal | Delegate private key used to sign MemWal operations |
| `MEMWAL_SERVER_URL` | Server only | Optional (default: `https://relayer.memory.walrus.xyz`) | MemWal relayer endpoint |
| `NEXT_PUBLIC_WALRUS_NETWORK` | Client & Server | Optional (default: `mainnet`) | Target Walrus network (`mainnet` or `testnet`) |
| `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL` | Client & Server | Optional | Read endpoint for verifying published blobs (default public aggregator) |
| `WALRUS_PUBLISHER_URL` | Server only | Optional | Write endpoint for optional public career passport publishing |

### 3. Setup Database & Storage

1. In your Supabase project dashboard, open the **SQL Editor**.
2. Run [`src/database/schema_v2.sql`](src/database/schema_v2.sql) to create all tables, indexes, and RLS policies.
3. Optional, for local demos only: run [`src/database/seed-demo.sql`](src/database/seed-demo.sql) to add clearly marked sample companies and jobs. Skip this on production.
4. Run [`src/database/triggerAuth.sql`](src/database/triggerAuth.sql) to create the automated profile trigger.
5. In the **Storage** dashboard, create a private bucket named **`resumes`**.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command                           | Purpose                                                     |
| :-------------------------------- | :---------------------------------------------------------- |
| `npm run dev`                     | Start Next.js development server on `http://localhost:3000` |
| `npm run build`                   | Verify and build production bundle                          |
| `npm run start`                   | Start Next.js production server                             |
| `npm run lint`                    | Run ESLint code quality checks                              |
| `npx tsc --noEmit`                | Execute static TypeScript type checking                     |
| `npm run test:unit`               | Run hermetic unit tests                                     |
| `npm run test:integration:mocked` | Run hermetic mocked integration tests                       |
| `npm run test:integration:live`   | Run live Supabase integration tests (requires test DB)      |
| `npm run test:coverage`           | Run full test suite with V8 code coverage report            |

---

## Project Structure

```text
Finder/
├── .github/
│   ├── workflows/             # GitHub Actions CI & Discord notification pipelines
│   └── ISSUE_TEMPLATE/        # Bug report and feature request templates
├── docs/                      # Architectural, API, and database specifications
│   ├── architecture/          # System architecture & matching engine deep-dives
│   ├── api/                   # API route handlers reference
│   ├── database/              # Schema ERD, RLS policies, and triggers
│   └── development/           # Setup and testing guides
├── src/
│   ├── app/                   # Next.js App Router (Layouts, Pages, and API routes)
│   │   ├── (app)/             # Authenticated workspace routes (/, /c/[id], /jobs, /settings)
│   │   ├── (auth)/            # Auth routes (/login, /register)
│   │   └── api/               # 13 REST and SSE API route handlers
│   ├── components/            # Reusable UI widgets and application shell
│   ├── contexts/              # React context providers (Sidebar, etc.)
│   ├── database/              # SQL schemas, migration scripts, and auth triggers
│   ├── features/              # Feature-based domain slices
│   │   ├── ai-analysis/       # Resume extraction, orchestrator, summary cards
│   │   ├── auth/              # Email authentication hooks and forms
│   │   ├── chat/              # Timeline, omni-prompt, message dispatch, SSE parser
│   │   ├── jobs/              # Jobs view, filters, drawer, Remotive ingestion client
│   │   └── sui/               # Web3 wallet connection and SIWS linking cards
│   ├── lib/                   # Infrastructure clients (Supabase, Groq, Sui, Rate Limiter)
│   ├── types/                 # TypeScript interfaces (candidate, chat, database)
│   └── proxy.ts               # Supabase SSR auth route guard middleware
└── test/                      # 3-tier Vitest test suites
    ├── unit/                  # Hermetic unit tests
    ├── integration/mocked/    # Hermetic mocked integration tests
    ├── integration/live/      # Live Supabase integration tests
    └── mocks/                 # In-memory Supabase and Groq mock adapters
```

---

## Documentation

Full index: [`docs/README.md`](docs/README.md).

- [**Architecture Overview**](docs/architecture/overview.md)
- [**System Architecture**](docs/architecture/system-architecture.md)
- [**Domain Model**](docs/architecture/domain-model.md)
- [**Architecture Invariants**](docs/architecture/invariants.md)
- [**Failure Semantics**](docs/architecture/failure-semantics.md)
- [**API Overview**](docs/api/overview.md)
- [**Database & RLS**](docs/database/schema-and-rls.md)
- [**AI Agent Context**](docs/ai/agent-context.md)
- [**Walrus & MemWal**](docs/integrations/walrus-memwal.md)
- [**Local Setup**](docs/development/setup.md)
- [**Testing**](docs/development/testing.md)
- [**Coding Standards**](docs/development/coding-standards.md)
- [**Change Map**](docs/development/change-map.md)
- [**Design System**](docs/design/design-system.md)
- [**Glossary**](docs/glossary.md)
- [**Product Vision**](docs/product/vision.md)
- [**Roadmap**](docs/product/roadmap.md)
- [**Security Policy**](SECURITY.md)

---

## Data Handling & Privacy

- Resumes are stored privately in Supabase Storage and are never published to Walrus.
- Resume text is sent to Groq for extraction and matching. Groq is a third-party processor, so review your own compliance needs before real user data flows through it.
- Career memories live in Supabase and on Walrus through Walrus Memory. Walrus blobs are public by default, and Walrus Memory encrypts their contents with Seal so only the owner and authorized delegate keys can read them.
- The optional public career passport contains only skills, target roles, employment types, and career level. It excludes name, contact details, education, employers, salary, location, and account identifiers, and it publishes only after explicit confirmation.
- Forget hides a memory from chat recall and marks it forgotten in the database. It does not delete the encrypted blob already written to Walrus. Permanent blob deletion requires a separate deletion flow.
- Server logs record operational metadata such as IDs, model names, and durations. They are not intended to contain resume text, memory content, prompts, or credentials.

---

## Contributing

We welcome contributions! Please review our [**Contributing Guide**](CONTRIBUTING.md) and [**Code of Conduct**](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## License

This project is licensed under the [MIT License](LICENSE).
