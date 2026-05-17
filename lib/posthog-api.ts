/**
 * Utility for fetching data FROM the PostHog REST API (Insights).
 * Uses the Personal API Key (POSTHOG_PERSONAL_API_KEY).
 * Documentation: https://posthog.com/docs/api
 */

import { getServerEnv } from "@/lib/env";

export async function fetchPostHogProfileViews(salonId: string, days: number = 30): Promise<number> {
  const env = getServerEnv();
  const apiKey = env.POSTHOG_PERSONAL_API_KEY;
  const projectId = env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) {
    // Graceful fallback if not configured
    return 0;
  }

  try {
    // For insights from EU cloud, API is eu.posthog.com
    const url = `https://eu.posthog.com/api/projects/${projectId}/insights/trend/?events=[{"id":"salon_profile_viewed","type":"events"}]&properties=[{"key":"salon_id","value":"${salonId}","operator":"exact","type":"event"}]&date_from=-${days}d`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Cache this request for 1 hour to prevent hitting PostHog rate limits
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("PostHog fetch profile views failed:", res.status, await res.text().catch(() => ""));
      return 0;
    }

    const data = await res.json();
    
    // Expected structure from PostHog Trends API
    let totalViews = 0;
    if (data.result && data.result.length > 0) {
      const series = data.result[0];
      
      if (typeof series.aggregated_value === 'number') {
        totalViews = series.aggregated_value;
      } else if (Array.isArray(series.data)) {
        totalViews = series.data.reduce((a: number, b: number) => a + b, 0);
      } else if (typeof series.count === 'number') {
        totalViews = series.count;
      }
    }
    
    return totalViews;
  } catch (error) {
    console.error("PostHog API fetch error:", error);
    return 0; // Silent fail
  }
}
