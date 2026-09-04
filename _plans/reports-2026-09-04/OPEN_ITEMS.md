# Consolidated open-items audit — Solen.ch (2026-09-04)

Read-only verification pass over 12 prior audit/plan files. Every unchecked box, bug, and gap in
those files was re-checked against CURRENT code (file:line), the live Supabase database, or git
history — never trusted from the plan's own claim. 4 background verification agents plus direct
grep/read/DB checks by the orchestrator covered the full set; findings below are deduplicated
across sources.

## Counts

| class | count |
|---|---|
| STILL OPEN | 34 (3 security, 5 data-integrity, 7 customer-visible, 1 owner-dashboard, 13 dead/decorative, 5 doc-rot) |
| NEEDS OWNER | 11 |
| FIXED SINCE | 24 |
| OBSOLETE | 0 |
| UNVERIFIABLE | 2 |
| **Total items examined** | **71 of 71** (nothing hidden; several low-value cosmetic items from the 60-gap FRONTEND.md list were folded into their nearest matching entry rather than given a separate id, noted inline where that happened) |

Source files read in full: `_plans/BACKEND_LOOP_2026-08-23.md`, `_plans/FIX_ALL_2026-08-24.md`,
`_plans/BUGS_2026-08-11.md`, `_plans/GAP_FIXES.md`, `_plans/BACKEND_FIX_TRACKER.md`,
`_plans/BACKEND_IMPROVEMENT.md`, `_plans/GETUSER_MIGRATION.md`,
`_plans/BRANCH_RECONCILIATION_2026-08-14.md`, `_tasks/INCOMPLETE_FEATURES.md`, `_docs/FRONTEND.md`
(known-gaps section, items 1-60), `_plans/DEAD_FEATURES_FOR_OWNER.md`, `_plans/BOSS_LOOP_2026-08-31.md`.
`_plans/FIX_ALL_2026-08-24.md` turned out to be entirely `~/.claude` config-repo hook work, not
Solen product code — out of scope, excluded from counts.

---

## STILL OPEN

### Security

**SEC-1. Booking flow can disagree with an admin's payment-mode override.** `app/api/bookings/route.ts`
computes payment mode via `effectivePaymentMode()` (admin-override-aware), but
`app/[locale]/salon/[slug]/booking/page.tsx:55-58` only selects the raw `payment_mode` column
(never fetches `payment_mode_admin`/`payment_mode_enforced`), and
`components-legacy/booking/PayConfirmStep.tsx:157,163-164` computes its own local `paymentMode`
straight off `salon.payment_mode`, never importing the resolver. If an admin ever sets an override,
the customer-facing screen can show a different payment requirement than what the API enforces.
Sources: `_plans/BACKEND_LOOP_2026-08-23.md`. Fix size: M. NOT DESIGN.

**SEC-2. Customer cancel of a prepaid CONFIRMED booking never cancels the underlying Stripe
PaymentIntent.** `lib/bookings/customer-cancel-money.ts:91-117` (the `wasPrepaid` branch) calls
`issueRefund`, which throws `NOT_CAPTURED` (`lib/bookings/issue-refund.ts:121-124`) whenever
`payment_status` isn't `paid`/`partially_refunded`; the catch block only logs and the cancellation
proceeds. Repo-wide grep for `paymentIntents.cancel(` finds it only in walk-in tip/queue, tips, and
three cron jobs — none of them target a customer-cancelled CONFIRMED booking's dangling PI. Impact
is bounded (Stripe auth holds expire on their own after ~7 days, nothing ever captures the money),
but a cancelled booking should release the hold immediately. Sources: E2E finding chased down from
`_plans/BACKEND_IMPROVEMENT.md`, confirmed by direct code read. Fix size: S (add
`stripe.paymentIntents.cancel()` in the `NOT_CAPTURED` catch branch). NOT DESIGN.

