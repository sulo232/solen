# SP-1 Guest Booking

> Scope: make appointment booking work for BOTH a logged-in user and a logged-out guest.
> Grounded in live DB introspection (project `tocfnsmxmdxkrcmjzzdw`, 2026-06-01) + the master plan
> `_tasks/REFUND_APPEAL_PLAN.md` Sections 8, 10b (esp. items 6 + 7), 12.
>
> **Binding constraints carried in from Section 10b:**
> - **10b#6:** nullable `user_id` is NOT sufficient. The live policy `bookings_insert_auth WITH CHECK (auth.uid() = user_id)` rejects any guest row. Guests MUST insert via a service-role server path. The new code does NOT rely on RLS for guest writes. Guest rows (`user_id IS NULL`) must be reachable ONLY through the token-gated service-role path, never anon-readable.
> - **10b#7:** guest authorization is app-layer token auth (SP-2), never RLS (`auth.uid()` is null for a guest). SP-1 only persists the token SP-2 issues; it never invents its own auth scheme.
> - The existing **logged-in path is verified (G1)** and must stay behaviorally identical. SP-1 adds a branch, it does not refactor the working path.

---

## Objective

One `POST /api/bookings` endpoint that creates a booking for either actor:

- **Logged-in:** unchanged from G1 — session present, write the row as the authenticated user via the normal RLS-backed client (`bookings_insert_auth` passes because `auth.uid() = user_id`).
- **Logged-out guest:** no session. Require `guest_name` + `guest_phone` (email optional). Validate, then write the row with `user_id = NULL` + the guest columns via the **service-role admin client** (RLS would otherwise reject it).

On success (both actors): issue a `reference_code` + access token by calling the **SP-2 helper**, persist them on the row, and return the booking. Front-end guest form (`GuestBookingForm.tsx`) gets wired into the logged-out flow; the visual is delivered as a **mockup** per Section 12 #1 — SP-1 specifies only the data wiring + integration point.

Out of band: hashing/lookup/resend/central authz all live in **SP-2**. Money, refunds, disputes, order-number display surfaces live in SP-2/SP-3/SP-5.

---

## Depends on

