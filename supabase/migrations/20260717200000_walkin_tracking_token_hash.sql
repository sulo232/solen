-- exists-check: adds a column + backfill + index to the LIVE barber_walkin_queue table. Not new.
--
-- #15 (live re-audit 2026-07-17). The walk-in tracking_token was stored in plaintext and compared
-- with a non-constant-time JS `!==` (app/api/walkin/queue/[id]/route.ts), the two problems
-- lib/bookings/guest-access.ts explicitly calls out as the walk-in token's flaws. This migration
-- lands the hash-at-rest COLUMN and switches lookups to it. The code (join.ts, authz.ts,
-- queue/[id]) is updated in the same change to write + read the hash and to compare in constant time.
--
-- SCOPE NOTE (honest): the plaintext tracking_token column is KEPT, not nulled, because
-- app/api/bookings/walk-in-verify/route.ts RE-RETURNS the raw token to the customer when they reopen
-- their booking link (the "surface my active ticket" flow). Nulling the plaintext would break that
-- re-fetch, so achieving true no-secret-at-rest requires a token-DELIVERY redesign (deliver-once,
-- never re-fetchable, like guest-access's one-time cookie exchange), which is an owner product call,
-- not a mechanical fix. This migration closes the exploitable timing-oracle half and moves lookups
-- to the hash; the at-rest half is flagged for the owner (tracked as a follow-up).
--
-- Postgres sha256 hex == Node crypto.createHash("sha256").digest("hex") was VERIFIED against a known
-- input this session, so backfilled hashes match what the app computes on lookup and existing
-- tickets keep working. pgcrypto is installed. Additive, idempotent, forward-only.
alter table public.barber_walkin_queue add column if not exists tracking_token_hash text;

update public.barber_walkin_queue
   set tracking_token_hash = encode(digest(tracking_token, 'sha256'), 'hex')
 where tracking_token_hash is null and tracking_token is not null;

create unique index if not exists barber_walkin_queue_token_hash_key
  on public.barber_walkin_queue (tracking_token_hash)
  where tracking_token_hash is not null;