**SEC-3. A test/unlisted salon's storefront page is publicly reachable and indexable.**
`lib/salon-detail.ts:61-70,87` (the PDP data loader) only checks `is_active`, never fetches
`is_test` or `listed_on_marketplace` — confirmed ~20 other listing/search routes DO apply all
three gates (e.g. `app/api/salons/route.ts:171-172`). `app/[locale]/salon/[slug]/layout.tsx:21-29`
(`generateMetadata`, which produces the SEO meta/OG tags) has NO visibility predicate at all, not
even `is_active`. A frozen, test, or deliberately-unlisted salon's page and its search-engine
metadata are live on the internet today if someone has (or guesses) the slug. Sources:
`_tasks/INCOMPLETE_FEATURES.md`. Fix size: S (add the same 3-gate predicate the other 20 routes
already use). NOT DESIGN.

### Data integrity (silent no-ops / phantom reads / dead persistence)

**DI-1. Refund application-fee source ignores `platform_settings`.** `lib/bookings/refund-config.ts:29-39`
still only reads an env var, never queries the `platform_settings` table even though that table now
exists live (confirmed via Supabase query, holds `referral`/`commission`/`homepage_sections` keys).
A stale code comment still says the table doesn't exist. Sources: `_tasks/INCOMPLETE_FEATURES.md`.
Fix size: S. NOT DESIGN.

**DI-2. Dashboard calendar day-bucketing uses browser-ambient timezone, not explicit Europe/Zurich.**
`app/[locale]/dashboard/calendar/page.tsx:61-65` (`ymdLocal()`) fixed the actual UTC-day-shift bug
that was manifesting, but derives "today" from the browser's local timezone rather than pinning
Europe/Zurich. Low real-world risk since salon owners run the dashboard from Switzerland, but the
literal fix requested was never done. Sources: `_plans/BACKEND_FIX_TRACKER.md`,
`_tasks/INCOMPLETE_FEATURES.md`. Fix size: S. NOT DESIGN.

**DI-3. `deleteSlot` on the dashboard calendar never re-fetches (mitigated by a side channel).**
`app/[locale]/dashboard/calendar/page.tsx:515-518` doesn't call `loadSlots()` after a delete
(unlike `rescheduleSlot`/`blockDay`, which do), but a realtime subscription
(lines 468-482) self-corrects the stale UI state independently. Low severity, but the intended fix
was never applied. Sources: `_plans/BACKEND_FIX_TRACKER.md`. Fix size: S. NOT DESIGN.

**DI-4. Service-photo delete (X button) doesn't persist.** The X button on a service photo only
updates local component state; `app/api/services/[id]/photos/route.ts` has no DELETE handler
(POST-only). A removed photo reappears the next time the page refetches. Sources:
`_tasks/INCOMPLETE_FEATURES.md`. Fix size: S/M (add the DELETE route + storage cleanup).
NOT DESIGN.

**DI-5. `solen-score/recalculate` cron is invisible to cron monitoring.**
`app/api/admin/solen-score/recalculate/route.ts` has zero references to `withCronRun` (grep
confirmed), so a failure or silent stop of this job would never show up in the `cron_runs` table
that every other cron job reports through. Sources: `_tasks/INCOMPLETE_FEATURES.md`, confirmed
directly. Fix size: S. NOT DESIGN.

### Customer-visible bugs

**CV-1. Dead receipt link on refund/upcharge case screens (404).**
`app/[locale]/bookings/[id]/refund/page.tsx:43` and `.../upcharge/page.tsx:47` both set
`receiptHref` to `/${locale}/bookings/${id}` — a path with no `page.tsx` (only `/report`,
`/refund`, `/upcharge` subfolders exist). Rendered as a real clickable link in
`RefundCaseView.tsx:946,973` and `UpchargeApproveView.tsx:335,422`. **This corrects a prior "fixed"
claim**: `_plans/GAP_FIXES.md` #23 verified a different, already-fixed link on the guest-lookup page
instead of this one. Sources: `_docs/FRONTEND.md` gap #23, `_plans/GAP_FIXES.md` (misdiagnosed).
Fix size: S (point `receiptHref` at `/${locale}/bookings/${id}/report`). NOT DESIGN.

