# Gap Audit V2 — Post-Q1-Q15 Lock Validation (2026-04-22)

Supplements `GAP_AUDIT.md`. Focuses on gaps the first audit missed.

**Total new/confirmed gaps:** 17 · **Critical:** 7 · **High:** 8 · **Medium:** 2

---

## 🔴 CRITICAL — violates locked decisions

### NEW-1 — `aspect-[4/3]` still in production SalonCard
- **Files:** `components/SalonCard.tsx:162`, `components/booking/ConfirmationStep.tsx:72`, `components/dashboard/GalleryManager.tsx:181`
- **Contradicts:** Q1 — salon card image = 1:1 SQUARE
- **Fix:** Replace `aspect-[4/3]` → `aspect-square` (3 lines, 5 min)
- **Severity:** Critical — Q1 is the most-referenced lock; prod is showing wrong ratio right now
- **Note:** Only `FeaturedSalonCarousel.tsx` got the square treatment during Option C. Other card renderers missed.

### NEW-2 — Dark mode classes pervasive despite "no dark mode" implicit lock
- **Files:** `app/error.tsx:20`, `app/[locale]/account/messages/page.tsx`, `app/[locale]/angebote/page.tsx`, `components/booking/ConfirmationStep.tsx` (21 refs), `components/dashboard/GalleryManager.tsx` (7 refs), and more
- **Pattern:** `dark:bg-s-dm-bg`, `dark:text-s-dm-text`, Tailwind `darkMode: 'class'`
- **Contradicts:** Q15 + SOLEN_DESIGN.md §15 ("No dark mode")
- **Fix options:**
  - **A:** Remove `darkMode: 'class'` from tailwind config + bulk-strip `dark:` prefixes across repo (45-60 min)
  - **B:** Leave classes, just don't enable dark mode (they become dead CSS, no user impact)
- **Severity:** Critical for bundle-size + doc-code alignment; low for user-visible behavior (mode never toggles)
- **My rec: B for now, A for Phase 1 cleanup.**

### NEW-3 — Hardcoded "Basel" in messages for all 4 locales (~80+ references)
- **Files:** `messages/{de,en,fr,it}.json`
- **Examples:**
  - `hero_title: "Dein Salon in Basel"`
  - `eyebrow: "Beliebt in Basel"`
  - `title: "Trending in Basel"`
  - `new_sub: "Frisch auf Solen — entdecke die neuesten Salons in Basel"`
- **Contradicts:** Q5 — Swiss-wide voice, "Für [city]" dynamic
- **Fix:** Wrap each string with `{city}` placeholder; add `useCityDetection` hook pass-through to `t()` calls
- **Effort:** 2-3 hrs (bulk transform + 4 locales + React plumbing)
- **Severity:** Critical for Q5 enforcement

### NEW-4 — Footer tagline explicitly says "Von Basel, für die Schweiz"
- **Files:** `messages/{de,en,fr,it}.json` `footer.tagline`
- **Contradicts:** Q5 (Swiss-wide voice, no hyperlocal)
- **Fix:** Change to `"Für deine Stadt. Für die Schweiz."` in all 4 locales
- **Effort:** 10 min
- **Severity:** Critical (footer is on every page)

### NEW-5 — `/termine` renders page, not redirect
- **File:** `app/[locale]/termine/page.tsx`
- **Contradicts:** Q9 lock (redirect to `/profile/bookings`)
- **Fix:** Replace content with `redirect('/profile/bookings')` server-side
- **Effort:** 5 min
- **Severity:** Critical (duplicates content + breaks lock)

### NEW-6 — SOLEN_DESIGN.md §17 still quotes "Von Basel. Für Basel." as voice example
- **File:** `_tasks/SOLEN_DESIGN.md` voice section
- **Contradicts:** Q5 (doc contradicts itself — lock says retired, spec body shows it as example)
- **Fix:** Replace example with `"Für deine Stadt. Für die Schweiz."` or dynamic city example
- **Effort:** 2 min
- **Severity:** Critical (design doc contradicts its own decision log)

### NEW-7 — Price rendering format unverified across components
- **Files:** unknown (need grep for price rendering paths)
- **Issue:** Q2 locks `"ab CHF X"` format but no single source-of-truth component enforces it
- **Fix:** Grep for price display; centralize via `<PriceDisplay>` or `formatCurrency()` helper
- **Effort:** 30 min (audit) + 1 hr (refactor if scattered)
- **Severity:** High → Critical if prices inconsistent

---

## 🟠 HIGH-PRIORITY — doc/code misalignment

### NEW-8 — MASTER_ROADMAP.md body uses stale phase numbers
- **File:** `_tasks/MASTER_ROADMAP.md`
- **Issue:** Header renumbered (Phase 1 = UI polish) but body/cross-references may still say "Phase 1 ship-blockers"
- **Fix:** Pass-level body edit to align
- **Effort:** 30 min

