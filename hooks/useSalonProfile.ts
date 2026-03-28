"use client";

import { useEffect, useState } from "react";

export interface SalonProfile {
  salonId: string | undefined;
  salonName: string | undefined;
  salonCategories: string[] | undefined;
  loading: boolean;
}

/**
 * Shared hook — fetches /api/profile once and returns salon identity.
 * Replaces the repeated fetch-profile boilerplate in every category page.
 */
export function useSalonProfile(): SalonProfile {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { salonId, salonName, salonCategories, loading };
}
