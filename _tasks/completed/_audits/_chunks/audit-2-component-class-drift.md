# Component class drift audit

Audit scope: `components/**/*.tsx` (read-only).

Patterns checked: retired Tailwind classes, retired font references, retired color hexes, retired icon library, decorative anti-patterns.

## Summary

- Total components scanned: 339
- Files with at least 1 drift hit: 272
- Total drift hits across all patterns: 3506

**Pattern observations:**
- `dark:` dominates the count (3401 hits across 254 files) — dark mode was retired in V2 cleanup but `dark:*` classes never got swept.
- `glass` shows 48 hits but most are intentional V5 liquid-glass usage (CSS vars `--glass-bg-*`, classes `glass-frost`, `glass-toolbar`, `glass-pill-active`). Per Q-locks, glass is not banned — only over-use is. Counts are concentrated in 2-3 files (HeroVisualCard, SocialProofStrip, CategoryPage). Treat as drift signal only if those files use it 3+ times.
- `blob` shows 5 hits but ALL are JS `Blob` API calls (`new Blob()`, `URL.createObjectURL(blob)`) — NOT decorative blob anti-patterns. Excluded from tally.
- `font-name-string` shows 23 hits but 22 of those are JSDoc comments describing typography tokens (e.g., `* - Numbers: Bebas Neue 28px`). Only 1 is real runtime drift: `FadeBlueprint.tsx:217` uses inline `style={{ fontFamily: "DM Sans, sans-serif" }}`.
- 6 patterns show ZERO hits and are already clean: `aspect-[3/2]`, `font-bebas/fraunces/syne/jakarta/outfit/dm` (Tailwind className form), `#1B4D1C` (V2 green), `#F5A962` (V2 peach), `phosphor` (icon library), decorative `blob` className.
- `bg-black` hits (19) are mostly intentional modal/lightbox/sheet backdrop scrims (`bg-black/25`, `bg-black/30`, `bg-black/95`). The `dark:bg-black/*` variants will disappear when dark mode is swept. Truly questionable: 4 plain `bg-black/N` scrims (Header, BottomTabBar, GuidedSearch, PhotoLightbox) — could migrate to `bg-s-ink/N` per Q-locks.

## Drift by pattern

| Pattern | Hits | Top 5 files |
|---|---|---|
| `rounded-lg` | 5 | `ui/ServiceAutosuggest.tsx` (2), `ui/PhotoLightbox.tsx` (1), `ui/CategorySkeleton.tsx` (1), `onboarding/steps/GoLiveStep.tsx` (1) |
| `rounded-xl` | 4 | `partner/PartnerSignupForm.tsx` (3), `ui/CategorySkeleton.tsx` (1) |
| `rounded-2xl` | 4 | `ui/DiscoverCarousel.tsx` (1), `salon/SalonSidebar.tsx` (1), `salon/BookingSidebar.tsx` (1), `layout/Header.tsx` (1) |
| `bg-black` | 19 | `ReviewForm.tsx` (3), `layout/Header.tsx` (2), `discovery/VideoCard.tsx` (2), `discovery/ItemCard.tsx` (2), `dashboard/GalleryManager.tsx` (2) |
| `text-gray-N` | 2 | `dashboard/nail/NailClientTab.tsx` (2) |
| `dark:` | 3401 | `ProfilePage.tsx` (132), `ui/GuidedSearch.tsx` (81), `dashboard/makeup/KitInventory.tsx` (55), `dashboard/spa/WellnessJournal.tsx` (52), `dashboard/makeup/FaceChartBuilder.tsx` (50) |
| `aspect-[3/2]` | 0 | _(no hits — clean)_ |
| `font-bebas/fraunces/syne/jakarta/outfit/dm` | 0 | _(no hits — clean)_ |
| `font-name-string` | 23 | `ui/HowItWorks.tsx` (4), `ui/FeaturedSalonCarousel.tsx` (4), `TestimonialCarousel.tsx` (4), `TrustStatsBanner.tsx` (3), `BrowseByCitySection.tsx` (2) |
| `#1B4D1C` | 0 | _(no hits — clean)_ |
| `#F5A962` | 0 | _(no hits — clean)_ |
| `phosphor` | 0 | _(no hits — clean)_ |
| `glass` | 48 | `ui/HeroVisualCard.tsx` (8), `ui/SocialProofStrip.tsx` (5), `CategoryPage.tsx` (5), `ui/BottomSheet.tsx` (3), `ui/GlassCard.tsx` (3) |