**CV-2. Profile hub "favorites" count silently shows 0 on a failed query (regression).**
`app/[locale]/profile/page.tsx:159`: `favoritesCount={favoritesCountRes.count ?? 0}`, with the
error only sent to `console.error` (line 101); `AccountHub.tsx:87` types `favoritesCount` as a
plain number with no null/error state. This exact bug was fixed once
(`_plans/GAP_FIXES.md` #47, `countOf()` returning null) but the fix does not exist in the
2026-08-02 profile-hub rebuild — a genuine regression from an unrelated rebuild, not a new bug.
Sources: `_docs/FRONTEND.md` gap #47. Fix size: S. NOT DESIGN.

**CV-3. Notifications hub link buried one tap deeper (partial regression).** `_plans/GAP_FIXES.md`
#46 genuinely fixed a missing notifications link (commit `7ce6d21ed`, 2026-07-18), but the
2026-08-02 profile-hub rebuild (`AccountHub.tsx`, from an owner-approved mockup) dropped the direct
hub row. Still reachable via `/profile/settings` (`Row href=/notifications` at `settings/page.tsx:94`),
so impact is mild, but it isn't what shipped originally. Sources: `_docs/FRONTEND.md` gap #46.
Fix size: S. NOT DESIGN.

**CV-4. Completed loyalty stamp card has no redeem action.** `app/[locale]/profile/stamps/page.tsx:29-31`
comment still says "no `is_redeemed` boolean, pending v2 schema"; the completed-card section
(lines 188-215) renders a static "Belohnung verfügbar" badge with no `onClick`/`href`. A customer
who earns a reward has no way to claim it. Sources: `_docs/FRONTEND.md` gap #53. Fix size: M
(needs a schema field + redeem flow). DESIGN (the redeem action needs a UI decision).

**CV-5. No in-app link from booking confirmation to the tip flow.** Confirmed nowhere in the
confirmation screen links to `/tip` for a completed appointment. Sources: `_docs/FRONTEND.md`
gap #20. Fix size: S/M. DESIGN (placement/CTA needs a call).

**CV-6. Cookie-consent banner buttons fail the 44px touch-target floor — all three, not just one.**
Live-measured at 375x812 in `app/[locale]/_components/primitives/CookieConsent.tsx`: the
settings/customize icon button (`:325-339`, `h-9 w-9`) is 36x36px as previously flagged, but
"Nur notwendige" (`:359-372`) measures 156x43px and "Alle akzeptieren" (`:373-386`) measures
154x41px — both also under the 44px accessibility floor, which the original note never caught.
Sources: `_plans/BOSS_LOOP_2026-08-31.md`. Fix size: S (bump height classes on all three, no
layout change). NOT DESIGN.

**CV-7. `QueueStatus.firstName` always renders null.** Sources: `_docs/FRONTEND.md` gap #32. Fix
size: S. NOT DESIGN. Low priority.

### Owner-dashboard bugs

**OD-1. Dev-only Stripe Connect fallback has no commission split logic.** Dev-guarded, so no
production exposure. Sources: `_docs/FRONTEND.md` gap #34. Fix size: S. NOT DESIGN. Low priority.

### Dead / decorative features (rendered or present, wired to nothing)

**DEAD-1. `app/api/loyalty/award/route.ts`** — zero callers anywhere in `app/`/`components/`/`lib`.
Sources: `_plans/DEAD_FEATURES_FOR_OWNER.md`. Fix size: S (delete). NOT DESIGN.

**DEAD-2. `app/api/bookings/waitlist/route.ts`** — duplicate of the live `/api/waitlist` route
(actually called from `components-legacy/booking/WaitlistModal.tsx:66`); zero callers itself.
Sources: `_plans/DEAD_FEATURES_FOR_OWNER.md`. Fix size: S. NOT DESIGN.

**DEAD-3. `app/api/ai/intake-recommendation/route.ts`** — duplicate of the live `/api/ai/recommend`
route (called from `components-legacy/dashboard/IntakeFormTab.tsx:94`); only reference elsewhere is
a route-name string in a rate-limiter list, not a real caller. Sources:
`_plans/DEAD_FEATURES_FOR_OWNER.md`. Fix size: S. NOT DESIGN.

**DEAD-4. `app/api/reviews/eligibility/route.ts`** — real, working eligibility-check logic
implementing a dated owner decision (last touched 2026-08-09), but zero frontend callers
(`ReviewForm.tsx`, `SalonReviews.tsx`, review pages never call it). Note: the source doc's premise
that this is a "retired stub" is FALSE — it's live logic nobody wired up, not dead code. Sources:
`_plans/DEAD_FEATURES_FOR_OWNER.md` (claim corrected). Fix size: S/M (wire it into ReviewForm, or
delete). NOT DESIGN.

**DEAD-5. Dormant SearchBar island composer.** Sources: `_docs/FRONTEND.md` gap #2,
`_plans/GAP_FIXES.md` (parked). Fix size: S. NOT DESIGN. Low priority.

**DEAD-6. Two parallel Stripe PaymentIntent creation code paths** — `create-payment-intent` is
orphaned, only a stray comment references it. Sources: `_docs/FRONTEND.md` gap #22. Fix size: S
(delete the orphaned path). NOT DESIGN.

**DEAD-7. Dead `/walk-in-join` route** (self-redirects home). Sources: `_docs/FRONTEND.md` gap #29.
Fix size: S. NOT DESIGN.

**DEAD-8. Vestigial HMAC walk-in-pay token branch with no producer** — dead code, unnecessary
attack surface. Sources: `_docs/FRONTEND.md` gap #30. Fix size: S. NOT DESIGN.

**DEAD-9. Duplicate `SalonReviews` component names + an unused `ReviewForm` variant.** Sources:
`_docs/FRONTEND.md` gaps #41/#42. Fix size: S. NOT DESIGN. Cosmetic cleanup.

**DEAD-10. Dashboard unread-messages badge fetch with nothing rendering it.**
`app/[locale]/dashboard/page.tsx:128` still fetches `/api/conversations?...&unread=true` for a
badge count; the render site was deliberately removed
(`components-legacy/dashboard/DashboardLayout.tsx:298,389`, "messaging unread badge removed").
Harmless wasted fetch. Sources: `_plans/DEAD_FEATURES_FOR_OWNER.md` (found while verifying item 7).
Fix size: S (delete the fetch). NOT DESIGN.

**DEAD-11. Hardcoded curated homepage salon-id lists.** Not fabricated data (they're real salon
IDs), but editorial/hardcoded rather than data-driven. Sources: `_docs/FRONTEND.md` gap #4. Low
priority, benign. NOT DESIGN.

**DEAD-12. Portfolio+Loyalty tabs lost their sticky-nav affordance.** Cosmetic. Sources:
`_docs/FRONTEND.md` gap #8. Fix size: S. DESIGN (affordance is a visual decision).

**DEAD-13. Inert sheet-adapter placeholders.** Confirmed harmless/inert. Sources: `_docs/FRONTEND.md`
gap #27. Fix size: S. NOT DESIGN. Very low priority.

### Plans / doc rot

**ROT-1. `_plans/DEAD_FEATURES_FOR_OWNER.md` is stale on 4 of its 8 items.** Items 5 (account
deletion), 6 (salon of the month), and 7 (chat-media storage lock) are already fixed by a
stranded-branch commit (`1dcebe4e9`, 2026-07-13) that landed *before* the doc's own 2026-08-15
date — the "existed on one branch and nowhere else" pattern this project has documented elsewhere.
Item 4 (reviews/eligibility) is described as a stub; it's actually live logic. Action: update or
retire the doc's stale claims (see DEAD-4 above for what's still actually true).

