import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createClient(req?: NextRequest) {
  let cookieStore: any;
  try {
    cookieStore = await cookies();
  } catch {
    // In-memory / request cookie fallback when invoked outside Next.js request context (e.g. tests)
    if (req) {
      cookieStore = {
        getAll() {
          return req.cookies
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }));
        },
        set(name: string, value: string) {
          req.cookies.set(name, value);
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: any }>,
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
        },
      };
    } else {
      const mem = new Map<string, { value: string; options?: any }>();
      cookieStore = {
        getAll() {
          return Array.from(mem.entries()).map(([name, entry]) => ({
            name,
            value: entry.value,
          }));
        },
        set(name: string, value: string, options?: any) {
          mem.set(name, { value, options });
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: any }>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            mem.set(name, { value, options });
          });
        },
      };
    }
  }

  const authHeader = req?.headers.get("authorization");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: authHeader
        ? {
            headers: {
              Authorization: authHeader,
            },
          }
        : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            if (typeof cookieStore.setAll === "function") {
              cookieStore.setAll(cookiesToSet);
            } else if (typeof cookieStore.set === "function") {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options),
              );
            }
          } catch {
            // Ignored if called from read-only Server Component
          }
        },
      },
    },
  );
}
