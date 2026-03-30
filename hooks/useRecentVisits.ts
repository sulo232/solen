"use client";

import { useState, useEffect } from "react";

interface RecentVisits {
  topCategory: string | null;
  lastVisitedSalonByCategory: Record<string, string>; // category slug -> salonId
}

const STORAGE_KEY = "solen_user_affinity";

export function useRecentVisits() {
  const [visits, setVisits] = useState<RecentVisits>({
    topCategory: null,
    lastVisitedSalonByCategory: {},
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVisits(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Could not load user affinity from localStorage:", err);
    }
    setIsLoaded(true);
  }, []);

  const recordVisit = (category: string, salonId?: string) => {
    setVisits((prev) => {
      const next: RecentVisits = {
        topCategory: category,
        lastVisitedSalonByCategory: {
          ...prev.lastVisitedSalonByCategory,
        },
      };
      if (salonId) {
        next.lastVisitedSalonByCategory[category] = salonId;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  };

  return { visits, isLoaded, recordVisit };
}
