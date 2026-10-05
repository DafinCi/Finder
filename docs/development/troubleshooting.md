# Troubleshooting

## Setup

**`Node.js detected but native WebSocket not found`**
You are on Node older than 22. Upgrade to Node 22 or newer.

**Build fails fetching Google Fonts**
The build fetches the font at compile time. A blocked network will fail the
build with a font error. Allow network access during build, or vendor the font.

**Build fails with `MemWal is not configured`**
This happened when the MemWal client was constructed at import time. It is now
created lazily, so the build no longer needs runtime credentials. If you see this
again, check that nothing constructs the client at module scope.

## Database

**`Database error while checking wallet identity`**
Usually a wrong key. Confirm `SUPABASE_SERVICE_ROLE_KEY` is the service-role
secret and not the anon key, and that `schema_v2.sql` has been applied.

**RLS blocks a query you expect to work**
The authenticated user's id must match the row owner. Server code that must read
across users has to use the service-role client, which is server-only.

## AI

**Groq returns 429**
The rate limit or token quota is exhausted. Finder retries once on the fallback
model. If both fail, the request returns a safe error. Check `GROQ_MODEL` and
`GROQ_FALLBACK_MODEL`.

**The agent answers without memory**
Recall returns empty on failure by design. Check MemWal credentials and the
memory status for the user.

## Sui

**Wallet rejected with a network mismatch**
The wallet network must match `NEXT_PUBLIC_SUI_NETWORK`. It defaults to mainnet in
production. Switch the wallet, or change the variable and rebuild.

**`RESUME_ARCHIVAL_DISABLED`**
This is intentional. Resumes are never published to Walrus.

## Tests

**Live tests fail with `fetch failed`**
They need network access and real credentials. Run them only in an environment
with both.

**`npm test` tries to run live tests**
That is expected. Use `npm run test:unit` and
`npm run test:integration:mocked` for local work.
