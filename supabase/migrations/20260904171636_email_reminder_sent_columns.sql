-- APPLIED LIVE 2026-09-04 via the Supabase MCP (migration name email_reminder_sent_columns).
-- Checked after applying: information_schema shows both columns on public.bookings as boolean
-- not null default false. No data changed; every existing booking simply reads false, which is
-- correct, it means no email reminder has been claimed for it yet.
-- exists-check: `npm run exists "bookings email_sent"` / "email reminder" / reminder /
-- notification ran this turn (0 new matches). bookings.sms_sent_24h / sms_sent_1h are the
-- existing SMS-channel send-once markers; this adds their EMAIL-channel mirror, extending
-- that same claim-before-send pattern rather than duplicating a table or a mechanism.
--
-- seo-comms-10 (2026-09-04): per-channel email reminder send-once markers, mirroring the
-- existing bookings.sms_sent_24h / sms_sent_1h claim-before-send columns. Needed so
-- app/api/cron/sms-reminders/route.ts can honor a customer's notification_email toggle
-- without ever sending the same 24h/1h email reminder twice inside one cron window.
--
-- Additive + idempotent (IF NOT EXISTS), matches the project's "never supabase db push"
-- rule (supabase/migrations history has diverged from the remote schema_migrations table,
-- confirmed live 2026-09-04 via `supabase db push --dry-run`): apply via the Supabase
-- MCP `apply_migration` tool, the same additive path every prior owner-save/backend-loop
-- migration in this file's neighborhood used, never `supabase db push`.

alter table public.bookings
  add column if not exists email_sent_24h boolean not null default false,
  add column if not exists email_sent_1h boolean not null default false;
