"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "solen_user_affinity";

export function useRecentVisits() {
  const [recentCats, setRecentCats] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Try parsing the old format { topCategory, lastVisitedSalonByCategory } vs new format []
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentCats(parsed);
        } else if (parsed.topCategory) {
          setRecentCats([parsed.topCategory]);
        }
      }
    } catch (err) {
      console.warn("Could not load user affinity from localStorage:", err);
    }
    setIsMounted(true);
  }, []);

  const visitCategory = useCallback((category: string) => {
    setRecentCats((prev) => {
      const next = [category, ...prev.filter((c) => c !== category)].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const bubbleRank = useCallback((keys: string[]) => {
    const result = [...keys];
    result.sort((a, b) => {
      const idxA = recentCats.indexOf(a);
      const idxB = recentCats.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
    return result;
  }, [recentCats]);

  return { recentCats, visitCategory, bubbleRank, isMounted };
}
