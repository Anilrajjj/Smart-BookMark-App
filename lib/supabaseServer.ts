/**
 * lib/supabaseServer.ts
 *
 * Server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers. Uses @supabase/ssr to read auth cookies on the server.
 *
 * IMPORTANT: Must only be imported in Server Components or Route Handlers,
 * never in Client Components.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  // next/headers cookies() must be awaited in Next.js 14+
  const cookieStore = await cookies();

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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — cookies can only be
            // set inside middleware or Route Handlers. The try/catch prevents
            // the error from breaking server rendering.
          }
        },
      },
    }
  );
}
