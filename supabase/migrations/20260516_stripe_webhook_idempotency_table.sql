-- Idempotency claim table for the Stripe webhook handler.
--
-- BACKGROUND: app/api/stripe/webhook/route.ts has referenced this table since
-- it was first written, but the table was never created in prod. As a result
-- every Stripe event was processed on every retry (the INSERT errored
-- silently because the insert result was never error-checked).
--
-- USAGE: webhook handler inserts the Stripe event_id at the start of the
-- request. PRIMARY KEY makes the insert atomic — a duplicate event returns
-- Postgres error 23505 (unique_violation) which the handler treats as
-- "already processed, return 200 + skip". On handler failure the row is
-- deleted so Stripe's retry can re-run the event.
--
-- APPLIED: 2026-05-16 directly to prod via MCP. This file is for git history.

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id     TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies. Only the service role (admin client) writes/reads this table.
-- Anon and authenticated users cannot access it.
