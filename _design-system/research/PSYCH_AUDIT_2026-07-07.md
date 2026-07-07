# Psychology audit , Solen customer surfaces (2026-07-07)

<!-- exists-check: net-new audit; part of the psychology system (_design-system/PSYCHOLOGY.md, workstream 11). Placed here (committed) because _audits/ is gitignored. -->

Method: 12 surfaces audited by sonnet agents against the 15-law checklist in [`../PSYCHOLOGY.md`](../PSYCHOLOGY.md) (letters A-N map to the laws), then EVERY finding re-checked at file:line by a separate read-only verifier. Only `confirmed` + `wrong-line` verdicts are kept; `not-real` and `duplicate-of-law` (intentional Solen law) were dropped and are listed at the end. Workflow wf_2563f4ec-42b.


**Tally:** 50 violations, 27 opportunities, 36 already-good across 12 surfaces. 3 findings dropped by the verifier.

**Actionable by severity:** 20 high, 30 medium, 27 low. Mockup-first (visual) items: 37. See [`AUDIT_CHANGELIST_2026-07-07.md`](AUDIT_CHANGELIST_2026-07-07.md) for the prioritized change list.


## Homepage

### [VIOLATION , high] Salon card star rating renders with no review count (E. Social proof and trust)
- **Where:** `app/[locale]/_components/homepage/SalonCard.tsx:567-569`
- **Now:** CardMeta wraps `<RatingStars value={rating} size="sm" />` with no `count` prop. RatingStars.tsx:190-198 shows the compact mode only appends `(count)` when `count != null` is passed by the caller. None of the three feed sections that render SalonCard on the homepage (Nearby.tsx:189-204, RecentlyViewed.tsx:182-197, ForYouSalonRows.tsx:48-63) pass a `count` prop, and the underlying demo data (NearbyEntry, RecentEntry, FORYOU_SALONS) carries no reviewCount field at all. Every salon card on the homepage therefore shows a bare average like "4.93" with a star icon, never "4.93 (n)".
- **Lever:** Add a `reviewCount` field to the demo/data shapes (NearbyEntry, RecentEntry, ForYou salon entries) and thread it through as `count={s.reviewCount}` on every `<SalonCard>` call site; SalonCard itself needs a new `reviewCount` prop passed into `RatingStars`.

### [VIOLATION , high] Hardcoded fake salon count in the Nearby map teaser (F. Loss aversion and scarcity ethics)
- **Where:** `app/[locale]/_components/homepage/Nearby.tsx:184`
- **Now:** The map-teaser pill renders the literal string "14 Salons in der Nähe Karte öffnen" - the number 14 is a hardcoded string, not computed from `entries.length` (which is actually 15, from the DEMO array) or any live geo query. This is a fabricated count shown as if it were real, and it doesn't even match the 15 demo entries rendered directly below it in the same file.
- **Lever:** Either compute the count from live nearby-salon data (once the geo query in the Phase 2 TODO lands) or drop the number entirely and say "Salons in der Nähe" without a count until it's wired to something real.

### [VIOLATION , medium] WalkInBand shows bare star rating with no review count next to it (E. Social proof and trust)
- **Where:** `app/[locale]/_components/homepage/WalkInBand.tsx:121-128`
- **Now:** The chip renders `<Star .../> {s.rating.toFixed(1)}` only when `s.reviewCount > 0` (line 123), but the count itself is never displayed, it's used purely as a gate. A salon with 200 reviews and one with 3 both show the same bare "4.9".
- **Lever:** Render `${s.rating.toFixed(1)} (${s.reviewCount})` instead of just the rating, matching the SalonCard/RatingStars compact pattern.

### [OPPORTUNITY , medium] Discount badge shows a bare percent-off with no anchor price on the card (D. Price transparency) [mockup-first]
- **Where:** `app/[locale]/_components/homepage/SalonCard.tsx:280-290`
- **Now:** DiscountBadge renders only `-{percentOff}%` (e.g. "-20%") on the photo. Row 3 shows `priceFromCHF` (the current/discounted price presumably) but there is no visible pre-discount anchor price anywhere on the card, so the relative label ("-20%") floats without the absolute comparison price the checklist requires ("an add-on price is never shown in isolation from the anchor price").
- **Lever:** When `discountPercent` is set, also surface the original price (e.g. strikethrough CHF next to the discounted CHF in Row 3) so the percent-off has a visible anchor.

### [OPPORTUNITY , low] Search bar has no default city/date/service preselected, and returning-user saved data isn't reused for search defaults (A. Defaults and preselection) [mockup-first]
- **Where:** `app/[locale]/_components/homepage/SearchBar.tsx:164-179`
- **Now:** `service`, `stadt`, `zeitDate`, `zeitPeriod` all initialize to empty/null (lines 164-170) regardless of session. `useCustomerPrefs` (loaded elsewhere on the page) knows the user's preferred categories but SearchBar never reads it to prefill the "Service" field or default city for a returning user, even though the same data already personalizes MobileCategoriesRow and Nearby on the same page.
- **Lever:** On mount, if `useCustomerPrefs()` resolves with a `categories[0]`, prefill the service placeholder value (non-committal, still shown as placeholder-style until the user confirms) rather than leaving it fully generic for logged-in returning users.

### [OPPORTUNITY , low] WalkInBand loading state uses hand-rolled pulse divs instead of the shared Skeleton primitive (H. Waiting and response feedback)
- **Where:** `app/[locale]/_components/homepage/WalkInBand.tsx:92-103`
- **Now:** While `loading` is true, WalkInBand renders two inline `<div className="... animate-pulse" />` blocks manually shaped to mimic the card layout, rather than importing `Skeleton`/`SkeletonCard` from `_components/primitives` (used correctly at the route level in app/[locale]/loading.tsx:1,7-18). The shape does match the eventual card layout so this is a consistency gap, not a bare-spinner violation.
- **Lever:** Swap the two pulse divs for the shared `<Skeleton>` primitive with matching dimensions, so all loading states in the app share one skeleton implementation.

### [OPPORTUNITY , low] No above-the-fold image is marked priority, so LCP photo may lazy-load (M. Photos first)
- **Where:** `app/[locale]/_components/homepage/SalonCard.tsx:502-509`
- **Now:** The `<Image>` inside SalonCard sets `fill`, `sizes`, and `className` but never `priority` or `loading="eager"`. Nearby and RecentlyViewed both render as the first visible card rows below the fold-adjacent hero, and next/image defaults remaining images to `loading="lazy"`, which can delay the LCP paint for the first-row cards that are visible on load for a typical viewport.
- **Lever:** Pass `priority` (or at least `loading="eager"`) on the first 1-2 cards of the first above-the-fold section (e.g. index 0-1 of RecentlyViewed/Nearby) so the earliest visible photo isn't deferred.

### [OPPORTUNITY , low] Not applicable: homepage has no multi-step flow or loyalty progress UI (B. Progress and goal-gradient)
- **Where:** `app/[locale]/page.tsx:149-182`
- **Now:** The homepage composition (Hero, MobileCategoriesRow, ForYouSalonRows, RecentlyViewed, Nearby, WalkInBand, Entdecken, Reviews, BusinessTeaser) contains no step indicator, no loyalty tier widget, and no progress bar of any kind, checklist item B doesn't apply to this surface at all.
- **Lever:** None, this item belongs to booking flow / loyalty surfaces, not the homepage. Included only to document the item was checked and found not-applicable rather than silently skipped.

### [OPPORTUNITY , low] Not applicable: homepage is not a confirmation screen (G. Peak-end)
- **Where:** `app/[locale]/page.tsx:149-182`
- **Now:** Checklist item G targets the post-booking confirmation screen, which lives in the booking flow, not the homepage. No confirmation state exists on this surface.
- **Lever:** None for this surface; verify separately on the booking-confirmation route.

### [GOOD , low] Category personalization is additive reordering, never a silent filter (N. Retention loops / personalization)
- **Where:** `app/[locale]/_components/homepage/useCustomerPrefs.ts:70-83`
- **Now:** `sortByCategoryPicks` stable-sorts the existing list so picked categories float to the front but never removes items (`list.map(...).sort(...)`, no `.filter()` that drops items by category). MobileCategoriesRow.tsx:64-68 and Nearby/RecentlyViewed both reuse this helper, so a user's onboarding picks bend the ranking without ever hiding other salons or categories.

### [GOOD , low] Browsing, search, and favoriting UI is available logged out; save bounces to login only on write (C. Guest-first and value-before-auth)
- **Where:** `app/[locale]/_components/homepage/HeartButton.tsx:84-93`
- **Now:** HeartButton's `persist` function only requires a session at the moment of an actual save `POST` (line 86: `if (!session) { ... window.location.href = .../auth/login... }`), not to view the heart or browse cards. The whole homepage (Hero, search, all SalonCard feeds) renders fully for anonymous visitors with no blur/lock wall, and the redirect carries `?redirect=` back to the current path so the user returns to where they were.

### [GOOD , low] WalkInBand correctly hides itself instead of showing a dead empty state, but Entdecken/Reviews have no analogous empty-state check (K. Empty/zero states)
- **Where:** `app/[locale]/_components/homepage/WalkInBand.tsx:54`
- **Now:** WalkInBand explicitly returns `null` when the live fetch resolves to zero walk-in salons (`if (!loading && (!salons || salons.length === 0)) return null;`), avoiding a dead empty section. Reviews.tsx and Entdecken.tsx by contrast always fall back to hardcoded DEMO data on empty/failed fetch (Reviews.tsx:131-132 `if (items.length === 0) return; // keep fallback`), so they never hit a true empty state on the homepage, this is fine on a marketing homepage feed (not a filtered results context K targets), but flagging the asymmetry for completeness.


## Search + map + category pages

### [VIOLATION , high] Price and rating are fully omitted (not placeholder-filled) when absent, breaking fixed-slot cards (D. Price transparency (fixed slots)) [mockup-first]
- **Where:** `app/[locale]/_components/search/SalonResultCard.tsx:291,333,401,415,557,638 (price) and :284,322,388,509,552,620 (rating)`
- **Now:** Every price and rating render is gated by `priceFromCHF != null &&` / `rating != null &&` with nothing rendered in the false branch (e.g. line 638: `{(priceFromCHF != null || nextSlot) && (...)}`). A salon missing avg_price or average_rating simply loses that row entirely.
- **Lever:** Reserve the row height even when the value is missing (e.g. render an empty CardMeta slot or a neutral dash) so cards in the same grid/feed row stay the same height regardless of data completeness.

