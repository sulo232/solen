# SP-2 Order Numbers + Guest Access

> Subplan of `_tasks/REFUND_APPEAL_PLAN.md` (see §13). Scope: the human-readable order
> number (`reference_code`) and the secure guest-access mechanism (hashed token + central
> authorization) that lets a guest with no account view and act on their booking. This SP
> builds the **identity + access layer**; the refund/appeal business logic that consumes it
> is SP-3.
>
> Binding constraints honored verbatim: Master plan §10b item 7 (token spec), §10b item 6
> (RLS / `auth.uid()` is null for guests), §7 / §10 security items, §12 mockups #2/#3/#4.
> **READ-ONLY discovery only** — no code was edited and no migration was run while drafting.

## Objective

Give every booking (appointment AND existing walk-in linkage) a stable, human, shareable
**order number** and give an account-less guest a **secure, non-enumerable, time-limited**
way to authenticate to their own booking, so that SP-3's refund/appeal flow and the SP-5
review surfaces have ONE trustworthy actor-resolution function to call.

Three deliverables, all backend + helper libs (FE is mockups-only per §12):

1. **`reference_code` generator** — `lib/bookings/reference.ts`. Human code `SOL-7K2QX`
   with DB-unique constraint + collision-retry, mirroring the walk-in `ticket_code`
   retry-on-`23505` loop in `lib/barber/walkin-ticket.ts`. Surfaced on confirmation,
   booking detail, and dashboard rows.
2. **Guest access token** — `lib/bookings/guest-access.ts`. `crypto.randomBytes(32)
   .toString('base64url')` (256-bit) issued once; only its **SHA-256 hash** stored in
   `bookings.access_token_hash`; verified with `crypto.timingSafeEqual`; TTL via
   `bookings.access_token_expires_at`; delivered via a **query param exchanged for a
   short-lived httpOnly cookie** (never in the URL path, never logged).
3. **Central authorization** — `lib/bookings/authorize.ts` `resolveBookingActor(req,
   bookingId)` returning `{ actor: 'guest' | 'customer' | 'salon' | 'admin' | null, ... }`,
   plus a **guest lookup endpoint** (code + token → cookie) and a **rate-limited "resend my
   access link"** endpoint (code + email/phone match). Uniform `404` for bad-code AND
   bad-token (no enumeration). Dedicated rate limiters, NOT the 30/min `generalLimiter`.

**Hard rule (§10b.7):** `reference_code` is for **display + lookup correlation only**. It is
NEVER accepted as authorization on its own. Auth always requires the hashed token (guest),
a session (customer/salon/admin), or both.

## Depends on

- **SP-0 Foundation** (`SP0-foundation.md`) — the single guarded forward-only migration MUST
  add the SP-2 columns + indexes (DDL listed below under "Schema / DB changes"). SP-2 writes
  NO migration of its own; it specs the columns SP-0 must carry. (§10b.4: local migration
  files and remote `schema_migrations` are divergent — one new guarded migration only, never
  `db push`.) Confirmed via live introspection (project `tocfnsmxmdxkrcmjzzdw`, 2026-06-01):
  `bookings` today has `paid_via`, `payment_intent_id`, `payment_status`, `price_paid`
  (numeric NOT NULL), `user_id` (uuid NOT NULL), `walkin_queue_id`. It does **NOT** have
  `guest_name/guest_email/guest_phone` (migration 033 never applied — drift), `reference_code`,
  `access_token_hash`, or `access_token_expires_at`. So every SP-2 column is net-new.
- **SP-1 Guest booking** (`SP1-guest-booking.md`) — owns nullable `user_id`, the
  `guest_name/guest_email/guest_phone` columns, the guest-RLS rewrite (§10b.6), and the
  service-role insert path. SP-2's authorize/lookup/resend logic reads those guest columns
  but does not create them. **Ordering: SP-0 → SP-1 → SP-2.** SP-2 is the consumer.
