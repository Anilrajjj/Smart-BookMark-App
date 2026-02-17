/**
 * components/BookmarkForm.tsx
 * Add bookmark form with strict URL validation.
 */

"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Bookmark } from "@/lib/types";

interface BookmarkFormProps {
  onBookmarkAdded: (bookmark: Bookmark) => void;
}

export default function BookmarkForm({ onBookmarkAdded }: BookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Adds https:// if protocol is missing
  const normaliseUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required.";
    if (!url.trim()) return "URL is required.";

    try {
      const parsed = new URL(normaliseUrl(url));

      // Only allow http and https protocols
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "URL must use http:// or https://.";
      }

      const hostname = parsed.hostname;

      // Must have a dot — rejects plain words like 'hello', 'test', 'random'
      if (!hostname.includes(".")) {
        return "Please enter a real URL with a domain (e.g. https://example.com).";
      }

      // Split into parts: ['google', 'com'] or ['sub', 'google', 'com']
      const parts = hostname.split(".");

      // Each part must be non-empty
      if (parts.some((p) => p.length === 0)) {
        return "Please enter a valid URL (e.g. https://example.com).";
      }

      // TLD (last part like .com .io .in) must be 2-6 letters only
      const tld = parts[parts.length - 1];
      if (!/^[a-zA-Z]{2,6}$/.test(tld)) {
        return "Please enter a valid URL (e.g. https://example.com).";
      }

      // Domain name (second to last part) must be at least 1 char
      const domain = parts[parts.length - 2];
      if (!domain || domain.length < 1) {
        return "Please enter a valid URL (e.g. https://example.com).";
      }

      // Only allow valid hostname characters
      if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
        return "URL contains invalid characters.";
      }

    } catch {
      return "Please enter a valid URL (e.g. https://example.com).";
    }

    return null; // all good
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to add bookmarks.");
      setIsSubmitting(false);
      return;
    }

    const normalizedUrl = normaliseUrl(url);

    const { data, error: insertError } = await supabase
      .from("bookmarks")
      .insert({ title: title.trim(), url: normalizedUrl, user_id: user.id })
      .select()
      .single();

    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) onBookmarkAdded(data as Bookmark);

    setTitle("");
    setUrl("");
    setSuccess(true);
    titleRef.current?.focus();
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-fade-in">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add New Bookmark
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="bookmark-title" className="block text-xs font-medium text-slate-600 mb-1">
            Title
          </label>
          <input
            ref={titleRef}
            id="bookmark-title"
            type="text"
            placeholder="e.g. Supabase Docs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="input-field"
            maxLength={200}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="bookmark-url" className="block text-xs font-medium text-slate-600 mb-1">
            URL
          </label>
          <input
            id="bookmark-url"
            type="url"
            placeholder="e.g. https://supabase.com/docs"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isSubmitting}
            className="input-field"
            maxLength={2000}
            autoComplete="off"
          />
          <p className="text-xs text-slate-400 mt-1">
            Must be a real website URL (e.g. https://google.com)
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-green-600 font-medium">Bookmark added!</p>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Bookmark
            </>
          )}
        </button>
      </form>
    </div>
  );
}
