/**
 * components/Header.tsx
 *
 * Dashboard header — shows the app name, logged-in user's avatar/name,
 * and a Logout button.
 *
 * Receives the `user` object as a prop from the Server Component parent,
 * so it can be a Client Component that handles the logout action.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";
import Image from "next/image";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Extract user display info from Google OAuth metadata
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;

  const email = user.email;

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* App name / logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-base hidden sm:block">
            Smart Bookmarks
          </span>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-slate-100 object-cover"
              />
            ) : (
              // Fallback initial avatar
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border-2 border-slate-100">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {displayName}
              </p>
              {email && (
                <p className="text-xs text-slate-400 leading-tight truncate max-w-[160px]">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       text-slate-600 hover:bg-slate-100 hover:text-slate-900
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1
                       transition-all duration-150"
          >
            {isLoggingOut ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
            <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