**ROT-2. `_plans/GAP_FIXES.md` #23 misdiagnosed a fix** — it verified a different (already-fixed)
receipt link on the guest-lookup page instead of the still-broken one on the refund/upcharge case
screens (see CV-1). The doc should be corrected, not just left checked.

**ROT-3. `_plans/BRANCH_RECONCILIATION_2026-08-14.md` C10 box is still legitimately unchecked** —
confirmed via `git branch -a`: ~10 of the "REMAINING" branches are still unmerged today
(`backend-analysis-improvements-77f02b`, `bold-jepsen-6019eb`, `clever-mirzakhani-1af8ef`,
`context-compact-architecture-5d1ace`, `cranky-bose-5621bf`, `crazy-bose-57e405`,
`happy-jackson-514459`, `nice-hugle-c0b706`, `quirky-ellis-ef5559`, `sad-austin-a99451`), though
individual features have since been cherry-picked out of some of them (staff-permissions, search
cache, migrations). This box's own claim (unchecked = untriaged) is accurate, not stale.

**ROT-4. `_plans/DEAD_FEATURES_FOR_OWNER.md`'s walk-in-analytics description is stale.** It
describes 3 metrics stuck at zero; 2 of the 3 (`retention_pct`, `avg_tip`) were replaced with real
calculations since the doc was written (`app/api/dashboard/barber-leaderboard/route.ts:132-150`).
Only `chair_utilization` (`app/api/dashboard/walkin-analytics/route.ts:91`) is still hardcoded 0.

