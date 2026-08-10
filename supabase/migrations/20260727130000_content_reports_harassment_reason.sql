-- exists-check: extends the live content_reports_reason_check constraint (confirmed via
-- pg_get_constraintdef, 2026-07-27: CHECK (reason = ANY (ARRAY['inappropriate','spam','fake',
-- 'ip_violation','other']))). Additive only, widens the allowed set, does not touch existing rows
-- (content_reports has 0 rows live per 078_content_reports.sql's own comment).
-- ============================================================
-- 20260727130000_content_reports_harassment_reason
-- trust-06 (marketplace-trust research, 2026-07-26): TermsContent.tsx section 7.3 promises
-- "zero tolerance ... immediate account suspension" for harassment, but no reason code existed
-- to distinguish a harassment report from an ordinary billing/quality complaint anywhere in the
-- taxonomy. content_reports already supports target_type='user' (a salon owner reporting a
-- customer, or vice versa) via the existing generic POST /api/reports, so this is purely a
-- taxonomy widening, not a new endpoint. lib/content-reports.ts REPORT_REASONS mirrors this.
-- ============================================================

ALTER TABLE public.content_reports DROP CONSTRAINT IF EXISTS content_reports_reason_check;
ALTER TABLE public.content_reports ADD CONSTRAINT content_reports_reason_check
  CHECK (reason IN ('inappropriate', 'spam', 'fake', 'ip_violation', 'harassment', 'other'));
