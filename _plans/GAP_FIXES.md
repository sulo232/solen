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
- [ ] #4 Homepage For-you/Nearby/Featured rows render HARDCODED rating 4.95 / price 45 / address
  "Bahnhofstrasse 28" (forYouSalons.ts, searchFeatured.ts -> ForYouSalonRows.tsx:48-62). Real fix:
  drop the hardcoded values, fetch each curated salon's REAL rating/price/address from DB; where a
  test salon has no reviews, SEED test reviews via the real reviews table/route so the rating is
  real-but-seeded. (This is the owner's exact example.)
- [ ] #28 Guest cannot cancel/reschedule from confirmation (canManage=!isGuest). Real fix: wire the
  guest actor path so a guest with a valid access token can cancel/reschedule.
- [ ] #29 Phone-channel resend is a delivery no-op (rotates token, sends no SMS). Real fix: send the
  SMS on the phone branch (seven.io is already wired for reminders), not hide the tab.

## WAVE 2 , wire the unwired features (real fixes)
- [ ] #5 Search date/service context dropped at PDP -> carry via query params + prefill booking.
- [ ] #19 / #50 Voucher spend unwired from the live pay UI -> add the voucher field to PayConfirmStep
  and send voucher_code (the spend path in booking-pay-intent is fully built).
- [ ] #52 Credit auto-applied silently -> show the applied credit in PayConfirmStep.
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
- [ ] #1 dead SalonResultCard deep-link vars + comment -> delete.
- [ ] #2 dormant SearchBar island + handleSubmit -> delete (after confirming no live handler reads it).
- [ ] #11 dead date-picker.tsx (zero importers) -> delete.
- [ ] #16 / #51 dead /checkout page (~660 lines, unreachable, dup of live pay) -> delete + graveyard.
- [ ] #35 dead walk-in-pay copy labels -> delete.
- [ ] #3 / #33 / #40 stale comments (price filter, dedupe, i18n) -> correct them.
- [ ] #38 dead salon_response fallback -> delete.
- [ ] #48 intake-forms raw DB-key labels -> localize.
- [ ] #47 hub counts silently coerce errors to 0 -> surface the error path.
- [ ] #17 /checkout misrepresents referral total_earned as credit -> moot once #16 deletes /checkout; verify.
- [ ] #18 /checkout warm-terracotta stale design -> moot once #16 deletes it; verify.
- [ ] #45 /profile/vouchers + /profile/gift-cards redirect-only no-op routes -> once vouchers wired (#19), make real; else delete the routes.

## SKIP , genuine LEAVE (intentional/known/harmless, per analysis)
#6 gift card owner-hidden (dated decision), #7 SalonLoyalty correctly removed, #8 nav/section minor,
#9 separate-flow reader note, #10 no fabrication, #12 gift_card owner-hidden, #13 in-memory cart by
design, #14 promo fields arrive pre-filled, #15 no-fabricate staff slot (correct), #21 two PI paths
(backend), #22 dead-link already in #23, #24 sheet-adapter placeholders (verify no reliance, minor),
#25... (map exact numbers to decisions.json before skipping; only skip a true "leave").

## Method
Layered loop per fix (coder + loop-reviewer), one commit per gap, live-verify. Backend-touching
fixes (SMS, reviews seed, voucher spend, receipt route) also run the council. SEED via real
routes/tables, never hardcode.