**ROT-5. `_plans/GAP_FIXES.md` numbering is offset for gaps #24/#25** — the fixes for those two are
actually filed under GAP_FIXES #28/#29, a cross-reference trap for future audits, not a functional
bug (both underlying issues are FIXED SINCE).

---

## NEEDS OWNER

**Q1.** "Production cron hasn't fired in 3 days (`cron_runs` table: 5 rows total, latest
2026-09-01 16:05 UTC, today is 2026-09-04) because `CRON_SECRET` still isn't set in Netlify.
`availability_slots` has 293,383 future rows but the furthest date is 2026-09-30 — the calendar
will go empty for every salon after that unless this is set. Want it fixed now?" (Highest-impact
open question in this whole audit — everything downstream of it is otherwise already correct.)

**Q2.** "The Supabase dashboard has a 'leaked password protection' toggle that's off. Note this
isn't the only defense: app-level HIBP breach-checking is already live and rejects breached
passwords at signup (`lib/auth/breached-password.ts`). The dashboard toggle would be an additional
layer, not the only one. Still want it turned on?"

**Q3.** "The no-show cron (`app/api/cron/no-show/route.ts:34-40`) is a pure time-window select with
no actual salon-confirmation gate — the 'salon-marked no-show' text in the audit log is just a
label, not a real check. Should marking a no-show require the salon to actually flag it first,
before the auto-charge fires?"

**Q4.** "The Edge Functions source directory was deleted from the repo (commit `71d1c2522`), but I
can't confirm from the repo alone whether the actual deployed functions on Supabase were also torn
down. Can you check the Supabase dashboard and confirm?"

**Q5.** "`chair_utilization` on the walk-in analytics dashboard is still hardcoded to 0
(`app/api/dashboard/walkin-analytics/route.ts:91`) — the other two metrics on that screen were
already made real. Building a real number needs a chair/station-count data model that doesn't exist
yet. Worth building, or should the metric be hidden until it's real?"

**Q6.** "There's a mockup ready (`public/_mockups/dashboard-filter-pill-gray.html`) for the
dashboard filter pill's selected state, which still uses light-blue on 9 dashboard pages while the
locked design-system recipe is calm gray. Option A keeps today's blue, option B uses the locked
gray recipe (but it visually disappears since the dashboard background is already that same gray),
option C is white fill + hairline + ink text (my recommendation, since B doesn't actually read as
selected against this particular background). Which do you want?"

**Q7.** "Three booking-failure reasons (the stylist hit their daily appointment cap, this looks
like a booking you already made, the stylist is fully booked) currently just show the generic
'Booking failed' message instead of a specific explanation. Want specific copy written for these
three, in all four languages?"

**Q8.** "The nightly prune-old-unbooked-slots job is still parked from 2026-08-26 — at today's
scale it would reclaim well under 1% of the table (889 of 227,758 eligible rows at last measure).
Still want it built despite the low payoff, or leave it parked?"

