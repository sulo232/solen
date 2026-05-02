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
