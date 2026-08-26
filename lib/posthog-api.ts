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
      // Cache this request for 1 hour to prevent hitting PostHog rate limits.
      // revalidate caps how OFTEN we call, not how long one call may hang, so
      // it is not a substitute for a timeout.
      next: { revalidate: 3600 },
      // 8000ms: third-party API read, same bound as lib/ai-vision.ts
      signal: AbortSignal.timeout(8000),
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

/**
 * Delete a person (and enqueue an async deletion of their captured events)
 * from PostHog by `distinct_id`. Used by the GDPR erasure pipeline
 * (`app/api/cron/process-deletions`) so a user's PII does not persist
 * forever in this third-party processor after their Supabase account is
 * anonymized/deleted.
 *
 * PostHog has no "delete by distinct_id" endpoint: distinct_id must first
 * be resolved to PostHog's internal person id via a lookup, then that
 * person is deleted with `delete_events=true` to also purge their events.
 *
 * Best-effort: returns `{ ok: false, error }` instead of throwing on any
 * HTTP/network failure, so a PostHog outage never blocks the rest of the
 * erasure run. Caller is responsible for logging/alerting on failure.
 */
export async function deletePostHogPerson(distinctId: string): Promise<{ ok: boolean; error?: string }> {
  const env = getServerEnv();
  const apiKey = env.POSTHOG_PERSONAL_API_KEY;
  const projectId = env.POSTHOG_PROJECT_ID;

  if (!apiKey || !projectId) {
    return { ok: false, error: "POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID not configured" };
  }

  try {
    // Resolve distinct_id -> PostHog's internal person id (deletion is by id).
    const lookupUrl = `https://eu.posthog.com/api/projects/${projectId}/persons/?distinct_id=${encodeURIComponent(distinctId)}`;
    const lookupRes = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // 8000ms: third-party API read, same bound as lib/ai-vision.ts
      signal: AbortSignal.timeout(8000),
    });

    if (!lookupRes.ok) {
      const detail = `${lookupRes.status} ${await lookupRes.text().catch(() => "")}`;
      console.error("[posthog-api] deletePostHogPerson lookup failed:", detail);
      return { ok: false, error: `PostHog person lookup failed: ${detail}` };
    }

    const lookupData = await lookupRes.json();
    const personId = lookupData?.results?.[0]?.id;

    if (!personId) {
      // No PostHog person exists for this distinct_id (never tracked, or
      // already purged). Nothing to delete, this is not a failure.
      return { ok: true };
    }

    const deleteUrl = `https://eu.posthog.com/api/projects/${projectId}/persons/${personId}/?delete_events=true`;
    // 8000ms: this runs inside the erasure cron, so a hang stalls the whole
    // batch. Same bound as lib/ai-vision.ts (third-party API call).
    const deleteRes = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!deleteRes.ok && deleteRes.status !== 404) {
      const detail = `${deleteRes.status} ${await deleteRes.text().catch(() => "")}`;
      console.error("[posthog-api] deletePostHogPerson delete failed:", detail);
      return { ok: false, error: `PostHog person delete failed: ${detail}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[posthog-api] deletePostHogPerson error:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