### [VIOLATION , high] Filter-clear and map-toggle buttons are 36px, under the 44px touch floor, with no expanded hit area (L. Touch floor)
- **Where:** `app/[locale]/_components/search/SearchTemplate.tsx:1289 (map icon) and :1326 (filter/clear-all)`
- **Now:** Both buttons use literal `h-9 w-9` (36x36px) Tailwind classes with no larger invisible padding/hit-area wrapper. Contrast with HeartButton (app/[locale]/_components/homepage/HeartButton.tsx:177), which correctly uses a 44x44 (`h-11 w-11`) transparent outer button around a smaller 28px visible glass circle.
- **Lever:** Wrap each button in the same pattern HeartButton already uses: an `h-11 w-11` tappable outer element with the 36px visual circle centered inside, or simply bump the button itself to `h-11 w-11`.

### [OPPORTUNITY , medium] No next/image priority on any result card photo, so the first above-the-fold LCP image is not prioritized (M. Photos first (LCP priority))
- **Where:** `app/[locale]/_components/search/SalonResultCard.tsx:230`
- **Now:** The shared `photoInner` Image element never receives a `priority` prop in any of the five card variants (grid/list/card/suggest/feed), so even the first card in the very first row lazy-loads like every other card below the fold.
- **Lever:** Pass `priority` (or `fetchPriority="high"`) to the Image for the first 1-2 cards rendered in SearchTemplate's map (index === 0 for both the mobile feed loop at line 1560 and the desktop grid loop at line 1624), matching Solen's own law 7 (photo paint is the LCP priority).

### [OPPORTUNITY , low] Deals/gender filter visibility and walk-in wait times are both driven by real server queries, never fabricated (F. Loss aversion and scarcity ethics / real numbers)
- **Where:** `lib/search/filter-availability.ts:57 and app/api/walkin/availability/route.ts:13-31`
- **Now:** getFilterAvailability() runs live DB counts to decide whether the deals/gender filter pills should even render, and /api/walkin/availability calls getWalkinAvailability() for real queue/wait data, both server-computed and gated behind a feature flag rather than hardcoded or simulated.
- **Lever:** No change needed; this is exactly the discriminating, server-truth pattern the checklist requires and is worth calling out as a model for other surfaces.

### [OPPORTUNITY , low] Search query and city inputs in the composer overlay carry no autoComplete/inputMode/type attributes (J. Forms)
- **Where:** `app/[locale]/_components/search/SearchOverlay.tsx:497,757`
- **Now:** The service-query `<input>` (line 497) and the city `<input>` (line 757) are plain inputs with no `type="search"`, `autoComplete`, or `inputMode` set, which the checklist calls for specifically on contact+payment inputs but is a minor cross-cutting gap on this surface's own text entry too (affects mobile keyboard layout and browser autofill/history behavior).
- **Lever:** Add `type="search"` and appropriate `autoComplete` (e.g. "off" for the free-text query, "address-level2" or similar for city) to both inputs; low priority since the checklist's explicit target is contact/payment forms, not search boxes.

### [OPPORTUNITY , low] entry file missing: none of the three named entry files were actually missing (N/A)
- **Where:** `app/[locale]/search/page.tsx, app/[locale]/[city]/[category]/page.tsx, app/[locale]/[city]/page.tsx`
- **Now:** All three specified entry files exist and were read in full; noting explicitly per the audit procedure that this contingency did not apply.
- **Lever:** No action needed.

### [GOOD , low] Cause-aware, server-computed empty state with a single computed recovery CTA (K. Empty/zero states)
- **Where:** `app/[locale]/_components/search/SearchTemplate.tsx:2199-2302`
- **Now:** EmptyState fetches /api/search/no-results to detect WHY there are zero results (city has no supply but query matches nationwide, a date/period filter, other active filters, or a query miss with a suggested category), and renders exactly one primary computed, tappable recovery action via C1State per cause, never a passive 'try broadening' message.

### [GOOD , low] No filter, sort, or amenity defaults to anything but off/any; nothing paid pre-checked (A. Defaults and preselection)
- **Where:** `app/[locale]/_components/search/FilterSheet.tsx:80,147,167 and app/[locale]/_components/search/SearchTemplate.tsx:453-463`
- **Now:** PriceSlider defaults to MAX (no cap), RatingBar defaults to index 0 ('Any'), open_now/deals/walk_in/instant_bookable all default false via `searchParams.get(...) === "true"`, and distance sort requires an explicit geolocation permission grant before applying.

### [GOOD , low] No auth wall blocks browsing, searching, or favoriting; login is deferred to the point of persisting a save (C. Guest-first and value-before-auth)
- **Where:** `app/[locale]/_components/homepage/HeartButton.tsx:84-93`
- **Now:** SearchTemplate, SearchOverlay, and CityPage render full search/browse/filter functionality with no session check. HeartButton only redirects to /auth/login at the moment a logged-out user tries to persist a favorite (after already seeing and interacting with full salon data), reverting the optimistic UI state first.

### [GOOD , low] Next-available-slot label is computed from real, server-provided ISO slot timestamps, never fabricated (F/D. Real data, no fabrication)
- **Where:** `lib/format.ts:109-134`
- **Now:** nextAvailableSlotLabel() only returns a label when a service actually has a future ISO slot in its `slots` array, computing the earliest one in Europe/Zurich time; it returns null (rendering nothing) rather than a guessed or generic string when no real slot exists.


## Salon detail page (PDP)

### [VIOLATION , high] Heart/favorite hard-redirects logged-out visitors to a full login page instead of working guest-side (C. Guest-first and value-before-auth)
- **Where:** `app/[locale]/_components/homepage/HeartButton.tsx:84-93`
- **Now:** persist() checks supabase.auth.getSession(); if there is no session it reverts the optimistic heart-fill and immediately does window.location.href = `/${locale}/auth/login?redirect=...` (line 90), a full-page navigation away from the PDP. This exact HeartButton (with a real salonId, so persistence is active) is wired into the salon hero at app/[locale]/_components/salon/SalonHero.tsx:123-129 and the desktop header at SalonHeader.tsx:148-153, i.e. every anonymous PDP visitor who taps the heart is bounced off the page.
- **Lever:** On logged-out tap, keep the optimistic local toggle and either (a) persist to localStorage/a guest favorites cookie and reconcile on login, or (b) show a small inline sign-in prompt/toast instead of a page navigation. Reserve the auth ask for the pay step, per the project's own guest-first rule.

