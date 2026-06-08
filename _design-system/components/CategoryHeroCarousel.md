# CategoryHeroCarousel

**File:** [app/[locale]/_components/search/CategoryHeroCarousel.tsx](../../app/[locale]/_components/search/CategoryHeroCarousel.tsx)
**Layer:** 1 chrome (black surface = `s-ink`; composes the locked `HeartButton` + Star; no new color tokens)
**Status:** wip (built + live + screenshot-verified on `/de/barbershop`; owner taste sign-off pending)
**Built:** V3-D421 (2026-06-05). Owner-approved design "B" (photo-hero).
**Structure (V3-D421c, 2026-06-05):** flipped to a FIXED-FRAME / inner-swipe model per owner ("one card, content swipes inside it" — the Zemart pattern). The rounded frame + shadow are a single fixed outer container; the swipe track lives INSIDE it (`absolute inset-0`, clipped by `overflow-hidden`), so only the content (photo + name + heart) slides — the frame never moves. Style "A — Overlay" picked over the split. Mock: `public/solen-widget-oneframe.html`.

**Variant "B" applied (V3-D421i, 2026-06-05, owner "B apply it everywhere"):** from `public/solen-widget-fullpage.html`. Three changes: (1) the "Top bewertet" SECTION TITLE (`<h2>`) AND the on-card BADGE are both REMOVED — there is no "Top bewertet" label anywhere now (`title` is retained only for the section `aria-label` + the dots' `aria-label`); (2) the card is enlarged from `aspect-[3/2]` to **`aspect-[5/4]`**; (3) the pagination dots moved from BELOW the card to INSIDE it — overlaid bottom-center, **white** (`bg-white` active bar / `bg-white/55` dots), in a `pointer-events-none` row (only the dot buttons are `pointer-events-auto`) so they never block a swipe. The bottom text block was raised to `bottom-9` to clear the dots.
**Axis refs:** §10.5 (no Fresha equivalent → Solen precedent, like CategoryBrowseRails), V3-D205 universal-components, LOCKFILE (ink surface, Star `#FFC32B`, locked HeartButton).

---

## Purpose

A **black, photo-led featured carousel** ("Top bewertet") shown ABOVE the results grid on a category route, in **browse mode only** (no query + no active filter). ONE fixed full-width card; the content (photo + name + heart) swipes INSIDE the fixed frame (no peek of the next card), pagination dots track it.

Its job is to be a **highlight strip you swipe through**, deliberately a DIFFERENT treatment from the white results grid below. The black-hero / white-grid contrast is the whole point: the same top-rated salon appearing in both the hero and the grid no longer reads as "the list shown twice" (the failure mode the earlier white-rail attempt had).

Reference: the owner's saved Uber "nach category" capture (dark swipable promo carousel) + the approved mock `public/solen-widget-variants.html` take **B**.

---

## Anatomy (per card)

```
┌───────────────────────────────┐
│ [Top bewertet]            ♥    │  ← white frosted curation chip (TL) + HeartButton (TR)
│                               │
│      PHOTO (aspect 3/2)       │  ← cover_photo_url, object-cover, group-hover scale
│                               │
│  Blade & Stone                │  ← name: font-display 700, WHITE, tracking -0.02em
│  ★ 4.4 (11)                   │  ← Star #FFC32B + rating(reviews), white
│  ab CHF 43 · Feldbergstr. 82  │  ← from-price + address, white/80
└───────────────────────────────┘   pure-black bottom-up gradient scrim under the text
        ● ─ ─                        ← pagination dots (active = wide ink bar)
```

- **Gradient scrim:** `linear-gradient(to top, rgba(0,0,0,0.90) 0%, 0.55 42%, 0.12 72%, 0.20 100%)` — lower ~40% kept dark (text lives there), top light (photo shows). Pure black, no hue.
- **Name `text-white` is REQUIRED:** a global `h3 { color: var(--color-heading) }` rule (globals.css) sets bare headings to ink and overrides the parent's inherited `text-white`. The class beats the element rule. Without it the name renders ink-on-dark (invisible) — the original bug.
- **Text-shadow** `0 1px 6px rgba(0,0,0,0.5)` on the text block — insurance for bright photo regions.
- **Fixed frame (V3-D421c):** the `aspect-[3/2] rounded-[22px] bg-s-ink shadow` lives on the OUTER container, NOT per-slide. The "Top bewertet" badge sits on the frame (`pointer-events-none` so a swipe started on it still scrolls). The inner track is `absolute inset-0 flex overflow-x-auto snap-x snap-mandatory`; each pane is `basis-full h-full` (one fills the frame, no peek). Per-pane: photo, gradient, name/rating/price, and the HeartButton (per salon, sibling of the `<Link>` for valid HTML). Frame + badge stay fixed; only panes scroll.

---

## Public API

```ts
export function CategoryHeroCarousel({ salons, locale, favoriteIds }: {
  salons: HeroSalon[];      // structural subset of SearchTemplate's `Salon` type
  locale: string;
  favoriteIds: Set<string>; // threaded so each card's HeartButton shows saved-state
}): JSX.Element | null;      // null when < 2 qualifying salons (a single card is no carousel)
```

`HeroSalon` = `{ id, name, slug, average_rating, review_count?, cover_photo_url, address?, quartier?, avg_price? }` — a strict subset of `Salon`, so `Salon[]` is assignable. Client component (scroll + dot state).

**Slice logic:** `average_rating != null` AND a `cover_photo_url` (the card is photo-led), sorted by rating desc, **top 6**. Dots track scroll position via `onScroll` → nearest index.

---

## Gating (in SearchTemplate)

```tsx
{activeCategory && activeFilterCount === 0 && q.length === 0 && (
  <CategoryHeroCarousel salons={salons} locale={locale} favoriteIds={favoriteIds} />
)}
```

Same browse-mode gate as CategoryBrowseRails: a category route (not `/search`), no active filter, no query. Toggling a filter chip or searching hides the hero and leaves only the (filtered) grid. Sits just below the sticky search / chips / für-dich header, so it is the first prominent body element (effectively "under the search area"). Zero extra fetch — it's a view of the already-fetched `salons`.

---

## Intentional deviations (named so the verifier doesn't re-flag)

- **Heart = the locked `HeartButton`, NOT the mockup's bespoke frosted heart.** The mockup drew a one-off translucent heart; the live component uses the shared `HeartButton` (same as every salon card) for consistency. A Gemini pass flags this as a "mismatch" each run — it is a deliberate design-system choice (don't fork the heart affordance). If a dark-surface heart treatment is wanted, that's a `HeartButton` change (affects all cards), not a fork here.
- **Name weight 700, not 900.** Matches the approved mockup B. Heavier is available (Inter Tight 800/900) if the owner wants more punch — taste call, not a defect.

