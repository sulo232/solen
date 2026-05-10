/**
 * AI Recommendations Utility
 *
 * Fetches baseline signals for AI-powered salon recommendations:
 * - User location (from edge geo headers — Netlify `x-nf-geo`, legacy fallback `x-vercel-ip-city`)
 * - Time of day
 * - Day of week
 */

export interface RecommendationSignals {
  location: string | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  timestamp: string;
}

/**
 * Get current time of day segment
 */
export function getTimeOfDay(): RecommendationSignals['timeOfDay'] {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Extract baseline recommendation signals from request headers
 * Used by /api/recommendations to contextualize AI engine
 */
export function extractSignalsFromHeaders(headers: Headers): RecommendationSignals {
  // Extract location from edge geo headers
  // Netlify provides `x-nf-geo` (base64-encoded JSON with `city`, `country`, ...)
  // Legacy Vercel header `x-vercel-ip-city` kept as fallback for any historical traffic
  let location: string | null = null;
  const netlifyGeo = headers.get('x-nf-geo');
  if (netlifyGeo) {
    try {
      const decoded = JSON.parse(atob(netlifyGeo));
      location = decoded?.city ?? null;
    } catch {
      // ignore parse errors — fall through to legacy header
    }
  }
  if (!location) {
    location = headers.get('x-vercel-ip-city') || null;
  }

  // Get current time context
  const now = new Date();
  const timeOfDay = getTimeOfDay();
  const dayOfWeek = now.getDay();

  return {
    location,
    timeOfDay,
    dayOfWeek,
    timestamp: now.toISOString(),
  };
}
