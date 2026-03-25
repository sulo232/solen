/**
 * AI Recommendations Utility
 *
 * Fetches baseline signals for AI-powered salon recommendations:
 * - User location (from Vercel headers x-vercel-ip-city)
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
  // Extract location from Vercel geo headers
  const location = headers.get('x-vercel-ip-city') || null;

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
