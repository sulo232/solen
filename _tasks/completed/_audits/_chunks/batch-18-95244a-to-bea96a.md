# Batch 18 Audit — 95244a to bea96a

Date range: 2026-03-26 15:16 → 2026-03-26 17:42 (single day sprint)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 95244a | 2026-03-26 | docs: add incomplete i18n Phase 2 tracking | 1 | +30/-1 | docs-only | NO | NO | NO | Added i18n Phase 2 tracking to INCOMPLETE_FEATURES.md (5/10 dashboard components). Entry was later superseded — i18n tracking was archived/removed from INCOMPLETE_FEATURES at HEAD once migration completed. |
| 2 | 76de0a | 2026-03-26 | phase5: dark mode polish + loading skeletons | 5 | +77/-21 | add | NO | YES | YES | Rewrote ProfilePage loading skeleton with dark mode tokens (s-dm-bg, s-dm-surface, dark: variants) and improved UX layout. Dark mode classes persist at HEAD (104 instances). Introduces dark mode patterns contradicting SOLEN_DESIGN.md which explicitly retires dark mode — these classes remain at HEAD. |
| 3 | 2ee9aa | 2026-03-26 | i18n(tier2): Phase 2 component 6 — DisputeNotification | 2 | +11/-8 | add | NO | YES | NO | Migrated DisputeNotification.tsx to dashboard.disputes namespace (7 keys). Also touched CLAUDE.md (+1 line). All 4 locales updated; migration persists at HEAD. |
| 4 | bc509f | 2026-03-26 | i18n(tier2): Phase 2 complete — components 6-10 migrated | 10 | +324/-76 | add | NO | YES | YES | Bulk migration completing Phase 2 — DisputeNotification, GiftCardManager, OffPeakManager, DiscoveryAdmin, ServiceCart. All message namespaces (dashboard.*, discovery.admin, booking.cart) still present at HEAD. Large diff >200 lines, 63+ translation keys per locale. |
| 5 | 0a06e0 | 2026-03-26 | i18n(tier3): batch 3A — components/ui/ (10 components) | 14 | +275/-47 | add | NO | YES | YES | Migrated 10 ui/ components to useTranslations — ui.error, ui.preview, ui.priceOffer, ui.search, ui.priceSlider, ui.button, ui.deviceFrame, ui.viewToggle, ui.progress, ui.modal. Translation keys persist at HEAD. Large diff >200 lines. |
| 6 | e588b5 | 2026-03-26 | i18n(tier3): batch 3C partial — admin, auth, barber components (5) | 9 | +262/-54 | add | NO | YES | YES | Migrated admin.disputes (19 keys), auth.tos (6), barber.sections (8), barber.cut_* (3). Note ExpressRebook.tsx labeled "partial" — only +2 lines, likely incomplete. All keys survive at HEAD. Large diff >200 lines. |
| 7 | 45a6df | 2026-03-26 | i18n(batch1): migrate 5 barber components to useTranslations | 5 | +62/-40 | add | NO | YES | NO | Migrated LoyaltyCard, LoyaltyCardList, RemoteQueueJoin, WaitTimeDisplay, WalkinQueue to barber.* namespaces with proper aria-labels. Changes persist at HEAD. |
| 8 | 73e778 | 2026-03-26 | docs: add i18n migration status tracker | 1 | +79/-0 | docs-only | YES | NO | NO | Created _tasks/i18n-migration-status.md tracking 76/210 components (36%) complete. File was later deleted (not present at HEAD) — overwritten by ff70b2d (Airbnb redesign commit). Lost artifact, but tracking was transitional. |
| 9 | 5117e8 | 2026-03-26 | feat: remove phone verification from salon registration | 2 | +7/-174 | cleanup | YES | YES | YES | Removed entire Step 2 phone OTP verification flow (150+ lines) from salon onboarding, reducing to 2-step flow. Removed verify-phone API calls. Phone step permanently gone at HEAD — confirmed lost. Pivot in UX: email-only registration. |
| 10 | bea96a | 2026-03-26 | i18n(tier3): migrate 5 critical user-facing components | 9 | +599/-30 | add | NO | YES | YES | Migrated LastMinuteCard, GuestBookingForm, StaffPicker, NearbySalons, RecentlyViewed. Also pre-populated translation keys for 13 additional components (salonCard, bookingSuccess, chat, aiSuggestion, etc.). Very large diff (599 additions). All namespaces survive at HEAD. |