### NEW-9 — Bottom nav actual count: 5 base + conditional dashboard (NOT 4)
- **File:** `components/layout/BottomNav.tsx:63-85`
- **Q14 lock:** "4 tabs" — but code has 5 (Home, Suche, Discover, Termine, Profil) + conditional Dashboard
- **Decision needed:**
  - **A:** Update Q14 lock to match reality (5 + conditional)
  - **B:** Trim code to 4 (remove Termine since Q9 redirects it anyway — Termine tab would now redirect to /profile/bookings, which Profil tab reaches)
- **My rec: B** — 4 consumer tabs matches lock, and Q9 redirect makes Termine tab redundant.
- **Effort:** 15 min if trimming

### NEW-10 — Solen Favorit badge (Q10) not implemented
- **Files:** no badge component exists
- **Q10 lock:** add 4th yellow badge for algorithmic curation
- **Fix:** Create `components/ui/SolenFavoritBadge.tsx` + wire into salon card rendering
- **Effort:** 30 min

### NEW-11 — Swipeable card image carousel (Q3) not implemented
- **Files:** `components/ui/FeaturedSalonCarousel.tsx` SalonHeroCard
- **Q3 lock:** Airbnb swipe with pagination dots
- **Fix:** 1-2 hrs focused work (snap-scroll, dots, lazy-load)

### NEW-12 — "Claim listing" ribbon (Q13) not implemented
- **Files:** no component
- **Q13 lock:** Scraped profiles show ribbon
- **Fix:** New `components/salon/ClaimRibbon.tsx`, gated on `salon.source === 'scraped'`
- **Effort:** 30 min

### NEW-13 — `aspect-[4/3]` in `components/booking/ConfirmationStep.tsx:72`
- **Specific file + line for NEW-1 critical** (pulled out for tracking)

### NEW-14 — `aspect-[4/3]` in `components/dashboard/GalleryManager.tsx:181`
- **Specific file + line for NEW-1 critical**

### NEW-15 — TWINT (Q8) integration not present
- **Issue:** Q8 requires TWINT before public launch. Current code has Stripe Connect, no TWINT-specific Payment Method config
- **Fix:** Stripe PaymentIntent with `payment_method_types: ['card', 'twint']`
- **Effort:** 2-3 hours (config + Swiss test mode verification)

---

## 🟡 MEDIUM — preview drift or low urgency

### NEW-16 — Bebas Neue usage scope unverified across components
- **Risk:** Q12 says unchanged scope (hero + Instagram + numerals + footer logo). Need visual QA to confirm.
- **Fix:** Grep for `font-display` / `Bebas Neue` across components; ensure only the 4 sanctioned contexts
- **Effort:** 20 min audit

### NEW-17 — Blobs in "dark sections" compliance unverified
- **Q7 allows blobs in hero + dark sections + Instagram tiles only**
- **Fix:** Visual QA pass on Last Minute, Quartier, Footer sections
- **Effort:** 15 min

---

## ✅ CONFIRMED CLEAN (scanned OK)

- Fonts: Bebas Neue + Fraunces + DM Sans correctly loaded in globals.css
- Icons: lucide-react throughout (no Phosphor imports found)
- `AirbnbSearchBar.tsx`: 3 segments correct (Q4 satisfied)
- Page bg: `#FFFFFF` in globals.css line 61 (Q15 satisfied)
- `--sh-xl` token: deleted from globals.css + tailwind.config.js (Q11 satisfied)
- Fraunces applied at `.h1/.h2/.h3` and `.sec-h` rules
- Radii: all tokens defined correctly
- Spacing: 8-point grid enforced
- `components/StaffPortfolio.tsx`: wired into salon detail page per earlier work

---

## 🎯 Recommended fix order (for Phase 1)

### Sprint 1 — Quick wins (30 min total)
1. NEW-1: `aspect-[4/3]` → `aspect-square` in 3 files (5 min)
2. NEW-6: SOLEN_DESIGN.md voice example (2 min)
3. NEW-4: Footer tagline in messages (10 min)
4. NEW-5: /termine redirect handler (5 min)
5. NEW-9: Trim bottom nav to 4 (15 min)

### Sprint 2 — i18n pass (2-3 hours)
6. NEW-3: Bulk Basel → {city} placeholder in 4 locales
7. NEW-8: MASTER_ROADMAP body consistency pass

### Sprint 3 — Dark mode cleanup (45-60 min)
8. NEW-2: Option A — remove `darkMode: 'class'` + strip `dark:` prefixes bulk

### Sprint 4 — Feature implementation (4-6 hours)
9. NEW-10: Solen Favorit badge
10. NEW-11: Swipeable card carousel
11. NEW-12: Claim listing ribbon
12. NEW-15: TWINT integration

### Audits (1 hour)
13. NEW-7: Price format verification
14. NEW-16: Bebas scope audit
15. NEW-17: Blobs audit

**Total:** ~10 hours of focused work to close every gap identified in GAP_AUDIT + GAP_AUDIT_V2.

---

## Combined gap total (V1 + V2)

Original gap audit: 30 identified (16 closed, 14 open Phase 1 work)
New gap audit v2: 17 new/confirmed (3 critical misses from V1, 5 unverified items)

**Overall open backlog:** ~25 real implementation-level gaps to close through Phase 1 work.
