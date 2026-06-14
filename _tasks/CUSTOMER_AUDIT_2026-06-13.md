# Customer-facing audit (2026-06-13)

Scope: all customer surfaces EXCEPT discovery + dashboard. 15-agent parallel sweep
(curl + code read) against the locked design system. 139 raw findings, ~55 unique.

Counts: **18 broken / 11 half-finished / 26 DS-mismatch · 17 high-severity.**

## Systemic themes
1. **i18n collapse (own epic, multi-day).** ~12 surfaces render hardcoded German on en/fr/it: salon PDP (17 components), auth (login + SignIn + reset-password, 35+ strings), gift-card purchase, vouchers, referral, gift-cards, intake-forms, stamps, favorites, homepage Hero, checkout/login. ~15 files x 4 catalogs.
2. **Locale-prefix-dropping links.** Homepage (MobileCategoriesRow hardcodes /de/, Reviews, Entdecken) + booking-lookup build hrefs without ${locale}, 307-ing non-DE users to German or dead routes.
3. **Blue (s-accent) on primary/commit CTAs** (banned, primary = ink): refund Send-request, refund Escalate x2, queue Directions, queue Send-feedback + nav links (Manage-booking, some see-all).
4. **Silent error handling.** .catch(()=>{}) / console-only-no-UI on ~5 flows (PayConfirmStep PATCH, SalonVenuesNearby, share/clipboard x6, gift-cards fetch, referral fetch, angebote fetch).
5. **Raw box-shadow instead of shadow-elevation-* tokens** (pervasive) + grey-haze drift (white card+shadow on white).
6. **Banned typography artifacts.** Middots (profile/page, BookingCard, EmptyStateDiscovery); en-dashes (SalonSidebar hours, BookingConfirmation time range, terms/privacy/impressum titles); uppercase tracked eyebrows; raw font-mono vs font-mono-code on codes.
7. **Dead/half-finished controls shown as live.** Reschedule (toast only), View-receipt (routeless), Looks page (no table), escalation reason dropped from POST, disabled-forever Contact-support, BusinessTeaser placeholder, dead service-slot block.
8. **Fabricated/hardcoded values.** Nearby "14 Salons", lookup always-"Completed" + always-"14 days left", unconditional 8.1% VAT line.

