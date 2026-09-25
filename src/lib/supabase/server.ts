import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  let cookieStore: any;
  try {
    cookieStore = await cookies();
  } catch {
    // In-memory fallback if invoked outside Next.js request context (e.g. test environments)
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

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
