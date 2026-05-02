# Solen — Build learnings (cross-phase)

> Things discovered during execution that the next phase should know.
> Append-only. Each entry: phase + date + what + why-it-matters.

---

## Phase 0 — Token contract migration (2026-05-02)

### L0.1 — Pre-edit grep saves bulk-deletion disasters
181 components reference legacy palette tokens (`s-blue/plum/sage/sand`). Plan said
"remove legacy tokens" — would have silently broken 181 components if executed
without grep-first. **Always grep before deleting any shared token, prop, or import.**

### L0.2 — Vercel `[skip vercel]` is NOT honored by Vercel
Vercel ignores commit-message skip tokens. The actual skip mechanism is
`vercel.json` `ignoreCommand` (a script that exits 0 to skip, 1 to build). User
locked: builds ONLY trigger when commit message contains literal `[deploy]` token.
Don't add `[deploy]` proactively — wait for explicit user instruction.

### L0.3 — Audit agents can search the wrong folder
Agent 3 reported Q59's `LoyaltyCard.tsx` + `LoyaltyCardList.tsx` as "fabricated
file paths." Reality: they exist at `components/barber/`, not `components/loyalty/`.
**Verify subagent findings with file existence checks before fixing the lock as
broken.** Updated Q59 to fully-qualify the paths so future phases don't repeat
the search.

---

## Phase 1 — State primitives (2026-05-02)

### L1.1 — `useReducedMotion` is the one motion gate
All Q35 + Q36 animation work uses `framer-motion`'s `useReducedMotion` hook.
`prefers-reduced-motion: reduce` returns `true` → skip the animation, instant
swap. Pattern: build the component to render BOTH the animated and instant paths;
the hook picks. Do NOT rely on CSS-only `@media (prefers-reduced-motion)` for
component animations — framer-motion bypasses it.

### L1.2 — `Q60 EmptyState` trio is a system, not 3 separate components
Don't build each empty state per-page from scratch. Use `<EmptyStateFTU>` /
`<EmptyStateInline>` / `<EmptyStateFiltered>` consistently. Pass:
- `eyebrow` (Figtree 700 .22em uppercase coral)
- `headline` (Anton uppercase)
- `subCopy` (Figtree ink/65)
- `ctaLabel` + `ctaHref` (FTU + Inline only) OR `resetLabel` + `onReset` (Filtered)
- `illustration` (inline SVG with `stroke="#E8624A"` per Q21 — caller picks anchor:
  calendar+clock for bookings, heart for favorites, magnifier for filtered, sparkle
  for looks, stamp circle for loyalty)

**Common mistake to avoid:** using lucide-react icons as the FTU illustration. Q21
locks line-coral SVG with explicit stroke, NOT lucide. Lucide is for utility chrome
(chevrons, action icons, pictograms in chips), not for illustration anchors.

### L1.3 — Q47 focus ring conflicts existed (now reconciled)
`globals.css` had TWO competing `:focus-visible` blocks (one in `@layer base` with
0.5-alpha coral, one global with white inner + button-coral outer). Q47 locks
**2px solid `#E8624A` + 2px outline-offset, focus-visible only**. Inputs use
box-shadow ring instead of outline (radius compatibility). Don't add a third block.

### L1.4 — `CelebrationRing` placement
`<CelebrationRing kind="..." active={...}>` is positioned `absolute inset-0` so
the parent must be `relative`. The component fires once and resets — pass `active`
as a one-shot toggle (parent sets true on event, the ring auto-clears after the
animation duration).

---

## Phase 2 — Brand primitives (2026-05-02)

### L2.1 — `SignatureLockup` is the brand fingerprint
Every page header should use `<SignatureLockup eyebrow="..." headline="..."
size="md|lg|xl">`. Eyebrow auto-renders coral `#C95A3A` Figtree 700 tracked
uppercase; headline auto-renders Anton uppercase with locked letter-spacing 0.01em
+ leading 0.95. Don't reimplement the eyebrow + Anton combo per page.