### [VIOLATION , high] Reviews never carry a verified-booking marker despite every review being booking-linked data (E. Social proof and trust (verified marker)) [mockup-first]
- **Where:** `app/[locale]/_components/salon/SalonReviews.tsx:168-220`
- **Now:** ReviewCard renders avatar, name/"Anonym", date, stars, and comment text only. The Review type itself (app/[locale]/_components/salon/_shared.ts:35-44) has no booking_id/verified field, and no verified badge or label appears anywhere in the render. A code comment at SalonReviews.tsx:174 references a planned "Verifizierte Buchung" line but it is not implemented, only mentioned in a comment.
- **Lever:** Add a verified marker (small checkmark + label like Fresha's) to reviews confirmed to come from a completed booking, per the project's own PSYCHOLOGY.md law 6 ("we have the data: every review comes from a real booking").

### [VIOLATION , medium] Team card silently substitutes the salon's blended rating for a staff member's personal rating with zero reviews (E. Social proof and trust) [mockup-first]
- **Where:** `app/[locale]/_components/salon/SalonTeam.tsx:168-170`
- **Now:** hasRating checks member.staff_review_count > 0; when false, displayRating falls back to salonAverageRating and is then rendered identically to a real personal rating on the stylist's avatar badge (no distinguishing label, e.g. no "salon avg" qualifier).
- **Lever:** Either omit the rating badge entirely for staff with zero personal reviews (matching the no-bare-rating principle) or label the fallback explicitly (e.g. "Salon 4.8") so it cannot be read as the individual's own score.

### [VIOLATION , medium] Service row "Buchen" button is under the 44px touch-target floor (L. Touch floor)
- **Where:** `app/[locale]/_components/salon/SalonServices.tsx:213-218`
- **Now:** className is `rounded-full border border-s-border bg-white px-5 py-2 text-[13px] ...` on mobile. py-2 (8px top+bottom) plus a 13px line at ~1.5 line-height (~19.5px) yields an estimated rendered height of about 35-36px, roughly 8-9px short of the 44px accessibility/ergonomic floor used elsewhere in this same file's HeartButton (h-11 w-11).
- **Lever:** Bump mobile padding to at least py-3 (or add a min-h-11) on the Buchen link so the tap target reaches 44px, consistent with the h-11 standard already used for icon buttons on this page.

### [OPPORTUNITY , low] "Mehr lesen" review-expand link is ink, not the mandated blue accent for expand-in-place actions (Copy economy rule 2 / affordance-by-color (related to E and the project's own link-color law)) [mockup-first]
- **Where:** `app/[locale]/_components/salon/SalonReviews.tsx:207-215`
- **Now:** The truncated-review "Mehr lesen" toggle button uses `text-s-ink` (line 211), not `text-s-accent`. Project CLAUDE.md copy rule 2 states long text should truncate with an inline `text-s-accent` "Mehr lesen" link (Fresha pattern), and this is the one place on the PDP where that exact pattern is implemented but with the wrong color token.
- **Lever:** Swap `text-s-ink` to `text-s-accent` on the Mehr lesen button to match the locked pattern and signal it is the same clickable affordance as review counts elsewhere on the page.

### [OPPORTUNITY , low] No fabricated scarcity or urgency copy anywhere on the PDP surface (F. Loss aversion and scarcity ethics)
- **Where:** `app/[locale]/_components/salon/SalonMobileBookBar.tsx:20-41 and SalonAppCta.tsx:1-78`
- **Now:** A repo-wide grep of the salon PDP component directory for scarcity/urgency phrasing ("Nur noch", "noch X", "Plätze frei", "läuft ab") returned zero hits outside the (unused) last_minute_discount_percent field name. The mobile sticky CTA and bottom-of-page CTA are plain booking prompts with no urgency framing.
- **Lever:** No violation to fix; flagged only because the checklist predicts this failure mode is common. If a real, server-computed scarcity signal is ever added (e.g. "3 slots left today"), it must resolve from live availability data, never a client constant.

### [GOOD , low] Star rating always renders with its review count via a deliberate split compact-star + accent-count pattern (E. Social proof and trust (stars never bare))
- **Where:** `app/[locale]/_components/salon/SalonHeader.tsx:93-109 and SalonSidebar.tsx:117-133`
- **Now:** RatingStars is called in compact mode without a count prop (by design, per inline comments at both call sites), but the review count is always rendered immediately adjacent as its own clickable `(N)` button in text-s-accent that scrolls to #section-reviews. The visual result always pairs rating with count, satisfying the never-bare-average rule while giving the count its own tap affordance.

### [GOOD , low] Amenities/additional-info list renders strictly from real per-salon boolean columns, no fabricated claims (F. Loss aversion and scarcity ethics (real numbers/claims only))
- **Where:** `app/[locale]/_components/salon/SalonAdditionalInfo.tsx:36-66`
- **Now:** Every item in the amenities checklist gates on a live boolean field from SalonDetail (instant_booking_enabled, accepts_online_payment, free_cancel_hours, pet_friendly, etc.) and the whole section returns null when nothing is true, avoiding any generic/marketing filler claims.


## Booking flow steps (services/staff/time)

### [VIOLATION , medium] No date or time slot is ever pre-selected or highlighted as soonest-available (A - Defaults and preselection (soonest slot)) [mockup-first]
- **Where:** `app/[locale]/_components/primitives/DateTimePicker.tsx:154-167`
- **Now:** value.date starts null (booking-context.tsx:16-17 selectedDate/selectedTime both null) and DateTimePicker never auto-selects today's date or flags the earliest available slot; TimeSlotList (DateTimePicker.tsx:551-594) renders every available slot with identical styling, none marked as 'soonest' or auto-picked.
- **Lever:** On slot fetch, if no date/time is chosen yet, auto-select today (or the first day with availability) and highlight (not force-select) the earliest available slot so the default path is one tap to confirm, matching the checklist's 'soonest available slot highlighted' rule.

### [VIOLATION , medium] Staff picker shows a bare star rating with no review count (E - Social proof: rating without count) [mockup-first]
- **Where:** `app/[locale]/_components/primitives/Avatar.tsx:84-88`
- **Now:** StaffStep.tsx:93 passes badge={{ rating }} to Avatar using only st.average_rating; Avatar.tsx:84-88 renders badge.rating.toFixed(1) alone, e.g. a floating '4.8' pill with no '(N)' review count anywhere on the staff card (StaffStep.tsx:91-130 has no review_count reference at all).
- **Lever:** Either add a review count to the Avatar badge (rating + count) when badge data is available, or drop the badge to a neutral avatar when count is unavailable, per the checklist's 'never a bare average' rule.

### [VIOLATION , medium] No-availability date state offers only passive text, no computed nearest-alternative action (K - Empty/zero states) [mockup-first]
- **Where:** `app/[locale]/_components/primitives/DateTimePicker.tsx:532-549`
- **Now:** When slots.length === 0 and no caller override, TimeSlotList renders a static CalIcon plus labels.noSlots / labels.noSlotsHint text only (DateTimePicker.tsx:536-548); DateTimeStep.tsx:223-249 layers a waitlist CTA on top, but there is no tappable 'next available date' or 'try another day' action computed from real data, the user must manually re-pick a day on the strip.
- **Lever:** When the picked date has 0 slots, compute the nearest future date that DOES have availability (from the already-fetched unavailableDates set or a lightweight follow-up call) and surface it as one tappable pill inside emptySlotContent, alongside the existing waitlist option.

### [VIOLATION , low] Confirmation screen has zero rebooking CTA despite a rebooking-nudge system existing elsewhere (G - Peak-end: no book-again prompt) [mockup-first]
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:250-269`
- **Now:** The only two actions on the confirmation screen are 'Add to calendar' (handleCalendar, line 251-259) and 'Directions' (line 260-268); no 'book again' / same-staff-same-service link exists on this screen, even though app/api/cron/rebooking-nudge/route.ts and messages/de.json's bookAgain keys (used only in components-legacy/refund/RefundCaseView.tsx:909-911) show the concept exists elsewhere in the product.
- **Lever:** Do not add an upsell here (peak-end must stay uncluttered per the checklist), but for a RETURNING customer with a prior completed booking at this salon, consider a single quiet 'book again' text link in the footer area (not a full card) once a next-cycle date is known; otherwise leave as is since the email/nudge cron already covers this asynchronously.

### [OPPORTUNITY , low] No visible card-brand or TWINT marks next to the payment step before/while Stripe Elements loads (E - Payment marks near fields) [mockup-first]
- **Where:** `components-legacy/booking/BookingPaymentForm.tsx:168-170`
- **Now:** The pay form renders only <PaymentElement options={{layout:'tabs'}}/> (line 170); Stripe's element renders its own brand icons once mounted/loaded, but there are no static Visa/Mastercard/TWINT marks in the surrounding chrome (BookingPaymentForm.tsx or PayConfirmStep.tsx's 'payOnlineTitle' card at PayConfirmStep.tsx:509-526) to build trust before the async element paints, and per project law TWINT is currently OFF pending Stripe review anyway.
- **Lever:** Low priority given TWINT is intentionally disabled; if/when TWINT is re-enabled, add the TWINT + card-brand marks inline next to the 'Online bezahlen' selector row (PayConfirmStep.tsx:509-526), not just inside the lazy-loaded Stripe iframe.

### [GOOD , low] Staff step has no visible pre-highlighted default even though context default is 'any' (A - Defaults and preselection)
- **Where:** `components-legacy/booking/StaffStep.tsx:71-89`
- **Now:** lib/booking-context.tsx:15 sets initialFormData.selectedStaffId = 'any' so 'Keine Praeferenz' is the context default from wizard entry, and StaffStep.tsx renders it as the first card with the same active/selected ring styling (cardCls) any other pick gets once selectedStaffId === 'any'.

### [GOOD , low] Confirmation screen already meets the peak-end bar (G - Peak-end: confirmation screen is a warm, uncluttered closing moment)
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:161-248`
- **Now:** One SuccessMark + single headline, one essentials card (salon, focal date, service, staff name, gated payment-status pill), exactly two actions (ink primary 'Add to calendar', flat secondary 'Directions'), no upsell stacked in, payment truth gated on payment_status (isPaid/isConfirming) rather than an unconditional 'paid' claim (lines 105-116).

### [GOOD , low] Full running total is visible from the very first booking step onward (D - Price transparency from step one)
- **Where:** `components-legacy/booking/ServicesStaffStep.tsx:465-477`
- **Now:** The sticky bottom bar on ServicesStaffStep (the first step) shows the live running formatCurrency(formData.totalPrice, locale) total the instant a service is added, well before the pay step; PayConfirmStep.tsx:401-421 adds the VAT line and grand total, so nothing new appears only at checkout.

### [GOOD , low] Auth ask correctly deferred; guest form only appears at PayConfirmStep, not earlier (C - Guest-first, auth deferred to pay step)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:482-498`
- **Now:** ServicesStaffStep, StaffStep, DateTimeStep, and HairStep never check isLoggedIn or block interaction; PayConfirmStep is the only step that renders GuestBookingForm, gated by isLoggedIn, matching the checklist's 'auth ask deferred to pay step' rule.

### [GOOD , low] Service list groups by subcategory with price and duration inline, matches comparability-over-trimming rule (I - Choice architecture: grouped services with inline price/duration)
- **Where:** `components-legacy/booking/ServicesStaffStep.tsx:359-443`
- **Now:** Services render in category sections (groupKey = subcategory ?? category) with duration and price inline per row (lines 413-428); no evidence of artificial capping of the list.

### [GOOD , low] Logged-in contact re-confirmation is well-handled (prefilled, summary row, edit-in-place) (J - Forms: redundant field re-ask)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:433-480`
- **Now:** For a logged-in user with complete profile data, PayConfirmStep shows a quiet read-only summary row (name + phone) with an 'Aendern' edit link rather than re-rendering empty input fields (lines 434-450); only an incomplete/editing state shows live inputs (lines 451-478), avoiding the redundant-fields anti-pattern.


## Pay step + checkout

### [VIOLATION , high] Orphaned legacy checkout page: wrong flow, wrong palette, wrong copy language, live in the route tree (D. Price transparency / general surface integrity)
- **Where:** `app/[locale]/checkout/page.tsx:1-745`
- **Now:** app/[locale]/checkout/page.tsx is a full standalone checkout screen wired to a different booking model (slot_id, JSON booking_intent query param, /api/stripe/create-payment-intent) than the locked services->staff->time->pay flow. It uses the pre-pivot warm palette (rgba(27,77,27,...) greens, s-warning amber, DM Sans font, uppercase-tracked 9-11px labels) banned by the current design system, and hardcodes German strings ('Jetzt buchen', 'Zahlung vor Ort') with no next-intl. Grep across app/components-legacy/components/lib found zero internal navigation targeting /checkout (only a defensive Breadcrumb exclusion and two unrelated /dev/mockups hits), so this route appears unreachable from any real user path but still ships and is directly URL-accessible in production.
- **Lever:** Confirm with the owner whether this route is truly dead; if so, delete it and add a _design-system/REMOVED.md line per the exists-check/graveyard protocol. If some entry point still targets it, it needs a full rebuild against the current PayConfirmStep pattern (styling, i18n, and the current booking data model) before it can be trusted as a real surface.

### [VIOLATION , medium] Legacy checkout page violates price transparency and hides the promo/voucher/credit total in a way the locked flow does not (D. Price transparency)
- **Where:** `app/[locale]/checkout/page.tsx:336-350`
- **Now:** chargeAmount subtracts promo discount_amount and voucher remaining_amount from baseChargeAmount, but userCredits (fetched at line 138 from /api/referral total_earned) is displayed as an informational chip (line 574-586) and never actually applied to chargeAmount anywhere in the render. A user sees 'Guthaben verfuegbar: CHF X' next to a total that does not reflect that credit being usable at this step.
- **Lever:** If this page is kept, either wire userCredits into the chargeAmount calculation with a visible line item, or remove the credits chip entirely so it does not imply the credit is active. If the page is being deleted per the finding above, this is moot.

### [VIOLATION , medium] Star rating can render without a review count on the pay-step summary card (E. Social proof and trust)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:337-345`
- **Now:** The star + average_rating render whenever average_rating > 0 (line 337), but the count span is a SEPARATE nested condition requiring review_count > 0 (line 341). A salon with a nonzero average_rating but a null/zero review_count (e.g. a rating imported or seeded without a synced count) renders a bare '4.8' star with no '(N)' next to it, which is exactly the bare-average pattern law 6 forbids.
- **Lever:** Make the two conditions the same gate: only render the star block at all when both average_rating > 0 AND review_count > 0 are true (a nested if, not two independent ifs), so a star literally cannot appear without its count.

### [VIOLATION , low] Recognizable payment marks sit only in the legacy checkout page's footer trust strip, not next to the live Stripe form (E. Social proof and trust (payment marks next to fields, not footer-only))
- **Where:** `app/[locale]/checkout/page.tsx:728-741`
- **Now:** The trust strip (SSL/Visa/Mastercard/Apple Pay/Stripe/TWINT) is a separate block placed AFTER the payment card in the DOM (line 655-726 payment card, then 728-741 trust strip), functionally footer-only relative to the card fields it should reassure.
- **Lever:** If the page survives the dead-route decision, move the payment-brand row to sit directly above or below the PaymentElement inside the payment card, not as a page-bottom strip.

### [OPPORTUNITY , low] No visible step indicator on PayConfirmStep itself; step context depends entirely on the wizard header comment reference (B. Progress and goal-gradient)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:311-313`
- **Now:** The component's own render explicitly omits any step lockup ('Step title comes from the wizard header ... no duplicate lockup here'), delegating the step indicator to a parent (BookingWizard.tsx, not read as part of this audit) rather than rendering it in this file.
- **Lever:** Not flaggable as a defect from this file alone since the indicator is intentionally centralized in the wizard header per the code comment; would need BookingWizard.tsx read to confirm the indicator actually appears and never starts at a literal 0% given account/contact data may already be known. Flagged as an opportunity to verify, not a confirmed violation.

### [OPPORTUNITY , low] Legacy checkout's promo/voucher inputs lack inputmode/autocomplete hints and validate only on a separate button press, not blur (J. Forms)
- **Where:** `app/[locale]/checkout/page.tsx:528-552,600-624`
- **Now:** Both the promo code and voucher code text inputs are plain type='text' with no autoComplete/inputMode attributes, and validation only fires via the explicit 'Anwenden' button click (handlePromoValidate / handleVoucherValidate), not on blur.
- **Lever:** Low priority given this route appears to be dead code (see the orphaned-checkout finding); if the route is kept, add inputMode/autoComplete where applicable and an onBlur validation trigger to match the checklist's blur-validation guidance.

### [GOOD , low] Payment marks are correctly placed next to fields in the live BookingPaymentForm (already good) (E. Social proof and trust)
- **Where:** `components-legacy/booking/BookingPaymentForm.tsx:168-210`
- **Now:** The lock icon + 'Sichere Zahlung ueber Stripe' caption sits immediately below the Pay CTA, directly adjacent to the PaymentElement card fields (line 170 PaymentElement, line 207-210 secure caption), not relegated to a page footer.

### [GOOD , low] Guest-first deferred auth correctly implemented in the locked flow (already good) (C. Guest-first and value-before-auth)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:482-498`
- **Now:** A logged-out user reaches the pay step with services/staff/time already selected and only supplies name+phone(+optional email) via GuestBookingForm at the pay step itself; no earlier step blocks or blurs on auth, matching law 4 (value before auth) exactly.

### [GOOD , low] Deposit/prepay payment mode is server-driven (salon-mandated), not a dark-pattern default toward the online charge (A. Defaults and preselection / F. loss aversion ethics)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:150-154`
- **Now:** payChoice defaults to 'online' only when onlineAvailable is true (salon actually accepts online payment) and paymentMode is 'at_salon' (a genuine free choice); for deposit/prepay modes the salon's own payment_mode drives the charge, with no client-side manipulation of which option looks selected to trick the user into paying more than intended.

### [GOOD , low] Full CHF total is visible from the top of the pay step, correctly ahead of the payment method choice (D. Price transparency)
- **Where:** `components-legacy/booking/PayConfirmStep.tsx:401-421`
- **Now:** The price card (per-service lines, conditional VAT-included line, bold total) renders above the payment-method selector and before any Stripe form, so the customer sees the full total before being asked to commit to a payment method, matching law 5.

### [GOOD , low] Guest form fields use correct autocomplete/inputmode/type attributes; validation is on-change with soft error suppression (J. Forms)
- **Where:** `components-legacy/booking/GuestBookingForm.tsx:131-244`
- **Now:** Name (autoComplete='name'), phone (type='tel', inputMode='numeric' with a fixed +41 chip, autoComplete='tel-national'), and email (type='email', inputMode='email', autoComplete='email', optional) are all correctly typed; errors are only shown for fields already flagged (sync at line 82-97 keeps only pre-existing errors), avoiding yelling at a half-typed field, and full force-validation happens only on the parent CTA press.


## Confirmation + post-booking

### [VIOLATION , high] One-tap 'book again' / rebook CTA is missing from the confirmation screen (G. Peak-end / L12. Effort beats delight) [mockup-first]
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:250-268`
- **Now:** The confirmation screen renders exactly two actions: 'Add to calendar' (ink primary) and 'Directions' (secondary). There is no rebook / 'Nochmals buchen' action anywhere on the component. Yet messages/de.json still carries orphaned successPage keys `rebook: "Nochmal buchen"` (line ~4643) and `continueExploring: "Weitere Salons entdecken"` (line ~4644) that are never referenced by this component (grep confirms zero t("rebook") calls in the file). A working express-rebook API already exists and is wired into BookingsList.tsx and ExpressRebook.tsx elsewhere in the app.
- **Lever:** Add a one-tap 'Nochmals buchen' action to BookingConfirmation for returning users (same staff, same service, cycle-appropriate next slot) using the existing /api/bookings/express-rebook + /api/bookings/express-rebook/confirm endpoints already used by BookingsList.tsx. Reuse the orphaned `rebook` translation key rather than inventing new copy.

### [VIOLATION , high] booking-action page is a dead end in every terminal state (confirmed, cancelled, and error) (K. Empty/zero states / G. Peak-end) [mockup-first]
- **Where:** `app/[locale]/booking-action/page.tsx:40-77`
- **Now:** This is a magic-link landing page (email quick-confirm/cancel action) with three terminal states, all rendered inside a static card with a headline + one line of body copy and nothing else: no Link, no <a>, no button, anywhere in the file (grep confirms zero navigable elements). A user who lands here after confirming or cancelling, or hitting the errMissingParams/errActionFailed/errRequestFailed error paths, has no way forward except closing the tab or hitting back.
- **Lever:** Add one computed, tappable next step per state: confirmed -> link to the booking detail/confirmation page (`/${locale}/confirmation?booking_id=...`); cancelled -> link to search/rebook; error -> link to `/booking/lookup` or a support contact. Mirrors the pattern already used in RefundCaseView.tsx's bookAgainHref.

### [VIOLATION , medium] Guest access-link copy button is 36px, under the 44px touch floor (L. Touch floor)
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:287`
- **Now:** The copy-to-clipboard icon button for the guest's only credential (the access link) is sized `h-[36px] w-[36px]`, while every other interactive element on the same screen (the salon-identity row's photo, the access-link input row) uses the locked 44px floor. This is the guest's single way back into their own booking, so a missed tap here is high-cost.
- **Lever:** Bump the button to `h-11 w-11` (44px), matching the design contract's icon-button row and the a11y floor already used elsewhere on this same card.