- **Existing env** (`lib/env.ts`): `SUPABASE_SERVICE_ROLE_KEY` (required), `CRON_SECRET`
  (optional), `BOOKING_HMAC_SECRET` (optional — used by the LEGACY walk-in-verify HMAC route;
  SP-2 does NOT use HMAC, see Reuse §). No new env var required: the token is random + hashed,
  not HMAC-signed, so no shared secret is needed. The SHA-256 hash needs no key.

## Schema / DB changes (reference SP-0 columns; any index)

SP-2 **does not run migrations**. These columns + indexes are added by the **one** SP-0
guarded migration (forward-only, `ADD COLUMN IF NOT EXISTS`, on a Supabase branch / with
backup per §10b.4). Listed here so SP-0 carries them:

```sql
-- carried into SP-0's single forward-only migration --
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reference_code            text,
  ADD COLUMN IF NOT EXISTS access_token_hash         text,   -- SHA-256 hex of the 256-bit token; NEVER the raw token
  ADD COLUMN IF NOT EXISTS access_token_expires_at   timestamptz;

-- Human order number: unique, case-handled. Codes are generated UPPERCASE (SOL-7K2QX);
-- store as-is and look up with an exact match on the normalized (uppercased) input.
-- Partial unique index so the (large) backfill window and any legacy NULL rows never collide.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_reference_code
  ON public.bookings (reference_code) WHERE reference_code IS NOT NULL;

-- Lookup-by-hash path is hot on the guest endpoints — index the hash (partial; NULLs skipped).
CREATE INDEX IF NOT EXISTS ix_bookings_access_token_hash
  ON public.bookings (access_token_hash) WHERE access_token_hash IS NOT NULL;
```

Notes for SP-0:
- **Backfill `reference_code`** for all existing rows in the SP-0 migration (or an SP-0
  one-shot script) using the same alphabet/length as the generator, looping on the unique
  index. Existing rows get NO token (`access_token_hash` stays NULL) — historical bookings
  are session-only; a guest token is minted only when a new guest booking is created (SP-1)
  or explicitly (re)issued via resend.
- **Do NOT store the raw token.** The column is `access_token_hash`, deliberately not
  `access_token`. (Master plan §4a mentions `bookings.access_token`; §10b.7 SUPERSEDES it
  with `access_token_hash`. The §10b spec wins — store the hash only.)
- `reference_code` is `text` not an enum; format owned by the generator below.
- No FK, no RLS policy here — guest access is **app-layer token auth, never RLS** (§10b.6:
  `auth.uid()` is null for guests, so RLS cannot gate them). All guest reads/writes go
  through the service-role client inside the authorized server route.

## Backend changes (per helper/endpoint: exact path, signature, logic, authz, status codes)

### 1. `lib/bookings/reference.ts` (NEW helper)

