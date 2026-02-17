# Smart Bookmark App 🔖

A production-ready bookmark manager built with **Next.js 14 App Router**, **Supabase** (Auth + Database + Realtime), and **Tailwind CSS**. Deployed on **Vercel**.

## Features

- 🔐 **Google OAuth** — sign in with Google, no passwords
- 📌 **Private bookmarks** — Row Level Security ensures users see only their own data
- ⚡ **Real-time sync** — changes appear instantly across all open tabs via Supabase Realtime
- 🗑️ **Delete bookmarks** — with real-time removal across tabs
- 🔄 **Session persistence** — stays logged in after page refresh
- 📱 **Responsive** — works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Realtime | Supabase Realtime |
| Styling | Tailwind CSS |
| Deployment | Vercel |

---

## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Login page
│   ├── globals.css             # Global styles
│   ├── dashboard/
│   │   └── page.tsx            # Protected dashboard (Server Component)
│   └── auth/
│       └── callback/
│           └── route.ts        # OAuth callback Route Handler
├── components/
│   ├── LoginButton.tsx         # Google sign-in button (Client)
│   ├── Header.tsx              # Dashboard header + logout (Client)
│   ├── BookmarkForm.tsx        # Add bookmark form (Client)
│   └── BookmarkList.tsx        # Realtime bookmark list (Client)
├── lib/
│   ├── supabaseClient.ts       # Browser Supabase client
│   ├── supabaseServer.ts       # Server Supabase client
│   └── types.ts                # TypeScript interfaces
├── supabase/
│   └── schema.sql              # Database schema + RLS policies
├── middleware.ts               # Session refresh + route protection
├── .env.local.example          # Environment variable template
└── README.md
```

---

## Setup Instructions

### Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app.git
cd smart-bookmark-app
npm install
```

---

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and click **New Project**
2. Choose your organisation, enter a project name and database password
3. Select a region close to your users
4. Wait ~2 minutes for the project to be ready

---

### Step 3 — Set up the database

1. In your Supabase project, go to **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run** (the green ▶ button)
4. Verify: go to **Table Editor** — you should see a `bookmarks` table

---

### Step 4 — Enable Google OAuth

#### 4a. Create Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services** → **OAuth consent screen**
   - Choose **External**
   - Fill in app name, support email, developer email → Save
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Smart Bookmark App`
   - **Authorised redirect URIs** — add:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

#### 4b. Configure Supabase Google provider

1. In Supabase → **Authentication** → **Providers** → **Google**
2. Toggle **Enable Google provider** to ON
3. Paste your Google **Client ID** and **Client Secret**
4. Note the **Callback URL** shown — it should match what you entered in Google Console
5. Click **Save**

#### 4c. Configure Redirect URLs in Supabase

1. In Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://your-app.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://your-app.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

---

### Step 5 — Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values from Supabase → **Project Settings** → **API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note**: Google OAuth in local development requires that `http://localhost:3000/auth/callback`
> is added to your Supabase Redirect URLs (done in Step 4c) AND to your Google OAuth
> Authorised redirect URIs in Google Cloud Console.

---

### Step 7 — Deploy to Vercel

1. Push your code to a GitHub repository (make sure `.env.local` is in `.gitignore`)

2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo

3. In the Vercel project settings → **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   ```

4. Click **Deploy**

5. After deployment, copy your Vercel URL (e.g. `https://smart-bookmark-app-xyz.vercel.app`)

6. Update Supabase → Authentication → URL Configuration:
   - **Site URL**: `https://smart-bookmark-app-xyz.vercel.app`
   - **Redirect URLs**: add `https://smart-bookmark-app-xyz.vercel.app/auth/callback`

7. Update Google Cloud Console → OAuth credentials:
   - Add `https://smart-bookmark-app-xyz.vercel.app/auth/callback` to Authorised redirect URIs

---

## SQL Reference

### Table creation

```sql
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  url        TEXT NOT NULL CHECK (char_length(url) > 0 AND char_length(url) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RLS policies

```sql
-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- View own bookmarks only
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own bookmarks only
CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete own bookmarks only
CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

### Enable Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
```

---

## Challenges & Solutions

### Challenge 1: Session persistence after page refresh

**Problem**: Using `@supabase/auth-helpers-nextjs` (the old package) caused sessions to be lost on refresh in the App Router.

**Solution**: Migrated to `@supabase/ssr`, the official package for Next.js App Router. Created separate browser and server clients that both read from cookies. Added `middleware.ts` to refresh the session token on every request, which is the key to keeping users logged in.

---

### Challenge 2: Realtime not firing after INSERT from same client

**Problem**: When a user adds a bookmark, the realtime `INSERT` event could fire and create a duplicate in the UI, since the form submit already knew about the new row.

**Solution**: In `BookmarkList.tsx`, the realtime handler checks `if (prev.some((b) => b.id === newBookmark.id)) return prev;` before appending — deduplicating by `id`. The server-seeded initial data also means the list renders correctly on first load without a loading state.

---

### Challenge 3: Cookie handling in Next.js 14 Server Components

**Problem**: The `cookies()` API from `next/headers` became async in Next.js 14.2, breaking the `createServerClient` setup.

**Solution**: Made `createServerSupabaseClient` an `async` function that `await`s `cookies()` before passing them to `createServerClient`.

---

### Challenge 4: Protecting routes without full re-renders

**Problem**: Protecting `/dashboard` purely client-side causes a flash of content before the redirect.

**Solution**: Used `middleware.ts` for server-side route protection. Middleware runs before the page renders, so unauthenticated users are redirected before any HTML is sent to the browser.

---

## License

MIT