### [OPPORTUNITY , low] Payment total on confirmation never shows a promo/credit breakdown line even when one was applied (D. Price transparency) [mockup-first]
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:229-247`
- **Now:** The 'paid + price' row shows only a single total (`props.priceLabel`) plus a paid/confirming/pay-in-person status; there is no prop or rendered line for an applied promo code or credit amount, so a user who paid less than the salon's list price because of a promo/credit sees only the final number with no record that a discount was applied (props: pricePaid, priceLabel, no promoAmount/creditAmount fields on the interface at all, lines 35-77).
- **Lever:** If promo/credit data is available on the booking row, surface it as a small line under the total (e.g. '-CHF 10 Gutschein') so the discount stays visible after the fact, consistent with the price-transparency law's requirement that promo/credit be part of the visible total story, not just baked silently into the final number.

### [OPPORTUNITY , low] Tip deep-link page renders a full-screen spinner for a single booking fetch instead of a layout-matching skeleton (H. Waiting and response feedback) [mockup-first]
- **Where:** `app/[locale]/tip/[bookingId]/page.tsx:36-42`
- **Now:** While `booking` loads via a single fetch to /api/bookings/${bookingId}, the whole page shows a centered `<Spinner size="md" />` on a blank background rather than a skeleton shaped like the TipSheet that is about to appear (recipient photo/name/rating row + amount buttons).
- **Lever:** Swap the bare spinner for a skeleton matching the TipSheet's recipient-row + amount-grid layout so the transition into the real sheet doesn't jump; low priority since this is a single-record fetch, not a full module with many parts.

### [GOOD , low] Success-state green is correctly the locked normal green, not the stale 'dark-green' comment (F/law-adjacent semantic color (context, not in the 15-law list directly, but predicted risk per Solen taste rule 6))
- **Where:** `app/[locale]/_components/primitives/SuccessMark.tsx:9`
- **Now:** The component doc comment says 'dark-green fill and white check' which reads like the previously-banned deep #15803D, but the actual token used (`bg-s-success`, tailwind config line 170) resolves to `#16A34A`, the correct normal green mandated by the design contract. The comment is stale wording, the shipped color is correct.
- **Verifier:** wrong-line , The finding is substantively correct (tailwind.config s-success DEFAULT = #16A34A confirmed, matches locked normal green) but the cited line 9 reads 'A solid green disc (s-success #16A34A) + white check...' which is accurate wording, not stale. The actual stale phrase 'Owner-approved look (dark-green fill + white check)' sits at app/[locale]/_components/primitives/SuccessMark.tsx:11, not line 9. Correct anchor: SuccessMark.tsx:11.

### [GOOD , low] Review-prompt cadence correctly waits 24h, not same-day (E/N. Review timing and reminder cadence)
- **Where:** `app/api/cron/review-prompt/route.ts:36-48`
- **Now:** The cron computes a 23h-25h window after the appointment (`starts_at`) before sending the review-prompt/tip email, correctly avoiding the same-day ask that Law 6 flags as producing fewer and worse reviews.

### [GOOD , low] Confirmation screen correctly avoids stacking loyalty, promos, or upsells on the peak-end moment (G. Peak-end)
- **Where:** `components-legacy/booking/BookingConfirmation.tsx:161-317`
- **Now:** The full render tree of BookingConfirmation contains no loyalty/points/tier copy, no promo banner, no cross-sell card; it is exactly SuccessMark + title + one essentials card + two actions + guest access block + footer, matching Law 1's 'never stack promos/upsells on it'.


## Auth + customer onboarding

### [VIOLATION , medium] Back button on onboarding wizard is 32px, under the 44px touch floor (L. Touch floor)
- **Where:** `app/[locale]/onboarding/OnboardingFlow.tsx:146-149`
- **Now:** The back-navigation button in the customer onboarding flow is styled `w-8 h-8` (32x32px). This is the only interactive control on the surface measured below the 44px minimum; the primary CTA (`h-12`), skip link, and chip buttons (`h-[46px]`) all clear it.
- **Lever:** Change `w-8 h-8` to `w-11 h-11` (44px) on the back button, keeping the same icon size/border/hover treatment.

### [VIOLATION , medium] No autoComplete/inputMode attributes on any auth or onboarding input (J. Forms)
- **Where:** `components-legacy/auth/SignIn.tsx:203-218`
- **Now:** Every text input across SignIn.tsx (email, password), register/page.tsx (email, password, birthday date, salon name) and reset-password/page.tsx (new password, confirm password) has `type` set but no `autoComplete` or `inputMode` attribute. Password managers and mobile keyboard optimizations (e.g. numeric keypad hints, autofill for 'current-password' vs 'new-password') are not wired.
- **Lever:** Add `autoComplete="email"`, `autoComplete="current-password"` (login) / `autoComplete="new-password"` (register/reset), and `autoComplete="bday"` on the date input, matching each field's semantic role.

### [VIOLATION , medium] Password and age rules validate only on submit, never on blur (J. Forms)
- **Where:** `app/[locale]/auth/register/page.tsx:77-103`
- **Now:** `handleSubmit` is the only place password length/digit/uppercase and minimum-age (16) checks run; the email/password/birthday inputs only carry `onChange` handlers that update state (lines 163, 171, 198), with no `onBlur` validation or inline error state. A user can fill an 8-character password with no digit and get zero feedback until they press the submit button.
- **Lever:** Add onBlur handlers that run the same regex checks and surface an inline error under the field (the reset-password page at app/[locale]/auth/reset-password/page.tsx:170-175 already does this correctly with live Requirement checkmarks; reuse that pattern here).

### [OPPORTUNITY , low] Register wizard has no step indicator across its two real steps (B. Progress and goal-gradient) [mockup-first]
- **Where:** `app/[locale]/auth/register/page.tsx:226-268`
- **Now:** The register flow moves through `StepRole` (role choice) then `StepRegister` (form), driven by `WizardStep = -1 | 0` with a slide animation, but renders no step count, progress bar, or 'Step X of Y' copy anywhere in the component. Contrast with the onboarding flow's OnboardingFlow.tsx:145-156, which shows a progress bar plus 'Schritt X von Y' text for its 5 steps.
- **Lever:** Add a small 2-step indicator (e.g. two dots or a thin progress bar) to StepRegister matching the visual weight of the onboarding one, so the user perceives forward motion instead of an open-ended flow.

### [OPPORTUNITY , low] Onboarding /onboarding route itself hard-requires a session before rendering (C. Guest-first and value-before-auth)
- **Where:** `app/[locale]/onboarding/page.tsx:29-33`
- **Now:** The server component reads the Supabase session and calls `redirect(...auth/login?redirect=/onboarding)` if `!user`. This is reached only from the post-email-confirmation callback (app/api/auth/callback/route.ts:47-63) so an account already exists by the time this page loads, meaning it is not gating browsing value, but a user who bookmarks or re-visits `/onboarding` while logged out (session expired) is bounced to a bare login screen with no context for why they are there.
- **Lever:** If the login redirect fires from an expired/missing session on this URL, consider a short explanatory line above SignIn ('Melde dich an, um dein Profil fertigzustellen') so the detour is legible; low priority since the primary entry path is already authenticated.

### [GOOD , low] No pre-checked marketing or newsletter opt-in anywhere in signup (A. Defaults and preselection)
- **Where:** `app/api/auth/signup/route.ts:16-32`
- **Now:** The signup Zod schema only collects email, password, birthday/salon_name; there is no marketing-consent or newsletter field in the API, and no checkbox of any kind (checked or unchecked) in StepRegister in app/[locale]/auth/register/page.tsx. Nothing that costs money or subscribes is pre-checked, satisfying the hard line directly.

### [GOOD , low] Onboarding progress bar never opens at a literal 0% (B. Progress and goal-gradient)
- **Where:** `app/[locale]/onboarding/OnboardingFlow.tsx:73`
- **Now:** `progress = Math.round(((i + 1) / TOTAL) * 100)` means step index 0 (the first question) computes to 20% (1/5), never 0%, and is paired with explicit 'Schritt 1 von 5' text (line 154). This is exactly the goal-gradient pattern the checklist calls for.

### [GOOD , low] Deferred-auth redirect pattern lets guests reach the login wall only at value-gated actions (C. Guest-first and value-before-auth)
- **Where:** `components-legacy/auth/SignIn.tsx:32-34`
- **Now:** SignIn reads `?redirect=` from the URL and only allows internal relative paths (`rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")`), then the caller pages (favorites, bookings, profile, hearts, e.g. app/[locale]/profile/favorites/page.tsx) build the login URL themselves when the user actually attempts a gated action, rather than forcing login upfront. Booking pages (app/[locale]/booking/**) show no requireAuth/login-redirect guard, consistent with the search/browse/select surfaces staying open.


## Inspo discovery feed

### [VIOLATION , high] CardSignals renders a bare star rating with no review count (E - Social proof (stars with count))
- **Where:** `components-legacy/discovery/CardSignals.tsx:32-37`
- **Now:** When `item.rating` is a number, the card shows `<Star/> {item.rating.toFixed(1)}` with no accompanying count, e.g. "4.8" with nothing after it. The `DiscoveryItem` type (lib/types.ts:422-500 range) has no `review_count`/`rating_count` field at all, and the feed route (app/api/discovery/feed/route.ts) never selects one, so there is no data to attach even if the UI wanted to. Currently this is dormant (the feed query never populates `item.rating`, confirmed by grep across app/api/discovery/*/route.ts), so nothing renders today, but the component is coded to violate law 6/checklist E the moment rating data is wired in.
- **Lever:** Before this component ever ships live data: add a `review_count` (or reuse the salon's `review_count`) field to the discovery item payload and require `hasRating` to also require `hasCount`, rendering "4.8 (54)" not a bare "4.8" (mirrors the pattern already correct in DetailPage.tsx:399-401 for the salon list, which shows rating without count either, worth fixing together).

### [VIOLATION , high] "Book this look" salon rows show a bare star rating, no review count (E - Social proof (stars with count) in Book-this-look salon list)
- **Where:** `components-legacy/discovery/DetailPage.tsx:398-402`
- **Now:** Each salon row under "Diesen Look buchen" renders `<Star/> {s.rating.toFixed(2)}` (e.g. "4.85") sourced from `salons.average_rating` (app/[locale]/inspo/[id]/page.tsx:185) with no review count fetched or shown, even though `salons.review_count` exists in the schema (lib/types.ts:128) and the query at page.tsx:161 does not select it.
- **Lever:** Add `review_count` to the `.select()` at app/[locale]/inspo/[id]/page.tsx:161, pass it through `SalonLite`, and render "4.85 (23)" in DetailPage.tsx:398-402, consistent with law 6 and how salon cards elsewhere in the app are expected to show rating+count together.

### [VIOLATION , medium] Multiple Inspo tap targets sit below the 44px hit-area floor (L - Touch floor)
- **Where:** `components-legacy/discovery/FilterDrawer.tsx:62,77`
- **Now:** The filter-sheet trigger button is `h-10 w-10` (40px, line 62) and the sheet's own close X is `h-[34px] w-[34px]` (34px, line 77). DetailPage's hero back-arrow and heart buttons are `h-9 w-9` (36px, DetailPage.tsx:253 and :263). Saved page's back arrow is `h-10 w-10` (40px, saved/page.tsx:67).
- **Lever:** Bump these five controls to `h-11 w-11` (44px), matching the locked icon-button size already used correctly elsewhere in the same files (e.g. FilterDrawer.tsx:110 gender-pill buttons and LikeButton.tsx:101 which are both h-11 w-11).

### [OPPORTUNITY , low] Heart-to-save correctly defers auth, but redirects away from the look with no return path (G/L - Guest-first save action and dead-end for logged-out users)
- **Where:** `app/[locale]/inspo/page.tsx:313`
- **Now:** `handleAuthRequired` does `router.push('/${locale}/auth/login')` with no `?redirect=` or `?returnTo=` param, so a logged-out user who taps a heart on a look loses their place in the feed/scroll position and, after logging in, lands on a generic post-login page rather than back on the look they wanted to save.
- **Lever:** Pass the current look id or feed URL as a redirect param to the login route (e.g. `/${locale}/auth/login?redirect=/${locale}/inspo/${item.id}`) so completing auth returns the user to the exact save-worthy content, preserving the guest-first value-before-auth principle through to completion.

### [OPPORTUNITY , low] BookCTA component (price-range + CTA card) is unused dead code, diverges from the shipped DetailPage flow (N - Retention loops (dead code risk))
- **Where:** `components-legacy/discovery/BookCTA.tsx:35`
- **Now:** `BookCTA` is never imported anywhere in the app (confirmed via repo-wide grep) yet still exists with its own price-estimate copy ("Geschätzte Preisspanne") and CTA logic that differs from the actual shipped booking entry point in DetailPage.tsx (the "Diesen Look buchen" salon list). Not user-facing today, so not a live violation, but it is drift risk: a future edit could accidentally re-wire it and reintroduce an estimated (not real) price range next to a CTA, or a second inconsistent booking path.
- **Lever:** Delete BookCTA.tsx and log the removal in `_design-system/REMOVED.md` per the exists-check protocol, since the real "book this look" flow already lives in DetailPage.tsx.

### [OPPORTUNITY , low] Salon list price is a same-service floor, not the specific pre-selected service's price (D - Price transparency (add-on / anchor))
- **Where:** `components-legacy/discovery/DetailPage.tsx:405 and app/[locale]/inspo/[id]/page.tsx:186`
- **Now:** `priceFrom` is computed as `Math.min(...services.map(x => x.price))` across ALL of the salon's matching-category services (page.tsx:186), but the CTA links to `bookHref(s.slug, chosen.id)` which pre-selects a specific matched-or-cheapest service (page.tsx:176-188) that may cost MORE than the displayed "ab CHF X" floor. A user can tap "Buchen" expecting the shown price and land on a booking step for a pricier service.
- **Lever:** Either show the price of the actually pre-selected `chosen` service instead of the category floor, or keep the floor but label it clearly as a range starting point (already does say "ab", so this is a minor precision gap, not a hidden-cost violation since the real total still renders on the booking page per law 5).

### [GOOD , low] Browsing, look detail, tags, and book-this-look all correctly work logged out (C - Guest-first / value-before-auth)
- **Where:** `app/[locale]/inspo/[id]/page.tsx:144-146 and components-legacy/discovery/DetailPage.tsx:392`
- **Now:** The detail page computes `isAuthenticated` but never gates rendering of the look, its salons list, or the `bookHref` links on it (DetailPage.tsx:389-408 renders the full salon list + working booking Links regardless of auth state); only the heart/save action calls `router.push('/auth/login')`. This is exactly the deferred-auth pattern law 4 calls for.

### [GOOD , low] Over-filtered zero-result state offers a tappable one-tap reset, not passive text (K - Empty/zero states with computed recovery)
- **Where:** `app/[locale]/inspo/page.tsx:559-568`
- **Now:** When `items.length === 0` and any filter/search/cut is active, `DiscoveryEmptyState` is given a real `reset` callback that clears every filter in one tap (resetFilters at page.tsx:362-368); only the true cold-empty case (no filters active) omits the reset button and shows the neutral empty-state copy instead of a fake CTA.


## Profile + loyalty + favorites + referral

### [VIOLATION , high] Referral "total_earned" is hardcoded to 0, never computed from real reward data (F - Loss aversion and scarcity ethics (no fabricated numbers))
- **Where:** `app/api/referral/route.ts:31,45-49`
- **Now:** `let total_earned = 0;` is declared once and never reassigned. The response always returns `total_earned: 0` regardless of how much the user actually earned. The `referrals` table already has a `reward_amount` column (confirmed live in _inventory/_db-columns.json:1093-1102) and `friends_invited` is correctly computed from a real query a few lines above, but the earnings figure next to it is dead code that always renders zero. On /profile/referral this renders as a permanent "CHF 0.00 Verdient" stat card even for users who successfully referred friends and earned credit, directly undermining the referral incentive copy shown at the top of the same page ("Ihr beide erhaltet CHF 10 Guthaben").
- **Lever:** Sum `reward_amount` from `referrals` where `referrer_id = user.id AND status = 'completed'` and return that instead of the literal 0.

### [VIOLATION , high] "Top bewertet" salon ranking sorts by raw average_rating with no review-count weighting, and feeds the empty-state hero photo (E - Social proof and trust (count x score weighting))
- **Where:** `app/[locale]/profile/favorites/page.tsx:68-73,86`
- **Now:** `.order("average_rating", { ascending: false }).limit(6)` with no minimum review_count filter and no Bayesian/count-weighted formula. A salon with a single 5.0 review currently outranks a salon with hundreds of reviews at 4.6. The very first result of this query (`topSalons?.[0]`) is then used as `bannerImg` for the empty-favorites hero photo (line 86), so a thin, low-confidence 5.0 salon can become the most visually prominent element on the empty-favorites screen.
- **Lever:** Weight the order by count x score (e.g. Wilson lower bound or `average_rating * ln(review_count+1)`), or floor the query at a minimum review_count before sorting by rating.

### [VIOLATION , high] Favorites list renders salons with the legacy no-photo card ("photos killed") instead of the current photo-first card (M - Photos first) [mockup-first]
- **Where:** `components-legacy/SalonCard.tsx:152-162 (rendered via app/[locale]/_components/profile/FavoritesList.tsx:12,103)`
- **Now:** FavoritesList imports `components-legacy/SalonCard.tsx`, whose cover block is commented "A3 LOCKED 2026-05-03: photos killed pre-launch. Always render solid category color + Anton uppercase salon name" and calls `<ImageFallback>` unconditionally, never touching `salon.cover_photo_url`. Meanwhile the current live card, `app/[locale]/_components/homepage/SalonCard.tsx:500-518`, explicitly supersedes that lock ("V3-D101: stock photos restored per user") and renders a real `<Image src={photoUrl}>` with a monogram-only fallback. Favorites is the one surface still on the stale card, so every favorited salon shows a flat color tile + big letter instead of its photo, the largest visual signal on a beauty marketplace card.
- **Lever:** Swap FavoritesList's import from `components-legacy/SalonCard` to the current `app/[locale]/_components/homepage/SalonCard` (or port its `photoUrl` prop into the legacy card) so favorited salons show real photos.

### [VIOLATION , high] Booking card's Rebook pill and overflow ("...") button are under the 44px touch floor (L - Touch floor) [mockup-first]
- **Where:** `components-legacy/booking/BookingCard.tsx:150-155,158-164`
- **Now:** The Rebook button uses `px-4 py-2` with 13px text (roughly ~34px tall) and the overflow menu trigger is explicitly `h-[38px] w-[38px]` (line 160). Both sit below the 44px floor that Solen's own design contract locks ("touch target ≥ 44px (h-11), the a11y floor") and that this checklist requires for every tappable control. This card renders once per booking on /profile/bookings, so every rebook/reschedule/cancel tap on that page is undersized.
- **Lever:** Bump both controls to `h-11` (44px): increase the Rebook button's vertical padding and change the overflow button to `h-11 w-11`.

### [VIOLATION , medium] Empty "upcoming bookings" state has action-oriented copy but zero tappable recovery (K - Empty/zero states) [mockup-first]
- **Where:** `components-legacy/booking/BookingsList.tsx:188-200`
- **Now:** The upcoming-tab empty message reads "Buche jetzt deine nächste Behandlung" ("Book your next treatment now") but `<EmptyState>` is called with only `icon`, `title`, and `message`, no `action`. The component itself supports an `action` slot (`components-legacy/ui/EmptyState.tsx:31,86`) and other surfaces (the favorites empty state, see the paired already-good finding below) use it correctly, but BookingsList never wires it, leaving a literal call-to-action sentence with nothing tappable under it.
- **Lever:** Pass `action={<Link href={`/${locale}/search`}>...Jetzt buchen...</Link>}` (or similar) into the `upcoming` branch of the `<EmptyState>` call.

### [VIOLATION , medium] Booking tab switch shows a bare centered spinner over the whole card grid instead of a layout-matching skeleton (H - Waiting and response feedback) [mockup-first]
- **Where:** `components-legacy/booking/BookingsList.tsx:176-180`
- **Now:** Every tab change (`upcoming`/`past`/`cancelled`) triggers `fetchBookings()`, which sets `loading=true` and, while true, replaces the entire card grid with `<div className="flex items-center justify-center py-12"><Spinner /></div>` - a bare small spinner standing in for a full-module reload of what is normally a 1-3 column card grid.
- **Lever:** Render 2-3 `BookingCard`-shaped skeleton blocks (matching the focal-date-block + text layout) during `loading`, reserving the small plain `<Spinner>` for genuinely small inline fetches.

### [VIOLATION , low] Referral page shows a fully blank screen with a centered spinner on first load, no layout-matching skeleton (H - Waiting and response feedback) [mockup-first]
- **Where:** `app/[locale]/profile/referral/page.tsx:44-50`
- **Now:** This is a `"use client"` page with no server-side render and no `loading.tsx` for its own route segment. While `/api/referral` resolves, the whole viewport shows only `<Spinner size="lg" />` centered on an otherwise empty page, no hint of the hero/code/stats layout that is about to appear.
- **Lever:** Add a `loading` skeleton matching the hero card + code box + 2-stat grid shape (mirrors the pattern already used in `app/[locale]/profile/loading.tsx`), shown while `data === null`.

### [OPPORTUNITY , low] Price and rating slots collapse out of the card layout when missing, instead of reserving a placeholder (D - Price transparency (fixed slots, no layout collapse)) [mockup-first]
- **Where:** `components-legacy/SalonCard.tsx:266-277,288-295`
- **Now:** `{priceToShow != null && (...)}` and the `salon.average_rating > 0 ? ... : salon.review_count === 0 ? <new badge> : null` branch both render nothing at all when the value is absent, so cards with and without a price/rating have different heights in the same grid (visible on the favorites grid, which can mix long-established and brand-new salons).
- **Lever:** Render a fixed-height placeholder (e.g. a muted dash or skeleton bar) in the price and rating slots when the value is null, so every card in a row keeps the same vertical rhythm.

### [GOOD , low] Loyalty status ties loss-framing to a real, user-owned expiry with an honest grace mechanic (F - Loss aversion and scarcity ethics)
- **Where:** `app/[locale]/rewards/RewardsView.tsx:177-184 (backed by lib/loyalty/status.ts:36-37,113-122)`
- **Now:** "Gültig bis {date}. Buche, um deinen Status zu behalten." is driven by a real `valid_through` value from the `loyalty_status` snapshot table (never fabricated), and the accompanying `howBody` copy is honest about the decay mechanic: status drops "langsam, immer nur eine Stufe" (slowly, one tier at a time) rather than an abrupt full reset, giving a genuine grace window instead of manufactured urgency.

### [GOOD , low] Favorites empty state offers a real, computed, tappable recovery instead of passive text (K - Empty/zero states)
- **Where:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx:71-138 (wired from app/[locale]/profile/favorites/page.tsx:80-96)`
- **Now:** When the favorites list is empty, the page renders a discovery banner linking to /inspo plus a horizontally-scrolling rail of real top-rated salons (each a live link to `/salon/[slug]`), giving the user an immediate, concrete next action rather than a bare "no favorites yet" message.


## Reviews (PDP section + review flow)

### [VIOLATION , high] Photo-remove button on the review form is a 20px tap target, less than half the a11y floor (L. Touch floor) [mockup-first]
- **Where:** `components-legacy/ReviewForm.tsx:410`
- **Now:** The X button that removes an attached review photo is `className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-s-ink/60 text-white"` (ReviewForm.tsx:407-414), i.e. a 20x20px hit area holding a 10px icon (`<X size={10} />`). Solen's own design contract locks `touch target | interactive controls >= 44px (h-11), the a11y floor`.
- **Lever:** Keep the visible 20px glyph but wrap it in a `h-11 w-11` (or at minimum an absolutely-positioned padded) hit area, matching the pattern already used elsewhere (icon-button spec = h-11 w-11).

### [VIOLATION , medium] Flag-review icon button is 32px, under the locked 44px touch floor (L. Touch floor) [mockup-first]
- **Where:** `components-legacy/salon/SalonReviews.tsx:281`
- **Now:** The per-review flag/report button is `className="grid h-8 w-8 shrink-0 place-items-center rounded-full ..."` (SalonReviews.tsx:276-284), a 32px circle holding a 15px Flag icon. Below the project's own locked 44px `icon-button` spec and the a11y floor.
- **Lever:** Bump to `h-11 w-11` to match the LOCKFILE icon-button size, or absolutely-position a 44px invisible hit-area around the visible 32px circle if the smaller visual size is intentional next to dense review-card headers.

### [VIOLATION , medium] Marketplace /reviews empty state is passive copy with no recovery action, a dead end (K. Empty/zero states) [mockup-first]
- **Where:** `app/[locale]/reviews/page.tsx:98-109`
- **Now:** When zero public reviews exist site-wide, the page renders only an icon + `t("emptyTitle")` + `t("emptyMessage")` (page.tsx:99-109). The actual copy is 'Noch keine Bewertungen' / 'Sobald die ersten Bewertungen eintreffen, erscheinen sie hier.' (messages/de.json:4846-4847) with no tappable link anywhere in the block, e.g. back to search/salon browsing. The project's own `EmptyState` component already supports an `action` prop (components-legacy/ui/EmptyState.tsx:28-32) but this page hand-rolls the empty block without one.
- **Lever:** Add one tappable recovery link in the empty block, e.g. 'Salons entdecken' pointing at `/search` or the homepage, so the state is never a dead end.

### [VIOLATION , medium] PDP review-body lazy fetch shows no loading skeleton, only ambiguous placeholder copy (H. Waiting and response feedback) [mockup-first]
- **Where:** `app/[locale]/_components/salon/SalonReviews.tsx:52-75`
- **Now:** When the parent withholds review bodies and only passes a count, this client component self-fetches up to 50 reviews via Supabase (lines 52-75) while `fetched` stays `null`. During that in-flight window `all.length === 0` is true, so the render branch at lines 119-129 shows italic text ('Bewertungstexte folgen.' when count>0, or 'Noch keine Bewertungen.' when count is also 0) with no distinction between 'still loading' and 'confirmed empty'. The project's own locked contract states loading states must be `<Skeleton>` matching the final layout, never bare text.
- **Lever:** Track an explicit `loading` boolean (true until the fetch settles) and render a `<Skeleton>` shaped like 1-2 review rows while `loading` is true, falling back to the current empty-copy branches only once the fetch has actually resolved.

### [OPPORTUNITY , high] No 'verified booking' marker on any review card, even though every review requires a completed booking (E. Social proof and trust) [mockup-first]
- **Where:** `app/api/reviews/route.ts:43`
- **Now:** POST /api/reviews hard-requires `booking.status !== "completed"` to reject the write (route.ts:39-43), so literally 100% of reviews on Solen are tied to a real completed booking. Yet none of the three review renderers surface that fact: components-legacy/salon/SalonReviews.tsx:250-274 (name/date/stars only), app/[locale]/_components/salon/SalonReviews.tsx:182-192 (avatar/name/date only), and app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:49-59 (avatar/name/stars only) all render zero verified/checkmark indicator.
- **Lever:** Add a small 'Verifizierte Buchung' text or ShieldCheck-icon marker next to the reviewer name/date in the three card renderers above, since the condition is unconditionally true and needs no new query.
- **Verifier:** wrong-line , The completed-booking gate is real but sits at app/api/reviews/route.ts:46 (`if (booking.status !== "completed") return ...`), not line 43 (line 43 is a blank line inside the preceding `.select().eq().single()` chain). The three renderer citations are all exact matches: components-legacy/salon/SalonReviews.tsx:250-274 (no badge), app/[locale]/_components/salon/SalonReviews.tsx:182-192 (avatar/name/date only, confirmed verbatim), app/[locale]/reviews/_components/MarketplaceReviewsList.tsx:49-59 (avatar/name/stars only, confirmed verbatim). Correct anchor for the completed-check claim: app/api/reviews/route.ts:46.

### [OPPORTUNITY , medium] Review submission ends with zero acknowledgment: sheet just closes, no toast, no list refresh (G. Peak-end) [mockup-first]
- **Where:** `components-legacy/salon/SalonReviews.tsx:412-417`
- **Now:** `onSuccess={() => { setShowReviewForm(false); onReviewSubmitted?.(); }}` (SalonReviews.tsx:412-415) is the entire post-submit handling. `onReviewSubmitted` is declared as an optional prop (line 53) but a repo-wide grep shows zero call sites ever pass it in, so after a successful POST the bottom sheet simply disappears: no confirmation copy, no thank-you state, and the just-submitted review does not appear in the list (no `router.refresh()` or optimistic insert), since the reviews array is server-fetched once per page load (app/[locale]/salon/[slug]/reviews/page.tsx:76-88).
- **Lever:** Wire a brief success toast ('Danke fuer deine Bewertung') on the ReviewForm's onSuccess before closing, and call `router.refresh()` (or optimistically prepend the new review) so the just-written review is visibly present, giving the effortful act of reviewing a closing moment instead of a silent disappearance.

### [OPPORTUNITY , low] Salon average_rating is a raw unweighted mean with no confidence/count weighting (E. Social proof and trust)
- **Where:** `app/api/reviews/route.ts:126-138`
- **Now:** On every new review, average_rating is recomputed as `stats.reduce((sum, r) => sum + r.rating, 0) / stats.length` (route.ts:132-138), a plain mean with no Bayesian/confidence shrinkage. A brand-new salon with a single 5-star review and an established salon with 300 reviews averaging 4.6 are stored and rendered with the same kind of number; the count is at least always shown alongside it (mitigating outright deception), but any future sort/badge built directly off this column would let a thin 5.0 outrank the well-reviewed 4.6, which the checklist explicitly flags as a risk.
- **Lever:** If a 'top rated' sort or badge is ever built on `average_rating`, feed it a lower-bound/Bayesian-adjusted score (e.g. Wilson score or add-k smoothing) instead of the raw column; no change needed to the current display, which is not itself misleading.

### [GOOD , low] Already good: reviews are fully browsable without login on both the marketplace and salon pages (C. Guest-first and value-before-auth)
- **Where:** `app/[locale]/reviews/page.tsx:48-60`
- **Now:** `ReviewsPage` (page.tsx:48-60) and `SalonReviewsPage` (app/[locale]/salon/[slug]/reviews/page.tsx:56-98) both read reviews with no session/auth check at all; only the write-review path (unreviewedBookingId, gated on a completed booking under the viewer's own session) requires auth. Exactly the value-before-auth pattern the checklist rewards: browsing/reading is never blurred or walled.

### [GOOD , low] Already good: review-request emails are delayed ~24h post-completion, not sent same-day (E. Social proof and trust)
- **Where:** `app/api/cron/review-prompt/route.ts:35-38`
- **Now:** The hourly cron computes `windowStart = now - 25h`, `windowEnd = now - 23h` and only emails bookings whose `starts_at` falls in that window (route.ts:35-46), i.e. review prompts go out roughly one day after the appointment, never immediately at checkout/same-day, matching the checklist's 'delayed 1-3 days, not same-day' rule.


## Walk-in + queue tracker

### [VIOLATION , high] Review/rating ask fires the same minute the haircut ends, not 1-3 days later (E Social proof and trust) [mockup-first]
- **Where:** `app/[locale]/queue/[token]/page.tsx:197`
- **Now:** The instant `data.status === "completed"` flips (the `isDone` branch, lines 197-287), the screen shows five interactive stars (lines 229-235) and calls `sendReview()` (defined line 78, POSTs to /api/walkin/review) from the exit actions (`exitHome`, line 202, and TipFlow's `onClose`, line 251). The customer is asked to rate the visit before they have even left the chair.
- **Lever:** Drop the star-rating capture from this synchronous completion screen; keep the immediate tip ask (a gratuity, not a review) but send the actual review/rating request 1-3 days later via push or email, per the evidence-tiered PSYCHOLOGY.md law (two field experiments: immediate asks produce fewer, worse reviews). The code comment at lines 193-196 calls this "owner-approved" but no dated TASTE_LOG entry exists to confirm an override.

### [VIOLATION , medium] Three tappable controls are well under the 44px touch floor (L Touch floor) [mockup-first]
- **Where:** `app/[locale]/walk-in-pay/page.tsx:505`
- **Now:** The service-description info toggle is `className="grid h-5 w-5 shrink-0 place-items-center rounded-full ..."` (20x20px, line 505). The two review-count buttons that open salon/barber pages are bare inline `<button>`s with no size or padding classes (`(booking.salon_review_count)` at line 438, `(booking.barber_review_count)` at line 484), so their hit area is just the text glyph box, well under 30px.
- **Lever:** Give the info toggle `min-h-11 min-w-11` (44px) while keeping the 14px icon centered inside it, and wrap the two review-count buttons in a padded hit area (e.g. `p-2.5 -m-2.5`) so the visual text size is unchanged but the tap target reaches 44px.

### [VIOLATION , medium] Full-page loads use pulsing dots / bare spinner instead of the locked layout-matching Skeleton (H Waiting and response feedback) [mockup-first]
- **Where:** `app/[locale]/walk-in-pay/page.tsx:366`
- **Now:** Initial load (before the booking/salon data arrives) renders three animated dots (lines 366-371), the same dots repeat during the paid-to-tracker redirect (lines 382-386), and the queue tracker's initial load renders a bare centered `<Spinner size="md" />` (queue/[token]/page.tsx:159-165). None of these full-module loads use the project's own `<Skeleton>`/`<SkeletonCard>` primitives (components-legacy/ui/Skeleton.tsx, app/[locale]/_components/primitives/Skeleton.tsx), which the project CLAUDE.md design contract locks as the required pattern ("loading = <Skeleton> ... NOT a bare spinner").
- **Lever:** Swap the dot clusters and the bare Spinner for a `<Skeleton>` shaped like the booking-summary card (walk-in-pay) and the hero+card layout (queue tracker), matching the locked states row.

### [VIOLATION , medium] Generic error states are dead ends; only the pay-blocked state has a real recovery action (K Empty/zero states) [mockup-first]
- **Where:** `app/[locale]/walk-in-pay/page.tsx:387`
- **Now:** When the token is invalid or salon/service lookup fails, the `error` branch (lines 387-394) renders only an AlertTriangle icon and the message text, no action button (just the persistent top-nav back arrow, which returns to browser history, not a computed alternative). By contrast the `payBlocked` state a few lines down (598-620) does the job right: it renders a "Choose another salon" primary CTA plus a "View salon" link.
- **Lever:** Reuse the same CTA block already built for `payBlocked` (lines 598-620) inside the generic `error` branch, e.g. a "Choose another salon" button routing to `/search`, instead of leaving the user with only a back arrow.

### [VIOLATION , medium] Peak-end completion screen stacks a monetary tip ask on the success moment and offers no rebook CTA (G Peak-end) [mockup-first]
- **Where:** `app/[locale]/queue/[token]/page.tsx:239`
- **Now:** The instant a rating of 3+ is tapped, `<TipFlow>` (a full amount-picker + Stripe card form) mounts directly under the stars (lines 239-256), turning the warm "All done!" close into a payment ask in the same breath. Every exit path (`exitHome`, line 202; TipFlow `onClose`, line 251; the cancelled/no-show branches, lines 290-303) routes straight to the homepage; there is no one-tap "book again with [barber]" anywhere in the file.
- **Lever:** Let the success state (checkmark + barber name) breathe on its own for a beat before offering the tip ask (or make tipping a secondary tap, not the automatic next screen), and add a one-tap "Termin bei [barber] wiederholen" CTA to the exit actions so the peak-end moment also seeds the next visit.

### [OPPORTUNITY , low] Free-cancellation reassurance copy is written but never rendered near the pay CTA (F Loss aversion and scarcity ethics) [mockup-first]
- **Where:** `app/[locale]/walk-in-pay/page.tsx:308`
- **Now:** The labels object defines `cancelPolicy: "Kostenlose Stornierung bis zum Aufruf"` / `cancelBtn` (line 308, mirrored in en/fr/it at 309-311) and a full working `handleCancel()` function (lines 226-263), but neither is ever rendered in the JSX of this file, confirmed by grep. A customer sees a bare "CHF 45 bezahlen" button with no stated cancellation policy before committing their card.
- **Lever:** Render the existing `cancelPolicy` string as a small reassurance line under the pay CTA (same slot pattern as the `secure`/Stripe line at lines 588-591), a low-cost risk-reversal lever that's already copy-complete and unused.

### [GOOD , low] Live queue counts and wait estimate are genuinely server-computed, never fabricated (F Loss aversion and scarcity ethics)
- **Where:** `lib/barber/walkin-ticket.ts:45`
- **Now:** `liveCounts()` (lines 45-63) counts real `waiting`/`in_chair` rows ahead of the customer's position and derives the ETA from `recentAvgServiceMinutes()`, an EWMA of the salon's actual measured start-to-completion durations (lines 20-43), never a fixed or client-simulated number. `/api/walkin/queue/status` (route.ts:38-56) recomputes the same real counts on every poll so the ETA visibly drops as the line moves.

### [GOOD , low] Live tracker leads with a large real photo hero, no blur placeholder (M Photos first)
- **Where:** `app/[locale]/queue/[token]/page.tsx:333`
- **Now:** The queue-tracker page opens with a 280px-tall swipeable salon photo gallery (lines 333-381), the single largest element on the screen, falling back to a plain neutral fill (not a lingering blur-up placeholder) when no photos exist (line 347).


## Notifications + reminders + rebooking loops

### [VIOLATION , high] The "SMS" notification toggle in Settings does nothing at all (N. Retention loops)
- **Where:** `app/[locale]/profile/settings/SettingsForm.tsx:210-212`
- **Now:** SettingsForm renders a Switch bound to profiles.notification_sms, captioned via messages/de.json:3618 ("Last-Minute und Sonderangebote"). A full repo grep for `notification_sms` (outside this form and its save round-trip) returns zero read sites: it is never checked anywhere. The one real SMS sender, app/api/cron/sms-reminders/route.ts, gates purely on the per-SALON columns `sms_reminder_24h` / `sms_reminder_1h` (lines confirmed by reading the whole file) and never looks at the user's own preference. Its own code comment (cron-jobs.yml:55-56) even documents that SMS reminders "honor the per-salon toggles" only.
- **Lever:** Either read profiles.notification_sms as an additional AND-gate inside sms-reminders/route.ts before sending, or remove/relabel the switch so it stops promising a control users can't actually exercise.

### [VIOLATION , high] The real category-split preference table is silently dead (0 rows, no insert path, no UI) (N. Retention loops)
- **Where:** `app/api/cron/rebooking-nudge/route.ts:60-65`
- **Now:** Migrations 036/054 model exactly the law this checklist asks for (rebooking_enabled/messages_enabled default true, deals_enabled/new_salons_enabled default false), and 4 crons read it (rebooking-nudge:60-65, welcome-series/route.ts:41-45, nail-infill-reminders/route.ts:59-63, off-peak/route.ts:48-55). But `npm run exists notification_preferences` shows the live table has 0 rows, and no code anywhere INSERTs a row for a user. Consequence: rebooking-nudge and welcome-series use the pattern `if (prefs && prefs.field === false) continue`, which can never fire when prefs is always null, so those sends are effectively unconditional; off-peak uses `.eq('deals_enabled', true)`, which can never match an empty table, so it never sends to anyone. There is also no Settings UI anywhere referencing rebooking_enabled/deals_enabled/new_salons_enabled, so a user cannot see or change any of this even if they wanted to.
- **Lever:** Upsert a default row into notification_preferences on signup (or lazily on first cron read), and add the missing Settings section that surfaces rebooking_enabled/deals_enabled/new_salons_enabled as real per-category toggles.

### [VIOLATION , medium] Rebooking-nudge email has no one-tap book-again link (G. Peak-end)
- **Where:** `lib/email.ts:420-423`
- **Now:** rebookingNudge() (lib/email.ts:408-426) already knows the exact salon and service (vars.salon, vars.service) but every locale's CTA links to the bare homepage `https://solen.ch`, not a deep link back to that salon/service. The user has to re-search and re-pick everything from scratch.
- **Lever:** Build the link as `${baseUrl}/${locale}/salon/${salonSlug}/book?service=${serviceId}` (values already available to the caller in rebooking-nudge/route.ts) instead of the bare domain.

### [VIOLATION , medium] Generic rebooking nudge uses one flat 28-day cutoff for every service category (N. Retention loops)
- **Where:** `app/api/cron/rebooking-nudge/route.ts:19-21`
- **Now:** cutoff.setDate(cutoff.getDate() - 28) is applied to every completed booking regardless of service. The same codebase already proves the cycle-aware alternative works: nail-infill-reminders/route.ts:27-45 reads a per-service `reminder_cycle_days` column, and barber-smart-reminders/route.ts:47-51 derives a personalized cycle from actual visit history via calculateVisitCycle(). Every other category (color, spa, brows, waxing, massage, etc.) instead falls back to the flat 28-day rule, nudging an 8-10 week color client a month early and a 2-week brow client two weeks late.
- **Lever:** Join `services.reminder_cycle_days` (already modeled) into the rebooking-nudge query and use it as the per-booking cutoff instead of the hardcoded 28.

### [VIOLATION , medium] Barber SMS nudge skips the opt-out check its sibling crons both honor (N. Retention loops)
- **Where:** `app/api/cron/barber-smart-reminders/route.ts:108-118`
- **Now:** barber-smart-reminders sends an unsolicited SMS with no notification_preferences check at all, while rebooking-nudge/route.ts:60-65 and nail-infill-reminders/route.ts:59-63 both check `rebooking_enabled` before contacting the user for the equivalent cycle nudge. (Given the empty-table finding above this check is currently a no-op everywhere, but the code's own intent is inconsistent between the three cycle-nudge crons.)
- **Lever:** Add the same notification_preferences.rebooking_enabled lookup used in rebooking-nudge/nail-infill-reminders before calling sendSMS here.

### [VIOLATION , medium] Full inbox load uses a bare spinner instead of a layout-matching skeleton (H. Waiting and response feedback) [mockup-first]
- **Where:** `app/[locale]/notifications/NotificationsClient.tsx:178-179`
- **Now:** `loading ? <div className="flex justify-center py-16"><Spinner /></div>` renders a centered generic spinner for the entire initial notification-list fetch. This is a full-module load, not a small inline fetch, so per checklist H (and the project's own locked design contract: "loading = <Skeleton> ... NOT a bare spinner") it should use a layout-matching skeleton.
- **Lever:** Replace the centered Spinner with a <Skeleton> shaped like 3-4 notification rows (44px icon disc + two text lines), matching the pattern used elsewhere in the app.

### [VIOLATION , medium] Empty notifications state has no tappable recovery action (K. Empty/zero states) [mockup-first]
- **Where:** `app/[locale]/notifications/NotificationsClient.tsx:180-187`
- **Now:** The zero-notifications state (icon + emptyTitle + emptyBody, copy at messages/de.json:6055-6056 "Keine Benachrichtigungen" / "Updates zu deinen Buchungen, Erstattungen und Bewertungen erscheinen hier.") is icon-plus-passive-text only. Checklist K requires one computed, tappable recovery action, not passive copy alone.
- **Lever:** Add one CTA in the empty state, e.g. a link to /inspo or /explore ("Salon entdecken"), the same pattern other empty states in this codebase already use for their recovery action.

### [VIOLATION , low] "Alle gelesen" mark-all button is under the 44px touch floor (L. Touch floor) [mockup-first]
- **Where:** `app/[locale]/notifications/NotificationsClient.tsx:169-173`
- **Now:** The mark-all-read button is `className="text-[14px] font-semibold text-s-accent transition-opacity active:opacity-60"` with no padding or min-height set, so its own hit box is sized to the 14px text line (well under 44px), unlike the notification Row itself which gets a generous tap target from its px-4 py-3.5 wrapper.
- **Lever:** Add `min-h-11 flex items-center px-1` (or similar) to the button so its actual hit area reaches 44px, matching the icon-button spec (h-11 w-11) used elsewhere in the design system.

### [GOOD , low] Review prompt is correctly delayed to 24h post-visit, not same-day (E. Social proof and trust)
- **Where:** `app/api/cron/review-prompt/route.ts:36-38`
- **Now:** The hourly cron windows on `now - 25h` to `now - 23h` against completed bookings, landing the review ask squarely at ~24h post-visit rather than nagging the customer the moment they walk out, matching the evidence-backed 1-3 day delay window.

### [GOOD , low] Nail and barbershop reminders are genuinely cycle-aware, per service and per customer (N. Retention loops)
- **Where:** `app/api/cron/nail-infill-reminders/route.ts:27-45`
- **Now:** nail-infill-reminders reads a per-service `reminder_cycle_days` column to time the nudge, and barber-smart-reminders (route.ts:47-51) goes further, deriving a personalized cycle from each customer's own visit history via a confidence-scored calculateVisitCycle() algorithm before reminding. This is exactly the "push rebooking at the service's typical cycle" law done right, it just isn't extended to the generic rebooking-nudge fallback that covers every other category (see the flat-28-day finding above).


## Dropped by the verifier (not-real / intentional Solen law)

- [not-real] Search + map + category pages: Default sort orders by solen_score before average_rating, but the count x score weighting formula is not visible on this surface , app/api/salons/route.ts:443 matches verbatim. But the central claim ('the actual nightly computation script... was not found in this repo/worktree') is false: it exists at app/api/admin/solen-score/recalculate/route.ts, is wired to a daily 03:00 UTC cron in .github/workflows/cron-jobs.yml (path /api/admin/solen-score/recalculate), and already computes a `reviewScore` term (`Math.round(Math.min((salon.review_count || 0) / 20, 1) * 15)`) alongside `ratingScore`, i.e. it already factors review_count, addressing exactly what the finding's lever asks to 'confirm or point to'. The premise that this cannot be verified from this repo is incorrect.
- [duplicate-of-law] Booking flow steps (services/staff/time): No step-progress UI anywhere in the wizard (by design per code comments, but worth flagging against the checklist) , BookingWizard.tsx:39-43 comment matches verbatim: 'NO progress UI anywhere ... the back arrow is the navigation, the big title names the task' with mockup 20 owner-approval dated 2026-06-11. The finding itself already labels this 'not a code defect' and 'do not re-open without the owner naming it', i.e. it is knowingly restating a dated, locked, owner-approved decision rather than surfacing anything actionable; correctly self-hedged but should be scored as restating existing law, not a fresh finding.
- [not-real] Pay step + checkout: No verified-booking marker anywhere in the pay/checkout surface's review or trust signals , Description of current behavior (aggregate-only rating, no verified marker) at lines 337-345 is accurate, but the finding itself concludes 'Not a defect in this surface specifically... No action needed on this surface' - it is a self-negating observation, not an actionable violation, so it should not be tracked as a punch item.
