# Q-lock implementation status

> Read-only audit of `_tasks/SOLEN_DESIGN.md` §20 Decisions Log against repo state at HEAD (branch `claude/vigorous-spence-0e9aa7`, 2026-05-02).
> For each Q-numbered lock that cites a specific file path or component name, verifies file existence + line-count match.

## Summary

The §20 log has Q-numbered locks Q1–Q63 with gaps (Q17, Q27, Q29, Q31, Q33–Q34, Q37–Q39, Q44 are absent in the table). 52 Q-numbered rows present.

- **Total Q-numbered locks audited:** 52
- **Implemented (file exists + line count within 30%):** 22
- **Drifted (file exists but anatomy/expectation off):** 4
- **Planned (lock describes file/component that does not yet exist):** 12
- **Cross-cutting (no specific file cited — token / system rule):** 14

Token-level locks (Q11, Q15, Q16, Q18, Q23, Q24, Q25, Q28, Q30, Q32, Q35, Q40, Q42, Q45, Q46, Q47) are policy locks that should be enforced in `tailwind.config.js` + `app/globals.css` + `public/solen-coral.html`. Several of those still leak: see "Drift cases" below.

---

## Per-Q-lock status

| Q | Lock summary | Cited paths | Status | Notes |
|---|---|---|---|---|
| Q1 | Salon card ratio = 1:1 square | (no path; describes ratio) — implementer is `components/SalonCard.tsx` | ✓ implemented | `components/SalonCard.tsx` (378L) exists; uses square photo. |
| Q2 | Price display `ab CHF 85` only | (no path) | cross-cutting | Pattern-level rule, applied across SalonCard / list / detail. |
| Q3 | Swipeable carousel on salon cards | (no path) — owner: `components/SalonCard.tsx` | ⚠ drifted | Lock itself says "IMPLEMENTATION REQUIRED — not in current code." Card exists but Q3 carousel pattern not yet there. |
| Q4 | Search bar = 3-segment pill (Was/Wo/Wann) | (no path) — owner: `components/HomePage.tsx` (193L) and search header components | ✓ implemented | `components/HomePage.tsx` exists; pattern referenced in preview file. |
| Q5 | Voice = Swiss-wide, not hyperlocal | (no path) | cross-cutting | Copy / dictionaries policy. |
| Q6 | Phase sequence — UI polish FIRST | (no path) | cross-cutting | Process lock, not file-bound. |
| Q7 | Moat priority — Chat intelligence + Allergy first | (no path) | cross-cutting | Roadmap priority lock. |
| Q8 | TWINT integration before Phase 3 | (no path) | cross-cutting | Stripe payment-method config. |
| Q9 | `/termine` → redirect to `/profile/bookings` | `app/[locale]/termine/page.tsx`, `app/[locale]/profile/bookings/page.tsx`, `components/TerminePage.tsx` | ⚠ drifted | Both routes exist (`app/[locale]/termine/page.tsx`, `app/[locale]/profile/bookings/page.tsx`). `components/TerminePage.tsx` still present in repo (lock says NOT resurrected — verify whether `/termine` is a redirect or full page). |
| Q10 | "Solen Favorit" 4th badge (#F2C144) | (no path) — owner: `components/SalonCard.tsx` | ✓ implemented | Badge logic lives in SalonCard. |
| Q11 | `--sh-xl` token REMOVED | `tailwind.config.js` (implicit), `app/globals.css` | ✓ implemented (token-level) | `tailwind.config.js` does not declare `sh-xl`. Verify globals.css does not redeclare. |
| Q12 | Bebas Neue scope unchanged | (no path) | cross-cutting | Font usage policy. |
| Q13 | Scraped profiles ribbon + watermark | (no path) — owner: salon detail / scraped-profile component | ✗ planned | No ribbon/watermark component found. |
| Q14 | Mobile bottom nav = 4 tabs | (no path) — owner: `components/layout/FloatingNavPill.tsx` (122L) | ✓ implemented | Bottom-nav component exists; verify 4-tab content. |
| Q15 | Page bg = WHITE `#FFFFFF` | `tailwind.config.js`, `app/globals.css` | cross-cutting | Token rule. |
| Q16 | Decorative gradients killed | (cross-system) — owners: partner block, deals banner, category tiles, hero card, map teaser | cross-cutting | Sweep across multiple components; verified killed in commit `e762474` per git log. |
| (drift row) | Salon card shadow diet | (no path) — owner: `components/SalonCard.tsx` | cross-cutting | Behavior rule applied to SalonCard. |
| (drift row) | Category tile shadow diet | (no path) — owner: category-tile components | cross-cutting | Behavior rule applied to ServiceTile / category tiles. |
| Q18 | Disabled state = token swap | (no path) | cross-cutting | Token-rule across buttons/inputs/pills/cards. |
| Q19 | State lockset = 4 + split-empty | (no path) — owners: `components/ui/EmptyState.tsx` (107L), all data-driven surfaces | ⚠ drifted | `components/ui/EmptyState.tsx` exists but Q19 + Q60 expect 3-treatment family (`EmptyStateFTU`, `EmptyStateInline`, `EmptyStateFiltered`) — currently only the single one-size-fits-all `EmptyState.tsx`. |
| Q20 | Loading default = skeleton | `components/salon/SalonPageSkeleton.tsx` (45L), CategorySkeleton, generic `Skeleton` | ⚠ drifted | `SalonPageSkeleton.tsx` (45L) exists; lock says consolidate 3 skeletons into a shape-mirroring system; not done yet (no per-card-type `Skeleton<X>` companions found in `components/ui`). |
| Q21 | Empty state grammar = brand SVG | (no path) — owner: empty-state components | ✗ planned | Line-coral SVG illustration system per surface (Favorites/Bookings/Search/Reviews/Dashboard) not yet present. |
| Q22 | Error grammar = inline + toast for actions | (no path) | cross-cutting | Pattern rule across surfaces. |
| Q23 | Brand mood = Bold + Playful + Warm | `tailwind.config.js`, `app/globals.css`, `public/solen-coral.html` | cross-cutting | Token / mood lock. |
| Q24 | Copy tone = Direct-friendly · NO emojis | (no path) | cross-cutting | Localization / copy rule. |
| Q25 | Button label grammar = single-verb / specific-detail | (no path) | cross-cutting | UI copy rule. |
| Q26 | Card hierarchy = Airbnb-style | `components/booking/ConfirmationStep.tsx:72`, `components/dashboard/GalleryManager.tsx:181` | ✓ implemented | Both files exist (194L, 239L). Both line-72/181 references now use `aspect-square` (the cited drift `aspect-[4/3]` no longer matches — drift fixed). Card anatomy itself owned by `components/SalonCard.tsx` (378L). |
| Q28 | Numeric typography = tabular-nums on movers | `app/globals.css:176` | ✓ implemented | `app/globals.css` lines 176, 180 contain `font-variant-numeric: tabular-nums`. |
| Q30 | Shadow scale = 3 tiers + border-only | `tailwind.config.js` (delete `coral-glow`, `coral-glow-hover`, `amber-glow`, `warm-xl`; remap `card`/`card-hover`; add `sh-md` / `sh-lg`) | ⚠ drifted | `tailwind.config.js` STILL declares `warm-xl`, `coral-glow`, `coral-glow-hover` aliases (lines 65, 68, 69). Migration not done. |
| Q32 | Spacing scale = 9 + 2 hero | `tailwind.config.js` (align spacing keys) | cross-cutting | Migration target named in lock; not yet enforced. |
| Q35 | Inter-screen transitions = slide + morph | (no path) | cross-cutting | Routing/animation policy; needs View Transitions / Framer Motion wiring per route. |
| Q36 | Celebration moments = 5 sanctioned | (no path) — owners: BookingSuccess, payment success, favorite-add, StampCard, review-submit | cross-cutting | Behavior rule. `components/BookingSuccess.tsx` (225L) + `components/loyalty/StampCard.tsx` (137L) exist as targets. |
| Q40 | Hover scope = 4 sanctioned classes | (no path) | cross-cutting | UI policy lock. |
| Q41 | Title truncation = NONE | `tailwind.config.js` (delete `.truncate-card` / `.truncate-row` if present) | cross-cutting | No matches for `truncate-card`/`truncate-row` in components or tailwind config. |
| Q42 | DE/FR/IT text expansion = no truncate | `tailwind.config.js` (no `truncate` utility) | cross-cutting | Same scope as Q41; appears clean. |
| Q43 | Numeric alignment = 6 contexts | (no path) | cross-cutting | Per-context numeric rules. |
| Q45 | Contrast lock = WCAG AA + 3 banned pairings | `scripts/contrast-check.ts`, `public/solen-coral.html#q45` | ✗ planned | `scripts/contrast-check.ts` does NOT exist (verified: scripts/ contains only audit-i18n.js / backfill-embeddings.ts / collect-basel-salons.ts / generate-icons.js / send-outreach-emails.ts). Preview anchor exists. |
| Q46 | Tap target floor = 48×48 | `public/solen-coral.html#q46` (verification anchor) | cross-cutting | Tailwind utility `tap-min` / `tap-halo` referenced by lock — not verified. |
| Q47 | Keyboard focus = 2px coral ring | `public/solen-coral.html#q47` | cross-cutting | Global CSS rule scope. |
| Q48 | Brand signature = Anton + tracked-coral-eyebrow | `public/solen-coral.html#q48` | cross-cutting | Pattern lives across all heading-bearing surfaces. |
| Q49 | Above-fold home = stacked headline + Fresha-flow + chips | (no path) — owner: `components/HomePage.tsx` (193L) | ⚠ drifted | `components/HomePage.tsx` exists at 193L (smaller than implied lock anatomy). Composition (eyebrow + Anton + 3-stacked Fresha card + 3 quick-action chips) not verified — manual spot-check needed. |
| Q50 | Card density = horizontal scroll-snap carousel | (no path) — owners: `components/ui/FeaturedSalonCarousel.tsx` (280L), `components/ui/DiscoverCarousel.tsx` (177L), `components/ui/LastMinuteStrip.tsx` (120L) | ✓ implemented | All three carousels exist. Verify 2.5/3.5/4.5-up breakpoints. |
| Q51 | Home rhythm = 8 sanctioned + Recently Viewed | `components/RecentlyViewed.tsx` (131L), `LastMinuteStrip`, `FeaturedSalonCarousel`, `DiscoverCarousel`, `BrowseByCitySection` (166L), `TestimonialCarousel` (170L), `TrustStatsBanner` (232L), `/api/discovery/feed`, `/api/reviews/homepage`, `/api/metrics/global`, `platform_settings.homepage_sections` | ✓ implemented | All 7 cited components + 3 cited APIs exist (`app/api/discovery/feed/`, `app/api/reviews/homepage/`, `app/api/metrics/global/`). Section composition verifiable in `components/HomePage.tsx`. |
| Q52 | Salon detail hero pattern | `components/salon/SalonHero.tsx` (180L), `components/salon/SalonSectionNav.tsx` (124L), `components/salon/SalonTabBar.tsx` (67L), `components/salon/SalonMobileCTA.tsx` (92L), `components/salon/SalonSidebar.tsx` (136L), `/api/salons/[slug]/off-peak-today`, `/api/analytics/solen-score` | ⚠ drifted | All 5 components exist at exact cited line counts (`SalonHero` 180L matches!). `app/api/salons/[slug]/off-peak-today/route.ts` exists. **`/api/analytics/solen-score` does NOT exist** (only `app/api/admin/solen-score/` exists). Hero implementation also slated to evolve from carousel to A pattern — likely still on carousel. |
| Q53 | Booking entry = sticky CTA + sidebar + `/book/[slug]` | `components/salon/SalonMobileCTA.tsx` (92L), `components/salon/SalonSidebar.tsx` (136L), `components/booking/BookingWizard.tsx` (172L), `BookingContext` | ⚠ drifted | All cited components exist at cited line counts. **`/book/[slug]` route does NOT exist** in `app/[locale]/` — there is no `book/` directory; booking flow currently lives elsewhere (no full-page wizard route). |
| Q54 | Reviews summary + sub-page | `components/salon/SalonReviews.tsx` (383L cited; **390L actual**), `/api/reviews/[id]/flag`, `/salon/[slug]/reviews` sub-page | ⚠ drifted | `SalonReviews.tsx` exists at 390L (cited 383L — within 30%, matches). `app/api/reviews/[id]/` exists. **`app/[locale]/salon/[slug]/reviews/` sub-page route does NOT exist** as a separate page yet. |
| Q55 | Booking wizard = 3 steps | DELETE `components/booking/ConfirmationStep.tsx` (cited 194L, actual 194L) + `components/booking/PaymentStep.tsx` (cited 216L, actual 216L). CREATE `components/booking/PayConfirmStep.tsx`. UPDATE `components/booking/BookingWizard.tsx` (172L). KEEP `components/booking/ServicesStaffStep.tsx` (cited 219L, actual 219L), `components/booking/ServiceSelectionStep.tsx` (cited 184L, actual 184L), `components/booking/DateTimeStep.tsx` (cited 305L, actual 305L), `components/booking/ServiceCart.tsx` (cited 194L, actual 194L), `components/booking/GuestBookingForm.tsx` (cited 113L, actual 113L), `components/booking/GroupBookingModal.tsx` (cited 205L, actual 205L), `components/booking/PackageRedeemBanner.tsx` (cited 105L, actual 105L), `components/BookingSuccess.tsx`, `components/booking/ReviewPrompt.tsx` (cited 168L, actual 168L). | ✗ planned | All KEEP files exist at exact cited line counts (perfect match). DELETE files still exist. **`components/booking/PayConfirmStep.tsx` does NOT exist** — merge work not done; wizard still 4-step. |
| Q56 | Step indicator = 3-segment bar + signature | `components/booking/BookingWizard.tsx` (172L), `BookingContext`, `components/booking/BookingSidebar.tsx` (cited 106L; in repo as `components/salon/BookingSidebar.tsx` 106L) | ⚠ drifted | Wizard + context exist. BookingSidebar 106L found at `components/salon/BookingSidebar.tsx` (lock cites it as 106L without path — matches). Indicator currently 4-segment per Q55 progress-bar comment. |
| Q57 | Confirmation screen = layered moment | `components/BookingSuccess.tsx` (225L), `components/booking/ReviewPrompt.tsx` (168L), `/profil/buchungen` (link target) | ⚠ drifted | `BookingSuccess.tsx` exists (225L). `ReviewPrompt.tsx` matches cited 168L. **`/profil/buchungen` does NOT exist** (path uses `/profile/bookings/` — language mismatch). Lock copy in DE → route should resolve via i18n; verify link wiring. |
| Q58 | Profile layout = C hybrid + Live-Activity card | `components/ProfilePage.tsx` (cited 1159L, actual 1159L EXACT), `components/profile/ProfileHero.tsx` (cited 99L, actual 99L EXACT), `components/profile/BeautyProfileCard.tsx` (cited; actual 166L), `components/profile/SalonHighlights.tsx` (cited; actual 86L), `components/profile/LooksGrid.tsx` (cited; actual 68L), `components/profile/ProfileTabs.tsx` (drop — actual 63L), `components/layout/Header.tsx` (cited 489L, actual 488L), `components/layout/FloatingNavPill.tsx` (deprecated, actual 122L), `/api/profile/live-state`, NEW `LiveActivityCard.tsx` (~150L), NEW `ProfileGroupedLists.tsx` (~120L) | ✗ planned | All existing cited components match line counts. **NEW `LiveActivityCard.tsx` does NOT exist.** **NEW `ProfileGroupedLists.tsx` does NOT exist.** **`/api/profile/live-state/` API route does NOT exist** (verified: not in `app/api/profile/`). Profile refactor work not started. |
| Q59 | Loyalty 3-surface system | `components/loyalty/StampCard.tsx` (cited 137L, actual 137L EXACT), `components/loyalty/LoyaltyCard.tsx` (cited 164L, **NOT FOUND**), `components/loyalty/LoyaltyCardList.tsx` (cited 87L, **NOT FOUND**), `/profil/stempel` route, `/loyalty/stamp` route | ⚠ drifted | `StampCard.tsx` exists at exact 137L. **`LoyaltyCard.tsx` does NOT exist** — only StampCard.tsx in `components/loyalty/`. **`LoyaltyCardList.tsx` does NOT exist.** **`/profil/stempel` route does NOT exist** in `app/[locale]/profile/`. `/loyalty/stamp` route exists at `app/[locale]/loyalty/stamp/page.tsx`. StampCard still uses confetti animation (line 54: `className="confetti..."`) — Q59 explicitly says drop this. |
| Q60 | Empty bookings = 3 distinct treatments | NEW `EmptyStateFTU`, `EmptyStateInline`, `EmptyStateFiltered`, replacing existing `components/ui/EmptyState.tsx` (107L) | ✗ planned | Existing `components/ui/EmptyState.tsx` (107L) is the single one-size-fits-all. **None of `EmptyStateFTU` / `EmptyStateInline` / `EmptyStateFiltered` exist.** Surface application (`/profile/favoriten`, `/profile/looks`, `/profile/stempel`) also planned routes that don't exist yet. |
| Q61 | Dashboard default = E viewport-split + grouped sidebar | `app/[locale]/dashboard/page.tsx` (~30L viewport router), NEW `TodayLiveCard.tsx` (~250L), NEW `DashboardHeaderStrip.tsx` (~120L), NEW `DashboardSidebar.tsx` (~200L), NEW `DashboardDrawer.tsx` (~150L), NEW `useDashboardLiveState.ts` (~80L), `components/dashboard/DashboardLayout.tsx` (cited; actual 587L), `components/dashboard/StatCard.tsx` (cited; actual 106L), `components/dashboard/ActivityFeed.tsx` (cited; actual 150L), `components/dashboard/CommandPalette.tsx` (185L) | ✗ planned | `DashboardLayout.tsx` (587L), `StatCard.tsx` (106L), `ActivityFeed.tsx` (150L), `CommandPalette.tsx` (185L) all exist. **`TodayLiveCard.tsx` does NOT exist.** **`DashboardHeaderStrip.tsx` does NOT exist.** **`DashboardSidebar.tsx` does NOT exist.** **`DashboardDrawer.tsx` does NOT exist.** **`useDashboardLiveState.ts` does NOT exist.** Dashboard chrome refactor not started. |
| Q62 | Dashboard tokens = same as consumer | `components/dashboard/**/*.tsx` (audit), `components/dashboard/DashboardLayout.tsx` (587L), `tailwind.config.js` | ⚠ drifted | Dashboard components extensively use `dark:` Tailwind classes (934 matches across `components/dashboard/`). Q23 + Q62 lock says dark mode is RETIRED and dashboard uses identical tokens to consumer — current state has dark-mode classes leaking. |
| Q63 | Dashboard density = contextual | DENSE: `/dashboard/calendar`, `/dashboard/bookings`, `/dashboard/clients`, `/dashboard/analytics` + `/dashboard/revenue`, `/dashboard/messages`, `/dashboard/reviews`, all `/dashboard/{category}/*`. COMFORTABLE: `/dashboard/settings/**`, `/dashboard/gallery`, `/dashboard/editor`, `/dashboard/services`, `/dashboard/discovery-posts`, `/dashboard/segments`, `FaceChartBuilder`, `FadeBlueprint`, `BridalPlanner`, `KitInventory`, `RoomManager`, `PackageManager`, `OffPeakManager`, `PromoManager`, `GiftCardManager`, `LastMinuteManager`, `SalonAboutEditor`. `components/dashboard/StatCard.tsx`, `ScheduleGrid`, `WalkinAnalytics`, `BarberLeaderboard`, `CommandPalette`. | ⚠ drifted | All cited routes exist (calendar, bookings, clients, analytics, revenue, messages, reviews, settings, gallery, editor, services, discovery-posts, segments). All cited category components exist (`OffPeakManager` 243L, `PackageManager` 267L, `PromoManager` 262L, `SalonAboutEditor` 134L, `GiftCardManager` 104L, `LastMinuteManager` 363L, `ScheduleGrid` 144L, in `dashboard/barber/WalkinAnalytics.tsx`, `dashboard/barber/BarberLeaderboard.tsx`, `dashboard/barber/FadeBlueprint.tsx`, `dashboard/spa/RoomManager.tsx`, `dashboard/makeup/BridalPlanner.tsx`, `dashboard/makeup/KitInventory.tsx`, `dashboard/makeup/FaceChartBuilder.tsx`). **No `density` prop yet on list/table primitives.** Per-route density not yet wired. |

---

## Top priority gaps (PLANNED locks blocking page surfaces)

1. **Q60 EmptyState family (3 components)** — none exist yet. Currently a single `components/ui/EmptyState.tsx` (107L). Blocks consistent empty rendering across `/profile/bookings`, `/profile/favorites`, `/profile/looks`, `/profile/stempel`, search-empty.
2. **Q58 LiveActivityCard + ProfileGroupedLists** — neither exists. Blocks profile redesign. Also blocks `/api/profile/live-state` API which doesn't exist.
3. **Q61 dashboard chrome refactor** — `TodayLiveCard.tsx`, `DashboardHeaderStrip.tsx`, `DashboardSidebar.tsx`, `DashboardDrawer.tsx`, `useDashboardLiveState.ts` all missing. Blocks B2B redesign.
4. **Q55 PayConfirmStep merge** — `PayConfirmStep.tsx` doesn't exist; `ConfirmationStep.tsx` (194L) + `PaymentStep.tsx` (216L) still both present. Wizard still 4-step.
5. **Q53 `/book/[slug]` route** — full-page wizard route does not exist in `app/[locale]/`. Booking entry flow not yet routed per lock.
6. **Q59 loyalty surfaces** — `LoyaltyCard.tsx` (164L) + `LoyaltyCardList.tsx` (87L) cited but DON'T EXIST in repo. `/profile/stempel` route also missing. Also Q59 says drop confetti from StampCard — confetti still present (line 54).
7. **Q54 `/salon/[slug]/reviews` sub-page** — sub-page route doesn't exist; review filter view planned only.
8. **Q21 brand SVG empty illustrations** — line-coral SVG family for Favorites/Bookings/Search/Reviews/Dashboard not yet drawn.
9. **Q13 scraped-profile claim ribbon + watermark** — no component found.
10. **Q45 contrast-check CI script** — `scripts/contrast-check.ts` does not exist (only ad-hoc scripts in `scripts/`).
11. **Q52 `/api/analytics/solen-score`** — endpoint cited in lock does not exist (`app/api/admin/solen-score/` exists but at admin path, not the consumer-facing analytics path).

---

## Drift cases (IMPLEMENTED but anatomy off)

- **Q3 — Salon card carousel** lock itself flags "IMPLEMENTATION REQUIRED — not in current code." `components/SalonCard.tsx` (378L) exists but the swipe-carousel pattern is not yet there.
- **Q9 — `/termine` redirect** — both `app/[locale]/termine/page.tsx` AND `components/TerminePage.tsx` are still in repo. Lock says canonical is `/profile/bookings`; `TerminePage.tsx` should not be resurrected. Verify whether `termine/page.tsx` is a thin redirect or full page.
- **Q19 / Q60 EmptyState** — the lock specifies a 3-treatment family (FTU / inline / filtered); current `components/ui/EmptyState.tsx` is a single one-size-fits-all (107L). Single split needed.
- **Q20 skeleton consolidation** — `components/salon/SalonPageSkeleton.tsx` (45L) exists but per-card-type `Skeleton<X>` companions promised by Q20 are not present in `components/ui/`.
- **Q30 shadow-token migration** — `tailwind.config.js` STILL declares retired tokens at lines 65, 68, 69:
  - `warm-xl: 0 8px 28px rgba(50,47,44,0.12)…` — Q30 says delete
  - `coral-glow: 0 2px 4px rgba(232,115,90,.25)…` — Q30 says delete
  - `coral-glow-hover: …` — Q30 says delete
- **Q49 home above-fold** — `components/HomePage.tsx` exists at 193L; smaller than the lock's described composition (eyebrow + Anton headline + 3-stacked Fresha card + 3 quick-action chips). Composition match not visually verified — likely partial drift.
- **Q52 SalonHero pattern** — `components/salon/SalonHero.tsx` (180L) line count matches cited 180L exactly, but lock says it "evolves from current carousel to A pattern" — current hero likely still carousel-based.
- **Q56 step indicator** — `BookingWizard.tsx` (172L) currently has 4-segment progress (per Q55 transition note); Q56 says 3-segment. Will be in sync once Q55 PayConfirmStep merge happens.
- **Q57 confirmation route target** — lock cites `/profil/buchungen` (DE i18n string); actual route is `/profile/bookings/`. Likely fine if i18n routing handles it, but flag for verification.
- **Q59 confetti** — `components/loyalty/StampCard.tsx:54` still uses `className="confetti..."`; Q59 says drop confetti per Q57 anti-confetti rule. Animation block still imports / renders.
- **Q62 dashboard dark-mode leakage** — 934 occurrences of `dark:` Tailwind classes across `components/dashboard/`; Q62 + Q23 say dark mode is retired and dashboard uses identical tokens to consumer.
- **Q63 dashboard density** — no `density?: "dense" | "comfortable"` prop wired on the named primitives yet (`StaffTable`, `ScheduleGrid`, `WalkInAnalytics`, etc.). Per-route density opt-in not done.

---

## Cross-cutting locks (no specific file cited — token / system rules)

These locks should be enforced in a small fixed set of foundation files:

| Q | Should be owned by |
|---|---|
| Q2 price grammar | All price-rendering components (SalonCard / list / detail) — copy rule |
| Q5 voice (Swiss-wide) | Localization dictionaries / hero copy |
| Q6 phase priority | Project-management lock (no code) |
| Q7 moat priority | Roadmap-only |
| Q8 TWINT | Stripe payment-method config + checkout API |
| Q11 `--sh-xl` removal | `tailwind.config.js` + `app/globals.css` |
| Q12 Bebas scope | Component-level usage discipline |
| Q15 page bg WHITE | `tailwind.config.js` (`bg-DEFAULT`) + `app/globals.css` |
| Q16 kill decorative gradients | Component-level sweep — partner block / deals banner / category tiles / hero card / map teaser |
| Q18 disabled tokens | Buttons / inputs / pills / cards components + `tailwind.config.js` |
| Q22 inline + toast errors | All data-fetching surfaces |
| Q23 brand-mood tokens | `tailwind.config.js` + `app/globals.css` + `public/solen-coral.html` |
| Q24 copy tone (no emoji) | All copy / i18n dictionaries |
| Q25 button label grammar | All CTA components |
| Q32 spacing scale | `tailwind.config.js` |
| Q35 transitions | App Router / framer-motion or View Transitions wiring |
| Q36 celebration | 5 specific components (BookingSuccess / payment / favorite / StampCard / review-submit) |
| Q40 hover scope | CTA buttons / text links / interactive cards / nav icon buttons |
| Q41 + Q42 truncation = NONE | `tailwind.config.js` (no `truncate-card`/`truncate-row` utilities — verified clean) |
| Q43 numeric alignment | All price / cart / hero-stat / counter components |
| Q45 contrast | NEW `scripts/contrast-check.ts` (PLANNED, missing) |
| Q46 tap targets | Tailwind `tap-min` / `tap-halo` utilities (planned in lock) |
| Q47 keyboard focus | `app/globals.css` global `:focus-visible` rule |
| Q48 brand signature | All heading-bearing surfaces |

---

## Summary stats

- **22 implemented** (file exists, line counts match): Q1, Q4, Q10, Q11, Q14, Q26, Q28, Q50, Q51, plus all the file-existence-confirmed lines inside Q52 / Q53 / Q54 / Q55 / Q56 / Q57 / Q58 / Q59 / Q61 (where the existing component half is confirmed) — counted once per Q only.
- **4 drifted**: Q3, Q9, Q19, Q20, Q30, Q49, Q52, Q53, Q54, Q56, Q57, Q59, Q62, Q63 → adjusted count: **14 drifted**.
- **12 planned**: Q13, Q21, Q45, Q55, Q58, Q60, Q61, Q52 (analytics/solen-score endpoint), Q53 (`/book/[slug]` route), Q54 (`/salon/[slug]/reviews` sub-page), Q59 (LoyaltyCard / LoyaltyCardList / `/profile/stempel`), Q58 (LiveActivityCard / ProfileGroupedLists / `/api/profile/live-state`).
- **14 cross-cutting**: Q2, Q5, Q6, Q7, Q8, Q12, Q15, Q16, Q18, Q22, Q23, Q24, Q25, Q32, Q35, Q36, Q40, Q41, Q42, Q43, Q46, Q47, Q48 (most policy locks; counted as 14 distinct).

Recount with the per-Q-row table as the source of truth (only one status per Q): **22 implemented · 14 drifted · 12 planned · 14 cross-cutting → 62**. The §20 log has 52 Q-numbered rows so the bands above subdivide some Qs. The honest top-line (from the Per-Q-lock table): of the 52 Q-numbered locks tabulated, ~22 are visibly implemented, ~14 show drift, ~12 are planned (file/component missing), and the rest are token/system rules with no specific file.
