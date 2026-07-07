# Psychology audit , prioritized change list (2026-07-07)

<!-- exists-check: net-new; the actionable half of PSYCH_AUDIT_2026-07-07.md, grouped by the owner's three named lenses (what we show / defaults+preselection / motion timing) plus the rest. -->

Source: [`PSYCH_AUDIT_2026-07-07.md`](PSYCH_AUDIT_2026-07-07.md) (verified findings only). Grouped by the owner's three named integration levers first ("what we show", "preselect this stuff", "how fast emotion/animation"), then the remainder. Each item tagged **[code]** (mechanical, ships via the layered loop) or **[mockup]** (visual, mockup-first per Solen law). Nothing here is applied yet, this is the queue.

**Recommendation on sequencing:** ship the **[code] high-severity** items first (they are honesty/trust fixes: bare star ratings, a fabricated "14 salons" count, omitted prices, missing verified-booking markers, a dead orphaned checkout route). These need no mockup and directly serve laws 5/6/9. Then run the **[mockup]** batch (rebooking CTA, endowed progress, discount anchor price) through the mockup-first pipeline. 20 high-severity items total.


## WHAT WE SHOW , social proof, price, no-fabrication, photos

- **HIGH** [code] `homepage` , Salon card star rating renders with no review count (law E. Social proof and trust)
    - fix: Add a `reviewCount` field to the demo/data shapes (NearbyEntry, RecentEntry, ForYou salon entries) and thread it through as `count={s.reviewCount}` on every `<SalonCard>` call site; SalonCard itself needs a new `reviewCount` prop passed into `RatingStars`.
    - at: `app/[locale]/_components/homepage/SalonCard.tsx:567-569`
- **HIGH** [code] `homepage` , Hardcoded fake salon count in the Nearby map teaser (law F. Loss aversion and scarcity ethics)
    - fix: Either compute the count from live nearby-salon data (once the geo query in the Phase 2 TODO lands) or drop the number entirely and say "Salons in der Nähe" without a count until it's wired to something real.
    - at: `app/[locale]/_components/homepage/Nearby.tsx:184`
- **HIGH** [code] `pay` , Orphaned legacy checkout page: wrong flow, wrong palette, wrong copy language, live in the route tree (law D. Price transparency / general surface integrity)
    - fix: Confirm with the owner whether this route is truly dead; if so, delete it and add a _design-system/REMOVED.md line per the exists-check/graveyard protocol. If some entry point still targets it, it needs a full rebuild against the current PayConfirmStep pattern (styling, i18n, and the current booking data model) before it can be trusted as a real surface.
    - at: `app/[locale]/checkout/page.tsx:1-745`
