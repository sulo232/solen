# Frontend gap fixes , the REAL fix, no hiding (owner 2026-07-18)

Owner: "go fix all of em except the hiding stuff or skipping over stuff. harden the gate , u keep
repeating hide it so customers cant see but we arent even live yet. if its hardcoded fake review,
remove that but then SEED fake but test reviews via real routes instead of hardcoding. harden bro"

RULE FOR THIS WORKSTREAM: never hide a feature because "not live / customers can't see it". Do the
real fix , wire the surface to its real route + SEED test data through the real tables/endpoints,
never hardcode, never hide. Deleting genuinely DEAD/duplicate/unreachable code IS allowed (it is
cleanup, not hiding). Enforced by .claude/hooks/no-easy-hide-gate.py (Stop gate, self-tested 4/4).
Full per-gap analysis: public/_reports/gap-decisions + scratchpad/decisions.json (60 gaps).

## WAVE 1 , highs + the fabrication class (do first)
- [x] #4 , VERIFIED ALREADY REAL (rule 16, the audit finding was stale). The LIVE homepage rows
  (ForYou/Nearby/Featured/RecentlyViewed) all pull real DB data via getSalonCardDataMap (fixed
  2026-07-16, commit 82c288691). The "4.95 / Bahnhofstrasse 28" literals the audit flagged live ONLY
  in FeaturedStylists.tsx, which is commented out at page.tsx:82 and never renders. Live-proven: 3
  cards' rating/price/postal match execute_sql; all 17 curated salons already have 7-25 real reviews
  + 11-15 services, so nothing needed seeding. No change. (Lesson: verify each gap vs current code
  before fixing; some findings are dead-code reads.)
- [x] #28 DONE + independently live-verified. Guest with a valid access token can now cancel/reschedule
  their own booking from the confirmation screen (token->cookie exchange + resolveBookingActor authz on
  the routes). SECURITY-CRITICAL negative test PASSED: no-cookie / wrong-token / garbage all 404, booking
  unchanged, no auth bypass. Caught + fixed 2 pre-existing RLS silent no-ops (reschedule + cancel writes
  never took effect for non-owners; moved to admin client, CAS-scoped). Reviewer PASS 6/6, tsc clean.
- [x] #29 DONE (the real fix, not hide). Phone resend branch now sends the access link via SMS
  (lib/sms.ts / seven.io, the cron sender). Live-traced: sendSMS invoked, token rotates, opaque 200
  preserved for match/no-match/bad-code (no enumeration leak), email branch unchanged. Commit below.

## WAVE 2 , wire the unwired features (real fixes)
- [ ] #5 Search date/service context dropped at PDP -> carry via query params + prefill booking.
- [x] #19/#50 DONE + live-proven. Voucher entry wired into PayConfirmStep -> sends voucher_code; TESTV10 drops CHF 45->35, invalid code -> toast + total unchanged. Reused the existing booking-pay-intent redemption path verbatim.
- [x] #52 DONE. Auto-applied credit now shows as a Guthaben line item in PayConfirmStep (credit_applied from the pay-intent response); live-proven credit_applied:15 -> total 45->30.
- [ ] #23 Receipt href /bookings/[id] 404s (no page) -> build the receipt page (or repoint to a real one).
- [ ] #49 Referral attribution lost (code written to localStorage, never read) -> read it at signup/booking.
- [ ] #37 Paged reviews lose photos (API doesn't select review_photos) -> select photos in the paged route.
- [ ] #36 Per-dimension review scores unwired (phantom columns) -> add the columns + wire, or drop cleanly.
- [ ] #55 Orphaned /inspo/board/[id] + /inspo/saved/[id] -> link them from the feed/saved surfaces.
- [ ] #56 Session-only saved state -> hydrate savedIds from /api/discovery/saves on load.
- [ ] #57 Boards not surfaced in the feed despite the comment -> surface boards or fix the comment+logic.
- [ ] #44 /profile/stamps orphaned from hub -> link it (or make the hub's Loyalty row honest).
- [ ] #46 /notifications not linked from the profile hub -> add a hub entry.

