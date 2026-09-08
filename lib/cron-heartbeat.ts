// lib/cron-heartbeat.ts (A11-cron-heartbeat, 2026-07-27)
//
// The daily-digest cron's cron-health section only ever asked cron_runs for
// rows where ok = false. A cron that never fires writes NO row at all, so it
// renders as "0 cron failures", not as a problem: the five most recent
// scheduled runs of the GitHub Actions cron workflow all failed and the
// digest reported nothing. This module is the missing half: a map of every
// scheduled cron's OWN interval, read off the `cron:` schedule entries in
// .github/workflows/cron-jobs.yml (not invented), plus a pure function that
// flags a name as overdue when its most recent cron_runs row, or the absence
// of one, is older than 2x that interval.
//
// The interval map excludes one cron on purpose:
//  - "daily-digest" itself (this route): checking your own not-yet-written
//    row the moment you run would always look overdue.

/**
 * cron_runs.name -> scheduled interval in milliseconds, grounded in the
 * `cron:` schedule entries of .github/workflows/cron-jobs.yml.
 */
export const EXPECTED_CRON_INTERVALS_MS: Record<string, number> = {
  // */15 * * * * (every-15-min job, cron-jobs.yml:9 / :55)
  "auto-complete": 15 * 60 * 1000,
  "pending-timeout": 15 * 60 * 1000,
  "abandon-sweep": 15 * 60 * 1000,
  "walkin-no-show": 15 * 60 * 1000,
  // */30 * * * * (every-30-min job)
  "sms-reminders": 30 * 60 * 1000,
  "no-show": 30 * 60 * 1000,
  // */30 * * * * (every-30-min-ai-backfill job)
  "discovery-ai-backfill": 30 * 60 * 1000,
  // 0 * * * * (hourly job)
  "review-prompt": 60 * 60 * 1000,
  "pre-charge": 60 * 60 * 1000,
  // 0 */6 * * * (every-6-hours job)
  "release-deposits": 6 * 60 * 60 * 1000,
  "release-payments": 6 * 60 * 60 * 1000,
  // 0 2 * * * (daily-02-utc job)
  "generate-slots": 24 * 60 * 60 * 1000,
  // 0 3 * * * (daily-03-utc job, cron-jobs.yml:14 / :153)
  "solen-score-recalculate": 24 * 60 * 60 * 1000,
  "process-deletions": 24 * 60 * 60 * 1000,
  reconcile: 24 * 60 * 60 * 1000,
  "style-affinity-recompute": 24 * 60 * 60 * 1000,
  "affinity-recompute": 24 * 60 * 60 * 1000,
  "salon-engagement-recompute": 24 * 60 * 60 * 1000,
  "dispute-timeout": 24 * 60 * 60 * 1000,
  // 45 3 * * * (daily-03-45-utc job)
  "db-backup": 24 * 60 * 60 * 1000,
  // 0 8 * * * (daily-08-utc job)
  "barber-smart-reminders": 24 * 60 * 60 * 1000,
  // 0 9 * * * (daily-09-utc job)
  "salon-onboarding": 24 * 60 * 60 * 1000,
  "birthday-messages": 24 * 60 * 60 * 1000,
  // 0 10 * * * (daily-10-utc job)
  "welcome-series": 24 * 60 * 60 * 1000,
  "nail-infill-reminders": 24 * 60 * 60 * 1000,
  // 0 11 * * * (daily-11-utc job)
  "rebooking-nudge": 24 * 60 * 60 * 1000,
  // 0 4 1 * * (monthly-1st-04-utc job; nominal 30d for the 2x threshold)
  "loyalty-recompute": 30 * 24 * 60 * 60 * 1000,
  // 0 5 * * 1 (weekly-mon-05-utc job)
  "discovery-deadcheck": 7 * 24 * 60 * 60 * 1000,
};

/**
 * Pure discriminator: given the most recent ran_at (ISO string) seen per
 * cron name and "now", returns the names that are MISSING (no row at all)
 * or STALE (last row older than 2x that cron's own interval). No I/O, no
 * Supabase client, so it is unit-testable without a live DB call.
 */
export function findOverdueCrons(
  lastRanAtByName: Record<string, string | undefined>,
  now: number = Date.now(),
): string[] {
  return Object.entries(EXPECTED_CRON_INTERVALS_MS)
    .filter(([name, intervalMs]) => {
      const lastRanAt = lastRanAtByName[name];
      if (!lastRanAt) return true;
      const ageMs = now - new Date(lastRanAt).getTime();
      return ageMs > intervalMs * 2;
    })
    .map(([name]) => name);
}