## HIGH (broken first, then glaring DS breaks)
- [broken] **/checkout/success has NO page.tsx** - 3DS card payers land on a blank home shell, onSuccess is a dead no-op (route-sweep). Build the success page or repoint.
- [broken] **checkout Stripe page**: hardcoded banned coral #C05038 + banned DM Sans font + blue (s-accent) for error states / decorative icons / price amounts. Reskin to tokens.
- [broken/i18n] **Salon PDP (17 salon/* components)** entirely hardcoded German on en/fr/it. Wire useTranslations('salonDetail') per _shared.ts:258 TODO. Highest-traffic page.
- [broken/i18n] **Auth** login/page.tsx + SignIn.tsx (20+) + reset-password (15+) hardcoded German; Apple button hardcoded while Google uses t().
- [broken] **booking/lookup/page.tsx:631** "View receipt" -> /bookings/[id] (no page.tsx) serves home shell at 200. Build receipt page or repoint to /profile/bookings.
- [broken] **salon/[slug]/gift-card/page.tsx:88-115** logged-out purchase 401s with raw English "Unauthorized" in German UI, no login path. Session-check + redirect.
- [broken] **confirmation/page.tsx:116** guest accessLink hardcoded https://www.solen.ch regardless of env. Use NEXT_PUBLIC_SITE_URL.
- [broken] **MobileCategoriesRow.tsx:45-46,81** category hrefs hardcode /de/. useLocale().
- [broken] **profile/bookings BookingsList.tsx:84-86** "Verschieben" (Reschedule) fires only toast, no flow. Remove or link to PDP booking.
- [broken] **profile/gift-cards/page.tsx:39-41** load catch console-only, no error UI; failure looks like empty account.
- [broken/i18n] **profile/vouchers + referral** zero useTranslations; referral shows login prompt on 500.
- [ds] **refund ReportRefundEntry.tsx:85,541 + RefundCaseView.tsx:73,796,858** primary commit CTAs (Send request, Escalate x2) use bg-s-accent. -> bg-s-ink.
- [broken] **RefundCaseView.tsx:917-926** admin_rejected terminal state's only affordance is a disabled-forever Contact-support button. Wire mailto/help.
- [half] **RefundCaseView.tsx:104,139,749-760** escalation reason chip set but POST sends only { note }. Include escReason.
- [ds] **queue/[token]/page.tsx:534 + :277** Directions + Send-feedback are full-width blue CTAs. -> bg-s-ink.
- [half] **queue/[token]/page.tsx:140** handleCancel uses native window.confirm() for an irreversible refund. Inline confirm/ConfirmSheet.
- [half] **profile/looks/page.tsx:31** permanent empty stub (no DB table) listed as live. Remove hub row or coming-soon variant.
- [broken/no-fake] **Nearby.tsx:182** hardcoded "14 Salons in der Nähe" with no API. Drop count.
- [broken] **Reviews.tsx:125,237 + Entdecken.tsx** outbound hrefs omit ${locale}. Prefix with useLocale().
- [broken] **profile/vouchers** both CTAs link to middleware-blocked /vouchers -> coming-soon (route-sweep).

## MEDIUM
(full list - see workflow run wf_3e4c88e0-275 / this file's git history)
- PayConfirmStep.tsx:212 empty .catch; BookingPaymentForm.tsx:196-203 hardcoded ternary vs PAY_COPY; PayConfirmStep.tsx:395-396 unconditional 8.1% VAT (gate on salon.vat_rate); 6 empty share/clipboard catches; gift-cards/stamps/favorites/intake-forms hardcoded copy; SalonSidebar.tsx:93 hasGiftCards hardcoded true; SearchOverlay blue + dead slot block; walk-in-pay:567 tokenless spinner gap; HideInBooking missing /walk-in-tip/[token]; middots (profile:136, BookingCard:118, EmptyStateDiscovery:134); en-dashes (SalonSidebar:174, BookingConfirmation:101); BookingConfirmation:302-307 blue Manage-booking; PayConfirmStep:577 rounded-full + CTA shadow + referral grey-haze; queue/TipSheet locale ternaries + hardcoded "Schliessen"; LastMinuteCard:78,84 blue time/countdown; gift-card chips:195-199 missing CHF; vouchers:243 + gift-cards:102 raw font-mono; booking-lookup OpenedView:579-613 always-Completed + 14-days + pip; ~30 orphaned successPage i18n keys; StampCard:109 + HeroStampCard amber reward + blue check; WaitlistModal/CancelBookingSheet pale-green disc + uppercase eyebrows; walk-in-pay:510 banned "ca." duration.

## LOW
- Raw box-shadow -> shadow-elevation-* (homepage, search map, walk-in/queue, auth TosPrompt); grey-haze back buttons; animate-pulse vs animate-shimmer; SalonTeam see-all missing chevron; SalonReviews "Mehr lesen" ink-on-ink (allowed-blue case); SalonBuy invisible white-on-white icon box; SearchOverlay clear-recent + FavoritesList post-remove blue; SalonCard invalid text-[s-ink/60] class + warm-cream blur fill; reset-password amber eyebrow + TosPrompt blue icon; LastMinuteCard animate-coral-pulse name + teal rgba; walk-in-tip expired CTA neutral (should be ink); bookings bg-[--base] legacy var; SignIn unused Loader2; SalonServicesSheet stale breadcrumb JSDoc; BusinessTeaser placeholder; Hero:190 Geist comment; terms/privacy 21x text-s-ink opacity-90 vs text-s-ink-2; BackToTopButton hover:scale-110.

Source: workflow wf_3e4c88e0-275 (15 agents, 139 raw findings).