## WAVE 3 , dead-code deletions (real cleanup, allowed) + stale docs
- [x] #1 dead SalonResultCard deep-link vars + comment DELETED (verified 0 JSX refs).
- [ ] #2 dormant SearchBar island + handleSubmit -> delete (after confirming no live handler reads it).
- [x] #11 dead date-picker.tsx DELETED (verified 0 importers).
- [x] #16/#51 dead /checkout page DELETED (748 lines, verified unreachable) + graveyarded. #17/#18 moot.
- [x] #35 dead walk-in-pay copy labels DELETED (verified unused).
- [x] #3/#33/#40 stale comments CORRECTED (price filter wired, walk-in dedupe, i18n labels).
- [x] #38 dead salon_response fallback DELETED (field never arrives).
- [ ] #48 intake-forms raw DB-key labels -> localize.
- [ ] #47 hub counts silently coerce errors to 0 -> surface the error path.
- [x] #17 moot , /checkout deleted (#16).
- [x] #18 moot , /checkout deleted (#16).
- [x] #45 /profile/vouchers rebuilt into a real wallet (lists the user's real vouchers + credit); gift-cards left as-is (owner-hidden, verified). Live-proven wallet matches DB.

## SKIP , genuine LEAVE (intentional/known/harmless, per analysis)
#6 gift card owner-hidden (dated decision), #7 SalonLoyalty correctly removed, #8 nav/section minor,
#9 separate-flow reader note, #10 no fabrication, #12 gift_card owner-hidden, #13 in-memory cart by
design, #14 promo fields arrive pre-filled, #15 no-fabricate staff slot (correct), #21 two PI paths
(backend), #22 dead-link already in #23, #24 sheet-adapter placeholders (verify no reliance, minor),
#25... (map exact numbers to decisions.json before skipping; only skip a true "leave").

## CRITICAL FINDING (surfaced by the #19 coder) , FIXED + live-verified 2026-07-18
- [x] LOGGED-IN BOOKING BLOCKER , ROOT-CAUSED + FIXED. app/api/bookings/route.ts resolves the chosen
  availability_slots via the RLS-scoped SESSION client, which returned ZERO rows for any logged-in customer.
  Root cause (live pg_policies dump, not migration files): a June/July hardening pass replaced migration 014's
  public-read policy (`slots_select_available USING(true)`) with an OWNER-ONLY select policy
  (`availability_slots_select_4c9184_m`, EXISTS(salons WHERE owner_id=auth.uid())), leaving zero SELECT access
  for a logged-in non-owner. Guest bookings were unaffected (admin client bypasses RLS).
  FIX (additive, tightest predicate): migration 20260718120000 adds `availability_slots_select_public_available`
  FOR SELECT USING (status='available'). Every session-client read of this table already filters
  .eq("status","available"); booked/blocked rows (carrying another customer's booked_by/booking_id/client_id)
  stay invisible to non-owners. Owner-only policy untouched (Postgres OR's permissive SELECT policies).
  LIVE-VERIFIED via RLS simulation as a non-owner customer (kunde, sub=7c88e454) against a salon they don't own:
  available slots readable = 1660 (was 0), booked slots readable = 0 (no over-exposure). Migration applied live +
  committed. Related degradation still open below.
- [ ] RELATED (not the booking blocker, separate design call): app/api/availability/[salon_id]/route.ts and
  app/api/slots/route.ts (GET) read ALL statuses via the SESSION client to compute the calendar / fully-booked
  view. With the new policy a non-owner now sees only `available` rows through the session client, so booked
  slots are invisible to those two read paths , the calendar can no longer distinguish "booked" from "free".
  Needs a SECURITY DEFINER RPC or a status-only rollup view (return counts/booleans, never booked_by/client_id).
  NOT urgent for launch (booking POST works); flag before the calendar's fully-booked UI is relied on.

## Method
Layered loop per fix (coder + loop-reviewer), one commit per gap, live-verify. Backend-touching
fixes (SMS, reviews seed, voucher spend, receipt route) also run the council. SEED via real
routes/tables, never hardcode.