## Top 30 most-drifted files

| Rank | File | Total hits | Pattern breakdown |
|---|---|---|---|
| 1 | `components/ProfilePage.tsx` | 132 | `dark:`:132 |
| 2 | `components/ui/GuidedSearch.tsx` | 82 | `dark:`:81, `bg-black`:1 |
| 3 | `components/dashboard/makeup/KitInventory.tsx` | 55 | `dark:`:55 |
| 4 | `components/dashboard/spa/WellnessJournal.tsx` | 52 | `dark:`:52 |
| 5 | `components/dashboard/makeup/FaceChartBuilder.tsx` | 50 | `dark:`:50 |
| 6 | `components/dashboard/coiffeur/FormulaBook.tsx` | 48 | `dark:`:48 |
| 7 | `components/BookingCalendar.tsx` | 47 | `dark:`:47 |
| 8 | `components/editor/EditPanel.tsx` | 46 | `dark:`:46 |
| 9 | `components/dashboard/nail/NailClientTab.tsx` | 45 | `dark:`:43, `text-gray-N`:2 |
| 10 | `components/editor/RequestList.tsx` | 42 | `dark:`:42 |
| 11 | `components/dashboard/spa/RoomManager.tsx` | 40 | `dark:`:40 |
| 12 | `components/booking/BookingCard.tsx` | 38 | `dark:`:38 |
| 13 | `components/dashboard/LastMinuteManager.tsx` | 37 | `dark:`:37 |
| 14 | `components/dashboard/PromoManager.tsx` | 36 | `dark:`:36 |
| 15 | `components/dashboard/nail/DynamicPricingConfig.tsx` | 36 | `dark:`:36 |
| 16 | `components/onboarding/steps/ServicesStep.tsx` | 35 | `dark:`:35 |
| 17 | `components/booking/ServiceCart.tsx` | 34 | `dark:`:34 |
| 18 | `components/dashboard/PackageManager.tsx` | 34 | `dark:`:34 |
| 19 | `components/dashboard/FormulaTab.tsx` | 34 | `dark:`:34 |
| 20 | `components/dashboard/OffPeakManager.tsx` | 32 | `dark:`:32 |
| 21 | `components/editor/EditorPage.tsx` | 32 | `dark:`:32 |
| 22 | `components/dashboard/barber/FadeBlueprint.tsx` | 31 | `dark:`:30, `font-name-string`:1 |
| 23 | `components/dashboard/coiffeur/ConsultationNotes.tsx` | 31 | `dark:`:31 |
| 24 | `components/discovery/DiscoveryAdmin.tsx` | 30 | `dark:`:30 |
| 25 | `components/staff/StaffProfilePage.tsx` | 30 | `dark:`:29, `bg-black`:1 |
| 26 | `components/dashboard/nail/RetailManager.tsx` | 29 | `dark:`:29 |
| 27 | `components/booking/PaymentStep.tsx` | 28 | `dark:`:28 |
| 28 | `components/dashboard/barber/LoyaltyConfig.tsx` | 28 | `dark:`:28 |
| 29 | `components/discovery/PostFromDiscover.tsx` | 27 | `dark:`:27 |
| 30 | `components/dashboard/makeup/BridalPlanner.tsx` | 27 | `dark:`:27 |

## File:line evidence — high-priority drift (non-`dark:`, non-`glass`)

Filtered to actionable lines that are NOT mass dark-mode sweeps or intentional glass usage. Sorted by category severity.