---

## Dual-axis (§10.0)

- **STRUCTURE** — Solen precedent (Fresha has no hero carousel on a category surface; their category page is a flat list). Like CategoryBrowseRails, this is a founder/owner borrow (Uber dark promo carousel) scoped ABOVE the still-present Fresha-style grid.
- **AESTHETIC** — Uber-via-LOCKFILE: ink surface, photo-led, Star `#FFC32B`, locked HeartButton, frosted white curation chip. No new tokens.

---

## Universal-components (V3-D205)

One component for every category. Category is implied by the page, so it isn't even a prop — the slice is purely rating-based. No `if (category === 'X')` branches.

---

## i18n

Title + "ab" label are per-locale **inline-records** (`TITLE` de/en/fr/it: Top bewertet / Top rated / Les mieux notés / Più votati; `FROM`), mirroring CategoryBrowseRails' `TITLES`. All four locales present; no `ß`, no em-dash. **Known micro-deviation:** inline rather than `messages/*.json` — migration path is `categoryHero.*` keys via `useTranslations` if a rule later requires it.

---

## Use for / Don't reuse for

**Use:** the browse-mode featured hero on category routes, via SearchTemplate's browse gate.

**Don't reuse for:**
- Homepage feeds (use `SalonCard` in `Section`/`ScrollRow`).
- `/search` "Alle" (no `activeCategory`) — gate excludes it.
- Filtered/searched states (the grid owns those).
- Salon detail / B2B pages.

---

## Open / next

- **Autoswipe** not implemented (owner mentioned it early, then "ditch the animation"; left as manual swipe + dots). Easy add: a slow auto-advance with pause-on-interaction + `prefers-reduced-motion` guard.
- **Placement** is just below the search/chips/für-dich header (the rails slot). Owner may want it higher (directly under the search bar, above für-dich) — a small move of the JSX block.
- **Booking hook** (a "heute frei ab HH:MM" line) intentionally omitted to keep the hero clean; can be added from `services[].slots`.

---

## Related

- `homepage/HeartButton` — the locked save affordance reused here.
- `search/CategoryBrowseRails` — the sibling browse-mode block (the white homepage-rail variant; currently `BROWSE_RAILS=false`). Both live in the same browse slot; this hero is the owner-chosen treatment.
- `search/SalonResultCard` — the white grid card BELOW the hero (the contrast partner).
- `search/SearchTemplate` — the host that gates + feeds the hero.
