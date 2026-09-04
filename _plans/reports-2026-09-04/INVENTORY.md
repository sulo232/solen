# Open Items Inventory — merged, deduped, still-open only (2026-09-04)

**BUGS: 47 | UI_CHANGES: 16 | HIS_DECISIONS: 21 | UNCLEAR: 20** (104 total, deduped from the raw rows; all `still_open:false` rows dropped)

Dedup note: where two or more source_ids described the same defect (explicit "duplicate of X" / "same as X" in the proof, or identical file+root cause), they are merged into one row with all source_ids listed. A few merges combine rows whose given `kind` disagreed (e.g. one source called it `bug`, another `his-decision` for the same fact) — the kind used is noted inline where it matters.

---

## BUGS (47) — CRITICAL > HIGH > MEDIUM > LOW, then by surface

None open at CRITICAL (all four CRITICAL-1..4 backend races are fixed and closed).

### HIGH (4)

1. **[HIGH-1]** Invited staff dashboard is functionally dead: 2 nav links 404, 2 pages render empty for staff.
   Surface: `components-legacy/dashboard/DashboardLayout.tsx` (STAFF_NAV), `app/[locale]/dashboard/calendar/page.tsx:503`, `app/[locale]/dashboard/settings/page.tsx:1449`.
   Close condition: `DashboardLayout.tsx:107-110` STAFF_NAV no longer links to `/dashboard/my-breaks` or `/dashboard/my-portfolio` (neither route exists today), AND both `calendar/page.tsx:503` and `settings/page.tsx:1449` fall back to `p?.staff_salon_id` when `p?.salon_id` is absent.

2. **[0-skeleton-timing, 1.2a, 1.5a]** `/de/search` and `/de/inspo` render pure skeleton for several seconds (measured 10-15s on a cold hit) with no timing floor anywhere in the design system.
   Surface: `/de/search`, `/de/inspo`.
   Close condition: a skeleton-duration floor is defined in the design system, and a timed cold load of both routes shows real content within that bound (e.g. under 3s), not 10-15s.

3. **[1.1e, 2-crosscard]** `WalkInBand.tsx` hand-builds its own salon card instead of importing the real `SalonCard` (Favorites was already fixed to use it; this is the one surface still diverging).
   Surface: `app/[locale]/_components/homepage/WalkInBand.tsx:109,124,161`.
   Close condition: `grep -n "SalonCard" app/[locale]/_components/homepage/WalkInBand.tsx` returns a real import, and the inline `rounded-[13px] border border-s-border bg-white p-3` divs at those three lines are gone.

4. **[1.6-loading]** Dashboard renders zero text at 1.5s settle and resolves slowly (4s / 8s observed).
   Surface: `/de/dashboard`.
   Close condition: a timed, authenticated load of `/de/dashboard` shows the StatTile numbers rendered (non-empty text content) within 1.5s.

### MEDIUM (22)

5. **[CV-6]** Cookie-consent banner: all three buttons fail the 44px touch-target floor.
   Surface: `app/[locale]/_components/primitives/CookieConsent.tsx:379-424`.
   Close condition: the settings icon button is `h-11 w-11` (44px) and both action buttons compute to >=44px total height (today: `h-9 w-9` icon button, `px-4 py-2.5`/`text-[14px]` actions at ~36-38px).

6. **[DEAD-6]** Two parallel Stripe PaymentIntent creation paths; `app/api/stripe/create-payment-intent` is orphaned, reading a query param nothing builds.
   Surface: `app/api/stripe/create-payment-intent`.
   Close condition: the route is deleted (with a `REMOVED.md` entry) or wired to a real caller; `_docs/FRONTEND.md:464` no longer calls it orphaned.

