-- exists-check: net-new. No csp-report table, endpoint, or lib existed before this session
-- (npm run exists csp-report / csp_violation_reports both returned zero matches, grep for
-- report-uri|report-to|Reporting-Endpoints|csp-report over the repo returned nothing).
--
-- WHAT AND WHY:
-- netlify.toml ships a Content-Security-Policy-Report-Only header with no report-uri and no
-- report-to, so it currently reports violations to nobody. The documented rollout plan ("watch
-- real reports for a normal traffic week, fix what they name, THEN enforce") is un-runnable
-- without somewhere to receive those reports. This table + function is that somewhere.
--
-- SHAPE: one row per (effective_directive, blocked_origin) pair, not one row per report. A
-- misconfigured or slow-loading asset can fire the same violation thousands of times a day;
-- storing origins as a de-duplicated, counted set is what the person reading this table
-- actually needs (which origins to allowlist), not a raw event log.
--
-- RLS: enabled, deliberately ZERO policies. With RLS on and no policies, anon and authenticated
-- roles get nothing at all, while the service role (used by the API route below via
-- createAdminSupabaseClient) bypasses RLS entirely and can read/write freely. There is no
-- legitimate reason for a browser-side client to ever touch this table, so no policy is added
-- "to be safe", that would only widen access nothing needs.
--
-- Idempotent (create if not exists / create or replace), additive only, forward-only. No DROP.

create table if not exists public.csp_violation_reports (
  id uuid primary key default gen_random_uuid(),
  effective_directive text not null,
  blocked_origin text not null,
  sample_blocked_uri text,
  disposition text,
  report_count bigint not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists csp_violation_reports_key
  on public.csp_violation_reports (effective_directive, blocked_origin);

alter table public.csp_violation_reports enable row level security;

-- record_csp_violation: the only writer this table has (called from app/api/csp-report/route.ts
-- via the admin/service-role client, never directly from a client). Upserts by
-- (effective_directive, blocked_origin): bumps report_count + last_seen_at on a known key,
-- inserts a new row otherwise.
--
-- NOT SECURITY DEFINER on purpose: the service role already has full rights to this table, a
-- definer function here would add a search_path hazard for zero benefit.
--
-- ROW CAP: a CSP violation report is submitted by the reporting browser and its contents
-- (including blocked-uri, which feeds blocked_origin after collapsing to origin in
-- lib/csp-report.ts) are attacker-influenced, anyone can POST an arbitrary origin to this
-- endpoint. That makes the distinct-key space unbounded in principle. Capping at 500 distinct
-- (directive, origin) rows keeps the table APPROXIMATELY bounded no matter what arrives, while an
-- existing key still accrues its real count past the cap (only NEW keys are dropped once full).
--
-- NOT ATOMIC, on purpose, and that is a real known limitation, not hidden: the "select count(*)
-- >= 500" check below and the insert are two separate statements, not one atomic unit. Under
-- READ COMMITTED (Postgres' default), two concurrent calls carrying two different NEW keys can
-- both read a count of 499 and both proceed to insert, so the table can overshoot 500 by
-- roughly the number of racing new keys. No locking is added to close this: the contention this
-- would add is not worth it for a diagnostic sink, and "approximately 500, maybe a little over
-- under a burst" is exactly as useful as "exactly 500" for the actual purpose here (staying
-- bounded, not staying at a precise count).
--
-- LIMITATION, stated plainly rather than hidden: once the cap is full, new distinct
-- (directive, origin) keys are silently dropped. An attacker who floods the endpoint with many
-- distinct fake origins can fill the table with junk and crowd out real findings before the
-- owner ever reads it. There is no eviction here (LRU or otherwise) to work around that, do not
-- add one. The recovery, if this happens, is manual: truncate public.csp_violation_reports and
-- re-watch for a clean traffic window.
create or replace function public.record_csp_violation(
  p_directive text,
  p_origin text,
  p_sample text,
  p_disposition text
) returns void
language plpgsql
as $$
begin
  update public.csp_violation_reports
  set report_count = report_count + 1,
      last_seen_at = now()
  where effective_directive = p_directive
    and blocked_origin = p_origin;

  if found then
    return;
  end if;

  if (select count(*) from public.csp_violation_reports) >= 500 then
    return;
  end if;

  insert into public.csp_violation_reports (
    effective_directive, blocked_origin, sample_blocked_uri, disposition
  )
  values (p_directive, p_origin, p_sample, p_disposition)
  on conflict (effective_directive, blocked_origin)
  do update set
    report_count = csp_violation_reports.report_count + 1,
    last_seen_at = now();
end;
$$;
