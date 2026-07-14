-- applied live via MCP apply_migration 2026-07-14; file backfilled for fresh-env reproducibility.
-- exists-check: npm run exists analytics_consent = 0 matches (only search_events.consent_given,
-- a separate per-search-event flag, and the client-side CookieConsent component).
--
-- Server-readable analytics consent, so SERVER-side PostHog capture can honour the cookie
-- banner. Consent already exists client-side (CookieConsent.tsx -> localStorage
-- 'solen-cookie-consent'), and the browser SDK correctly inits opted-OUT and only opts in when
-- consent.analytics === true (components-legacy/PostHogProvider.tsx). But localStorage is
-- unreadable from the server, so lib/posthog-server.ts trackServerEvent() fired unconditionally
-- for signup / reviews / stripe webhook / process-deletions. Those callers all pass a USER ID as
-- the distinctId, so storing consent on the profile lets every context (including webhooks and
-- crons, which have no request cookie) check it.
-- NULL = no decision recorded = NO consent (fail closed, do not track).
-- Not added to guard_profile_privilege_columns: this is the user's own choice to set.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS analytics_consent boolean;

COMMENT ON COLUMN public.profiles.analytics_consent IS
  'User analytics (PostHog) consent from the cookie banner. NULL/false = do not track server-side.';
