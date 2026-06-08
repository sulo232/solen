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
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export interface CustomerPrefs {
  categories: string[];
  interests: string[];
  /** First name for the greeting (from display_name), null if unset. */
  name: string | null;
}

let cached: Promise<CustomerPrefs | null> | null = null;

const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

function loadPrefs(): Promise<CustomerPrefs | null> {
  if (cached) return cached;
  // Gate the /api/profile fetch on a known client session. The homepage renders
  // for every logged-out visitor; firing /api/profile while signed out produced a
  // guaranteed 401 in the browser network console. getSession() reads the local
  // auth cookie only (no network round-trip), so guests short-circuit to the
  // default unpersonalized view without ever hitting the 401 endpoint.
  cached = createBrowserSupabaseClient()
    .auth.getSession()
    .then(({ data: { session } }) => {
      if (!session) return null;
      return fetch("/api/profile", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : null,
      );
    })
    .then((data) => {
      if (!data || typeof data !== "object") return null;
      const obj = data as Record<string, unknown>;
      const p = obj.customer_preferences as Record<string, unknown> | undefined;
      const rawName = typeof obj.display_name === "string" ? obj.display_name.trim() : "";
      // First name only — keeps the greeting short ("Willkommen zurück, Sarah").
      const name = rawName ? rawName.split(/\s+/)[0] : null;
      return {
        categories: asStrArr(p?.categories),
        interests: asStrArr(p?.interests),
        name,
      };
    })
    .catch((err) => {
      console.error("[useCustomerPrefs] profile fetch failed:", err);
      return null;
    });
  return cached;
}

/**
 * Stable-sort a list so items in the user's picked categories float to the front
 * (in pick order); everything else keeps its original order. Used to "bend"
 * existing feed sections (Top auf Solen, In der Nähe) toward the user's picks
 * WITHOUT dropping any salon — so a section never empties for an unusual pick.
 */
export function sortByCategoryPicks<T extends { category: string }>(
  list: T[],
  picked: string[],
): T[] {
  if (!picked.length) return list;
  const rank = (c: string) => {
    const i = picked.indexOf(c);
    return i === -1 ? picked.length : i;
  };
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.category) - rank(b.item.category) || a.i - b.i)
    .map((x) => x.item);
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
