-- exists-check: alters the LIVE barber_walkin_queue table (supabase/migrations/073_barber_foundation.sql:20)
-- and its twin _hash column (20260717200000_walkin_tracking_token_hash.sql). Not new. Confirmed via
-- `npm run exists walkin_tracking_token_nullable` (0 matches, genuinely new migration file).
--
-- #38 (Uber "mint a fresh link on reopen" model). barber_walkin_queue.tracking_token was TEXT NOT
-- NULL UNIQUE, stored the guest's live-queue capability token in PLAINTEXT at rest. The previous
-- migration (20260717200000) added tracking_token_hash and moved every lookup/compare onto it; this
-- migration finishes the job by (1) dropping the NOT NULL constraint so new rows can insert with
-- tracking_token left null (the app now writes only the hash), (2) moving uniqueness fully onto the
-- hash column (a partial unique index already exists from 20260717200000; this file is the
-- idempotent-safe re-statement, harmless if it already exists), and (3) nulling every existing
-- plaintext value so no live secret remains at rest. The column itself is NOT dropped here
-- (deferred to a later release, once this migration has been out long enough that no straggler
-- code path can still reference it).
--
-- DEPLOY ORDER (round 2 correction): a prior draft of this comment required this migration to land
-- AFTER the code stopped writing tracking_token, which inverted the actual risk: the live column
-- is `NOT NULL` until this migration runs, so code shipping first (Netlify auto-deploys from main
-- ahead of any manual `apply_migration`) would 23502 on every walk-in insert. The code (walkin-
-- ticket.ts / join.ts / test-salon/seed) now writes the ALREADY-COMPUTED tracking_token_hash value
-- into the legacy tracking_token column too (not the raw secret, so no new plaintext-at-rest risk),
-- which satisfies NOT NULL regardless of which side deploys first. This migration can therefore
-- land in ANY order relative to the code; the NULL-out step below simply clears the last real
-- plaintext values once it runs, and future inserts only ever write the harmless hash-mirror above.
alter table public.barber_walkin_queue alter column tracking_token drop not null;

create unique index if not exists barber_walkin_queue_token_hash_key
  on public.barber_walkin_queue (tracking_token_hash)
  where tracking_token_hash is not null;

update public.barber_walkin_queue set tracking_token = null where tracking_token is not null;