**Q9.** "`/profile/looks` is a permanent empty page — there's no `looks` table backing it. Build the
feature, or retire the route?"

**Q10.** "The inspo boards routes have zero live links pointing at them anywhere in the app. Wire
them up, or retire them?"

**Q11.** "Walk-in intake-form recommendation and reviews-eligibility both have real backend logic
with zero frontend callers (see DEAD-3, DEAD-4). Want these wired into the UI, or should the dead
routes just be deleted?"

---

## FIXED SINCE

- `getSession()` → `getUser()` identity-verification migration — 0 live server-side `getSession()`
  authz callers remain; one stale comment only (`app/api/favorites/toggle/route.ts:29`).
  `_plans/GETUSER_MIGRATION.md`.
- Avatar/photo storage purge on GDPR deletion — `lib/gdpr/purge-avatar-storage.ts` wired into the
  `process-deletions` cron; `app/api/admin/reports/[id]/route.ts:107-131` removes the storage
  object + row + prunes `gallery_urls`. `_plans/BACKEND_LOOP_2026-08-23.md`.
- 8 stranded security migrations (C14) — commit `064fe4fad` confirmed ancestor of `main`;
  `supabase/migrations/20260624070907_security_close_anon_write_holes.sql` present.
  `_plans/BRANCH_RECONCILIATION_2026-08-14.md`.
- Edge Functions shared-secret gate — moot, `supabase/functions/` source deleted entirely (commit
  `71d1c2522`); see Q4 for the one remaining unverifiable half. `_plans/BACKEND_FIX_TRACKER.md`.
- Double-booking race — EXCLUDE/GiST constraint `prevent_double_booking`
  (`supabase/migrations/20260328_prevent_double_booking_gist.sql:6`). `_plans/BACKEND_IMPROVEMENT.md`.
- Promo/member-discount max-uses race — atomic `reserve_promo_use`/`reserve_member_discount` RPCs
  (`app/api/stripe/booking-pay-intent/route.ts:252-253,276-281,380-390`).
  `_plans/BACKEND_IMPROVEMENT.md`.
- Commission rate fallback — all 8 money-charging paths query `platform_settings.commission`
  first, constant only as fallback. `_tasks/INCOMPLETE_FEATURES.md`.
- Service-photo upload routing — correct route + response shape now. `_tasks/INCOMPLETE_FEATURES.md`.
- `salons/[slug]` 500 on malformed `review_replies` — route refactored, normalizer handles all
  shapes. `_tasks/INCOMPLETE_FEATURES.md`.
- Voucher spend path — UI + API + DB RPC + advisory-lock hardening pass all confirmed live.
  `_docs/FRONTEND.md` gap #19, `_tasks/INCOMPLETE_FEATURES.md`.
