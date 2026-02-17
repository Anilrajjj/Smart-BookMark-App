/**
 * components/BookmarkList.tsx
 *
 * Fixed: Waits for SIGNED_IN auth event before starting Realtime subscription.
 * This ensures Tab 2 connects properly when navigated to dashboard via auth sync.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Bookmark } from "@/lib/types";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkDeleted: (id: string) => void;
  onRealtimeInsert: (bookmark: Bookmark) => void;
  onRealtimeDelete: (id: string) => void;
}

export default function BookmarkList({
  bookmarks,
  onBookmarkDeleted,
  onRealtimeInsert,
  onRealtimeDelete,
}: BookmarkListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const startRealtime = (userId: string) => {
      // Prevent duplicate subscriptions
      if (isSubscribed) return;
      isSubscribed = true;

      channel = supabase
        .channel(`bookmarks_user_${userId}_v5`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "bookmarks" },
          (payload) => {
            const newBookmark = payload.new as Bookmark;
            if (newBookmark.user_id !== userId) return;
            onRealtimeInsert(newBookmark);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "bookmarks" },
          (payload) => {
            const deletedId = payload.old.id as string;
            onRealtimeDelete(deletedId);
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);
          if (status === "SUBSCRIBED") setRealtimeStatus("connected");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setRealtimeStatus("error");
          }
        });
    };

    // ✅ Step 1: Try to get existing session immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Session already available (e.g. Tab 1 or page refresh)
        startRealtime(user.id);
      }
      // If no user yet, Step 2 below will catch it
    });

    // ✅ Step 2: Also listen for SIGNED_IN in case session arrives slightly late
    // This handles Tab 2 which gets redirected via onAuthStateChange
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        startRealtime(session.user.id);
      }
    });

    return () => {
      isSubscribed = false;
      authSubscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [onRealtimeInsert, onRealtimeDelete]);

  // ── Delete — optimistic (instant) ───────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setDeleteError(null);
    onBookmarkDeleted(id);
    setDeletingIds((prev) => new Set(prev).add(id));

    const supabase = createClient();
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      setDeleteError(`Failed to delete: ${error.message}`);
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) data.forEach((b) => onRealtimeInsert(b as Bookmark));
    }

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [onBookmarkDeleted, onRealtimeInsert]);

  // ── Status colors ────────────────────────────────────────────────────────
  const statusColor =
    realtimeStatus === "connected" ? "#10b981" :
    realtimeStatus === "error" ? "#ef4444" : "#f59e0b";

  const statusLabel =
    realtimeStatus === "connected" ? "Live" :
    realtimeStatus === "error" ? "Disconnected" : "Connecting...";

  // ── Empty state ──────────────────────────────────────────────────────────
  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h3 className="text-slate-600 font-semibold text-sm">No bookmarks yet</h3>
        <p className="text-slate-400 text-xs mt-1">Add your first bookmark using the form above.</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColor }}>
          <span className="relative flex h-2 w-2">
            {realtimeStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: statusColor }} />
          </span>
          {statusLabel}
        </span>
      </div>

      {deleteError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-red-600">{deleteError}</p>
        </div>
      )}

      <ul className="space-y-2">
        {bookmarks.map((bookmark) => (
          <li
            key={bookmark.id}
            className="group bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200 animate-slide-up"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="flex-shrink-0">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(bookmark.url)}&sz=32`}
                  alt=""
                  className="w-6 h-6 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{bookmark.title}</p>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate block transition-colors duration-150"
                >
                  {bookmark.url}
                </a>
              </div>

              {isMounted && (
                <span className="text-xs text-slate-300 hidden sm:block flex-shrink-0">
                  {formatDate(bookmark.created_at)}
                </span>
              )}

              <button
                onClick={() => handleDelete(bookmark.id)}
                disabled={deletingIds.has(bookmark.id)}
                className="btn-danger flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete bookmark: ${bookmark.title}`}
              >
                {deletingIds.has(bookmark.id) ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                <span>Delete</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