---

## Summary

**Date range:** 2026-03-26 15:16 – 17:42 (2.5-hour sprint)

**Defining theme:** Aggressive i18n migration sprint (8/10 commits) replacing hardcoded German strings with `useTranslations()` across dashboard, UI, barber, admin, auth, and consumer-facing components. Interleaved with one functional UX pivot (phone verification removal) and one dark mode UI polish commit.

### Components introduced / rewritten / deleted
- **Rewritten (i18n migration):** DisputeNotification, GiftCardManager, OffPeakManager, DiscoveryAdmin, ServiceCart, ErrorFallback, QuickPreviewSheet, PriceOfferModal, SearchAutocomplete, PriceSlider, AnimatedButton, DeviceFrame, MobileViewToggle, ProgressDots, GlassModal, BookingDisputePanel, TosPrompt, BarbershopSections, CutHistoryTimeline, LoyaltyCard, LoyaltyCardList, RemoteQueueJoin, WaitTimeDisplay, WalkinQueue, LastMinuteCard, GuestBookingForm, StaffPicker, NearbySalons, RecentlyViewed (~30 components)
- **Loading skeleton rewritten:** ProfilePage.tsx (commit 2)
- **Deleted (phone verification):** Step2 OTP component in `app/[locale]/onboarding/salon/page.tsx` (~150 lines)

### Design tokens added / removed
- No new design tokens added in this batch
- ProfilePage (commit 2) uses `bg-[--base]`, `bg-[--raised]` CSS variable references alongside legacy `dark:bg-s-dm-*` tokens — mixed token usage pattern
- Dark mode (`dark:` classes) used extensively in ProfilePage — **this contradicts SOLEN_DESIGN.md which retires dark mode**

### Patterns adopted / rejected
- **Adopted:** `useTranslations()` hook with namespace-scoped keys replacing hardcoded strings; 4-locale updates bundled with each migration batch
- **Adopted:** CSS variable refs `bg-[--base]` / `bg-[--raised]` for theming (commit 2)
- **Rejected (removed):** Phone OTP verification step in B2B onboarding registration flow
- **Concern:** `dark:` classes still present (104 in ProfilePage at HEAD) — this is a retired pattern per CLAUDE.md

### Docs created / lost
- `_tasks/i18n-migration-status.md` created (commit 8) then **deleted** at HEAD (overwritten by ff70b2d homepage redesign commit) — lost tracking artifact
- `_tasks/INCOMPLETE_FEATURES.md` updated with i18n Phase 2 tracking (commit 1) — entry likely resolved and cleaned by later commits

### Translation namespaces added (all 4 locales)
`dashboard.disputes`, `dashboard.giftCards`, `dashboard.offPeak`, `discovery.admin`, `booking.cart`, `ui.error`, `ui.preview`, `ui.priceOffer`, `ui.search`, `ui.priceSlider`, `ui.button`, `ui.deviceFrame`, `ui.viewToggle`, `ui.progress`, `ui.modal`, `admin.disputes`, `auth.tos`, `barber.sections`, `barber.cut_*`, `barber.loyalty`, `lastMinuteCard`, `guestBookingForm`, `staffPicker`, `nearbySalons`, `recentlyViewed`, `salonCard`, `chat`, `aiSuggestion`, `bookingBubble`, `clientTags`, `packageRedeemBanner`, `categoryHero`, `bookingSuccess`

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 76de0a | `phase5: dark mode polish` — introduces dark mode tokens (dark:bg-s-dm-*) into ProfilePage contradicting the retired dark mode rule in SOLEN_DESIGN.md; also uses `bg-[--base]`/`bg-[--raised]` CSS variable refs that should be audited against design token spec |
| bc509f | Large i18n batch (324 lines, 10 files) — verify translations are accurate and namespaces don't collide |
| 0a06e0 | Large i18n batch (275 lines, 14 files) — 10 UI components migrated simultaneously |
| e588b5 | Partial migration flagged — ExpressRebook.tsx only got +2 lines; may have incomplete migration |
| 5117e8 | Phone verification entirely removed — confirm `/api/auth/verify-phone/send` and `/api/auth/verify-phone/check` endpoints are either removed or unused; UX pivot from 3-step to 2-step B2B registration |
| bea96a | Largest single diff (+599 lines) — pre-populated translation keys for 13 components not yet migrated; risk of key drift if components migrated differently later |