### Rounded-* drift (locked: explicit `rounded-[Npx]`)
- `components/layout/Header.tsx:386` — `rounded-2xl` → use `rounded-[Npx]`. `className="absolute right-0 top-[calc(100%+8px)] w-52 max-w-[calc(100vw-32px)] rounded-2xl z-[80] overflow-hidden bg-whi`
- `components/onboarding/steps/GoLiveStep.tsx:62` — `rounded-lg` → use `rounded-[Npx]`. `className="w-full flex items-center justify-between group hover:bg-s-bg-sunken dark:hover:bg-s-dm-raised p-2 -mx-2 round`
- `components/partner/PartnerSignupForm.tsx:59` — `rounded-xl` → use `rounded-[Npx]`. `className="w-full px-5 py-3.5 bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 rounded-xl text-`
- `components/partner/PartnerSignupForm.tsx:67` — `rounded-xl` → use `rounded-[Npx]`. `className="w-full px-5 py-3.5 bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 rounded-xl text-`
- `components/partner/PartnerSignupForm.tsx:72` — `rounded-xl` → use `rounded-[Npx]`. `className="w-full bg-s-coral hover:brightness-[1.06] text-white font-heading font-semibold py-3.5 px-6 rounded-xl transi`
- `components/salon/BookingSidebar.tsx:33` — `rounded-2xl` → use `rounded-[Npx]`. `className="sticky top-[100px] rounded-2xl border border-s-ink/[0.08] bg-white p-6"`
- `components/salon/SalonSidebar.tsx:67` — `rounded-2xl` → use `rounded-[Npx]`. `className="rounded-2xl overflow-hidden p-6 bg-white border border-s-ink/[0.08]"`
- `components/ui/CategorySkeleton.tsx:13` — `rounded-lg` → use `rounded-[Npx]`. `<div className="h-8 w-40 bg-s-ink/[0.07] dark:bg-white/[0.07] rounded-lg animate-pulse" />`
- `components/ui/CategorySkeleton.tsx:22` — `rounded-xl` → use `rounded-[Npx]`. `<div className="w-full aspect-[20/19] md:aspect-square bg-s-ink/[0.07] dark:bg-white/[0.07] animate-pulse rounded-xl mb-`
- `components/ui/DiscoverCarousel.tsx:109` — `rounded-2xl` → use `rounded-[Npx]`. `<div key={i} className="shrink-0 snap-center w-[44vw] max-w-[200px] aspect-[4/5] rounded-2xl">`
- `components/ui/PhotoLightbox.tsx:178` — `rounded-lg` → use `rounded-[Npx]`. `className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 transition-[transform,filter,border-color,background-`
- `components/ui/ServiceAutosuggest.tsx:181` — `rounded-lg` → use `rounded-[Npx]`. `className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-s-ink/[0.04] cursor-pointer rounded-lg transition-colors `
- `components/ui/ServiceAutosuggest.tsx:217` — `rounded-lg` → use `rounded-[Npx]`. `className="group flex items-center gap-2 w-full px-3 py-2.5 hover:bg-s-ink/[0.04] cursor-pointer rounded-lg transition-c`