### L2.2 — `lib/format.ts` is the canonical numeric formatter
Use `formatPrice(85)` for `CHF 85`, `formatTime(14, 30)` for `14:30`,
`formatRating(4.83)` for `4.8`, `formatTimeOffset(120)` for `in 2h`. Apply
`tabular-nums` Tailwind class on the containing element so digits column-align —
the helpers don't impose typography, just stringify.

### L2.3 — Don't refactor existing Button/Card components in primitive phase
`components/ui/button.tsx` (shadcn-style) + `components/ui/card.tsx` +
`components/SalonCard.tsx` (378L) all exist and work. Per CODE_SAFETY Rule 8,
extend per-surface in the consuming phase (Phase 4 stress-tests Card via section
carousels; Phase 5 stress-tests Button via booking wizard). Building parallel
duplicates would break 200+ existing imports.

---

## Phase 3 — Profile shell + loyalty + anti-confetti (2026-05-02)

### L3.1 — Aggressive deletion is safer than additive when routes already exist
Initial instinct: inject LiveActivityCard above the existing 5-tab system (additive,
~30% Q58). Better: delete the entire ProfileTabs render, route each "tab" to its
own dedicated sub-page (~95% Q58). Why safer: the sub-routes already exist or are
trivial stubs. Additive shipped a hybrid layout that looks broken visually
(LiveActivityCard + tabs side-by-side = inconsistent). **Aggressive ≠ risky when
the destinations already exist.**

### L3.2 — Q58 + Q60 are co-designed
Don't treat them as independent. Q58 says "profile = grouped lists." Q60 says
"each list-page has 3 empty treatments." Together: each grouped-list row routes
to a sub-page that uses one of the EmptyState variants. This is one system, not
two.

### L3.3 — `<ProfileTabs>`, `<LooksGrid>`, `<SalonHighlights>` are now orphans
After Phase 3, these components are imported in `ProfilePage.tsx` but no longer
rendered. **Phase 7 (drift sweep) deletes them after confirming no other call
sites.** Leaving the imports for now to avoid cascading lint changes; Phase 7
sweep handles cleanup.

### L3.4 — `/profile/looks` is a stub
The looks feature has no backend table yet (per BACKEND_NEEDS_UI). The page
always renders the EmptyStateFTU. When the backend lands, swap the EmptyState
for the existing `LooksGrid` component.

### L3.5 — `/api/profile/live-state` is sequential, not optimized
v1 runs 5 sequential Supabase queries (upcoming → loyalty → deal → reply →
rebook). Returns the FIRST qualifying state. Phase 7 may rewrite as a single
SQL CTE if the access-pattern hot path needs it. For now correctness > speed.

### L3.6 — Bottom-nav fully removed from web
`<FloatingNavPill>` no longer rendered anywhere on web. `<BottomNav>` exists but
is unused on web routes. Per Q58 mobile-native/PWA can re-introduce later — **a
future Q-lock will design the mobile-only bottom-nav surface separately.**

### L3.7 — `setActiveTab` callbacks need replacement when tabs deleted
Existing `<ProfileHero>` accepts `onEditProfile={() => setActiveTab('einstellungen')}`.
After tab deletion, swapped to anchor-scroll: `() =>
document.getElementById("settings")?.scrollIntoView({ behavior: "smooth" })`.
Phase 7 replaces with proper route to `/profile/settings` once that page exists.

