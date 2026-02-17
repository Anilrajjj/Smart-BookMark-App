/**
 * app/dashboard/page.tsx
 *
 * Protected dashboard page.
 * This is a Server Component — it fetches the authenticated user on the server
 * so there's no flash of unauthenticated content.
 *
 * Middleware also protects this route (double protection).
 */

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";

export default async function DashboardPage() {
  // Verify the user is authenticated on the server
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated (middleware catches this too)
  if (error || !user) {
    redirect("/");
  }

  // Fetch initial bookmarks server-side for instant first render (no loading flash)
  const { data: initialBookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with user info and logout */}
      <Header user={user} />

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome message */}
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold text-slate-800">
            Your Bookmarks
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Add and manage your personal bookmarks. Changes sync in real time
            across all open tabs.
          </p>
        </div>

        {/* Add bookmark form (Client Component) */}
        <BookmarkForm />

        {/* Bookmark list with real-time updates (Client Component) */}
        <BookmarkList initialBookmarks={initialBookmarks ?? []} />
      </main>
    </div>
  );
}
