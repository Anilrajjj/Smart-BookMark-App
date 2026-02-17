/**
 * app/auth/callback/route.ts
 *
 * Route Handler for the Supabase OAuth callback.
 *
 * After the user authenticates with Google, Supabase redirects here with
 * a `code` query parameter. We exchange that code for a session and set
 * the auth cookies, then redirect the user to their dashboard.
 *
 * This URL must be registered as an allowed redirect URL in:
 *   - Supabase Dashboard > Authentication > URL Configuration > Redirect URLs
 *   - Google Cloud Console > OAuth 2.0 > Authorized redirect URIs
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` param lets us redirect to a specific page after login (optional)
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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
              // Ignore cookie errors in middleware context
            }
          },
        },
      }
    );

    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to dashboard (or wherever `next` points)
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("OAuth callback error:", error.message);
  }

  // If something went wrong, redirect back to home with an error param
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}
