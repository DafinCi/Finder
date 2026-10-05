# Supabase Integration

Finder uses Supabase for authentication, the Postgres database, and private file
storage. This document covers how Finder uses Supabase, not what Supabase is.
For platform concepts, see the official Supabase documentation.

## What Finder uses

| Capability | Used for | Notes |
| --- | --- | --- |
| Supabase Auth | Email and password accounts, sessions | Sessions are cookie-based through `@supabase/ssr` |
| Postgres | All application data | Row Level Security is enabled on user tables |
| Storage | Resume PDFs | Private bucket named `resumes` |

## Two clients, two trust levels

- `src/lib/supabase/server.ts` builds a request-scoped client using the anon key
  and the caller's cookies. It is used to read the authenticated user.
- `src/lib/supabase/admin.ts` builds a service-role client. It bypasses Row Level
  Security and must only run on the server. It is used for trusted operations
  such as storage access and admin lookups.

Never expose the service-role key to the browser, and never add a `NEXT_PUBLIC_`
prefix to it.

## Row Level Security

Every user-owned table enables RLS and scopes rows to the authenticated identity
with `auth.uid() = profile_id` or `auth.uid() = id`. This means a leaked anon key
cannot read another user's data on its own. The exact policies live in
`src/database/schema_v2.sql` and the migrations; that file is authoritative.

## Identity provisioning

A database trigger (`handle_new_user`) creates a `profiles` row when a new
`auth.users` row appears, so every account has a profile from the start.

## Configuration

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public key, safe with correct RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Administrative access |

## Related

- [../api/authentication.md](../api/authentication.md)
- [../architecture/data-ownership.md](../architecture/data-ownership.md)
- [../database/schema-and-rls.md](../database/schema-and-rls.md)
