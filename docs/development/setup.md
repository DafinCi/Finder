# Local Development Setup

This guide provides step-by-step instructions to configure and run Finder on your local workstation.

---

## Prerequisites

Before starting, verify you have the following installed:

- **Node.js**: Version `22.x` or later (tested on Node 22). Check with:
  ```bash
  node -v
  ```
- **npm**: Version `10.x` or later. Check with:
  ```bash
  npm -v
  ```
- **Git**: Installed and configured.
- **Supabase Account**: A Supabase project (cloud or local Supabase CLI).
- **Groq API Key**: An API key from [Groq Console](https://console.groq.com) (free tier supported).
- **Sui Wallet (Optional for Web3 testing)**: Sui Wallet or Slush browser extension connected to `testnet`.

---

## Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/DafinCi/Finder.git
cd Finder

# Install project dependencies using npm
npm install
```

---

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Groq AI Configuration (Active models: https://console.groq.com/docs/models)
GROQ_API_KEY=gsk_your_actual_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
GROQ_MAX_TOKENS=2500

# Application Base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Sui Web3 Configuration
NEXT_PUBLIC_SUI_NETWORK=mainnet

# Cron Sync Secret (optional in development; allows bypass when unset)
CRON_SECRET=dev_secret_12345
```

---

## Step 3: Database & Storage Setup

1. Open your Supabase Dashboard:
   - Navigate to the **SQL Editor**.
2. Run the consolidated schema script:
   - Copy the entire contents of [`src/database/schema_v2.sql`](../../src/database/schema_v2.sql) and execute it.
   - This script creates all tables, indexes, constraints, and RLS policies.
   - Optional, for local demos only: run [`src/database/seed-demo.sql`](../../src/database/seed-demo.sql) to add clearly marked sample companies and jobs. Skip this on production.
3. Run the Auth Trigger script:
   - Copy the contents of [`src/database/triggerAuth.sql`](../../src/database/triggerAuth.sql) and execute it.
   - This ensures the `on_auth_user_created` trigger automatically provisions profiles for new users.
4. Create the Storage Bucket:
   - Navigate to **Storage** in the Supabase Dashboard.
   - Create a new bucket named **`resumes`**.
   - Set the bucket to **Private** (authenticated RLS will control access).

---

## Step 4: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 5: Seed Jobs (Optional)

To ingest live tech jobs from the Remotive API into your local database:

```bash
curl -X POST http://localhost:3000/api/jobs/sync
```

_(In development mode, requests succeed even without the `CRON_SECRET` header)._

---

## Troubleshooting Common Setup Issues

### 1. `Node.js detected but native WebSocket not found`

- **Cause**: Running on an older Node version (< 22) where Supabase Realtime fails to find native global `WebSocket`.
- **Solution**: Upgrade to Node.js 22+. Verify with `node -v`.

### 2. `Database error while checking wallet identity`

- **Cause**: Missing database schema, missing tables, or incorrect `SUPABASE_SERVICE_ROLE_KEY`.
- **Solution**: Ensure you ran `schema_v2.sql` in the Supabase SQL editor and that `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is the service-role secret (not the anon key).

### 3. Groq `429 Too Many Requests`

- **Cause**: Groq free tier TPM (tokens per minute) limit reached.
- **Solution**: Finder automatically attempts fallback to `openai/gpt-oss-20b`. You can also configure an active alternative model from [Groq Supported Models](https://console.groq.com/docs/models) or check usage in the Groq console.

### 4. Sui Wallet Connection Fails or Rejected

- **Cause**: Wallet extension set to a different network than configured in `.env.local`.
- **Solution**: Ensure your browser wallet (e.g., Sui Wallet) is switched to the network in `NEXT_PUBLIC_SUI_NETWORK` (mainnet by default), and that the value matches the deployment.