### `bg-black` drift (locked: `bg-s-ink/N` for ink scrims)
- `components/ReviewForm.tsx:206` — `className="w-full px-4 py-3 rounded-[12px] border border-s-ink/10 dark:border-white/10 bg-white dark:bg-black/20 text-s-`
- `components/ReviewForm.tsx:226` — `<button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 `
- `components/auth/TosPrompt.tsx:74` — `<div className="fixed inset-0 z-[100] flex items-center justify-center bg-s-ink/40 dark:bg-black/60 backdrop-blur-[6px] `
- `components/dashboard/GalleryManager.tsx:198` — `<div className="bg-white/90 dark:bg-black/90 text-s-ink dark:text-s-dm-text p-1.5 rounded-md backdrop-blur-[6px] cursor-`
- `components/dashboard/GalleryManager.tsx:204` — `className="bg-white/90 dark:bg-black/90 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-md backdrop-blur-[6`
- `components/discovery/ItemCard.tsx:115` — `<div className="flex items-center gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-1.5 py-1">`
- `components/discovery/ItemCard.tsx:135` — `<div className="bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-2.5 py-1.5 max-w-[70%]">`
- `components/discovery/VideoCard.tsx:164` — `<div className="flex items-center gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-1.5 py-1">`
- `components/discovery/VideoCard.tsx:184` — `<div className="bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-2.5 py-1.5 max-w-[70%]">`
- `components/layout/BottomTabBar.tsx:168` — `className="fixed inset-0 z-[60] bg-black/30"`
- `components/layout/Header.tsx:441` — `className="fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 pointer-events-auto"`
- `components/layout/Header.tsx:460` — `className="fixed inset-0 z-[45] bg-black/20"`
- `components/nail/NailDesignCard.tsx:87` — `<div className="flex items-center gap-1 bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-1.5 py-1">`
- `components/nail/NailDesignCard.tsx:107` — `<div className="bg-white/30 dark:bg-black/30 backdrop-blur-[6px] rounded-pill px-2.5 py-1.5 max-w-[70%]">`
- `components/profile/BeautyProfileEditModal.tsx:153` — `className="fixed inset-0 bg-s-ink/40 dark:bg-black/60 z-modal-backdrop"`
- `components/staff/StaffProfilePage.tsx:340` — `className="fixed inset-0 z-modal bg-s-ink/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center"`
- `components/ui/GuidedSearch.tsx:437` — `className="fixed inset-0 z-[60] bg-black/40"`
- `components/ui/PhotoLightbox.tsx:97` — `<div className="absolute inset-0 bg-black/95" />`

### `text-gray-N` drift (locked: `text-s-ink-2` / `text-s-ink-3`)
- `components/dashboard/nail/NailClientTab.tsx:226` — `gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",`

### Retired font references
**Real runtime drift (must fix):**
- `components/dashboard/barber/FadeBlueprint.tsx:217` — `style={{ fontFamily: "DM Sans, sans-serif" }}`

**JSDoc/comment drift (low priority — comments describe retired V2 typography tokens, no runtime impact):**
- `components/BrowseByCitySection.tsx:15` — `* - City font: Bebas Neue 48px`
- `components/BrowseByCitySection.tsx:17` — `* - Coral label header: Syne 12px/700 uppercase`
- `components/CategoryPage.tsx:352` — `{/* Hero — pure white + Bebas Neue H1 */}`
- `components/TestimonialCarousel.tsx:15` — `* - ALL avatars: coral #E8735A with white Syne letter`
- `components/TestimonialCarousel.tsx:17` — `* - Quote: DM Sans 15px/400 italic`
- `components/TestimonialCarousel.tsx:18` — `* - Section heading: DM Sans 28px/700 (Pattern A)`
- `components/TestimonialCarousel.tsx:19` — `* - Coral label: Syne 12px/700 uppercase`
- `components/TrustStatsBanner.tsx:14` — `* - Numbers: Bebas Neue 28px (counts), DM Sans 16px/700 (rating)`
- `components/TrustStatsBanner.tsx:15` — `* - Labels: DM Sans 13px/400`
- `components/layout/Footer.tsx:14` — `* - Sprout icon + 'SOLEN' in Bebas Neue 24px (brand wordmark)`
- `components/layout/Footer.tsx:15` — `* - Tagline: 'Die Schweizer Salon-Plattform.' DM Sans 14px/400`
- `components/ui/FeaturedSalonCarousel.tsx:70` — `{/* Title + subtitle — Pattern A: DM Sans 28px/700 */}`
- `components/ui/FeaturedSalonCarousel.tsx:223` — `{/* Name — Fraunces 15px/700 (serif heading, warm editorial) */}`
- `components/ui/FeaturedSalonCarousel.tsx:243` — `{/* Location — DM Sans 14px/400 */}`
- `components/ui/FeaturedSalonCarousel.tsx:248` — `{/* Price — DM Sans 14px/400 */}`
- `components/ui/HeroVisualCard.tsx:26` — `{/* Bebas Neue salon name watermark */}`
- `components/ui/HomepageHero.tsx:14` — `* - Trust line: below search, DM Sans 13px, muted`
- `components/ui/HowItWorks.tsx:13` — `* - Section heading: Pattern A (DM Sans 28px/700)`
- `components/ui/HowItWorks.tsx:14` — `* - Coral label: Syne 12px/700 uppercase`
- `components/ui/HowItWorks.tsx:16` — `* - Step title: DM Sans 16px/600`
- `components/ui/HowItWorks.tsx:17` — `* - Step description: DM Sans 13px/400`

