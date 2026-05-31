"use client";

// useCustomerPrefs (V3-D348) — client-side reader for the onboarding picks that
// drive homepage curation. The homepage is statically cached (ISR), so per-user
// personalization can't happen server-side without killing the cache. This hook
// fetches /api/profile AFTER hydration and exposes the saved categories/interests.
//
// One module-level promise caches the fetch, so the tiles row + the "Für dich"
// salon rows share a SINGLE request instead of each firing their own.
//
// Returns null while loading OR when logged-out / no prefs — callers treat null
// as "render the default, unpersonalized view".

import * as React from "react";

export interface CustomerPrefs {
  categories: string[];
  interests: string[];
}

let cached: Promise<CustomerPrefs | null> | null = null;

const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function loadPrefs(): Promise<CustomerPrefs | null> {
  if (cached) return cached;
  cached = fetch("/api/profile", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== "object") return null;
      const p = (data as Record<string, unknown>).customer_preferences as
        | Record<string, unknown>
        | undefined;
      return {
        categories: asStrArr(p?.categories),
        interests: asStrArr(p?.interests),
      };
    })
    .catch((err) => {
      console.error("[useCustomerPrefs] profile fetch failed:", err);
      return null;
    });
  return cached;
}

export function useCustomerPrefs(): CustomerPrefs | null {
  const [prefs, setPrefs] = React.useState<CustomerPrefs | null>(null);
  React.useEffect(() => {
    let mounted = true;
    loadPrefs().then((p) => {
      if (mounted) setPrefs(p);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return prefs;
}
