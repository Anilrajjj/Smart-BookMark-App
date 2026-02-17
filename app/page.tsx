/**
 * app/page.tsx
 *
 * Landing / Login page.
 * This is a Server Component — it checks the session on the server.
 * If the user is already logged in, middleware.ts redirects to /dashboard.
 */

import LoginButton from "@/components/LoginButton";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center space-y-6">
          {/* Logo / Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Smart Bookmark App
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Save, organise, and access your bookmarks from anywhere.
              Real-time sync across all your tabs.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {["Real-time sync", "Private bookmarks", "Google login"].map(
              (f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                >
                  {f}
                </span>
              )
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Login button (Client Component) */}
          <LoginButton />

          <p className="text-xs text-slate-400">
            By signing in, you agree to our Terms of Service.
            <br />
            Your bookmarks are private and only visible to you.
          </p>
        </div>
      </div>
    </main>
  );
}