- **SP-0 (Foundation)** — `_tasks/refund-appeal/SP0-foundation.md`. SP-0 owns the single guarded forward-only migration. SP-1's DDL (guest columns, `user_id` nullable, `reference_code`, `access_token_hash`, plus the RLS rewrite below) is **authored as part of SP-0's one migration**, not a second migration file. SP-1 references those columns; it does not `apply_migration` on its own. (Section 10b#4: no `supabase db push`, no second ad-hoc migration — one guarded migration carries everything.)
- **SP-2 (Order numbers + guest access)** — `_tasks/refund-appeal/SP2-order-numbers.md`. SP-2 owns:
  - the `reference_code` generator (collision-retry, mirrors the walk-in `ticket_code` retry loop in `lib/barber/walkin-ticket.ts:148-200`),
  - the token spec from Section 10b#7: `crypto.randomBytes(32).toString("base64url")` (256-bit), store the **SHA-256 hash** in `bookings.access_token_hash`, return the plaintext token ONCE to the caller,
  - `resolveBookingActor()` (the centralized guest/customer/salon/admin check used by every booking sub-route).
  SP-1 calls SP-2's `issueBookingAccess()` helper and persists what it returns. **If SP-2's helper is not ready when SP-1 is built, SP-1 is blocked on it** — do not inline a throwaway token scheme (would violate 10b#7 and create the duplication the owner forbids).

**Build order:** SP-0 (migration + columns) → SP-2 (token helper + generator) → SP-1 (route branch + form wiring). SP-1 cannot land before its columns and the issuance helper exist.

---

## Schema / DB changes (RLS policy edits; columns are defined in SP-0, reference them)

All DDL below is **authored inside SP-0's single guarded migration** (`ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS … CREATE POLICY` guards per 10b#4). Listed here so SP-0 carries the exact statements SP-1 needs.

### Columns (owned by SP-0, referenced by SP-1)
On `public.bookings` (live table has 36 cols today; none of these exist yet — confirmed via `information_schema.columns`):

- `user_id` → **drop NOT NULL** (currently `is_nullable = NO`). Keep the FK `REFERENCES public.profiles(id) ON DELETE CASCADE`; a NULL is allowed, a present value still must reference a profile.
- `guest_name text` (nullable)
- `guest_phone text` (nullable)
- `guest_email text` (nullable)
- `reference_code text` — owned/populated by SP-2; SP-1 persists the value SP-2 returns. Unique constraint + backfill are SP-2's.
- `access_token_hash text` (nullable) — SHA-256 hash of the guest access token (SP-2 spec). SP-1 persists it on insert.
- **Integrity guard (CHECK):** a booking must have an owner OR guest contact —
  `CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL))`.
  Prevents an orphan row with neither a user nor a way to identify the guest. (Authored in SP-0; named so SP-3/SP-5 can rely on it.)

> NOTE the live table already has `payment_status`, `paid_via`, `deposit_amount`, `platform_fee`, `walkin_queue_id` etc. — SP-1 touches none of them.

### RLS policy rewrite (SP-1 owns the spec; statements authored in SP-0's migration)

Live policies today (verified via `pg_policies`):

| policy | cmd | clause |
|---|---|---|
| `bookings_insert_auth` | INSERT | `WITH CHECK (auth.uid() = user_id)` |
| `bookings_select_own` | SELECT | `USING (auth.uid() = user_id OR <owner-of-salon>)` |
| `bookings_update_own` | UPDATE | `USING (auth.uid() = user_id OR <owner-of-salon>)` |

Two problems for guests: (1) INSERT `WITH CHECK (auth.uid() = user_id)` rejects a NULL-user row (and rejects an anon caller outright); (2) SELECT/UPDATE keyed on `auth.uid() = user_id` means a `user_id IS NULL` row is invisible/unwritable to anon — which is the behavior we WANT for anon, but we must make sure we are not *widening* it. The fix is to **keep RLS strict and route all guest access through service-role**, not to open RLS to anon.

**Required policy edits (forward-only, guarded):**

1. **INSERT — keep strict, do NOT add an anon-insert path.** Leave `bookings_insert_auth WITH CHECK (auth.uid() = user_id)` intact for the logged-in path. Do **not** add a policy that lets `anon`/`authenticated` insert a `user_id IS NULL` row — guest inserts go exclusively through the **service-role admin client**, which bypasses RLS. (Section 10b#6: "the new code does not rely on RLS for guests.")
   - Hardening: `REVOKE INSERT ON public.bookings FROM anon;` so even a leaked anon key cannot create guest rows directly — the only guest write path is our server route. (`authenticated` retains INSERT, gated by the existing `WITH CHECK`.)

2. **SELECT — explicitly exclude guest rows from any non-service-role reader.** Replace `bookings_select_own` with the same logic plus an explicit guard so a NULL-user row is never returned to `anon` or to a logged-in user who is not the salon owner:

   ```sql
   DROP POLICY IF EXISTS bookings_select_own ON public.bookings;
   CREATE POLICY bookings_select_own ON public.bookings
     FOR SELECT
     USING (
       (user_id IS NOT NULL AND auth.uid() = user_id)
       OR EXISTS (SELECT 1 FROM public.salons s
                  WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid())
     );
   ```
   Effect: guest rows (`user_id IS NULL`) are readable through RLS ONLY by the salon owner (legit — the salon must see its bookings). The **guest themselves** reads via the SP-2 token-gated **service-role** route (`resolveBookingActor()` verifies the token, then reads with the admin client). `anon` gets nothing. This satisfies "reachable ONLY via the token-gated service-role path, never anon-readable."

3. **UPDATE — mirror the SELECT guard** so an anon/non-owner cannot mutate a guest row through RLS; guest-initiated mutations (cancel, refund-request) go through SP-2/SP-3 service-role routes after `resolveBookingActor()`:

   ```sql
   DROP POLICY IF EXISTS bookings_update_own ON public.bookings;
   CREATE POLICY bookings_update_own ON public.bookings
     FOR UPDATE
     USING (
       (user_id IS NOT NULL AND auth.uid() = user_id)
       OR EXISTS (SELECT 1 FROM public.salons s
                  WHERE s.id = bookings.salon_id AND s.owner_id = auth.uid())
     );
   ```

4. **Index** for the guest read path SP-2 will use: `CREATE INDEX IF NOT EXISTS idx_bookings_reference_code ON public.bookings (reference_code);` (SP-2 may instead make it part of the UNIQUE constraint — coordinate so it is created once).

> Net: RLS stays a deny-by-default wall. Guests never touch the table through RLS. Every guest read/write is a server route that (a) verifies the SP-2 token, then (b) uses the service-role admin client. This is the literal reading of 10b#6 + 10b#7.

---

## Backend changes (per file: exact path + change; the POST conditional logic; service-role insert)

### 1. `lib/validations.ts` — `createBookingSchema` gets a guest branch

Current schema (lines 28-40) requires `service_id` + (`slot_id` OR `salon_id`+`starts_at`); G1's slot-resolution contract. Keep all of it. Add **optional** guest fields and a refinement that the route (not the schema, since the schema cannot see the session) enforces conditionally.

- Add to the object:
  - `guest_name: z.string().min(2).max(100).optional()`
  - `guest_phone: z.string().regex(/^\+41[0-9]{9}$/).optional()` — match the existing Swiss-phone contract used by `walkInSchema` (line 267) and `GuestBookingForm`'s client regex (`GuestBookingForm.tsx:30`).
  - `guest_email: z.string().email().optional()`
- Keep the existing `.refine()` for slot resolution. Do **not** add a "guest fields required" refine here — Zod has no session context. The **route** decides: if no session, guest_name + guest_phone are required (return `VALIDATION_ERROR` if missing). This keeps the schema reusable for both actors and avoids a schema that rejects the logged-in path. Document this with a one-line comment mirroring the G1 comment style at lines 24-27.
- (Note: PayConfirmStep currently also POSTs `payment_method`, `promo_code`, `gift_card_code`, `total_price` — these are NOT in the schema today and are silently dropped by `safeParse` returning only declared keys. SP-1 does not add them; out of scope. Flag only.)

### 2. `app/api/bookings/route.ts` — POST conditional (logged-in vs guest)

The route is the auth boundary. Current POST (lines 36-52) hard-401s without a session and hard-codes `user_id: user.id`. Rework the **top of POST** and the **insert**; leave slot resolution (lines 56-86), pricing (line 95), confirm-mode (lines 98-100), slot-mark (122-126), and the email/referral tails (128-247) structurally intact, with the small `user_id`-nullable adjustments noted.

**(a) Session gate → conditional, not a hard 401.** Replace lines 40-48:

```ts
const supabase = await createServerSupabaseClient();
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;
const isGuest = !user;

// Guest write path needs the service-role client (RLS rejects user_id IS NULL).
// Logged-in path keeps using the RLS-backed `supabase` client (G1 behavior).
const db = isGuest ? createAdminSupabaseClient() : supabase;  // createAdminSupabaseClient already imported (line 4)

if (user) {
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;
}

// Rate-limit by userId for logged-in, by IP for guests (Section 10b#12: do NOT
// leave the money/booking surface unthrottled for anon). Use bookingLimiter with
// an IP key for guests; SP-0/SP-2 may introduce a dedicated guest limiter — until
// then, reuse bookingLimiter keyed on the forwarded IP.
const rlKey = user ? { userId: user.id } : { ip: ipFromRequest(request) };
const rateLimited = await applyRateLimit(bookingLimiter, rlKey);
if (rateLimited) return rateLimited;
```

> `applyRateLimit`'s key shape must support an IP key — confirm `lib/ratelimit.ts` `applyRateLimit` signature during build; if it only accepts `{ userId }`, extend it minimally (or use the request IP via the existing helper the codebase uses for anon limits). This is the one small cross-file dependency; keep it surgical.

**(b) Validate, then conditionally require guest fields.** After `validateBody` (lines 50-52), destructure the new fields and enforce:

```ts
const { slot_id, salon_id, service_id, staff_member_id, starts_at, is_first_visit,
        referral_code, guest_name, guest_phone, guest_email } = validated;

if (isGuest) {
  if (!guest_name || !guest_phone) {
    return NextResponse.json(
      { message: "Guest bookings require name and phone", code: "GUEST_INFO_REQUIRED" },
      { status: 400 },
    );
  }
}
```

**(c) Slot resolution** (lines 62-86): unchanged. Use `db` (so the guest path reads slots via service-role; slots are public-readable anyway per `slots_select_available USING (true)`, but using `db` keeps one client).

**(d) Profile lookup for `is_first_visit`** (lines 88-96): guard it — a guest has no profile.

```ts
let profile: { is_first_visit_default?: boolean; locale?: string } | null = null;
if (user) {
  const { data } = await db.from("profiles")
    .select("is_first_visit_default, locale").eq("id", user.id).single();
  profile = data;
}
const firstVisit = is_first_visit ?? profile?.is_first_visit_default ?? true;
```

**(e) Issue reference_code + access token (call SP-2), then INSERT.** Before the insert, call the SP-2 helper. It returns the `reference_code` (string) + `access_token_hash` (string) + the plaintext `accessToken` (returned to the client once, only for guests). Then build the insert payload conditionally:

```ts
import { issueBookingAccess } from "@/lib/bookings/access";  // SP-2 owns this module

const { referenceCode, accessTokenHash, accessToken } = await issueBookingAccess(db);

const { data: booking, error: bookingError } = await db
  .from("bookings")
  .insert({
    user_id: user?.id ?? null,                 // NULL for guest (10b#6)
    guest_name:  isGuest ? guest_name  : null,
    guest_phone: isGuest ? guest_phone : null,
    guest_email: isGuest ? (guest_email ?? null) : null,
    salon_id: slot.salon_id,
    service_id,
    staff_member_id: staff_member_id ?? slot.staff_member_id,
    slot_id: resolvedSlotId,
    starts_at: slot.starts_at,
    ends_at: slot.ends_at,
    price_paid: price,
    status: bookingStatus,
    is_first_visit: firstVisit,
    reference_code: referenceCode,
    access_token_hash: accessTokenHash,
  })
  .select()
  .single();
```

> The guest INSERT works **only** because `db` is the service-role admin client (bypasses RLS). The logged-in INSERT uses the RLS client and passes `bookings_insert_auth`. Same code, two clients — chosen at line (a).

**(f) Slot-mark** (lines 122-126): `booked_by: user?.id ?? null` (guest has no profile id; column is `ON DELETE SET NULL`, nullable — verified in migration 014 line 192). Use `db`.

**(g) Email tail** (lines 128-143): the customer-confirmation email currently uses `user.email!`. For a guest, use `guest_email` if present, else **skip** the customer email (no address). The salon-owner notification (145-173) already uses the admin client and `owner_id`; for the customer name passed to `salonNewBooking` (line 162) use `user?.email ?? guest_name ?? "Gast"`. Wrap the customer-email branch:

```ts
const customerEmail = user?.email ?? guest_email ?? null;
if (customerEmail) { /* existing bookingConfirmation(...) call */ }
```

(Per Section 9 + 10a, notifications are not fully deferred — Resend hooks exist. SP-1 just makes the existing call null-safe for guests; it does not add new notification logic.)

**(h) Referral tail** (lines 176-247): wrap the whole block in `if (referral_code && user) { … }`. Referrals reward `referred_user_id = user.id`; a guest has no user id, so referrals are a logged-in-only feature. No behavior change for logged-in users.

**(i) Response.** Return the booking. For a **guest**, also return the plaintext `accessToken` + `reference_code` so the confirmation screen can show the order number and store the access link (SP-2 defines the exact response contract + the cookie exchange). Do NOT include the token for logged-in users (they authenticate by session).

```ts
return NextResponse.json(
  { data: booking, ...(isGuest ? { access_token: accessToken, reference_code: referenceCode } : {}) },
  { status: 201 },
);
```

### 3. `app/api/bookings/route.ts` — GET is unchanged
GET (lines 10-34) stays session-gated (401 for anon). A guest lists/looks-up bookings via the SP-2 token route, not this GET.

---

## Reuse + anti-duplication

- **Service-role client:** reuse `createAdminSupabaseClient` (`lib/supabase.ts:70`), already imported in `route.ts:4`. Do not create a new admin client.
- **Guest token + reference code:** reuse the **SP-2** helper (`lib/bookings/access.ts` `issueBookingAccess`). SP-2's generator itself mirrors the **walk-in** collision-retry pattern (`lib/barber/walkin-ticket.ts:148-200`, the `for` loop bumping `ticket_code` on `23505`). SP-1 writes **zero** token/code logic. This is the single biggest anti-duplication point — Section 10b forbids a parallel guest-auth scheme.
- **Phone contract:** reuse the exact Swiss regex `^\+41[0-9]{9}$` already in `walkInSchema` (`lib/validations.ts:267`) and `GuestBookingForm.tsx:30`. One contract, three call sites agree.
- **Guest form component:** reuse the existing, fully-built `GuestBookingForm.tsx` (113 lines, i18n-wired, validates name/phone/email, emits `GuestInfo {name, phone, email}`). It is currently **orphaned** — only re-exported in `components-legacy/booking/index.ts:7`, never rendered. SP-1 renders it; it does not rebuild it.
- **Rate limiting:** reuse `bookingLimiter` (`lib/ratelimit.ts:21`); only the key changes (IP for guest). Do not add a new limiter unless SP-0/SP-2 introduces the dedicated money-surface limiter (Section 10b#12).
- **No second migration:** all DDL goes into SP-0's one guarded migration (10b#4).

---

## Front-end mockups needed (Section 12 numbers + the integration point)

Per Section 12 (owner policy: FE = competitor-informed mockups, signed off before any real build), SP-1 needs:

- **Section 12 #1 — Guest booking form placement.** The component exists (`GuestBookingForm.tsx`); the mockup is a **design check + where it slots into the logged-out flow**, not a new build. Mockup at `public/solen-guest-booking-*.html` per the mockup convention, in English (internal artifact).
- **Section 12 #2 — Confirmation screen with the order number** is owned by SP-2, but SP-1's guest response returns the `reference_code` + `access_token` that screen consumes — note the handoff.

**Integration point (data wiring — the part SP-1 specifies precisely):**

Today the booking surface has **no session signal on the client**. The server page `app/[locale]/salon/[slug]/booking/page.tsx` fetches data with the admin client and renders `<BookingWizard>` with **no `user`/`session` prop** (verified: lines 138-164 pass only salon/services/staff data). `PayConfirmStep.tsx` POSTs to `/api/bookings` (lines 79-93) with no auth awareness. So:

1. **Surface logged-in state to the client.** In `app/[locale]/salon/[slug]/booking/page.tsx`, read the session server-side (`getSessionUser()` from `lib/supabase.ts:60`) and pass a boolean `isLoggedIn` down: `page.tsx` → `<BookingWizard isLoggedIn={…}>` → `<PayConfirmStep isLoggedIn={…}>`. This is a new prop threaded through `BookingWizard.tsx` (add to `BookingWizardProps`, pass into the `pay-confirm` case at line 133-134) and `PayConfirmStep.tsx` (`PayConfirmStepProps`, line 33-36).
2. **Render `GuestBookingForm` in the logged-out flow.** In `PayConfirmStep.tsx`, when `!isLoggedIn`, render `<GuestBookingForm onSubmit={…} submitting={isSubmitting} />` **above** the payment selector (or as the gate before the Buchen CTA — exact placement is the Section 12 #1 mockup's job). Store the returned `GuestInfo` in local state.
3. **Pass guest info to the POST.** Extend the existing `fetch('/api/bookings', …)` body in `PayConfirmStep.tsx` (lines 82-92) to include, when guest: `guest_name: guestInfo.name, guest_phone: guestInfo.phone, guest_email: guestInfo.email || undefined`. Logged-in: omit them (route ignores). The `handleConfirm` flow (lines 62-108) gates on `guestInfo` being valid before POSTing when `!isLoggedIn`.
4. **Consume the guest response.** On success for a guest, the response carries `access_token` + `reference_code`; redirect to the confirmation route carrying them (exact param/cookie handoff is SP-2). Logged-in: unchanged redirect `/confirmation?booking_id=…` (line 101).

> SP-1 delivers the **wiring spec + mockup**; it does not ship the visual. The mockup (Section 12 #1/#2) is signed off first, then the wiring above is implemented.

---

## Acceptance criteria (testable: curl as guest + as user, expected rows)

Assumes SP-0 columns + RLS edits and SP-2 `issueBookingAccess` are in place. Use a real available `salon_id` + `service_id` + `starts_at` (or a `slot_id`) from the live `availability_slots` (status `available`).

1. **Guest create (no auth cookie) succeeds via service-role.**
   ```bash
   curl -i -X POST "$BASE/api/bookings" -H 'Content-Type: application/json' -d '{
     "salon_id":"<SALON>","service_id":"<SERVICE>","starts_at":"<ISO_UTC_SLOT>",
     "guest_name":"Test Gast","guest_phone":"+41791234567","guest_email":"guest@example.com"
   }'
   ```
   Expect **201**, body `{ data: { id, user_id: null, guest_name:"Test Gast", reference_code:"…" }, access_token:"<plaintext>", reference_code:"…" }`.
   DB check:
   ```sql
   SELECT user_id, guest_name, guest_phone, guest_email, reference_code,
          (access_token_hash IS NOT NULL) AS has_hash
   FROM bookings WHERE id = '<RETURNED_ID>';
   -- user_id NULL; guest_* populated; reference_code present; has_hash = true
   ```
   And the matching slot flipped to `booked` with `booked_by = NULL`.

2. **Guest create missing phone → 400.** Same body without `guest_phone` → **400** `code:"GUEST_INFO_REQUIRED"`. No row written.

3. **Logged-in create unchanged (G1 regression).** With a valid auth cookie, POST the same body **without** guest fields → **201**, `data.user_id = <that user>`, `guest_name = NULL`, `access_token` **absent** from response. Confirms the G1 path is intact and guests-only get a token.

4. **Guest row is NOT anon-readable (RLS proof).** With the **anon** key (no session), attempt to select the guest row:
   ```sql
   -- executed as anon role / via anon PostgREST
   SELECT id FROM bookings WHERE id = '<GUEST_ROW_ID>';  -- expect 0 rows
   SELECT id FROM bookings WHERE user_id IS NULL;          -- expect 0 rows
   ```
   And confirm `anon` cannot insert a guest row directly (REVOKE proof):
   ```sql
   -- as anon: INSERT ... (user_id NULL) → permission denied / 0 rows
   ```
   The only way the guest reads their booking is the SP-2 token route.

5. **Salon owner CAN see the guest row (RLS positive).** As the salon's owner session: `SELECT id, guest_name FROM bookings WHERE salon_id = '<SALON>' AND user_id IS NULL;` returns the row (the salon must service the booking).

6. **CHECK guard holds.** A direct service-role insert with neither `user_id` nor guest contact is rejected by the `CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_phone IS NOT NULL))` constraint (DB-level, defense in depth).

7. **Token is single-issue + hashed.** The plaintext `access_token` appears in the response exactly once; the DB stores only `access_token_hash` (criterion 1's `has_hash`); plaintext is never persisted (grep the row — no plaintext column exists). (Hash/lookup correctness is SP-2's full suite; SP-1 verifies persistence only.)

---

## Risks + edge cases (cite Section 10)

- **RLS does not enable guests (10b#6).** The #1 trap: shipping nullable `user_id` and assuming guests can insert. They cannot — `bookings_insert_auth WITH CHECK (auth.uid() = user_id)` rejects NULL and rejects anon. Mitigation: service-role insert + `REVOKE INSERT FROM anon`. Acceptance #1/#4 prove both directions.
- **Guest row leakage (10b#6, 10b#7, Section 7 "Guest bearer token").** A guest row must never be anon-readable, and the order number alone must never be auth. Mitigation: SELECT/UPDATE policies explicitly require `user_id IS NOT NULL AND auth.uid() = user_id` (so NULL-user rows fall through to salon-owner-only); guest read is SP-2's token-gated service-role route with uniform 404 on bad code/token. SP-1 must NOT add an anon SELECT policy as a "convenience."
- **Token persistence vs SP-2 (10b#7).** SP-1 persists `access_token_hash` only; if SP-1 is built before SP-2's helper exists, do NOT inline a token scheme — block on SP-2. Inlining risks a non-256-bit / unhashed token (the exact thing 10b#7 forbids).
- **Rate-limit hole on the anon surface (10b#12).** A hard-401 today doubles as anon throttling; removing it opens the create endpoint to anon spam. Mitigation: IP-keyed `bookingLimiter` on the guest branch; flag that 10b#12 wants a dedicated money/lookup limiter (SP-0/SP-2). Do not leave the guest branch unthrottled.
- **PII on the booking (Section 7 "PII / Swiss DSG + GDPR", 10b#10).** Guest name/phone/email now sit on `bookings`. SP-1 only writes them; **retention/erasure is SP-2/SP-3** (GDPR erasure NULLs `guest_*`, never hard-deletes the row — it cascades to reviews). SP-1 must keep PII out of URLs and logs (no `console.log` of guest fields; token never in a path).
- **Money unit (10b#5).** SP-1 writes `price_paid` exactly as G1 does (`slot.price_override ?? services.price`) and touches **no** amount math. The Rappen/CHF unit bug is SP-0's to fix. SP-1 must not "helpfully" convert anything — out of scope, and touching it risks the 100x bug.
- **Two booking types (Section 7, 10a).** Walk-ins already have their own guest+ticket path (`barber_walkin_queue`, service-role). SP-1 is the **appointments** path; do not fork or refactor the walk-in path. Reuse only the *pattern* (collision retry) via SP-2, not the walk-in table.
- **Concurrency on slot + code (Section 7 "Code uniqueness", 10b#11).** Two guests hitting the same slot: the existing slot resolution + `status='available'` filter + post-insert slot-mark is the G1 behavior (unchanged). `reference_code` collision is handled by SP-2's retry loop. SP-1 adds no new race surface beyond what G1 already has. (Note: G1's read-then-mark slot flow is a pre-existing TOCTOU not introduced here; flag, don't fix in SP-1.)
- **Schema drift / single migration (10b#4).** The RLS rewrite + columns must ride SP-0's one guarded, idempotent migration. A standalone SP-1 migration risks the divergent-history abort 10b#4 warns about.
- **Profile-dependent code paths.** `is_first_visit_default`, `locale`, referral rewards all assume a profile row. Each is now guarded by `if (user)`. Edge case: a logged-in user with no profile row (shouldn't happen given the `handle_new_user` trigger, migration 014:46-64) still degrades to defaults.

---

## Out of scope for SP-1

- **Hashing, lookup, timing-safe compare, resend-my-link, `resolveBookingActor()`, the cookie exchange** — all SP-2 (10b#7).
- **`reference_code` generator + uniqueness backfill + display on confirmation/detail/dashboard + `/booking/lookup` page** — SP-2.
- **The SP-0 migration mechanics** (history reconcile, guarded forward-only migration, Rappen unit lock, `issueRefund` chokepoint) — SP-0.
- **Refunds, refund-requests, disputes/upcharges, eligibility, escalation, admin/salon review queues** — SP-3 / SP-5.
- **Email/SMS notification content** — owner's later piece; SP-1 only keeps the existing Resend confirmation call null-safe for guests (Section 9, 10a#4).
- **Guest PII retention / GDPR erasure cron** — SP-2/SP-3 (10b#10).
- **The actual visual build of any screen** — Section 12 mockups, signed off first; SP-1 ships the wiring spec + the Section 12 #1 mockup only.
- **Adding `payment_method` / `promo_code` / `gift_card_code` / `total_price` to the booking schema or persisting them** — pre-existing gap (PayConfirmStep sends them, schema drops them); not SP-1's scope, flagged only.
- **Walk-in booking/guest path** — already exists; deferred for refunds (D10), untouched here.
