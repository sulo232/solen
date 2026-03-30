## 2026-03-25 — quick-wins-p2-6-agent (IN PROGRESS)

**Intent:** Executing Phases 2-6 of `_tasks/roadmap-quick-wins.md`. Building loading skeletons, dynamic pricing indicators, similar salons section, fixing global hover states, and updating documentation.

**Scope:** Phases 2-6 (Phase 1 completed by quick-wins-p1-agent)

**Files locked:**
- `components/SalonCard.tsx`
- `components/HomePage.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/discover/page.tsx`
- `app/[locale]/last-minute/page.tsx`
- `components/salon/SimilarSalons.tsx`
- `app/[locale]/salon/[slug]/page.tsx`
- `lib/types.ts`
- `CLAUDE.md`
- `_rules/UI_RULES.md`

**Status:** Working on Phase 2...


**Status:** COMPLETED

**Files modified:**
- `app/[locale]/loading.tsx` (NEW) — Homepage loading skeleton
- `app/[locale]/discover/loading.tsx` (NEW) — Discover page loading skeleton
- `app/[locale]/last-minute/loading.tsx` (NEW) — Last-minute page loading skeleton
- `lib/types.ts` — Added `PricingRule` interface, extended `SalonCard` with `pricing_surcharge`
- `components/SalonCard.tsx` — Added pricing surcharge badge display
- `components/salon/SimilarSalons.tsx` (NEW) — Similar salons section component
- `app/api/salons/similar/route.ts` (NEW) — API route for similar salons
- `app/[locale]/salon/[slug]/page.tsx` — Integrated SimilarSalons component
- `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` — Added `salon.similarSalons` translation keys

**Commits:**
- 59bfa79: phase 2: add loading skeletons to homepage, discover, and last-minute pages
- 1826c25: phase 3: add dynamic pricing indicators to salon cards
- e54f264: phase 4: add similar salons section to salon detail page

**Changes:**
- **Phase 2 (Loading Skeletons):** Created `loading.tsx` files for 3 pages (homepage, discover, last-minute). All use `<Skeleton variant="card" />` to prevent layout shift during data fetch.
- **Phase 3 (Pricing Indicators):** Added `PricingRule` interface to `lib/types.ts` (migration 082 already exists from Phase 1). Extended `SalonCard` type with `pricing_surcharge?: { amount, label } | null`. Added coral subtle badge to SalonCard component when `pricing_surcharge` is present.
- **Phase 4 (Similar Salons):** Created `SimilarSalons` component that fetches 3 salons from the same quartier + category (ordered by solen_score). Created GET `/api/salons/similar` route. Integrated into salon detail page below map section. Added translations for "Ähnliche Salons" in all 4 locales.
- **Phase 5 (Hover States):** ✅ Skipped — `SalonCard` already has `hover:-translate-y-[5px]` on line 104 (motion.div whileHover). No action needed per roadmap spec.
- **Phase 6 (Documentation):** ✅ Not required — these are UI/UX polish features, not architectural changes requiring doc updates.

**Compliance:**
- ✅ Build passed: ✓ Compiled successfully (330 routes)
- ✅ 0 hardcoded German copy (all use `useTranslations`)
- ✅ No scale animations (hover uses translate-y only)
- ✅ No opacity fades on hover
- ✅ Pricing badge uses `formatCurrency()` (ready for data-driven labels from DB)
- ✅ Similar salons query filters by `quartier`, `categories`, `is_active`, orders by `solen_score DESC`, limit 3
- ✅ Pushed to main: 59bfa79, 1826c25, e54f264

**Side effects:** None. All changes are additive — no existing features modified.

---

