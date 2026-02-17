/**
 * components/Dashboard.tsx
 *
 * Client component that holds shared bookmark state.
 * Passes bookmarks and the add-callback to both BookmarkForm and BookmarkList.
 * This way adding a bookmark updates the list INSTANTLY without needing Realtime.
 */

"use client";

import { useState, useCallback } from "react";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkList from "@/components/BookmarkList";
import type { Bookmark } from "@/lib/types";

interface DashboardProps {
  initialBookmarks: Bookmark[];
}

export default function Dashboard({ initialBookmarks }: DashboardProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

  // Called by BookmarkForm immediately after successful insert
  const handleBookmarkAdded = useCallback((newBookmark: Bookmark) => {
    setBookmarks((prev) => {
      // Prevent duplicates
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
