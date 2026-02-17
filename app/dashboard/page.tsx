/**
 * app/dashboard/page.tsx
 * Protected dashboard - passes bookmark state between form and list.
 */

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  const { data: initialBookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-semibold text-slate-800">Your Bookmarks</h2>
          <p className="text-slate-500 text-sm mt-1">
            Add and manage your personal bookmarks. Changes sync in real time across all open tabs.
          </p>
        </div>
        {/* Dashboard is a client component that manages shared bookmark state */}
        <Dashboard initialBookmarks={initialBookmarks ?? []} />
      </main>
    </div>
  );
}
