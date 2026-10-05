# Local Setup

## Prerequisites

- Node.js 22 or newer. The project relies on native WebSocket in Node 22, and the
  CI uses Node 22.
- npm.
- A Supabase project. A free project is enough for development.
- A Groq API key.
- A MemWal account and delegate key if you want memory to work against a real
  relayer.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values. `.env.local` is
gitignored and must never be committed.

Required for the app to run:

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never expose to the browser |
| `GROQ_API_KEY` | Server only | Provider credential |

Required for memory to work:

| Variable | Scope |
| --- | --- |
| `MEMWAL_ACCOUNT_ID` | Server only |
| `MEMWAL_DELEGATE_PRIVATE_KEY` | Server only |

Common optional variables: `GROQ_MODEL`, `GROQ_FALLBACK_MODEL`,
`GROQ_AGENT_MODEL`, `GROQ_MAX_TOKENS`, `MEMWAL_SERVER_URL`,
`NEXT_PUBLIC_WALRUS_NETWORK`, `NEXT_PUBLIC_SUI_NETWORK`, `CRON_SECRET`,
`NEXT_PUBLIC_SITE_URL`, and `WALRUS_PUBLISHER_URL`.

## 3. Set up the database and storage

Run these in the Supabase SQL editor, in order:

1. `src/database/schema_v2.sql` creates the tables, indexes, constraints, and RLS
   policies.
2. `src/database/triggerAuth.sql` creates the profile provisioning trigger.
3. Optional, for local demos only: `src/database/seed-demo.sql` inserts clearly
   marked sample companies and jobs. Skip this on production.

Then create a private Storage bucket named `resumes`.

## 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. Verify quality gates

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:integration:mocked
npm run build
```

## Notes

- `NEXT_PUBLIC_*` values are baked at build time, so changing one requires a
  restart of the dev server and a rebuild for production.
- Missing MemWal credentials fail loudly at first use instead of falling back to a
  mock. That is intentional.

See [troubleshooting.md](troubleshooting.md) if something does not start.
