# Next.js Conventions in Finder

Finder uses the Next.js App Router. This document lists the conventions that
matter when changing routing or server behavior. For framework concepts, see the
official Next.js documentation.

## Structure

- Pages and layouts live under `src/app`, grouped by route group such as `(app)`,
  `(auth)`, and `(marketing)`.
- API handlers live under `src/app/api/**/route.ts` and export named HTTP methods.
- Every API route sets `export const dynamic = "force-dynamic"` so it is never
  cached as static output.

## Middleware

Next.js 16 names the middleware entry `src/proxy.ts`. It refreshes the Supabase
session and redirects unauthenticated users away from protected pages. When you
add a new authenticated page, add it to the protected list in that file.

## Server versus client components

- Default to server components.
- Add `"use client"` only when the component needs state, effects, or browser
  APIs.
- Never import a server-only client (for example the service-role Supabase client)
  into a client component.

## Environment variables

- `NEXT_PUBLIC_*` values are inlined at build time and are visible to the browser.
  Only put non-secret configuration there.
- Server secrets are read at runtime and must never use the `NEXT_PUBLIC_` prefix.
- Because `NEXT_PUBLIC_*` is baked at build time, changing one requires a rebuild
  and redeploy.

## Build configuration

`next.config.mjs` keeps `pdf-parse` as a server external package, because it must
not be bundled for the client.

## Adding a route

1. Create `route.ts` under `src/app/api/...`.
2. Export the HTTP methods you need and mark the route dynamic.
3. Verify the session unless the route is deliberately public.
4. Validate the body with a schema.
5. Update [../api/overview.md](../api/overview.md) and the matching API document.