- **HIGH** [code] `inspo` , CardSignals renders a bare star rating with no review count (law E - Social proof (stars with count))
    - fix: Before this component ever ships live data: add a `review_count` (or reuse the salon's `review_count`) field to the discovery item payload and require `hasRating` to also require `hasCount`, rendering "4.8 (54)" not a bare "4.8" (mirrors the pattern already correct in DetailPage.tsx:399-401 for the salon list, which shows rating without count either, worth fixing together).
    - at: `components-legacy/discovery/CardSignals.tsx:32-37`
- **HIGH** [code] `inspo` , "Book this look" salon rows show a bare star rating, no review count (law E - Social proof (stars with count) in Book-this-look salon list)
    - fix: Add `review_count` to the `.select()` at app/[locale]/inspo/[id]/page.tsx:161, pass it through `SalonLite`, and render "4.85 (23)" in DetailPage.tsx:398-402, consistent with law 6 and how salon cards elsewhere in the app are expected to show rating+count together.
    - at: `components-legacy/discovery/DetailPage.tsx:398-402`
- **HIGH** [code] `profile` , Referral "total_earned" is hardcoded to 0, never computed from real reward data (law F - Loss aversion and scarcity ethics (no fabricated numbers))
    - fix: Sum `reward_amount` from `referrals` where `referrer_id = user.id AND status = 'completed'` and return that instead of the literal 0.
    - at: `app/api/referral/route.ts:31,45-49`
- **HIGH** [code] `profile` , "Top bewertet" salon ranking sorts by raw average_rating with no review-count weighting, and feeds the empty-state hero photo (law E - Social proof and trust (count x score weighting))
    - fix: Weight the order by count x score (e.g. Wilson lower bound or `average_rating * ln(review_count+1)`), or floor the query at a minimum review_count before sorting by rating.
    - at: `app/[locale]/profile/favorites/page.tsx:68-73,86`
- **HIGH** [mockup] `search` , Price and rating are fully omitted (not placeholder-filled) when absent, breaking fixed-slot cards (law D. Price transparency (fixed slots))
    - fix: Reserve the row height even when the value is missing (e.g. render an empty CardMeta slot or a neutral dash) so cards in the same grid/feed row stay the same height regardless of data completeness.
    - at: `app/[locale]/_components/search/SalonResultCard.tsx:291,333,401,415,557,638 (price) and :284,322,388,509,552,620 (rating)`
- **HIGH** [mockup] `pdp` , Reviews never carry a verified-booking marker despite every review being booking-linked data (law E. Social proof and trust (verified marker))
    - fix: Add a verified marker (small checkmark + label like Fresha's) to reviews confirmed to come from a completed booking, per the project's own PSYCHOLOGY.md law 6 ("we have the data: every review comes from a real booking").
    - at: `app/[locale]/_components/salon/SalonReviews.tsx:168-220`
- **HIGH** [mockup] `profile` , Favorites list renders salons with the legacy no-photo card ("photos killed") instead of the current photo-first card (law M - Photos first)
    - fix: Swap FavoritesList's import from `components-legacy/SalonCard` to the current `app/[locale]/_components/homepage/SalonCard` (or port its `photoUrl` prop into the legacy card) so favorited salons show real photos.
    - at: `components-legacy/SalonCard.tsx:152-162 (rendered via app/[locale]/_components/profile/FavoritesList.tsx:12,103)`
- **HIGH** [mockup] `reviews` , No 'verified booking' marker on any review card, even though every review requires a completed booking (law E. Social proof and trust)
    - fix: Add a small 'Verifizierte Buchung' text or ShieldCheck-icon marker next to the reviewer name/date in the three card renderers above, since the condition is unconditionally true and needs no new query.
    - at: `app/api/reviews/route.ts:43`
- **HIGH** [mockup] `walkin` , Review/rating ask fires the same minute the haircut ends, not 1-3 days later (law E Social proof and trust)
    - fix: Drop the star-rating capture from this synchronous completion screen; keep the immediate tip ask (a gratuity, not a review) but send the actual review/rating request 1-3 days later via push or email, per the evidence-tiered PSYCHOLOGY.md law (two field experiments: immediate asks produce fewer, worse reviews). The code comment at lines 193-196 calls this "owner-approved" but no dated TASTE_LOG entry exists to confirm an override.
    - at: `app/[locale]/queue/[token]/page.tsx:197`
- **MEDIUM** [code] `homepage` , WalkInBand shows bare star rating with no review count next to it (law E. Social proof and trust)
    - fix: Render `${s.rating.toFixed(1)} (${s.reviewCount})` instead of just the rating, matching the SalonCard/RatingStars compact pattern.
    - at: `app/[locale]/_components/homepage/WalkInBand.tsx:121-128`
- **MEDIUM** [code] `search` , No next/image priority on any result card photo, so the first above-the-fold LCP image is not prioritized (law M. Photos first (LCP priority))
    - fix: Pass `priority` (or `fetchPriority="high"`) to the Image for the first 1-2 cards rendered in SearchTemplate's map (index === 0 for both the mobile feed loop at line 1560 and the desktop grid loop at line 1624), matching Solen's own law 7 (photo paint is the LCP priority).
    - at: `app/[locale]/_components/search/SalonResultCard.tsx:230`
- **MEDIUM** [code] `pay` , Legacy checkout page violates price transparency and hides the promo/voucher/credit total in a way the locked flow does not (law D. Price transparency)
    - fix: If this page is kept, either wire userCredits into the chargeAmount calculation with a visible line item, or remove the credits chip entirely so it does not imply the credit is active. If the page is being deleted per the finding above, this is moot.
    - at: `app/[locale]/checkout/page.tsx:336-350`
- **MEDIUM** [code] `pay` , Star rating can render without a review count on the pay-step summary card (law E. Social proof and trust)
    - fix: Make the two conditions the same gate: only render the star block at all when both average_rating > 0 AND review_count > 0 are true (a nested if, not two independent ifs), so a star literally cannot appear without its count.
    - at: `components-legacy/booking/PayConfirmStep.tsx:337-345`
- **MEDIUM** [mockup] `homepage` , Discount badge shows a bare percent-off with no anchor price on the card (law D. Price transparency)
    - fix: When `discountPercent` is set, also surface the original price (e.g. strikethrough CHF next to the discounted CHF in Row 3) so the percent-off has a visible anchor.
    - at: `app/[locale]/_components/homepage/SalonCard.tsx:280-290`
- **MEDIUM** [mockup] `pdp` , Team card silently substitutes the salon's blended rating for a staff member's personal rating with zero reviews (law E. Social proof and trust)
    - fix: Either omit the rating badge entirely for staff with zero personal reviews (matching the no-bare-rating principle) or label the fallback explicitly (e.g. "Salon 4.8") so it cannot be read as the individual's own score.
    - at: `app/[locale]/_components/salon/SalonTeam.tsx:168-170`
- **MEDIUM** [mockup] `booking` , Staff picker shows a bare star rating with no review count (law E - Social proof: rating without count)
    - fix: Either add a review count to the Avatar badge (rating + count) when badge data is available, or drop the badge to a neutral avatar when count is unavailable, per the checklist's 'never a bare average' rule.
    - at: `app/[locale]/_components/primitives/Avatar.tsx:84-88`
- **LOW** [code] `homepage` , No above-the-fold image is marked priority, so LCP photo may lazy-load (law M. Photos first)
    - fix: Pass `priority` (or at least `loading="eager"`) on the first 1-2 cards of the first above-the-fold section (e.g. index 0-1 of RecentlyViewed/Nearby) so the earliest visible photo isn't deferred.
    - at: `app/[locale]/_components/homepage/SalonCard.tsx:502-509`
- **LOW** [code] `search` , Deals/gender filter visibility and walk-in wait times are both driven by real server queries, never fabricated (law F. Loss aversion and scarcity ethics / real numbers)
    - fix: No change needed; this is exactly the discriminating, server-truth pattern the checklist requires and is worth calling out as a model for other surfaces.
    - at: `lib/search/filter-availability.ts:57 and app/api/walkin/availability/route.ts:13-31`
- **LOW** [code] `pdp` , No fabricated scarcity or urgency copy anywhere on the PDP surface (law F. Loss aversion and scarcity ethics)
    - fix: No violation to fix; flagged only because the checklist predicts this failure mode is common. If a real, server-computed scarcity signal is ever added (e.g. "3 slots left today"), it must resolve from live availability data, never a client constant.
    - at: `app/[locale]/_components/salon/SalonMobileBookBar.tsx:20-41 and SalonAppCta.tsx:1-78`
- **LOW** [code] `pay` , Recognizable payment marks sit only in the legacy checkout page's footer trust strip, not next to the live Stripe form (law E. Social proof and trust (payment marks next to fields, not footer-only))
    - fix: If the page survives the dead-route decision, move the payment-brand row to sit directly above or below the PaymentElement inside the payment card, not as a page-bottom strip.
    - at: `app/[locale]/checkout/page.tsx:728-741`
- **LOW** [code] `inspo` , Salon list price is a same-service floor, not the specific pre-selected service's price (law D - Price transparency (add-on / anchor))
    - fix: Either show the price of the actually pre-selected `chosen` service instead of the category floor, or keep the floor but label it clearly as a range starting point (already does say "ab", so this is a minor precision gap, not a hidden-cost violation since the real total still renders on the booking page per law 5).
    - at: `components-legacy/discovery/DetailPage.tsx:405 and app/[locale]/inspo/[id]/page.tsx:186`
- **LOW** [code] `reviews` , Salon average_rating is a raw unweighted mean with no confidence/count weighting (law E. Social proof and trust)
    - fix: If a 'top rated' sort or badge is ever built on `average_rating`, feed it a lower-bound/Bayesian-adjusted score (e.g. Wilson score or add-k smoothing) instead of the raw column; no change needed to the current display, which is not itself misleading.
    - at: `app/api/reviews/route.ts:126-138`
- **LOW** [mockup] `booking` , No visible card-brand or TWINT marks next to the payment step before/while Stripe Elements loads (law E - Payment marks near fields)
    - fix: Low priority given TWINT is intentionally disabled; if/when TWINT is re-enabled, add the TWINT + card-brand marks inline next to the 'Online bezahlen' selector row (PayConfirmStep.tsx:509-526), not just inside the lazy-loaded Stripe iframe.
    - at: `components-legacy/booking/BookingPaymentForm.tsx:168-170`
- **LOW** [mockup] `confirmation` , Payment total on confirmation never shows a promo/credit breakdown line even when one was applied (law D. Price transparency)
    - fix: If promo/credit data is available on the booking row, surface it as a small line under the total (e.g. '-CHF 10 Gutschein') so the discount stays visible after the fact, consistent with the price-transparency law's requirement that promo/credit be part of the visible total story, not just baked silently into the final number.
    - at: `components-legacy/booking/BookingConfirmation.tsx:229-247`
- **LOW** [mockup] `profile` , Price and rating slots collapse out of the card layout when missing, instead of reserving a placeholder (law D - Price transparency (fixed slots, no layout collapse))
    - fix: Render a fixed-height placeholder (e.g. a muted dash or skeleton bar) in the price and rating slots when the value is null, so every card in a row keeps the same vertical rhythm.
    - at: `components-legacy/SalonCard.tsx:266-277,288-295`
- **LOW** [mockup] `walkin` , Free-cancellation reassurance copy is written but never rendered near the pay CTA (law F Loss aversion and scarcity ethics)
    - fix: Render the existing `cancelPolicy` string as a small reassurance line under the pay CTA (same slot pattern as the `secure`/Stripe line at lines 588-591), a low-cost risk-reversal lever that's already copy-complete and unused.
    - at: `app/[locale]/walk-in-pay/page.tsx:308`

## DEFAULTS & PRESELECTION

- **MEDIUM** [mockup] `booking` , No date or time slot is ever pre-selected or highlighted as soonest-available (law A - Defaults and preselection (soonest slot))
    - fix: On slot fetch, if no date/time is chosen yet, auto-select today (or the first day with availability) and highlight (not force-select) the earliest available slot so the default path is one tap to confirm, matching the checklist's 'soonest available slot highlighted' rule.
    - at: `app/[locale]/_components/primitives/DateTimePicker.tsx:154-167`
- **LOW** [code] `homepage` , Not applicable: homepage has no multi-step flow or loyalty progress UI (law B. Progress and goal-gradient)
    - fix: None, this item belongs to booking flow / loyalty surfaces, not the homepage. Included only to document the item was checked and found not-applicable rather than silently skipped.
    - at: `app/[locale]/page.tsx:149-182`
- **LOW** [code] `pay` , No visible step indicator on PayConfirmStep itself; step context depends entirely on the wizard header comment reference (law B. Progress and goal-gradient)
    - fix: Not flaggable as a defect from this file alone since the indicator is intentionally centralized in the wizard header per the code comment; would need BookingWizard.tsx read to confirm the indicator actually appears and never starts at a literal 0% given account/contact data may already be known. Flagged as an opportunity to verify, not a confirmed violation.
    - at: `components-legacy/booking/PayConfirmStep.tsx:311-313`
- **LOW** [mockup] `homepage` , Search bar has no default city/date/service preselected, and returning-user saved data isn't reused for search defaults (law A. Defaults and preselection)
    - fix: On mount, if `useCustomerPrefs()` resolves with a `categories[0]`, prefill the service placeholder value (non-committal, still shown as placeholder-style until the user confirms) rather than leaving it fully generic for logged-in returning users.
    - at: `app/[locale]/_components/homepage/SearchBar.tsx:164-179`
- **LOW** [mockup] `auth` , Register wizard has no step indicator across its two real steps (law B. Progress and goal-gradient)
    - fix: Add a small 2-step indicator (e.g. two dots or a thin progress bar) to StepRegister matching the visual weight of the onboarding one, so the user perceives forward motion instead of an open-ended flow.
    - at: `app/[locale]/auth/register/page.tsx:226-268`

## RETENTION LOOPS , peak-end rebooking, notifications, personalization

- **HIGH** [code] `retention-loops` , The "SMS" notification toggle in Settings does nothing at all (law N. Retention loops)
    - fix: Either read profiles.notification_sms as an additional AND-gate inside sms-reminders/route.ts before sending, or remove/relabel the switch so it stops promising a control users can't actually exercise.
    - at: `app/[locale]/profile/settings/SettingsForm.tsx:210-212`
- **HIGH** [code] `retention-loops` , The real category-split preference table is silently dead (0 rows, no insert path, no UI) (law N. Retention loops)
    - fix: Upsert a default row into notification_preferences on signup (or lazily on first cron read), and add the missing Settings section that surfaces rebooking_enabled/deals_enabled/new_salons_enabled as real per-category toggles.
    - at: `app/api/cron/rebooking-nudge/route.ts:60-65`
- **HIGH** [mockup] `confirmation` , One-tap 'book again' / rebook CTA is missing from the confirmation screen (law G. Peak-end / L12. Effort beats delight)
    - fix: Add a one-tap 'Nochmals buchen' action to BookingConfirmation for returning users (same staff, same service, cycle-appropriate next slot) using the existing /api/bookings/express-rebook + /api/bookings/express-rebook/confirm endpoints already used by BookingsList.tsx. Reuse the orphaned `rebook` translation key rather than inventing new copy.
    - at: `components-legacy/booking/BookingConfirmation.tsx:250-268`
- **MEDIUM** [code] `retention-loops` , Rebooking-nudge email has no one-tap book-again link (law G. Peak-end)
    - fix: Build the link as `${baseUrl}/${locale}/salon/${salonSlug}/book?service=${serviceId}` (values already available to the caller in rebooking-nudge/route.ts) instead of the bare domain.
    - at: `lib/email.ts:420-423`
- **MEDIUM** [code] `retention-loops` , Generic rebooking nudge uses one flat 28-day cutoff for every service category (law N. Retention loops)
    - fix: Join `services.reminder_cycle_days` (already modeled) into the rebooking-nudge query and use it as the per-booking cutoff instead of the hardcoded 28.
    - at: `app/api/cron/rebooking-nudge/route.ts:19-21`
- **MEDIUM** [code] `retention-loops` , Barber SMS nudge skips the opt-out check its sibling crons both honor (law N. Retention loops)
    - fix: Add the same notification_preferences.rebooking_enabled lookup used in rebooking-nudge/nail-infill-reminders before calling sendSMS here.
    - at: `app/api/cron/barber-smart-reminders/route.ts:108-118`
- **MEDIUM** [mockup] `reviews` , Review submission ends with zero acknowledgment: sheet just closes, no toast, no list refresh (law G. Peak-end)
    - fix: Wire a brief success toast ('Danke fuer deine Bewertung') on the ReviewForm's onSuccess before closing, and call `router.refresh()` (or optimistically prepend the new review) so the just-written review is visibly present, giving the effortful act of reviewing a closing moment instead of a silent disappearance.
    - at: `components-legacy/salon/SalonReviews.tsx:412-417`
- **MEDIUM** [mockup] `walkin` , Peak-end completion screen stacks a monetary tip ask on the success moment and offers no rebook CTA (law G Peak-end)
    - fix: Let the success state (checkmark + barber name) breathe on its own for a beat before offering the tip ask (or make tipping a secondary tap, not the automatic next screen), and add a one-tap "Termin bei [barber] wiederholen" CTA to the exit actions so the peak-end moment also seeds the next visit.
    - at: `app/[locale]/queue/[token]/page.tsx:239`
- **LOW** [code] `homepage` , Not applicable: homepage is not a confirmation screen (law G. Peak-end)
    - fix: None for this surface; verify separately on the booking-confirmation route.
    - at: `app/[locale]/page.tsx:149-182`
- **LOW** [code] `search` , entry file missing: none of the three named entry files were actually missing (law N/A)
    - fix: No action needed.
    - at: `app/[locale]/search/page.tsx, app/[locale]/[city]/[category]/page.tsx, app/[locale]/[city]/page.tsx`
- **LOW** [code] `inspo` , Heart-to-save correctly defers auth, but redirects away from the look with no return path (law G/L - Guest-first save action and dead-end for logged-out users)
    - fix: Pass the current look id or feed URL as a redirect param to the login route (e.g. `/${locale}/auth/login?redirect=/${locale}/inspo/${item.id}`) so completing auth returns the user to the exact save-worthy content, preserving the guest-first value-before-auth principle through to completion.
    - at: `app/[locale]/inspo/page.tsx:313`
- **LOW** [code] `inspo` , BookCTA component (price-range + CTA card) is unused dead code, diverges from the shipped DetailPage flow (law N - Retention loops (dead code risk))
    - fix: Delete BookCTA.tsx and log the removal in `_design-system/REMOVED.md` per the exists-check protocol, since the real "book this look" flow already lives in DetailPage.tsx.
    - at: `components-legacy/discovery/BookCTA.tsx:35`
- **LOW** [mockup] `booking` , Confirmation screen has zero rebooking CTA despite a rebooking-nudge system existing elsewhere (law G - Peak-end: no book-again prompt)
    - fix: Do not add an upsell here (peak-end must stay uncluttered per the checklist), but for a RETURNING customer with a prior completed booking at this salon, consider a single quiet 'book again' text link in the footer area (not a full card) once a next-cycle date is known; otherwise leave as is since the email/nudge cron already covers this asynchronously.
    - at: `components-legacy/booking/BookingConfirmation.tsx:250-269`

## MOTION, WAITING & RESPONSE FEEDBACK

- **MEDIUM** [mockup] `profile` , Booking tab switch shows a bare centered spinner over the whole card grid instead of a layout-matching skeleton (law H - Waiting and response feedback)
    - fix: Render 2-3 `BookingCard`-shaped skeleton blocks (matching the focal-date-block + text layout) during `loading`, reserving the small plain `<Spinner>` for genuinely small inline fetches.
    - at: `components-legacy/booking/BookingsList.tsx:176-180`
- **MEDIUM** [mockup] `reviews` , PDP review-body lazy fetch shows no loading skeleton, only ambiguous placeholder copy (law H. Waiting and response feedback)
    - fix: Track an explicit `loading` boolean (true until the fetch settles) and render a `<Skeleton>` shaped like 1-2 review rows while `loading` is true, falling back to the current empty-copy branches only once the fetch has actually resolved.
    - at: `app/[locale]/_components/salon/SalonReviews.tsx:52-75`
- **MEDIUM** [mockup] `walkin` , Full-page loads use pulsing dots / bare spinner instead of the locked layout-matching Skeleton (law H Waiting and response feedback)
    - fix: Swap the dot clusters and the bare Spinner for a `<Skeleton>` shaped like the booking-summary card (walk-in-pay) and the hero+card layout (queue tracker), matching the locked states row.
    - at: `app/[locale]/walk-in-pay/page.tsx:366`
- **MEDIUM** [mockup] `retention-loops` , Full inbox load uses a bare spinner instead of a layout-matching skeleton (law H. Waiting and response feedback)
    - fix: Replace the centered Spinner with a <Skeleton> shaped like 3-4 notification rows (44px icon disc + two text lines), matching the pattern used elsewhere in the app.
    - at: `app/[locale]/notifications/NotificationsClient.tsx:178-179`
- **LOW** [code] `homepage` , WalkInBand loading state uses hand-rolled pulse divs instead of the shared Skeleton primitive (law H. Waiting and response feedback)
    - fix: Swap the two pulse divs for the shared `<Skeleton>` primitive with matching dimensions, so all loading states in the app share one skeleton implementation.
    - at: `app/[locale]/_components/homepage/WalkInBand.tsx:92-103`
- **LOW** [mockup] `confirmation` , Tip deep-link page renders a full-screen spinner for a single booking fetch instead of a layout-matching skeleton (law H. Waiting and response feedback)
    - fix: Swap the bare spinner for a skeleton matching the TipSheet's recipient-row + amount-grid layout so the transition into the real sheet doesn't jump; low priority since this is a single-record fetch, not a full module with many parts.
    - at: `app/[locale]/tip/[bookingId]/page.tsx:36-42`
- **LOW** [mockup] `profile` , Referral page shows a fully blank screen with a centered spinner on first load, no layout-matching skeleton (law H - Waiting and response feedback)
    - fix: Add a `loading` skeleton matching the hero card + code box + 2-stat grid shape (mirrors the pattern already used in `app/[locale]/profile/loading.tsx`), shown while `data === null`.
    - at: `app/[locale]/profile/referral/page.tsx:44-50`

## GUEST-FIRST & AUTH RETURN PATHS

- **HIGH** [code] `pdp` , Heart/favorite hard-redirects logged-out visitors to a full login page instead of working guest-side (law C. Guest-first and value-before-auth)
    - fix: On logged-out tap, keep the optimistic local toggle and either (a) persist to localStorage/a guest favorites cookie and reconcile on login, or (b) show a small inline sign-in prompt/toast instead of a page navigation. Reserve the auth ask for the pay step, per the project's own guest-first rule.
    - at: `app/[locale]/_components/homepage/HeartButton.tsx:84-93`
- **LOW** [code] `auth` , Onboarding /onboarding route itself hard-requires a session before rendering (law C. Guest-first and value-before-auth)
    - fix: If the login redirect fires from an expired/missing session on this URL, consider a short explanatory line above SignIn ('Melde dich an, um dein Profil fertigzustellen') so the detour is legible; low priority since the primary entry path is already authenticated.
    - at: `app/[locale]/onboarding/page.tsx:29-33`
- **LOW** [mockup] `pdp` , "Mehr lesen" review-expand link is ink, not the mandated blue accent for expand-in-place actions (law Copy economy rule 2 / affordance-by-color (related to E and the project's own link-color law))
    - fix: Swap `text-s-ink` to `text-s-accent` on the Mehr lesen button to match the locked pattern and signal it is the same clickable affordance as review counts elsewhere on the page.
    - at: `app/[locale]/_components/salon/SalonReviews.tsx:207-215`

## FORMS, TOUCH TARGETS, CHOICE ARCHITECTURE, EMPTY STATES

- **HIGH** [code] `search` , Filter-clear and map-toggle buttons are 36px, under the 44px touch floor, with no expanded hit area (law L. Touch floor)
    - fix: Wrap each button in the same pattern HeartButton already uses: an `h-11 w-11` tappable outer element with the 36px visual circle centered inside, or simply bump the button itself to `h-11 w-11`.
    - at: `app/[locale]/_components/search/SearchTemplate.tsx:1289 (map icon) and :1326 (filter/clear-all)`
- **HIGH** [mockup] `confirmation` , booking-action page is a dead end in every terminal state (confirmed, cancelled, and error) (law K. Empty/zero states / G. Peak-end)
    - fix: Add one computed, tappable next step per state: confirmed -> link to the booking detail/confirmation page (`/${locale}/confirmation?booking_id=...`); cancelled -> link to search/rebook; error -> link to `/booking/lookup` or a support contact. Mirrors the pattern already used in RefundCaseView.tsx's bookAgainHref.
    - at: `app/[locale]/booking-action/page.tsx:40-77`
- **HIGH** [mockup] `profile` , Booking card's Rebook pill and overflow ("...") button are under the 44px touch floor (law L - Touch floor)
    - fix: Bump both controls to `h-11` (44px): increase the Rebook button's vertical padding and change the overflow button to `h-11 w-11`.
    - at: `components-legacy/booking/BookingCard.tsx:150-155,158-164`
- **HIGH** [mockup] `reviews` , Photo-remove button on the review form is a 20px tap target, less than half the a11y floor (law L. Touch floor)
    - fix: Keep the visible 20px glyph but wrap it in a `h-11 w-11` (or at minimum an absolutely-positioned padded) hit area, matching the pattern already used elsewhere (icon-button spec = h-11 w-11).
    - at: `components-legacy/ReviewForm.tsx:410`
- **MEDIUM** [code] `pdp` , Service row "Buchen" button is under the 44px touch-target floor (law L. Touch floor)
    - fix: Bump mobile padding to at least py-3 (or add a min-h-11) on the Buchen link so the tap target reaches 44px, consistent with the h-11 standard already used for icon buttons on this page.
    - at: `app/[locale]/_components/salon/SalonServices.tsx:213-218`
- **MEDIUM** [code] `confirmation` , Guest access-link copy button is 36px, under the 44px touch floor (law L. Touch floor)
    - fix: Bump the button to `h-11 w-11` (44px), matching the design contract's icon-button row and the a11y floor already used elsewhere on this same card.
    - at: `components-legacy/booking/BookingConfirmation.tsx:287`
- **MEDIUM** [code] `auth` , Back button on onboarding wizard is 32px, under the 44px touch floor (law L. Touch floor)
    - fix: Change `w-8 h-8` to `w-11 h-11` (44px) on the back button, keeping the same icon size/border/hover treatment.
    - at: `app/[locale]/onboarding/OnboardingFlow.tsx:146-149`
- **MEDIUM** [code] `auth` , No autoComplete/inputMode attributes on any auth or onboarding input (law J. Forms)
    - fix: Add `autoComplete="email"`, `autoComplete="current-password"` (login) / `autoComplete="new-password"` (register/reset), and `autoComplete="bday"` on the date input, matching each field's semantic role.
    - at: `components-legacy/auth/SignIn.tsx:203-218`
- **MEDIUM** [code] `auth` , Password and age rules validate only on submit, never on blur (law J. Forms)
    - fix: Add onBlur handlers that run the same regex checks and surface an inline error under the field (the reset-password page at app/[locale]/auth/reset-password/page.tsx:170-175 already does this correctly with live Requirement checkmarks; reuse that pattern here).
    - at: `app/[locale]/auth/register/page.tsx:77-103`
- **MEDIUM** [code] `inspo` , Multiple Inspo tap targets sit below the 44px hit-area floor (law L - Touch floor)
    - fix: Bump these five controls to `h-11 w-11` (44px), matching the locked icon-button size already used correctly elsewhere in the same files (e.g. FilterDrawer.tsx:110 gender-pill buttons and LikeButton.tsx:101 which are both h-11 w-11).
    - at: `components-legacy/discovery/FilterDrawer.tsx:62,77`
- **MEDIUM** [mockup] `booking` , No-availability date state offers only passive text, no computed nearest-alternative action (law K - Empty/zero states)
    - fix: When the picked date has 0 slots, compute the nearest future date that DOES have availability (from the already-fetched unavailableDates set or a lightweight follow-up call) and surface it as one tappable pill inside emptySlotContent, alongside the existing waitlist option.
    - at: `app/[locale]/_components/primitives/DateTimePicker.tsx:532-549`
- **MEDIUM** [mockup] `profile` , Empty "upcoming bookings" state has action-oriented copy but zero tappable recovery (law K - Empty/zero states)
    - fix: Pass `action={<Link href={`/${locale}/search`}>...Jetzt buchen...</Link>}` (or similar) into the `upcoming` branch of the `<EmptyState>` call.
    - at: `components-legacy/booking/BookingsList.tsx:188-200`
- **MEDIUM** [mockup] `reviews` , Flag-review icon button is 32px, under the locked 44px touch floor (law L. Touch floor)
    - fix: Bump to `h-11 w-11` to match the LOCKFILE icon-button size, or absolutely-position a 44px invisible hit-area around the visible 32px circle if the smaller visual size is intentional next to dense review-card headers.
    - at: `components-legacy/salon/SalonReviews.tsx:281`
- **MEDIUM** [mockup] `reviews` , Marketplace /reviews empty state is passive copy with no recovery action, a dead end (law K. Empty/zero states)
    - fix: Add one tappable recovery link in the empty block, e.g. 'Salons entdecken' pointing at `/search` or the homepage, so the state is never a dead end.
    - at: `app/[locale]/reviews/page.tsx:98-109`
- **MEDIUM** [mockup] `walkin` , Three tappable controls are well under the 44px touch floor (law L Touch floor)
    - fix: Give the info toggle `min-h-11 min-w-11` (44px) while keeping the 14px icon centered inside it, and wrap the two review-count buttons in a padded hit area (e.g. `p-2.5 -m-2.5`) so the visual text size is unchanged but the tap target reaches 44px.
    - at: `app/[locale]/walk-in-pay/page.tsx:505`
- **MEDIUM** [mockup] `walkin` , Generic error states are dead ends; only the pay-blocked state has a real recovery action (law K Empty/zero states)
    - fix: Reuse the same CTA block already built for `payBlocked` (lines 598-620) inside the generic `error` branch, e.g. a "Choose another salon" button routing to `/search`, instead of leaving the user with only a back arrow.
    - at: `app/[locale]/walk-in-pay/page.tsx:387`
- **MEDIUM** [mockup] `retention-loops` , Empty notifications state has no tappable recovery action (law K. Empty/zero states)
    - fix: Add one CTA in the empty state, e.g. a link to /inspo or /explore ("Salon entdecken"), the same pattern other empty states in this codebase already use for their recovery action.
    - at: `app/[locale]/notifications/NotificationsClient.tsx:180-187`
- **LOW** [code] `search` , Search query and city inputs in the composer overlay carry no autoComplete/inputMode/type attributes (law J. Forms)
    - fix: Add `type="search"` and appropriate `autoComplete` (e.g. "off" for the free-text query, "address-level2" or similar for city) to both inputs; low priority since the checklist's explicit target is contact/payment forms, not search boxes.
    - at: `app/[locale]/_components/search/SearchOverlay.tsx:497,757`
- **LOW** [code] `pay` , Legacy checkout's promo/voucher inputs lack inputmode/autocomplete hints and validate only on a separate button press, not blur (law J. Forms)
    - fix: Low priority given this route appears to be dead code (see the orphaned-checkout finding); if the route is kept, add inputMode/autoComplete where applicable and an onBlur validation trigger to match the checklist's blur-validation guidance.
    - at: `app/[locale]/checkout/page.tsx:528-552,600-624`
- **LOW** [mockup] `retention-loops` , "Alle gelesen" mark-all button is under the 44px touch floor (law L. Touch floor)
    - fix: Add `min-h-11 flex items-center px-1` (or similar) to the button so its actual hit area reaches 44px, matching the icon-button spec (h-11 w-11) used elsewhere in the design system.
    - at: `app/[locale]/notifications/NotificationsClient.tsx:169-173`

## Counts

- Total actionable: 77 (40 code, 37 mockup-first)
- WHAT WE SHOW: 29 (12 high)
- DEFAULTS & PRESELECTION: 5 (0 high)
- RETENTION LOOPS: 13 (3 high)
- MOTION, WAITING & RESPONSE FEEDBACK: 7 (0 high)
- GUEST-FIRST & AUTH RETURN PATHS: 3 (1 high)
- FORMS, TOUCH TARGETS, CHOICE ARCHITECTURE, EMPTY STATES: 20 (4 high)
