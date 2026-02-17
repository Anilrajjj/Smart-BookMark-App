/**
 * components/Dashboard.tsx
 *
 * Client component that holds shared bookmark state.
 * Also listens for auth state changes — if user signs out in another tab,
 * this tab automatically redirects to the login page.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import { createClient } from "@/lib/supabaseClient";
import type { Bookmark } from "@/lib/types";

interface DashboardProps {
  initialBookmarks: Bookmark[];
}

export default function Dashboard({ initialBookmarks }: DashboardProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const router = useRouter();

  // ── Listen for auth state changes across tabs ──────────────────────────
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth event:", event);

      if (event === "SIGNED_OUT") {
        // User signed out (in this tab or another tab) — redirect to login
        router.push("/");
        router.refresh();
      }

      if (event === "SIGNED_IN") {
        // User signed in in another tab — refresh to load their data
        router.refresh();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Called by BookmarkForm immediately after successful insert
  const handleBookmarkAdded = useCallback((newBookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === newBookmark.id)) return prev;
      return [newBookmark, ...prev];
    });
  }, []);

  // Called by BookmarkList when a bookmark is deleted
  const handleBookmarkDeleted = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Called by BookmarkList when Realtime fires (cross-tab sync)
  const handleRealtimeInsert = useCallback((newBookmark: Bookmark) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.id === newBookmark.id)) return prev;
      return [newBookmark, ...prev];
    });
  }, []);

  const handleRealtimeDelete = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <>
      <BookmarkForm onBookmarkAdded={handleBookmarkAdded} />
      <BookmarkList
        bookmarks={bookmarks}
        onBookmarkDeleted={handleBookmarkDeleted}
        onRealtimeInsert={handleRealtimeInsert}
        onRealtimeDelete={handleRealtimeDelete}
      />
    </>
  );
}
