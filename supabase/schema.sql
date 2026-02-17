-- ═══════════════════════════════════════════════════════════════
--  Smart Bookmark App — Supabase Database Setup
--  Run this entire script in the Supabase SQL Editor:
--  Dashboard → SQL Editor → New Query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Create the bookmarks table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  url        TEXT NOT NULL CHECK (char_length(url) > 0 AND char_length(url) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries (essential for large datasets)
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);

-- Index for sorted fetches (most recent first)
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON public.bookmarks(created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- 2. Enable Row Level Security (RLS)
--    IMPORTANT: Without RLS enabled, any authenticated user
--    can read/write everyone else's bookmarks.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 3. RLS Policies
--    auth.uid() returns the UUID of the currently authenticated user.
--    Each policy checks that user_id = auth.uid() so users can
--    only touch their own rows.
-- ─────────────────────────────────────────────────────────────

-- Allow users to SELECT only their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to INSERT bookmarks only for themselves
-- (also prevents spoofing another user's user_id)
CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE only their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: We intentionally omit an UPDATE policy since this app
-- does not have an edit feature. Add one if needed later.


-- ─────────────────────────────────────────────────────────────
-- 4. Enable Realtime for the bookmarks table
--    Required for Supabase Realtime subscriptions to work.
-- ─────────────────────────────────────────────────────────────
-- Run this in the SQL Editor to add bookmarks to the realtime publication:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;


-- ─────────────────────────────────────────────────────────────
-- 5. (Optional) Verify setup — run these SELECT statements to check
-- ─────────────────────────────────────────────────────────────

-- Check the table exists:
-- SELECT * FROM public.bookmarks LIMIT 5;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'bookmarks';

-- Check policies:
-- SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
