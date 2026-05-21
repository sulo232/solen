/**
 * AI Recommendations Utility
 *
 * Fetches baseline signals for AI-powered salon recommendations:
 * - User location (from Netlify x-nf-geo or Vercel x-vercel-ip-city)
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
 * Extract user city from platform-specific geolocation headers.
 * Tries Netlify's `x-nf-geo` (base64-encoded JSON) first, then falls back
 * to Vercel's `x-vercel-ip-city`. Returns null when neither is present.
 */
function extractLocation(headers: Headers): string | null {
  const netlifyGeo = headers.get('x-nf-geo');
  if (netlifyGeo) {
    try {
      const decoded = Buffer.from(netlifyGeo, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded) as {
        city?: string | { names?: { en?: string } };
      };
      const city =
        typeof parsed.city === 'string'
          ? parsed.city
          : parsed.city?.names?.en;
      if (city) return city;
    } catch {
      // malformed header — fall through to Vercel/null
    }
  }
  return headers.get('x-vercel-ip-city') || null;
}

/**
 * Extract baseline recommendation signals from request headers
 * Used by /api/recommendations to contextualize AI engine
 */
export function extractSignalsFromHeaders(headers: Headers): RecommendationSignals {
  const location = extractLocation(headers);

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