- Guest booking cancel/reschedule + phone SMS resend — confirmed live (filed under GAP_FIXES
  #28/#29, an offset from the original #24/#25 numbering — see ROT-5). `_docs/FRONTEND.md`.
- Confirmation email now includes an access/manage link — `lib/email.ts:188-249`
  (`bookingConfirmation` takes `manageUrl`), `app/api/bookings/route.ts:636-654`. Shipped by a
  later initiative not tracked in GAP_FIXES. `_docs/FRONTEND.md` gap #26.
- Walk-in `/walk-in-pay` in-app entry point — `SalonDetailV3.tsx:261-267` +
  `SalonWalkInPanel.tsx:155-156,384-388` render a real `joinHref` link. `_docs/FRONTEND.md` gap #31.
- Referral code propagation — `lib/referral/attributeStoredReferral.ts` called from both
  `OnboardingFlow.tsx:88` (signup) and `BookingConfirmation.tsx:224-234` (post-booking retry), more
  complete than the original gap described. `_docs/FRONTEND.md` gap #49.
- Orphaned `/checkout` route + no spend visibility — both confirmed fixed. `_docs/FRONTEND.md`
  gaps #51/#52.
- Inspo feed `savedIds` hydration — `app/[locale]/inspo/page.tsx:131-136,183-207` hydrates from
  `/api/discovery/saves?ids=1`. `_docs/FRONTEND.md` gap #56.
- Account-deletion endpoint routing — `SettingsForm.tsx:242` calls the fuller
  `/api/profile/request-deletion` (handles guest-booking PII erasure), not the simpler
  `/api/profile/delete`. Commit `1dcebe4e9` (2026-07-13). `_plans/DEAD_FEATURES_FOR_OWNER.md`.
- "Salon of the month" homepage placement — `app/[locale]/page.tsx:60,283` mounts `SalonOfMonth`;
  public reader route exists, feature-flag gated. Commit `1dcebe4e9` (2026-07-13).
  `_plans/DEAD_FEATURES_FOR_OWNER.md`.
- Chat-media storage read lock — `20260815010000_chat_media_read_own_folder_only.sql` scopes SELECT
  to `auth.uid() = folder[1]` (INSERT/DELETE were already scoped). `_plans/DEAD_FEATURES_FOR_OWNER.md`.
- Search "Wo?" step trapped white space — commit `775d523d5` (2026-08-11) added
  `locSlackFor`/`dateLiftFor` (still present in `SearchOverlay.tsx:879-948`), closing the gap the
  same day it was flagged. `_plans/BUGS_2026-08-11.md`.
- Sentry — fully removed on purpose (confirmed via `package.json` + filesystem check), not an open
  item. `_plans/BACKEND_IMPROVEMENT.md`.
- Staff-invite permission check (`isInvitedStaff` gate) — confirmed live,
  `middleware.ts:175-212`. `_plans/GETUSER_MIGRATION.md` scope item.
- `dashboard/clients/[id]/notes` GET missing salon-ownership check — confirmed the matching check
  now exists alongside POST/DELETE. `_plans/GETUSER_MIGRATION.md`.
- `staff_invites` table columns (`access_role`, `permissions`) — confirmed present live via direct
  Supabase query. `_plans/BACKEND_LOOP_2026-08-23.md`.

---

## OBSOLETE

None found. No item in the 12 source docs had a matching `_design-system/REMOVED.md` entry or a
dated `TASTE_LOG.md` line marking it deliberately killed — everything either got fixed, is still
open, or needs an owner decision. (The in-app messaging conversation-view UI is deliberately
unreached per an owner-dated redirect from 2026-06-13, but that's a "not built yet by design," not
a "built then removed" case, so it's filed as DEAD-10/CV-adjacent above, not OBSOLETE.)

---

## UNVERIFIABLE

**UV-1. Bundle size ~4x over budget on two routes.** Could not get a clean, reproducible build in
this worktree — shared `node_modules`/`.cache` with live dev processes racing produced unstable
numbers. Weak signal: zero `next/dynamic` usage found on either route, suggesting the underlying
cause is still unaddressed, but the 4x figure itself is unrefreshed since 2026-07-27 and I can't
stand behind it as current. `_tasks/INCOMPLETE_FEATURES.md`.

**UV-2. Whether Supabase Edge Functions were actually torn down on the server**, not just deleted
from the repo. No tool available in this session can inspect deployed Supabase Edge Functions
directly; this is really a question for the owner (see Q4), not a true dead-end, but I'm marking it
unverifiable-by-me rather than guessing.

## Found during review, 2026-09-04 evening (not yet fixed)

**NEW-1. Dispute email link hardcodes German.** `app/api/bookings/[id]/dispute/route.ts:189` builds
`${baseUrl}/de/bookings/${bookingId}/upcharge` for the email, so a French or Italian customer lands on
the German page. Fix size: S (use the booking's or customer's locale, like the other booking emails do).
NOT DESIGN. Found by the CV-1 round-2 reviewer.

**NEW-2. Two more nightly jobs wrote no monitoring row.** `affinity-recompute` and
`salon-engagement-recompute` never called withCronRun; five scheduled names were missing from the
heartbeat map. Coder done, reviewer running. Found by the DI-5 reviewer.

**NEW-3. Dispute email is German-and-English only.** `app/api/bookings/[id]/dispute/route.ts` sends a
bilingual de/en subject and a German-only body to every customer; the link is now in the customer's
language (NEW-1 fixed) but the words around it are not. French and Italian customers get German.
Fix size: M (four-language template like the other booking emails; check lib/email for how the
booking confirmation picks its body). NOT DESIGN. Found by the NEW-1 coder.

**NEW-4. Two portfolio components nothing loads.** `components-legacy/discovery/StaffPortfolio.tsx` and
`components-legacy/nail/TechPortfolio.tsx` called two API routes that do not exist (now repointed at
the staff profile route). The reviewer is checking whether any screen still imports them; if none
does, they are dead code with filter pills that can never change the result. Decision for him:
delete both, or keep for the nail feature that is switched off.

**NEW-5. One copy key with no screen left.** `walk_in_customer` ("Walk-in Customer" in four languages)
was only ever sent as a fake customer name by the barber Express Menu; that send is gone (CV-7 round 2),
so the key renders nowhere. Fix size: XS (delete the key in all four language files, parity script
must stay green). NOT DESIGN.

**NEW-6. Italian cannot be saved as a profile language.** Live database rule on `profiles.locale`
allows de, en, fr only. Migration file written (20260904200000_profiles_locale_allow_it.sql), NOT
applied: it needs a drop + re-add of the rule, which the apply guard refuses without his word. PARKED
FOR HIM (plan, parked decision 2).

**NEW-7. A hidden salon can still be booked (council security, HIGH).** The hide rule added today
(inactive, unlisted, or test salon) covers the salon page, its metadata and the sitemap, but the
booking screen only checks inactive, and the bookings API checks nothing, so a raw call books and can
charge a card at a hidden salon. Coder out (one shared helper, booking screen, bookings API, staff
profile route, locale whitelist for the two email links).

## Added 21:45 (council + dead-link + walk leftovers, all parked with a reason)
- NEW-8 `/booking-action` page + `POST /api/bookings/[id]/quick-action` are built, but no email ever links to them (never wired; the one-click confirm/cancel link also needs `bookings.consumed_at` for replay protection, which is not live). Product decision + migration, parked.
- NEW-9 Three dashboard pages have no sidebar entry: earnings, help-editor, products. Which deserve a slot is his call; parked.
- NEW-10 Dead routes with zero inbound links: `/profile/settings/personal` (merged into /profile/edit), `/inspo/saved/[id]` (duplicate of /inspo/[id]), `/referral/[code]` (superseded by ?ref=), `/brand/[slug]`, `/inspo/board/[id]`. Deleting is his call; parked.
- NEW-11 Receipt link on refund/upcharge case pages shows for any logged-in viewer of a guest booking (link 404s, no leak). Low; parked.
- NEW-12 Six more files carry their own Zurich date formatter (express-rebook, two availability routes, birthday-messages, daily-digest x2); `zurichYmd` in lib/time/zurich.ts now exists to replace them when next touched.
- NEW-13 The two older "see all" circle copies differ from the SeeAllButton variant (icon stroke 2.2 vs 2; the rails one is an inert span with no 44px hit cell). Converging them changes pixels, so it is mockup work, not a cleanup.
- NEW-14 Welcome email (lib/email.ts:660-672) uses em-dashes and the informal "du" register in German; COPY_LAW says "Sie". Copy change, parked for the mockup/copy pass.
- NEW-15 `_tasks/search-golden-queries.ts:500` still hand-rolls the hidden-salon rule; dev script, converge when touched.
- NEW-16 `scripts/check-geometry.mjs` FLOORS_ALLOWLIST (2026-07-25) looks stale: home imagery now passes but is still listed. Audit entry by entry.
- NEW-17 Dev-mode Next returns HTTP 200 on a deep notFound() (streaming); check whether `next start` does too, since it would affect crawler signals on every 404.
- NEW-18 First-name derivation is copied in 7+ places (queue status, /api/me, reviews page, calendar x4, useCustomerPrefs); a shared helper would collapse them.