7. **[Home + PDP First Load JS, UV-1]** Home and salon-PDP First Load JS are ~4x the 200KB bundle budget; zero `next/dynamic()` calls in either route (the "unreproducible" framing in UV-1 is resolved — it's confirmed real).
   Surface: `app/[locale]` (home), `app/[locale]/salon/[slug]` (PDP), plus city/category, coiffeur, barbershop, search, inspo.
   Close condition: `grep -c "next/dynamic" app/[locale]/page.tsx app/[locale]/salon/[slug]/page.tsx` returns >0, and a production build's First Load JS for `/` and `/salon/[slug]` is within 2x of the 200KB budget.

8. **[MEDIUM-2]** pre-charge and release-payments crons never populate `errors[]`, so `withCronRun` reports `ok:true` even on a 100%-failure run.
   Surface: `app/api/cron/pre-charge/route.ts:203`, `app/api/cron/release-payments/route.ts:65`, `lib/cron-run.ts`.
   Close condition: both routes' return objects include a populated `errors` array on any per-item failure, and `withCronRun`'s ok-check treats a non-empty `errors` array as `ok:false`.

9. **[MEDIUM-4]** Service name renders in English instead of fr/it in lifecycle emails at 7 call sites.
   Surface: `app/api/bookings/route.ts:659-661` + `app/api/cron/no-show/route.ts:34,136`, `pending-timeout/route.ts:71`, `pre-charge/route.ts:37,192`, `rebooking-nudge/route.ts:43,104`, `app/api/slots/[id]/route.ts:21,38,62,123`.
   Close condition: all 7 sites branch on all 4 locales (not `de`/`en` only) and the underlying `services` SELECT includes `name_fr`/`name_it`.

10. **[MEDIUM-5]** `notification_preferences.rebooking_enabled` has zero write sites (no UI, no writer) so its read-side gate in loyalty/award can never fire (the sibling `deals_enabled` half is already fixed).
    Surface: `app/api/loyalty/award/route.ts:86,90`, `app/api/cron/nail-infill-reminders/route.ts:82,86`.
    Close condition: a PATCH endpoint or settings-form control writes `rebooking_enabled`, and at least one live row carries a non-null value.

11. **[MEDIUM-6]** `GET /api/metrics/global` silently serves hardcoded fallback stats on any query failure or null result, with no logging; route has zero live callers.
    Surface: `app/api/metrics/global/route.ts:9-16,52-65`.
    Close condition: the catch block calls `console.error(...)` before returning the fallback, or the route is deleted.

12. **[MEDIUM-7]** Walk-in refund PATCH has no Stripe idempotency key; a repeat cancel PATCH can fall through to a second `stripe.refunds.create` call under a narrow race.
    Surface: `app/api/walkin/queue/[id]/route.ts:82-89,248`.
    Close condition: the `stripe.refunds.create` call at line 248 passes an `idempotencyKey` derived from the entry id, and the CAS at lines 82-89 checks against the entry's previously-read status, not a freshly re-read one.

13. **[MEDIUM-8]** Walk-in-linked booking's `payment_status` is permanently frozen at `deposit_held` because the walk-in lifecycle never writes back to `bookings`.
    Surface: `lib/barber/walkin-ticket.ts:279-281`, `app/api/walkin/queue/[id]/route.ts`.
    Close condition: the completed/no_show/cancelled branches in the walk-in route update `bookings.payment_status` to a terminal value.

14. **[MEDIUM-9]** `charge.refunded` Stripe webhook has no CAS/ordering guard (unlike 3 sibling handlers in the same file), so out-of-order delivery can revert `salon_payouts` to a stale higher gross figure.
    Surface: `app/api/stripe/webhook/route.ts:921-946`.
    Close condition: the update at those lines gains a `.eq(...)` guard against a stored refunded-so-far watermark or event timestamp, matching the pattern at lines ~212-223 and ~448-454 in the same file.

15. **[MEDIUM-10, corroborated by 10l]** Salon-owner booking confirm has no compare-and-swap; a concurrent cancel can be silently overwritten back to `confirmed`.
    Surface: `app/api/bookings/[id]/confirm/route.ts:46-49`.
    Close condition: the update adds `.eq('status', booking.status)` and a `.select().maybeSingle()` match-check, mirroring the cancel route's CAS pattern.

16. **[NEW-3]** Dispute email body is German/English only; fr/it customers get German (the locale-resolution half of this bug, NEW-1, is already fixed).
    Surface: `app/api/bookings/[id]/dispute/route.ts:205-207`.
    Close condition: the subject/html branch covers all 4 locales, not `DE|EN` only.

17. **[NEW-9, ORPHAN-18, ORPHAN-19, ORPHAN-20]** Three fully-built dashboard pages (earnings, help-editor, products) have no sidebar nav entry.
    Surface: `app/[locale]/dashboard/earnings/page.tsx`, `help-editor/page.tsx`, `products/page.tsx`; `components-legacy/dashboard/DashboardLayout.tsx`.
    Close condition: `grep -n "earnings\|help-editor\|/products"` against `DashboardLayout.tsx` returns a nav-entry match for all three (today: zero).

18. **[Pair-D-i18n-bug]** `SalonServices.tsx` renders hardcoded German text ("Alle ansehen", "Buchen") on every locale.
    Surface: `app/[locale]/_components/salon/SalonServices.tsx:174,246`.
    Close condition: both sites call a translation function instead of a literal German string.

19. **[Q23(pdp-map)]** PDP map's "Wegbeschreibung" link uses an address-text Google search, not the salon's actual stored lat/lng, so directions can be inaccurate (tappability itself is already fixed).
    Surface: `app/[locale]/_components/salon/SalonLocation.tsx:192`.
    Close condition: `directionsHref` is built from `salon.latitude`/`salon.longitude`, not `salon.address`.

20. **[1.1d, 3-priority1]** `NearbyMap` markers render in the fallback typeface (no font-family class).
    Surface: `app/[locale]/_components/homepage/NearbyMap.tsx:72`.
    Close condition: line 72 sets a font-family class (e.g. `font-body`) alongside `font-semibold`.

21. **[1.1f]** Wait-estimate number on the home walk-in band renders in semantic success-green as the loudest text on the card.
    Surface: `app/[locale]/_components/homepage/WalkInBand.tsx` (~line 129).
    Close condition: the wait-range text no longer carries `text-s-success`; green stays confined to a status icon.

22. **[1.1g]** Review cards carry both a hairline border and a shadow simultaneously, violating the one-surface-table lock.
    Surface: `app/[locale]/_components/homepage/Reviews.tsx:150-151`.
    Close condition: the className array has either `border-s-border` or a `shadow-elevation-*` class, never both.

23. **[1.2b]** 5 distinct font sizes inside one 8px band on `/de/search`'s first viewport.
    Surface: `app/[locale]/_components/search/SearchTemplate.tsx` (lines 1370-2573).
    Close condition: a getBoundingClientRect/computed-style sweep of the rendered first viewport counts <=4 distinct font sizes.

24. **[1.3a]** 5 distinct font sizes clustered in an 8px window on the salon PDP.
    Surface: `/de/salon/muse-beauty-studio`.
    Close condition: same measurement on the PDP's first viewport counts <=4 distinct sizes.

25. **[1.4b]** 7 distinct font sizes on `/de/profile` — the worst of all screens measured (the FavoritesList card-source bug on the same screen, 1.4c, is already fixed).
    Surface: `/de/profile`.
    Close condition: same measurement on the profile hub's first viewport counts <=4 distinct sizes.

26. **[9g-half-replaced-jobs]** Two neutered cloud functions (salon-freeze escalation, recurring bookings) were only half-replaced when the Supabase Edge Functions were deleted.
    Surface: scheduled jobs / salon freeze escalation, recurring bookings.
    Close condition: a scheduled job exists (verifiable in `.github/workflows/cron-jobs.yml`) that performs both salon-freeze escalation and recurring-booking generation.

### LOW (21)

27. **[#58]** `/nail-admin` sits inside `middleware.ts`'s `adminOnlyPaths`, wrongly gating it as admin-only (dormant while `nail_features` is off; fix explicitly deferred by design).
    Surface: `middleware.ts:249`.
    Close condition: `/nail-admin` is removed from `adminOnlyPaths` (owner-deferred until nail features return, per plan notes).

28. **[confirmed-4]** Home map tile's label now matches its own pin count (fixed), but the map PAGE it opens still lists a different count (12) via its own separate viewport filter — never investigated further.
    Surface: home map tile + the map page it opens.
    Close condition: the map page's viewport filter is checked against `NEARBY_SALON_IDS` and the counts reconciled, or the discrepancy is explicitly documented as intentional.

29. **[CV-3]** Notifications hub link is buried one tap deeper than favorites/vouchers; only reachable via `/profile/settings`.
    Surface: `app/[locale]/_components/profile/AccountHub.tsx:228`.
    Close condition: `AccountHub.tsx` links directly to `/profile/notifications` in addition to (or instead of) `/profile/settings`.

30. **[D7]** Refund commission-keep flag reads only the env var default; `platform_settings.commission` has no key for it yet.
    Surface: `lib/bookings/refund-config.ts:24-37`.
    Close condition: `getRefundConfig()` reads a `platform_settings` column once one is added, instead of only `REFUND_APP_FEE_DEFAULT`.

31. **[DEAD-1]** `app/api/loyalty/award/route.ts` has zero callers.
    Surface: `app/api/loyalty/award/route.ts:10`.
    Close condition: the file is deleted (with a `REMOVED.md` entry) or a real caller is added.

32. **[DEAD-2]** `app/api/bookings/waitlist/route.ts` duplicates the live `/api/waitlist` route.
    Surface: `app/api/bookings/waitlist/route.ts`.
    Close condition: one of the two routes is deleted and `REMOVED.md` logs it.

33. **[DEAD-3, Q11]** `app/api/ai/intake-recommendation/route.ts` duplicates `/api/ai/recommend`, zero callers.
    Surface: `app/api/ai/intake-recommendation/route.ts`.
    Close condition: the route is deleted or wired to a real UI caller.

34. **[DEAD-4, Q11]** `app/api/reviews/eligibility/route.ts` has zero frontend callers.
    Surface: `app/api/reviews/eligibility/route.ts`.
    Close condition: the route is deleted or wired to a real UI caller.

35. **[DEAD-5]** Dormant SearchBar island composer, parked with no live code path using it.
    Surface: `app/[locale]/_components/homepage/SearchBar.tsx` and related files.
    Close condition: the composer is deleted or a real usage is added.

36. **[DEAD-7]** Dead `/walk-in-join` route that self-redirects home.
    Surface: `app/[locale]/walk-in-join`.
    Close condition: the directory is deleted (with a `REMOVED.md` entry).

37. **[DEAD-8]** Vestigial HMAC walk-in-pay token verification branch with no producer.
    Surface: `app/api/bookings/walk-in-verify/route.ts:17-46`, `app/api/walkin/confirm/route.ts:13-24`.
    Close condition: the HMAC branches are removed, or a producer is confirmed and documented.

38. **[LOW-1]** nail-infill-reminders and barber-smart-reminders crons never check the `nail_features`/`barber_features` kill switch before messaging customers.
    Surface: `app/api/cron/nail-infill-reminders/route.ts`, `app/api/cron/barber-smart-reminders/route.ts`.
    Close condition: both routes call a feature-flag check before sending, and `grep` for `checkFeatureEnabled` in each file returns a hit.

39. **[LOW-5]** Three Gemini AI routes swallow errors with no server log; intake-recommendation also swallows its own DB-write error and reports success regardless.
    Surface: `app/api/ai/recommend/route.ts:64-66`, `app/api/salons/[slug]/ai-info/route.ts:104-106`, `app/api/ai/intake-recommendation/route.ts:96-99`.
    Close condition: all three call `console.error(...)` before returning/continuing (currently unreachable by real users, so low-priority).

40. **[LOW-7]** Day-bucketing uses a raw UTC date slice instead of `zurichYmd()` at 4 call sites, silently misfiling bookings starting between midnight and ~2am Zurich time.
    Surface: `app/api/bookings/route.ts:271`, `app/api/bookings/[id]/cancel/route.ts:299`, `app/api/bookings/recurring/route.ts:47-49`.
    Close condition: all 3 files call `zurichYmd()` instead of `.slice(0,10)` / `toISOString().split('T')[0]`.

41. **[NEW-11]** Receipt link shows for any logged-in viewer of a guest booking (currently 404s, no actual data leak).
    Surface: `app/[locale]/bookings/[id]/refund/page.tsx:24-33,48`.
    Close condition: `isGuest`/`receiptHref` logic checks real ownership of the specific booking, not just "is any user logged in".

42. **[OD-1]** Dev-only Stripe Connect fallback has no commission-split logic (non-prod only, dev-guarded).
    Surface: dev Stripe Connect fallback in `pay-intent/route.ts`.
    Close condition: the dev fallback adds `transfer_data`/commission split, or stays explicitly documented as dev-only with no live-money path.

43. **[PHANTOM-3, 1c-dead-route]** `/api/slots/next-available` selects a nonexistent `services.name` column (would always return the literal "Service") and has zero callers.
    Surface: `app/api/slots/next-available/route.ts:16,22,25`.
    Close condition: the route is deleted, or `services!inner(name)` at line 22 is corrected to a real column (`name_de`/`name_en`/etc).

44. **[promo/member-discount race]** Member-discount per-window cap is still a check-then-act race (the sibling promo-code race is already fixed via `reserve_promo_use`).
    Surface: `lib/loyalty/perks.ts:201-204`.
    Close condition: the discount-count check is replaced with an atomic RPC reservation, matching the promo fix's pattern.

45. **[refund-inversion phantom-reservation]** Claim-first refund inversion leaves a rare phantom-reservation window on a mid-flight process crash.
    Surface: refund/reconcile flow.
    Close condition: a durable `refund_pending` marker + sweeper exists (`grep -r "refund_pending"` currently returns zero hits anywhere in the repo).

46. **[SMS+email notifications]** Walk-in "you're next" notification is still not sent; the functions for it exist but have zero callers.
    Surface: `lib/email.ts:908,925` (`barberYoureNextSMS`, `barberQueuePositionSMS`), `app/api/walkin/queue/[id]/route.ts:266`.
    Close condition: the walk-in queue route's status-change branch calls one of those two functions.

47. **[UNKNOWN-TABLE-3, 1c-clients-tags]** Salon-owner client list's VIP/Regular/New/At-risk tags depend on a `clients`/`client_rfm_segments` table that does not exist live, so tags never render (currently a guarded, honest degrade — not a fabrication).
    Surface: `app/api/salon/clients/route.ts:83-85`, `app/[locale]/dashboard/clients/page.tsx`.
    Close condition: `to_regclass('public.clients')` returns non-null on the live DB, or the gap is explicitly parked as an owner decision (it currently degrades gracefully either way).

---

## UI_CHANGES (16) — surface + what the mockup must show + component/route to copy

1. **[CV-4]** Surface: `/profile/stamps` completed stamp card. Mockup must show: a redeem action/button on a completed card (today: only a static "reward available" badge, no `is_redeemed` column). Copy: `app/[locale]/profile/stamps/page.tsx` (redeemed section, real `StampCard`).

2. **[CV-5]** Surface: booking confirmation screen. Mockup must show: an in-app CTA/link from confirmation into the tip flow. Copy: `components-legacy/booking/BookingConfirmation.tsx`.

3. **[DEAD-12]** Surface: `/profile` portfolio + loyalty tabs. Mockup must show: the sticky-nav affordance restored while scrolling those tabs. Copy: `ProfileTabs.tsx`.

4. **[Discovery-store DM]** Surface: Inspo/discovery item detail. Mockup must show: a share-to-DM / book-from-inspo entry point linking a discovery item to a real booking or conversation action. Copy: the real Inspo item detail page (no `/discover/[id]` route exists yet — build the mockup against the existing Inspo detail surface, not a from-scratch page).

5. **[NEW-13]** Surface: "see all" circle button (home sections, PDP). Mockup must show: one consolidated see-all treatment (icon stroke + hit-cell) replacing today's two divergent legacy variants. Copy: `SeeAllButton.tsx` (canonical) next to `SectionHeader.tsx`'s current inline variant.

6. **[NEW-14]** Surface: welcome email, German body. Mockup must show: formal `Sie/Ihr` register with no em-dashes, beside the current informal/em-dash body. Copy: `lib/email.ts`'s `welcomeEmail()` German template.

7. **[Parked-5]** Surface: bottom sheet close-by-flick gesture. Mockup must show: the flick-close physics comparison already built, awaiting his verdict (no rebuild needed). Copy: `/en/dev/sheet-flick` (existing comparison page).

8. **[Pair-B]** Surface: review card (home + wherever reviews render). Mockup must show: hairline-only vs hairline+shadow, side by side at real size (built once already, verdict never recorded). Copy: `Reviews.tsx`.

9. **[Per-service staff assignment]** Surface: booking flow, staff selection step. Mockup must show: per-service staff selection on a multi-service cart, vs today's single stylist-per-booking. Copy: `components-legacy/booking/StaffStep.tsx`.

10. **[Q6]** Surface: dashboard filter pills (9 pages). Mockup must show: the gray selected-state treatment replacing today's light-blue selected pill. Copy: the real filter pill on a dashboard list page; finish the existing draft at `public/_mockups/dashboard-filter-pill-gray.html`.

11. **[Q-2026-06-11-slot-radius]** Surface: `DateTimePicker` slot buttons (booking + search). Mockup must show: 12px-radius rectangle slots beside the current pill (`rounded-full`) treatment. Copy: `app/[locale]/_components/primitives/DateTimePicker.tsx`.

12. **[round2-5]** Surface: search panel, "Wo?" step, keyboard up. Mockup must show: proof (on his actual iPhone, via a tunnel link) that the white gap under "Basel" is gone — three prior code fixes were never verified in his conditions. Copy: `SearchOverlay.tsx`'s real Wo? step.

13. **[wave1-directory-cards]** Surface: category route result grid (e.g. `/de/basel/coiffeur`). Mockup must show: how a non-bookable Google-directory listing would render, separate section vs mixed into the grid. Copy: `SearchTemplate.tsx`'s real result grid.

14. **[log-search-panel-zindex]** Surface: search panel overlay. Mockup must show: the panel's z-index values placed on the locked layering ladder (today: raw `z-[100]/[101]/[102]`) without breaking stacking against the map/sheet. Copy: `SearchOverlay.tsx`.

15. **[1.2c]** Surface: `/de/search` first viewport. Mockup must show: a real display anchor >=28px added where none exists today. Copy: `SearchTemplate.tsx`'s real header area.

16. **[1.5b]** Surface: `/de/inspo` first viewport. Mockup must show: a real heading anchor replacing today's placeholder search text as the de-facto anchor. Copy: the real Inspo page header area.

---

## HIS_DECISIONS (21)

1. **[Q1, round2-3, Netlify: Post-Deploy Manual Steps, Parked-1] — CRITICAL.** Production (solen.ch) is still the May build; publishing `main`, setting `CRON_SECRET` on Netlify, and re-enabling the GitHub cron workflow are all external actions only he can take. `cron_runs` shows the last real fire on 2026-09-01; the calendar goes empty for every salon after 2026-09-30 without this.

2. **[LOW-2]** `search_salons_ranked`'s `w_popularity`/`w_affinity` weights are live-zero; popularity and DNA affinity contribute nothing to search ranking today. Needs his call on whether/how to flip them.

3. **[LOW-3]** review-prompt and tip-prompt emails bypass `notification_email` with no opt-out at all — a deliberate design gap flagged for his decision, not a broken toggle.

4. **[Q2, S4-5]** Supabase's `auth_leaked_password_protection` dashboard toggle is off; a Pro-plan-only setting he must flip himself (app-level HIBP check is already live as the one confirmed layer).

5. **[Q3]** No-show cron selects purely on a time window with no real salon-confirmation gate; needs a decision on whether one is required.

6. **[Q4, UV-2]** Cannot confirm from this session whether the deleted Supabase Edge Functions were also torn down server-side; needs him to check the Supabase dashboard directly.

7. **[Q5]** `chair_utilization` is hardcoded to `0` in the walk-in analytics dashboard; needs a real computation or an explicit "not tracked yet" decision.

8. **[Q7]** Generic "Booking failed" message covers three distinct failure reasons (stylist daily cap, duplicate booking, stylist fully booked); needs four-language specific copy approved.

9. **[Q8]** Nightly prune-old-unbooked-slots job is parked as low-payoff; needs a yes/no on building it.

10. **[Q9, ORPHAN-17]** `/profile/looks` is a permanent stub with no backing data model (TBD). *Source conflict noted*: ORPHAN-17 marks this `still_open:false` ("stands unchanged") while Q9 marks it `true` ("still waiting on a backend decision") — treated as open here since nothing has actually been decided.

11. **[ROT-3, Parked-4, 6c, 10g]** ~19 local + several remote unmerged `claude/*` branches remain; merging or deleting the rest is his call.

12. **[NEW-4, Parked-3]** `StaffPortfolio.tsx`/`TechPortfolio.tsx` have real, now-fixed API calls but zero live importers outside a dev page; his call whether to delete both or keep them for the switched-off nail feature.

13. **[NEW-10, Q10, ORPHAN-4, ORPHAN-6, ORPHAN-7, ORPHAN-8]** Five-to-six orphaned/unlinked routes with zero real inbound navigation: `profile/settings/personal`, `inspo/saved/[id]`, `referral/[code]`, `brand/[slug]`, `inspo/board/[id]` (plus the Inspo boards feed generally). Each still renders; his call whether to delete, or to actually wire in links from somewhere real.

14. **[Apple Wallet]** No Add-to-Apple-Wallet button on the real confirmation screen and no PassKit infra exists at all; his call whether to scope this in.

15. **[Pair-D]** Salon-page services type scale (5 sizes vs a proposed 4-size lock): explicitly parked, "NOT NOW, parked by his word" — nothing built until he says so.

16. **[#55/#57, Parked-6]** Saved-boards feature (3 boards, 0 pins, nothing links to it) is half-landed; measured numbers were supplied but his actual delete-or-keep answer was never given.

17. **[1.4d]** Profile avatar renders as a plain solid-color circle with no photo/initial fallback; no owner decision on record for the fallback style.

18. **[3-priority3]** Owner must decide the skeleton-duration floor and the no-natural-anchor exemption policy that the /de/search and /de/inspo timing/anchor bugs above are blocked on.

19. **[Q25(french-register)]** French copy register: switch to informal `tu` or keep formal `vous`. Measured today: 358 formal tokens vs 7 informal in `messages/fr.json` — even more lopsided than the doc's original count; still his call, not to be decided unilaterally.

20. **[Q26(ab-chf-legal)]** Whether "ab CHF X" for a single flat-priced service needs a legal/data gate (vs today's uniform display) — needs actual legal review, not yet done.

21. **[NEW-8, ORPHAN-2]** `/booking-action` landing page and the quick-action route are built but nothing generates a `/booking-action` URL to send customers; his call whether to wire an email link to it (and whether a replay-protection column is still needed for that specific flow).

---

## UNCLEAR (20)

1. **[ORPHAN-5]** `walk-in-tip/[token]` entry point exists with no found generation site anywhere in the codebase; genuinely unresolved, needs investigation.

2. **[SKIP list note]** `_plans/GAP_FIXES.md`'s SKIP/leave list for gaps #6-#25+ was never fully mapped against a `decisions.json` that does not exist in the repo; documentation-completeness gap only.

3. **[NEW-17]** Whether dev-mode Next.js returns 200 on a deep `notFound()` during streaming (an SEO concern) has never been checked against a real `next start` production build.

4. **[1.1h]** "Beliebte Looks" section reportedly shows two blank white boxes with no photo/fallback; never re-verified since first flagged, status unconfirmed either way.

5. **[1.4a]** `/de/profile` fails the imagery floor at 0%, and the exemption list doesn't name profile as an exception; unresolved policy gap, not yet a specific fix.

6. **[1.6b]** "Warten auf Freigabe" dashboard banner uses amber for the pending-approval icon; contrast was never checked against WCAG.

7. **[1.6c, 4-4]** The FLOORS-law numbers captured for `/de/dashboard` were measured on the loading/skeleton state, not the resolved dashboard; no getComputedStyle-level re-measurement of the resolved state exists anywhere.

8. **[1.1c, 4-1]** Home page's display-anchor measurement (18px/1.5x) contradicts an earlier Jul-30 measurement (44px/3.67x PASS) at the same route; never reconciled with a side-by-side re-measurement.

9. **[4-2]** Desktop viewport has never been measured in any design-walk session; a pure coverage gap.

10. **[4-3]** A content-supply defect (eleven photos supplied for nineteen slots, flagged Jul-30) was never re-audited; status genuinely unknown.

11. **[4-5]** `/de/search`'s SalonCard rendering was never independently re-measured against the home version's anatomy; visual-only comparison so far.

12. **[S4-1]** The RLS live-policy snapshot (`_inventory/_rls-policies.json`) is a point-in-time file, not a live query; Supabase MCP access is gated behind auth this session, so no independent re-verification is currently possible.

13. **[S4-2]** The `.select("*")` audit sweep was a sample (10 of 97 live matches today, not exhaustive); coverage gap, not a fixable defect on its own.

14. **[S4-3]** Six upload routes were corroborated via a migration only, not re-read line-by-line this session; audit-depth gap.

15. **[S4-6]** Whether Netlify's `x-nf-client-connection-ip` header is actually spoof-resistant against live traffic has never been independently verified beyond an in-repo comment.

16. **[1d-orphaned-routes]** Orphaned routes were never counted as part of the frontend gap sweep; explicitly parked as a small follow-up, no count exists.

17. **[1b-2-uncheckable]** Two of the 34 originally-flagged open audit items were noted as "could not be checked from here," with no identification anywhere of which two they are.

18. **[2a-10]** Findings NEW-8 through NEW-18 referenced in an earlier pass point at a prior session's scratchpad file that is not part of this repo checkout; those specific items remain unread and unresolved from this machine.

19. **[log-map-button-desktop]** The map-toggle button on search results also renders on desktop, not just mobile; explicitly noted as pre-existing and left unevaluated as bug-vs-intended.

20. **[ORPHAN-21]** `dashboard/queue-display` deliberately bypasses the nav shell as a kiosk display; the generator/bookmark code that would create a real queue-display URL was never found, open question on whether one needs to exist.

---

## UNCLEAR, resolved tonight (20 of 20 checked against the code or the live pages)

Now BUGS (in fix loops or mockups): 1 walk-in-tip dead entry point (nothing links to it; tip control on the queue done state -> mockup queue-done-tip); 3 notFound answers 200 in production on a missing salon, city/category or booking (fix loop notfound-404); 6 amber clock icon 1.8:1 on the approval banner (mockup warning-icon-contrast); 7 dashboard resolved state 8 sizes / 3 weights (mockup dashboard-type-collapse); 8 home first viewport largest text 18px, no 28px anchor and no photo focal (mockup home-anchor, floor vs Airbnb collision, his call); 9 desktop home/search/salon 10/6/11 sizes and 4 weights, no horizontal overflow (mockups desktop-type-*); 11 the For-you rail card lacks the price and city lines its sibling cards carry, data path not the component (fix loop foryou-card-props); 13 profile API returns the whole profiles row including stylist_notes and stripe_customer_id (fix: explicit column list, queued behind the loyalty-prefs slice which holds that file); 15 four edge-runtime auth routes rate-limit on a spoofable forwarded IP (fix loop auth-ip); 19 desktop shows two map controls (fix loop desktop-map-pill); 20 nothing emits the kiosk queue-display URL (mockup kiosk-link); plus the Where step gap re-measured: 522px white under "Basel" when focused at 390x844, 186px at keyboard height (mockup where-step-height).

NOT A BUG, with proof: 2 (the decisions.json was a prior session's scratch file), 4 (Popular looks: 8 of 8 tiles carry a loaded photo), 5 (profile is not on the imagery-floor exemption list: a rule gap, noted), 10 (home page: 28 of 28 card photos loaded, 0 fallbacks), 14 (all six upload routes have auth, a size cap and magic-byte type checks, cited per route), 16, 17, 18 (documentation, closed).

STILL UNCLEAR: 12 (live RLS policy count needs Docker for `supabase db dump`; the CLI is linked and connects).
