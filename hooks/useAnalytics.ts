"use client";

import { useState, useEffect, useCallback } from "react";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage may be unavailable (SSR, private mode) — silently ignore
  }
}

interface UseAnalyticsOptions {
  salonId: string | undefined;
  period?: string;
}

interface AnalyticsData {
  total_bookings?: number;
  revenue_total?: number;
  avg_rating?: number;
  cancellation_rate?: number;
  trends_vs_prior?: Record<string, { current: number; prior: number; direction: "up" | "down" | "flat" }>;
  revenue_by_week?: { week: string; revenue: number }[];
  top_services?: { name: string; count: number; revenue: number }[];
  [key: string]: unknown;
}

export function useAnalytics({ salonId, period = "month" }: UseAnalyticsOptions) {
  const cacheKey = salonId ? `analytics_${salonId}_${period}` : null;

  // Initialise from cache immediately (avoids spinner on repeated visits)
  const [data, setData] = useState<AnalyticsData | null>(() => {
    if (!cacheKey) return null;
    return readCache<AnalyticsData>(cacheKey);
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (force = false) => {
    if (!salonId || !cacheKey) return;

    if (!force) {
      const cached = readCache<AnalyticsData>(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/salon/${salonId}?period=${period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      writeCache(cacheKey, json);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [salonId, period, cacheKey]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const refresh = useCallback(() => fetch_(true), [fetch_]);

  return { data, loading, error, refresh };
}