### L3.8 — StampCard `celebrate` prop is event-driven, NEVER on mount
Confetti was firing on EVERY mount when `isComplete=true`. Per Q59 anti-pattern
("per-stamp celebration animation that fires on the dedicated page when user
just opens it"), the new `celebrate` prop is opt-in by the caller — only fires
when a stamp event actually happens. Default `false`. Reward-unlock celebration
runs at milestone scale (1200ms ring + amber checkmark).

---

## Phase 3 verification pass (2026-05-02 follow-up)

### L3.9 — Time estimates were padded; testing wasn't done
Phase 3 took ~55 min, not 6-7 hr. Reason: Q-locks make every render-layer
decision so component code is mostly transcription, not architecture. BUT
the original ship had **zero runtime verification**. A verification pass found:

### L3.10 — Schema column names: 4 wrong guesses, all fixable
- `bookings.slot_at` does NOT exist; the column is `starts_at`. Fixed in
  `/api/profile/live-state/route.ts` (3 query sites).
- `loyalty_stamp_cards` table exists but the active loyalty-program flow
  uses `loyalty_cards` + `loyalty_stamps` JOIN. Pattern from
  `/api/loyalty/route.ts`:
  ```ts
  .from("loyalty_cards")
  .select(`id, salon_id, stamps_needed, reward_text, salons(slug, name, cover_photo_url),
           loyalty_stamps!inner(id, customer_id)`)
  .eq("is_active", true)
  .eq("loyalty_stamps.customer_id", userId)
  ```
- `stamps_collected` is computed (count of loyalty_stamps for this card+
  customer), NOT a column. Same for `is_complete` (compares count to
  `stamps_needed`).
- `salons.cover_url` does NOT exist; the column is `cover_photo_url`.
  Same on Salon `cover_photo_url` everywhere.
- `salons.average_rating` (NOT `rating`); `review_count` (NOT
  `rating_count`); no `price_band` column — derive from joined services.

### L3.11 — Drop existing prop without grep = TS regression
Phase 1 dropped `zone` prop from `EmptyState`. I greped for `<EmptyState`
imports but not for `zone={` JSX call sites. Result: 3 TS errors in
SalonReviews / SalonServices / PageState. Fixed in 0104958.
**Pattern: when removing a prop, grep for all JSX call sites with
`grep -rn "PropName=" components/ app/` BEFORE shipping.**

### L3.12 — Pre-existing node_modules corruption blocks Next.js dev
Project has multiple node_modules issues unrelated to Phase 3:
- `postcss-selector-parser` was missing — `npm i` fixed it
- `@vercel/otel` was missing — `npm i` fixed it
- `picomatch/lib/picomatch` resolution still fails despite the package
  existing — needs full `rm -rf node_modules && npm install` cycle to
  resolve. Deferred to user.
**Workaround:** static design preview at `localhost:3000/solen-coral`
(via `npx serve public`) is unaffected. Use that for design verification.

### L3.13 — Mirror existing API patterns instead of guessing schema
For `/profile/favorites/page.tsx`, instead of enumerating salon columns
in the select, mirror the `/api/profile/favorites/route.ts` approach:
two-step fetch (favorites → salon ids → full salons + services price
average). Less guessing, less drift, returns the canonical SalonCard
shape that <SalonCard> already accepts.

---

## Phase 2 finish (2026-05-02)

### L2.4 — Phase 0d regex left 120 dark-mode artifacts in 70 files
The `\s+dark:...` regex in scripts/strip-dark-mode.mjs required leading
whitespace, which missed nested `hover:dark:bg-...` and chained
`:dark:bg-...` modifiers. Result: invalid Tailwind strings like
`hover:bg-s-ink/[0.09]:bg-s-dm-text/[0.14]` that silently fail at render.
Caught while reading button.tsx. Fixed via a corrective regex pass that
strips orphan `:bg-s-dm-`/`:text-s-dm-`/`:border-s-dm-`/etc fragments +
dangling `hover:`/`focus:`/`active:` modifiers. **Lesson:** when writing
a regex sweep over a class-name space, also test against nested-modifier
patterns like `hover:dark:` and `lg:dark:`. The naive `\s+dark:` pattern
misses them.

---

## Phase 4 — Home + discovery (2026-05-02)

### L4.1 — Q49 above-fold replaces V5 cinematic hero
NEW: `components/home/HeroAboveFold.tsx`. Old `HomepageHero.tsx` (V5
cinematic + AirbnbSearchBar pill) is now orphan — Phase 7 deletes it +
the `.figma.tsx` mirror file. Bg color changed `#FAFAF8` → white per Q15.

### L4.2 — Search field opens existing GuidedSearch sheet via [data-gs-trigger]
The Q49 stacked search card is a presentational trigger; tapping any
field clicks the hidden `[data-gs-trigger]` element which opens the
existing GuidedSearch sheet (preserves all input/filter logic).
**Pattern:** when refactoring a UI surface, find the existing sheet/modal
trigger via DOM attribute and reuse it instead of duplicating the input
flow.

### L4.3 — Q51 partial — 4 sections deferred to Phase 4.b
Shipped: Q49 hero + Q51 #8 TrustStatsBanner. Deferred (need design call
or backend wiring):
- **Nearby section (#2):** geolocation hook (`useCityDetection` exists)
  + a Nearby SectionCarousel pulling from existing `/api/salons/nearby`.
  Quick if existing API works — verify before building.
- **Discover section (#4):** Pinterest+booking-bridge. Needs
  `discovery_items` table data flow + a new card pattern (mixed card
  sizes, image-led). Substantial work; needs a Q-lock for the Discover
  card anatomy first (no spec exists).
- **Spotlight section (#6):** salon-of-the-week curation. Needs admin
  curation UI + a `spotlight_salons` table or feature flag. Lowest
  priority since it's marked `[optional]` in Q51.
- **Per-section canonical SectionCarousel:** existing
  `FeaturedSalonCarousel` (280L) already does the Q50 scroll-snap
  pattern. Refactoring to a generic SectionCarousel is cosmetic
  harmonization, not functional. Defer to Phase 7.

---

## Phase 5a — Q57 confirmation (2026-05-02)

### L5.1 — Q57 BookingSuccess used CelebrationRing primitive directly
The Phase 1 `<CelebrationRing kind="booking">` primitive plugged in
exactly as designed. Mount-time `useEffect` sets `celebrate=true`,
component auto-resets internal state. Reduced-motion: instant
overlay-only via the primitive's built-in handling.

### L5.2 — Replacing window-wide CSS confetti
Old BookingSuccess generated 50 colored particles via direct DOM
manipulation (`document.createElement` + appended to body, with
`@keyframes confetti-fall` injected as a `<style>` tag). Replaced with
a single React component that respects `prefers-reduced-motion`. **Net
LOC: -8** while shipping a more sophisticated celebration.

### L5.3 — Q57 anti-pattern enforcement (referral CTA killed)
Old BookingSuccess had a "refer a friend, both get CHF 10" CTA panel
right below the summary card. Q57 explicitly bans this — feels
predatory immediately after pay. Removed entirely. Referral discovery
moved into the Q58 profile grouped-list (Misc group, 'Freunde einladen'
row with `CHF 10` reward chip — already shipped in Phase 3).

---

## Phase 5b-f — Q52-Q56 deferred (2026-05-02)

These remaining Phase 5 locks need substantial refactors and a focused
session. Each is its own ~1-2 hr surgical operation:

### L5.4 — Q52 SalonHero + sticky scrollspy tab nav
- `SalonHero.tsx` (180L): evolve carousel → A pattern (single full-bleed
  photo + bottom-fade Anton overlay + thumbnail strip + tap-to-fullscreen
  gallery sub-page). Significant JSX rewrite.
- `SalonSectionNav.tsx` (124L) + `SalonTabBar.tsx` (67L): Fresha-pattern
  pin-on-scroll, header-collapse, sliding coral underline (200ms),
  IntersectionObserver scrollspy. 7 behaviors per Q52 lock.
- Need to build the gallery sub-page route (`/salon/[slug]/gallery`).

### L5.5 — Q53 booking entry — 3 entry points → /book/[slug]
- Sticky bottom CTA (`SalonMobileCTA.tsx` 92L), sticky sidebar
  (`SalonSidebar.tsx` 136L), in-flow service+ rows: ALL three route to
  `/book/[slug]` full-page wizard with Q35 shared-element morph.
- The shared-element morph requires Framer Motion `<LayoutGroup>` or
  `next/router` view-transitions API. Test on mobile especially.

### L5.6 — Q54 reviews split (summary + sub-page)
- `SalonReviews.tsx` (383L): summary on detail tab + new
  `/salon/[slug]/reviews` sub-page route with filter chips + infinite
  scroll + reply threads expanded.
- The sub-page route doesn't exist yet — needs to be built.

### L5.7 — Q55 wizard 4→3 step merge (HIGHEST RISK)
- Delete `ConfirmationStep.tsx` (194L) + `PaymentStep.tsx` (216L).
- NEW: `PayConfirmStep.tsx` (~250-300L) merges both into single screen.
- `BookingWizard.tsx` (172L) progress bar 4 segments → 3.
- `BookingContext` formData stays unchanged; currentStep enum changes.
- **HIGH RISK:** this is the revenue path. Must preserve all Stripe
  integration, deposit flows, gift card redeem, package redeem,
  group booking modal. Test pay flow end-to-end before shipping.

### L5.8 — Q56 step indicator
- `BookingWizard.tsx` progress bar: 3-segment + eyebrow `Schritt N / 3`
  + Anton step label. Smaller than Q55 but couples with it (Q56 spec
  assumes 3 steps from Q55). Ship in same commit as Q55.

---

## Cross-cutting reminders for Phase 4+

### R1 — Vercel gate is active
Push freely. No commit triggers a Vercel build unless the message contains
literal `[deploy]`. Don't add `[deploy]` proactively.

### R2 — `solen-coral.html` static preview at localhost:3000
Run `npx serve public --listen 3000` (or use the launch.json `Design preview
(static)` config). Open `localhost:3000/solen-coral`. Live app preview is a
separate surface — `npm run dev` for that.

### R3 — Anton headlines are uppercase by default
`globals.css` `@layer base` rule: all `h1-h6` elements get `text-transform:
uppercase`. So when using raw `<h2>` etc., Anton + uppercase auto-applies. When
using `<SignatureLockup>`, it's explicit. When using `<motion.h2>` or other
custom elements, you may need to add `uppercase` class manually.

### R4 — Body bg is white (`#FFFFFF`)
Q15 lock. Don't override on individual pages (no cream bg, no gradient bg).
Only sub-surfaces (cards, tiles) use `s-bg-sunken` (`#FAF7F3`) or `s-bg-cream`
(`#FFF4E8`).

### R5 — Use existing primitives before reinventing
`SignatureLockup`, `EmptyStateFTU/Inline/Filtered`, `InlineError`, `Toast`,
`CelebrationRing`, `Skeleton` all exist. Building parallel duplicates means more
maintenance. Search `components/ui/` first.

### R6 — `cn()` from `@/lib/utils` is the standard className merger
Used everywhere for conditional classes. Don't introduce alternatives.

### R7 — All user-facing strings localize via `useTranslations()` / `getTranslations()`
Server components: `getTranslations({ locale, namespace })`. Client components:
`useTranslations()`. Hardcoded strings break on EN/FR/IT.

### R8 — Phase 7 backlog (track here, don't lose)
- Delete orphan components: `ProfileTabs.tsx`, `LooksGrid.tsx`, `SalonHighlights.tsx`,
  `BottomNav.tsx` (after confirming no other call sites)
- Extract inline `#settings` section from `ProfilePage.tsx` to `/profile/settings/page.tsx`
- Extract `PaymentMethodsSection` to `/profile/payment-methods/page.tsx` (Q58 grouped
  list "Zahlungsmethoden" row should route there, not anchor-scroll)
- Single SQL CTE for `/api/profile/live-state` if hot path
- Build `looks` table + ingestion flow per BACKEND_NEEDS_UI (Q-lock TBD in V4)
- Sweep remaining `dark:` JSDoc comments (cosmetic)
- Sweep retired token JSDoc references (mention V5 Bebas/Fraunces/DM Sans)
- 181 legacy palette token (`s-blue/plum/sage/sand`) usages — needs design call
  on what they should map to
- Several retired shadow tokens (`warm-xl`, `coral-glow`, `coral-glow-hover`)
  still referenced in components — replace with locked `elevation-1/2/3`