```ts
// Human order number. Alphabet excludes ambiguous chars (no 0/O, 1/I/L) so a customer can
// read it off a screen / say it on the phone. Mirrors the walk-in ticket retry pattern.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars, Crockford-ish, no 0O1IL
const CODE_LEN = 5;                                  // SOL-XXXXX → 31^5 ≈ 28.6M space

export function generateReferenceCode(): string;     // "SOL-7K2QX" (uses crypto RNG, not Math.random)
export function normalizeReferenceCode(input: string): string; // trim, uppercase, strip spaces; tolerant of missing "SOL-" prefix

/**
 * Insert-with-retry on the bookings unique index, mirroring createWalkinTicket's
 * 23505 retry loop. Caller passes the partial insert/update; this owns code generation.
 * Used by SP-1's guest-insert path AND a backfill for session bookings created in
 * /api/bookings (which today inserts no reference_code).
 */
export async function assignReferenceCode(
  admin: Admin,            // service-role client (createAdminSupabaseClient)
  bookingId: string,
): Promise<string>;        // generates, UPDATEs bookings.reference_code, retries on 23505 (≤6 attempts), throws on exhaustion
```
- **Logic:** generate → `UPDATE bookings SET reference_code=$code WHERE id=$id AND
  reference_code IS NULL` → on Postgres `23505` (unique violation) regenerate + retry, up to
  6 attempts (same budget as `createWalkinTicket`). On exhaustion `console.error
  ("[reference] code assignment exhausted:", ...)` + throw. The `reference_code IS NULL`
  guard makes it idempotent (a retry/webhook can't overwrite an already-issued code).
- **Authz:** none — internal helper, only called from already-authorized server contexts.
- **Why crypto RNG not nanoid here:** `nanoid` is fine (it's crypto-backed) and is the
  walk-in precedent; either is acceptable. Spec'd as crypto so the alphabet is controllable
  for human-readability. Implementer may use `nanoid`'s custom alphabet API
  (`customAlphabet(ALPHABET, CODE_LEN)`) to match the walk-in dependency exactly — both
  satisfy the "reuse the walk-in pattern" constraint.

### 2. `lib/bookings/guest-access.ts` (NEW helper) — §10b.7 token spec, in code

```ts
import crypto from "crypto";

const TOKEN_BYTES = 32;                 // 256-bit, per §10b.7
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days; regenerate-on-resolution (SP-3 closes a case → null the hash)
export const GUEST_COOKIE = "solen_guest_access"; // httpOnly cookie name

// Mint a fresh token: returns the RAW token (shown/linked ONCE) + the hash to persist + expiry.
export function issueAccessToken(): {
  raw: string;            // crypto.randomBytes(32).toString("base64url")
  hash: string;           // sha256(raw) hex → store in bookings.access_token_hash
  expiresAt: string;      // ISO, now + TTL → store in bookings.access_token_expires_at
};

export function hashToken(raw: string): string;        // sha256 hex — pure, used on lookup

/**
 * Constant-time compare of a presented raw token against the stored hash, with expiry check.
 * Uses crypto.timingSafeEqual on the HEX hashes (equal length → safe). Returns false on
 * length mismatch / expiry / null, never throws. NEVER use `!==` (the walk-in DELETE route's
 * bug we are explicitly NOT copying — see Reuse §).
 */
export function verifyAccessToken(
  rawPresented: string,
  storedHash: string | null,
  expiresAt: string | null,
): boolean;

// Cookie helpers (httpOnly, Secure, SameSite=Lax, Path=/, short-lived session scope).
export function setGuestCookie(res: NextResponse, bookingId: string, rawToken: string): void;
export function readGuestCookie(req: NextRequest): { bookingId: string; raw: string } | null;
```
- **Token-in-cookie, never-in-URL (§10b.7):** the raw token arrives ONCE as a query param on
  the lookup endpoint, is immediately exchanged for the httpOnly cookie, and the endpoint
  responds with a redirect/200 that **drops the param**. The cookie value binds
  `bookingId:rawToken` (or a signed pair) so a single cookie can't be replayed against a
  different booking. Subsequent sub-route calls read the cookie, never a URL token.
- **No logging of the token:** the lookup route must not `console.log` the query string;
  Next.js access logs see the path only if the token is in the query — so the link format
  puts it in a param the moment of exchange and we never echo it. (Acceptable residual: the
  param appears in the user's own browser history / referrer once; mitigated by short TTL +
  one-time exchange + httpOnly cookie thereafter. Documented as a known tradeoff in Risks.)
- **timingSafeEqual on equal-length hex** avoids the length-leak that bare `timingSafeEqual`
  on raw tokens has (it throws on length mismatch). Hashing first normalizes length to 64
  hex chars.

### 3. `lib/bookings/authorize.ts` (NEW helper) — the central chokepoint

```ts
export type BookingActor = "guest" | "customer" | "salon" | "admin";

export interface BookingActorResult {
  actor: BookingActor | null;
  booking: BookingRow | null;   // the row, fetched once (service-role) so callers don't refetch
  userId: string | null;        // set for customer/salon/admin
}

/**
 * THE single authorization resolver every booking sub-route must call. Resolution order
 * (first match wins), all against ONE service-role fetch of the booking:
 *   1. session present + booking.user_id === session.user.id           → 'customer'
 *   2. session present + profiles.role === 'admin'                      → 'admin'
 *   3. session present + salons.owner_id === session.user.id           → 'salon'
 *   4. else read guest cookie for THIS bookingId, verifyAccessToken vs
 *      booking.access_token_hash (+ expiry)                            → 'guest'
 *   5. none                                                            → { actor: null }
 * NEVER matches on reference_code (display only, §10b.7).
 */
export async function resolveBookingActor(
  req: NextRequest,
  bookingId: string,
): Promise<BookingActorResult>;
```
- **Why centralize (§10a multi-actor / §10b.7):** today auth is copy-pasted and inconsistent
  — `/api/bookings/[id]` does `isOwner || isSalonOwner` (no admin, no guest);
  `/api/bookings/[id]/refund` does salon-owner-only; `/api/bookings/[id]/report` does
  reporter-only via `.eq("user_id", user.id)`. One resolver removes the per-route holes and
  is the only place that understands guests.
- **Consumers (existing routes SP-3/SP-5 migrate onto it — names exact):**
  `app/api/bookings/[id]/route.ts` (GET/PATCH), `.../refund/route.ts`, `.../report/route.ts`,
  `.../dispute/route.ts`, `.../cancel/route.ts`, `.../reschedule/route.ts`,
  `.../confirm/route.ts`, `.../quick-action/route.ts`. SP-2 SHIPS the resolver; SP-3 wires
  the refund/appeal routes onto it; the broad migration of the other six is called out as a
  follow-up so SP-2 stays scoped (see Out of scope).
- **Authz failure shape:** resolver returns `{ actor: null }`; the calling route maps that to
  the **same** status it would use for "not found" on the guest path — a **uniform 404** when
  the requester is unauthenticated/guest (no enumeration), and `403` only when a *logged-in*
  user is authenticated-but-not-entitled (their session already proves they exist, so 403
  leaks nothing). Per-route maps the actor to its allowed verbs.

### 4. `app/api/bookings/guest-lookup/route.ts` (NEW endpoint) — GET, code + token → cookie

- **Path:** `GET /api/bookings/guest-lookup?code={REF}&t={rawToken}`
- **Auth:** none (this is how a guest authenticates). Dedicated limiter (below).
- **Logic:**
  1. `applyRateLimit(guestLookupLimiter, { ip: getClientIp(req) })` → `429` on trip.
  2. Read `code` + `t`. If either missing → **uniform `404`** (not 400 — 400 vs 404 itself
     leaks "code exists, token missing").
  3. `normalizeReferenceCode(code)`; service-role fetch
     `bookings WHERE reference_code = $norm` selecting
     `id, access_token_hash, access_token_expires_at`. If no row → **`404`**.
  4. `verifyAccessToken(t, row.access_token_hash, row.access_token_expires_at)`. If false →
     **`404`** (identical body to step 3 — bad-code and bad-token are indistinguishable,
     §10b.7).
  5. On success: `setGuestCookie(res, row.id, t)` (httpOnly), respond `200 { booking_id }`
     (or `302` to `/booking/lookup/{id}` for the FE flow — FE is mockup; backend returns
     200 + sets cookie). **Response carries no token; the URL param is consumed and not
     echoed back.**
- **Status codes:** `200` (cookie set), `404` (bad code OR bad token OR missing param —
  uniform), `429` (rate limited). Never `403`/`401` here (those would distinguish states).

### 5. `app/api/bookings/resend-access/route.ts` (NEW endpoint) — POST, resend my link

- **Path:** `POST /api/bookings/resend-access`  body `{ code, email?, phone? }`
- **Auth:** none. **Strictest** dedicated limiter (below) — this is the brute-force /
  enumeration / spam surface.
- **Logic:**
  1. `applyRateLimit(resendAccessLimiter, { ip: getClientIp(req) })` → `429`.
  2. Validate body (zod): `code` required, exactly one of `email`/`phone` required.
  3. `normalizeReferenceCode(code)`; service-role fetch
     `bookings WHERE reference_code=$norm` selecting `id, guest_email, guest_phone,
     user_id`. **Always behave identically whether or not the row exists or the contact
     matches** (anti-enumeration): compute a constant-time-ish equality of the supplied
     email/phone against the stored guest contact; only when it matches AND the row is a
     guest booking (`user_id IS NULL`), mint a fresh token via `issueAccessToken()`,
     `UPDATE bookings SET access_token_hash=$hash, access_token_expires_at=$exp` (service
     role), and queue the email via the **existing Resend hook** (§10b.9 — reuse the
     `report` route's Resend pattern; do NOT build a new mailer) containing the
     `/booking/lookup?code=…&t=raw` link.
  4. **Response is ALWAYS the same `200 { ok: true, message: "If that order number matches a
     guest booking, we've sent a new access link." }`** regardless of match/no-match —
     prevents probing which codes exist and which contact is on file. (Logged-in bookings
     `user_id != null` get the same opaque 200 but no email — guests-only feature; a
     logged-in user uses their account.)
- **Status codes:** `200` (always, opaque), `400` (malformed body only — pre-lookup, leaks
  nothing about a code), `429`.
- **Regenerate-on-resolution tie-in (§10b.7):** resend mints a NEW token (rotating any prior
  one); SP-3, on closing a case, nulls `access_token_hash` so a stale link dies.

### 6. `lib/ratelimit.ts` additions (dedicated limiters, NOT `generalLimiter`) — §10b.12

Add three IP-keyed limiters next to the existing ones (same `Ratelimit`/`slidingWindow`
shape already in the file):

```ts
// Guest booking access surface — keep TIGHT; this is the enumeration / brute-force surface.
export const guestLookupLimiter  = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "10 m"), analytics: true, prefix: "rl:guest:lookup" });
export const resendAccessLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,  "1 h"),  analytics: true, prefix: "rl:guest:resend" });
```
- `guestLookupLimiter`: a legit guest needs 1-2 attempts; 10 / 10 min per IP stops a token
  brute-forcer cold while not hurting a fat-fingered user. (Token space is 256-bit so brute
  force is infeasible regardless; the limiter defends the `reference_code` space — 31^5 — and
  DB load.)
- `resendAccessLimiter`: 3 / hour per IP — resends are rare and abuse-prone (email
  bombing + code probing).
- Keyed by **IP** (`getClientIp`), since guests have no `userId`. Same graceful-degrade
  behavior as `applyRateLimit` (Redis down → allow through, already handled in the file).

## Reuse + anti-duplication (walk-in pattern, what to copy vs fix)

**COPY from `lib/barber/walkin-ticket.ts` (the proven pattern, §1/§7 of master plan):**
- The **insert/update-with-retry on `23505`** loop → `assignReferenceCode` mirrors
  `createWalkinTicket`'s attempt loop (≤6 attempts, regenerate code, return on success).
- The **`nanoid` custom-alphabet** approach for short human codes (walk-in uses
  `nanoid(12)` for `tracking_token`; reference codes use a readable custom alphabet).
- The **partial unique index** convention (`WHERE col IS NOT NULL`) so NULL rows never
  collide — exactly what `uq_barber_walkin_queue_salon_ticket` /
  `uq_barber_walkin_queue_payment_intent` do (see `20260531_walkin_ticket_code.sql`).
- The **idempotency-via-DB-constraint** philosophy: the unique index is the source of truth,
  the retry loop is the reconciliation.

**Do NOT copy (these are the walk-in token's weaknesses — fix in SP-2):**
- **`tracking_token` is stored & compared in PLAINTEXT.** `walkin-ticket.ts` inserts
  `tracking_token: nanoid(12)` and `app/api/walkin/queue/[id]/route.ts:124` compares with
  `entry.tracking_token !== token`. SP-2 stores **only the SHA-256 hash** and compares with
  **`timingSafeEqual`**, never `!==` (the `!==` is non-constant-time AND the value is a raw
  secret at rest). 12-char nanoid (~71 bits) is also weaker than the spec'd 256-bit.
- **Token passed as a bare query param that authorizes directly** (`?token=` on the walk-in
  DELETE). SP-2 exchanges the param for an httpOnly cookie on first contact and authorizes
  off the cookie thereafter (§10b.7).
- **Walk-in token routes use the admin client directly with no central resolver.** SP-2
  routes their authorization through `resolveBookingActor`. (Walk-in queue is a separate
  table/path and is out of scope to refactor here — D10 defers walk-in; we only avoid
  repeating its mistakes on the bookings path.)
- **The legacy `BOOKING_HMAC_SECRET` self-describing token** in
  `app/api/bookings/walk-in-verify/route.ts` (`verifyHmacToken`) is a DIFFERENT mechanism
  (stateless HMAC, no DB column, no revocation, no rotation). SP-2 deliberately uses a
  **stored-hash random token** instead (revocable, rotatable on resolution, no shared
  secret). Do not extend the HMAC route; it stays for its existing walk-in purpose. The
  `timingSafeEqual` usage in that file (line 28) is the one good pattern to mirror.

**Anti-duplication for `reference_code`:** ONE generator (`lib/bookings/reference.ts`) used
by SP-1's guest insert, the `/api/bookings` session insert (which currently writes no code),
and the SP-0 backfill. No per-route code generation.

**Anti-duplication for authz:** ONE `resolveBookingActor`; every booking sub-route migrates
onto it (SP-3 does the refund/appeal routes; remaining six tracked as follow-up). This is the
SP-2 analogue of §10b.3's "one shared refund chokepoint."

## Acceptance criteria (testable: curl with right/wrong token expecting 200/404; timing-safe; enumeration check)

Assume a seeded guest booking with `reference_code = SOL-7K2QX`, a freshly issued raw token
`$GOOD` (its SHA-256 stored in `access_token_hash`, `access_token_expires_at` = now+30d), and
a wrong token `$BAD` of identical length.

1. **Correct code + correct token → 200 + cookie set, no token echoed.**
   ```
   curl -i "http://localhost:3000/api/bookings/guest-lookup?code=SOL-7K2QX&t=$GOOD"
   # → HTTP/1.1 200 ; Set-Cookie: solen_guest_access=...; HttpOnly; Secure; SameSite=Lax
   # → body contains booking_id; body/headers contain NO raw token
   ```
2. **Correct code + WRONG token → 404 (uniform).**
   ```
   curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/bookings/guest-lookup?code=SOL-7K2QX&t=$BAD"   # → 404
   ```
3. **NONEXISTENT code (right format) + any token → 404, byte-identical body to #2.**
   ```
   curl -s "http://localhost:3000/api/bookings/guest-lookup?code=SOL-ZZZZZ&t=$GOOD" \
     | diff - <(curl -s "http://localhost:3000/api/bookings/guest-lookup?code=SOL-7K2QX&t=$BAD")
   # → no diff (bad-code and bad-token are indistinguishable — enumeration check)
   ```
4. **Missing param → 404 (NOT 400).** `?code=SOL-7K2QX` with no `t`, and `?t=$GOOD` with no
   `code`, both return 404 with the same body as #2/#3.
5. **Timing-safe:** a micro-benchmark (e.g. 1000 reqs each) shows no statistically
   significant latency delta between #2 (wrong token, code exists) and #3 (code absent) —
   verifies `timingSafeEqual` + identical control flow. (Hash-first guarantees equal-length
   compare; assert in a unit test that `verifyAccessToken` calls `timingSafeEqual`, never
   `!==`, and returns false on length mismatch without throwing.)
6. **Authorized cookie reaches a protected sub-route:** after #1, a follow-up request that
   sends the `solen_guest_access` cookie to a `resolveBookingActor`-gated route resolves
   `actor: 'guest'`; the same request to a DIFFERENT bookingId resolves `actor: null` → 404
   (cookie is booking-bound, no cross-booking replay).
7. **`reference_code` collisions:** a unit/integration test inserting N bookings asserts all
   codes unique (DB unique index holds) and `assignReferenceCode` survives a forced `23505`
   by retrying (mock one collision, expect success on the next attempt). Re-running
   `assignReferenceCode` on a booking that already has a code is a no-op (idempotent).
8. **Resend is opaque:** `POST /resend-access` with a matching code+email, a matching
   code+wrong-email, and a nonexistent code ALL return the identical `200 { ok: true }`
   body; only the matching-guest case actually writes a new `access_token_hash` (assert via
   DB) and only it triggers a Resend call (assert the mailer is invoked once).
9. **Rate limits:** the 11th `guest-lookup` within 10 min from one IP → `429` with
   `Retry-After`; the 4th `resend-access` within 1 h from one IP → `429`. (Skipped cleanly
   when Upstash env is unset — matches existing `applyRateLimit` behavior.)
10. **No token in logs:** grep the dev server output after #1-#4 for `$GOOD`/`$BAD` → no
    match (token never logged, never in a redirect Location, never in an error body).

## Risks + edge cases (cite Section 10 security items)

- **Guest bearer token leakage (§7 "Guest bearer token", §10b.7).** Mitigations baked in:
  256-bit entropy, **hash-at-rest** (a DB dump never exposes a usable token), TTL +
  rotate-on-resolution, httpOnly cookie after a one-time param exchange, rate-limited
  lookups, uniform 404. **Residual tradeoff (documented):** the raw token appears once in the
  user's own URL/history/referrer at exchange time. Accepted because the alternative
  (POST-only with the token in a body) breaks shareable email links, which is the whole
  point; TTL + one-time exchange + httpOnly cookie bound the exposure. Flag for owner.
- **Enumeration via `reference_code` (§7 "order numbers are guessable", §10b.7).** 31^5 ≈
  28.6M space is guessable at scale, so the code is NEVER auth on its own (token required),
  bad-code == bad-token == missing-param → uniform 404, and `guestLookupLimiter` (10/10min)
  throttles scanning. Resend is `200`-opaque regardless of code existence.
- **Timing side-channel (§10b.7, §10b.11).** `timingSafeEqual` on equal-length hex +
  identical control flow on all failure branches (fetch-then-compare even when the row is
  absent? — note: a true constant-time path would do a dummy hash-compare on the miss to
  equalize work; SP-2 spec'd to hash the presented token and compare against a sentinel hash
  on a missing row so both branches do equal crypto work. Implementer MUST equalize the
  no-row branch, not early-return, to avoid a code-existence timing oracle). Acceptance #5
  is the guard.
- **Multi-actor authz hole (§7 "Multi-actor authz", §10a).** Centralized `resolveBookingActor`
  is the single source; first-match-wins order is explicit; reference_code excluded from the
  match set. Risk if a sub-route forgets to call it → tracked: SP-3 migrates the money routes,
  follow-up migrates the rest; until then the un-migrated routes keep their current
  session-only checks (no guest access leaks because they simply don't read the cookie).
- **PII in URLs/logs (§7 "PII / Swiss DSG + GDPR", §10b.10).** Token never in the path; email/
  phone only in POST bodies (resend), never query params; no `console.log` of request query/
  body in these routes. GDPR erasure (SP-3/§10b.10) nulls `guest_*` + `access_token_hash`.
- **Cookie scope / CSRF.** `SameSite=Lax` + the cookie only *reads* on safe sub-routes;
  state-changing guest actions (SP-3 refund-request POST) must additionally verify the actor
  is `'guest'` for THAT booking (cookie is booking-bound) — Lax already blocks cross-site
  POSTs. No global CSRF token needed for this surface; flag if SP-3 adds sensitive guest
  mutations.
- **Token rotation race.** Two concurrent resends → two hashes written; last-writer-wins is
  fine (older link simply 404s on next use). The `UPDATE … WHERE reference_code=$norm` is a
  single statement; no read-modify-write (consistent with §10b.11's atomic-update guidance).
- **Backfill collision under concurrency (§7 "Code uniqueness").** SP-0's backfill + the live
  insert path can race for a code; the partial unique index + retry loop is the guard (same
  as walk-in). Covered by Acceptance #7.
- **`reference_code` case/format drift.** `normalizeReferenceCode` (uppercase, strip "SOL-"
  optionalness, strip spaces) makes lookup tolerant; storage is canonical uppercase.

## Front-end mockups needed (Section 12 #2, #3, #4)

Per §12 (owner policy: competitor-informed mockups in the Solen design system, signed off
BEFORE any real build; brief template `_design-system/AGENT_BRIEF_TEMPLATE.md`). SP-2's FE
surface is exactly §12 items **#2, #3, #4** (English working-copy per user memory; product
locale rendering is a build concern):

- **#2 — Confirmation screen with the order number.** Shows `reference_code` prominently
  (copy-to-clipboard), a "Save your access link" affordance (the one-time link), and share.
  Must communicate "this is how you find this booking later" without ever printing the raw
  token as plain text the user might screenshot insecurely (link behind a button).
- **#3 — Guest lookup page (`/booking/lookup`).** Enter order number → land via the token
  link (the link auto-exchanges to a cookie). Empty/invalid states show the SAME generic
  "we couldn't find that" message (mirrors the uniform-404 backend — no "code exists but
  token wrong" copy that would leak).
- **#4 — "Resend my access link" page (rate-limited).** Enter order number + email/phone →
  always the same opaque confirmation ("If that matches a guest booking, we've sent a new
  link"), a visible rate-limit/try-again state, and no signal about whether the code or
  contact existed.

Mockups only — no live wiring until sign-off. Backend (this SP) is built/tested via curl +
unit tests independent of the FE.

## Out of scope for this SP

- **The refund/appeal business logic** that consumes the actor (create refund request, salon
  review, escalate, admin decision, eligibility, `case_events`, status machine) → **SP-3**.
- **Guest booking creation, nullable `user_id`, guest columns, guest-RLS rewrite,
  service-role insert, `GuestBookingForm` wiring** → **SP-1** (SP-2 only reads those columns).
- **Running the migration / history reconcile / backfill execution / unit lock** → **SP-0**
  (SP-2 only specifies the columns + indexes + backfill requirement).
- **Migrating the six non-money booking sub-routes** (`[id]` GET/PATCH, `cancel`,
  `reschedule`, `confirm`, `quick-action`) onto `resolveBookingActor` → **follow-up after
  SP-3** (SP-2 ships the resolver + wires only what the guest-access endpoints need; SP-3
  wires the refund/appeal routes). Keeps SP-2 to the identity/access layer.
- **Walk-in token hardening / walk-in refunds** → deferred (master plan **D10**); SP-2 only
  avoids repeating the walk-in token's mistakes on the bookings path, it does not refactor
  the walk-in path.
- **Email/SMS delivery system** → reuse the existing Resend hook (§9, §10b.9); building a
  notification system is the owner's later piece.
- **"Claim this guest booking into an account" upgrade** (§7) → future enhancement, not SP-2.
- **Real FE build** of #2/#3/#4 → mockups only here (§12); build after sign-off.
