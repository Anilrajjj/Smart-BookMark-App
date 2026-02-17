/**
 * lib/supabaseClient.ts
 *
 * Browser-side Supabase client with Realtime configured to use
 * WebSocket with increased timeout and reconnection settings.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        timeout: 30000, // 30 seconds timeout (default is 10s)
        heartbeatIntervalMs: 15000, // ping every 15s to keep connection alive
        reconnectAfterMs: (tries: number) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
          return Math.min(1000 * Math.pow(2, tries - 1), 10000);
        },
      },
    }
  );
}