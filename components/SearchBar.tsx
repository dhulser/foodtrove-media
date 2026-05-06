/**
 * SearchBar — functional search input.
 *
 * Client component so it can use useRouter for navigation.
 * Handles Enter key and submit button. Navigates to /search?q=<query>.
 */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  /** Initial value (pre-populate from URL param on search page) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Extra CSS classes */
  className?: string;
}

export default function SearchBar({
  defaultValue = "",
  placeholder = "Search products…",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex w-full ${className}`}
      role="search"
      aria-label="Search products"
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-4 w-4 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-9 pr-10 py-2 text-sm border border-stone-200 rounded-full bg-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        placeholder={placeholder}
        aria-label="Search products"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            inputRef.current?.focus();
          }}
          className="absolute inset-y-0 right-8 flex items-center pr-1 text-stone-400 hover:text-stone-600"
          aria-label="Clear search"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <button
        type="submit"
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-emerald-600 transition-colors"
        aria-label="Submit search"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