### Patterns with zero hits (already clean)
- `aspect-[3/2]` — 0 hits (Q26 square 1/1 already enforced)
- `font-bebas` / `font-fraunces` / `font-syne` / `font-jakarta` / `font-outfit` / `font-dm` Tailwind className — 0 hits
- `#1B4D1C` (V2 green hex) — 0 hits
- `#F5A962` (V2 peach hex) — 0 hits (verify locked amber `#F3A864` is used instead)
- `@phosphor-icons` import — 0 hits (icon library cleanly migrated to lucide-react)
- decorative `className="...blob..."` — 0 hits (Q23 anti-pattern absent)

## Recommended action

**Phase 7 sweep order (priority tiers):**

**Tier 1 — surgical, high-impact (<30 lines total):**
1. `components/ui/CategorySkeleton.tsx` — `rounded-lg` + `rounded-xl` (2 hits)
2. `components/ui/ServiceAutosuggest.tsx` — `rounded-lg` (2 hits)
3. `components/ui/PhotoLightbox.tsx` — `rounded-lg` (1 hit)
4. `components/ui/DiscoverCarousel.tsx` — `rounded-2xl` (1 hit)
5. `components/salon/SalonSidebar.tsx` — `rounded-2xl` (1 hit)
6. `components/salon/BookingSidebar.tsx` — `rounded-2xl` (1 hit)
7. `components/layout/Header.tsx` — `rounded-2xl` (1) + `bg-black/N` scrims (2)
8. `components/onboarding/steps/GoLiveStep.tsx` — `rounded-lg` (1 hit)
9. `components/partner/PartnerSignupForm.tsx` — `rounded-xl` (3 hits)
10. `components/dashboard/barber/FadeBlueprint.tsx:217` — inline `fontFamily: "DM Sans"` (1 hit, REAL runtime drift)
11. `components/dashboard/nail/NailClientTab.tsx:226` — `text-gray-700/300` + `bg-gray-100/800` (1 line, 2 token violations)

**Tier 2 — `bg-black/N` scrim review:** decide whether to keep `bg-black/N` for true black overlays or migrate to `bg-s-ink/N`. Affects ~10 files (Header, BottomTabBar, GuidedSearch, PhotoLightbox, ItemCard, VideoCard, NailDesignCard, GalleryManager, ReviewForm, TosPrompt, BeautyProfileEditModal, StaffProfilePage). Many `dark:bg-black/N` variants will auto-disappear in Tier 3.

**Tier 3 — dark-mode sweep (massive but mechanical):** 3401 `dark:*` hits across 254 files. The retired-list says dark mode is gone; these classes do nothing at runtime if `dark:` variant generation is disabled in `tailwind.config.js`, but they are pure noise. Recommend a single mechanical sweep PR using a regex to strip `dark:[a-z0-9-]+(\[[^\]]*\])?(/[0-9]+)?` from className strings. Top 30 files by dark hits are listed in the table above — start there.

**Tier 4 — JSDoc comment cleanup (cosmetic):** 22 references to retired V2 typography tokens (`Bebas Neue`, `Fraunces`, `Syne`, `Plus Jakarta`, `Outfit`, `DM Sans`) live in JSDoc headers. Zero runtime impact, but they describe the OLD design. Update or delete during component-level redesign — not a separate sweep.

**Already clean — no action needed:** Phosphor icon migration, V2 hex colors, retired Tailwind font classes, decorative blob anti-pattern, 3:2 aspect ratio.